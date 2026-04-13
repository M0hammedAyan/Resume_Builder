import { motion } from "framer-motion";
import { PanelLeftClose, PanelRightClose, PanelLeftOpen, PanelRightOpen } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCareerOSStore } from "../store/careeros.store";
import { ResumeFileUpload } from "./ResumeFileUpload";
import { apiService } from "../services/api";
import type { ResumeSectionData } from "../types/resume";
import { parseResumeFileLocally } from "../utils/localResumeParser";
import { getAllTemplates, render_template, type TemplateId } from "../config/resume.templates";
import { mapStoreResumeToTemplateData } from "../utils/templateResumeMapper";
import { RibbonToolbar } from "./RibbonToolbar";
import { ResumeEditor } from "./ResumeEditor";

export function ResumeStudioView() {
  const { resume, selectedTemplate, setSelectedTemplate, setResume } = useCareerOSStore();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | undefined>(undefined);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSizeInput, setFontSizeInput] = useState("16");
  const [textColor, setTextColor] = useState("#111111");
  const [pageColor, setPageColor] = useState("#ffffff");
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRangeRef = useRef<Range | null>(null);
  const historyRef = useRef<string[]>([]);
  const redoStackRef = useRef<string[]>([]);

  const templates = getAllTemplates();

  const templateData = useMemo(
    () => mapStoreResumeToTemplateData(resume as NonNullable<typeof resume>) as unknown as Record<string, unknown>,
    [resume],
  );
  const renderedHtml = useMemo(
    () => render_template(selectedTemplate as TemplateId, templateData),
    [selectedTemplate, templateData],
  );
  const [editableHtml, setEditableHtml] = useState(renderedHtml);

  useEffect(() => {
    setEditableHtml(renderedHtml);
    historyRef.current = [renderedHtml];
    redoStackRef.current = [];
  }, [renderedHtml]);

  useEffect(() => {
    const handleSelectionChange = () => saveSelection();

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;

      switch (e.key.toLowerCase()) {
        case "z": {
          e.preventDefault();
          e.shiftKey ? redo() : undo();
          return;
        }
        case "y": {
          e.preventDefault();
          redo();
          return;
        }
        case "a": {
          e.preventDefault();
          selectAllText(editor);
          saveSelection();
          return;
        }
        case "b": {
          e.preventDefault();
          document.execCommand("bold");
          break;
        }
        case "i": {
          e.preventDefault();
          document.execCommand("italic");
          break;
        }
        case "u": {
          e.preventDefault();
          document.execCommand("underline");
          break;
        }
        default:
          return;
      }

      saveSelection();
      syncEditorHtml();
    };

    editor.addEventListener("keydown", handleKeyDown);
    return () => editor.removeEventListener("keydown", handleKeyDown);
  }, []);

  function selectAllText(editor: HTMLDivElement) {
    const range = document.createRange();
    range.selectNodeContents(editor);

    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function saveHistory() {
    const editor = editorRef.current;
    if (!editor) return;
    const currentHtml = editor.innerHTML;
    const lastHistoryEntry = historyRef.current[historyRef.current.length - 1];

    if (lastHistoryEntry !== currentHtml) {
      historyRef.current.push(currentHtml);
      redoStackRef.current = [];
    }
  }

  function undo() {
    if (historyRef.current.length > 1) {
      const current = historyRef.current.pop();
      if (current) {
        redoStackRef.current.push(current);
      }

      const previous = historyRef.current[historyRef.current.length - 1];
      if (editorRef.current && previous) {
        editorRef.current.innerHTML = previous;
        setEditableHtml(previous);
        saveSelection();
      }
    }
  }

  function redo() {
    if (redoStackRef.current.length > 0) {
      const next = redoStackRef.current.pop();
      if (next) {
        historyRef.current.push(next);
        if (editorRef.current) {
          editorRef.current.innerHTML = next;
          setEditableHtml(next);
          saveSelection();
        }
      }
    }
  }

  function saveSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setFontSizeInput("");
      return;
    }
    const range = selection.getRangeAt(0);
    if (!editorRef.current || !editorRef.current.contains(range.commonAncestorContainer)) {
      setFontSizeInput("");
      return;
    }
    selectionRangeRef.current = range.cloneRange();

    const detectedSize = getSelectedFontSize();
    setFontSizeInput(detectedSize || "");
  }

  function getComputedFontSize(node: Node | null): string | null {
    if (!node) return null;
    const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement);
    if (!element) return null;
    const raw = window.getComputedStyle(element).fontSize;
    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed)) return null;
    return String(Math.round(parsed));
  }

  function getSelectedFontSize(): string | null {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return null;

    if (range.collapsed) {
      const anchorNode = range.startContainer;
      const anchorOffset = range.startOffset;

      if (anchorNode.nodeType === Node.TEXT_NODE) {
        const fromTextNode = getComputedFontSize(anchorNode);
        if (fromTextNode) return fromTextNode;
      }

      if (anchorNode.nodeType === Node.ELEMENT_NODE) {
        const anchorElement = anchorNode as HTMLElement;
        const atOffsetNode = anchorElement.childNodes[anchorOffset] ?? anchorElement.lastChild ?? null;
        const fromOffsetNode = getComputedFontSize(atOffsetNode);
        if (fromOffsetNode) return fromOffsetNode;
      }

      return getComputedFontSize(anchorNode);
    }

    const sizes = new Set<string>();
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    let currentNode = walker.nextNode();
    while (currentNode) {
      const textNode = currentNode as Text;
      if (textNode.textContent && textNode.textContent.trim() && range.intersectsNode(textNode)) {
        const size = getComputedFontSize(textNode);
        if (size) sizes.add(size);
      }
      currentNode = walker.nextNode();
    }

    if (sizes.size === 1) return Array.from(sizes)[0] ?? null;
    if (sizes.size > 1) return "";

    return getComputedFontSize(range.commonAncestorContainer);
  }

  function restoreSelection(): Selection | null {
    const selection = window.getSelection();
    const range = selectionRangeRef.current;
    if (!selection || !range || !editorRef.current) return null;
    selection.removeAllRanges();
    selection.addRange(range);
    return selection;
  }

  function syncEditorHtml() {
    if (!editorRef.current) return;
    setEditableHtml(editorRef.current.innerHTML);
  }

  function applyFormattingCommand(command: string, value?: string) {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    if (!restoreSelection()) return;
    document.execCommand(command, false, value);
    saveSelection();
    syncEditorHtml();
  }

  function applyFontSizePx(sizePx: string) {
    const editor = editorRef.current;
    if (!editor) return;
    const parsedSize = Number(sizePx);
    if (!Number.isFinite(parsedSize)) return;

    editor.focus();
    if (!restoreSelection()) return;
    document.execCommand("fontSize", false, "7");

    const oversizedNodes = editor.querySelectorAll("font[size='7']");
    oversizedNodes.forEach((node) => {
      const htmlNode = node as HTMLElement;
      htmlNode.removeAttribute("size");
      htmlNode.style.fontSize = `${parsedSize}px`;
    });

    saveSelection();
    syncEditorHtml();
  }

  function handleBold() {
    applyFormattingCommand("bold");
  }

  function handleItalic() {
    applyFormattingCommand("italic");
  }

  function handleUnderline() {
    applyFormattingCommand("underline");
  }

  function handleFontFamilyChange(nextFamily: string) {
    setFontFamily(nextFamily);
    applyFormattingCommand("fontName", nextFamily);
  }

  function handleFontSizeChange(nextSize: string) {
    setFontSizeInput(nextSize);
    if (!nextSize) return;
    applyFontSizePx(nextSize);
  }

  function handleTextColorChange(nextColor: string) {
    setTextColor(nextColor);
    applyFormattingCommand("foreColor", nextColor);
  }

  function handleAlignLeft() {
    applyFormattingCommand("justifyLeft");
  }

  function handleAlignCenter() {
    applyFormattingCommand("justifyCenter");
  }

  function handleAlignRight() {
    applyFormattingCommand("justifyRight");
  }

  function handleJustify() {
    applyFormattingCommand("justifyFull");
  }

  function handleInsertHorizontalLine() {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    if (!restoreSelection()) return;

    const hr = document.createElement("hr");
    hr.className = "resume-hr";
    insertNodeAtCursor(hr);

    const br = document.createElement("div");
    br.innerHTML = "<br/>";
    insertNodeAtCursor(br);

    saveHistory();
    syncEditorHtml();
  }

  function handleInsertTable(rows: number, cols: number) {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    if (!restoreSelection()) return;

    const table = document.createElement("table");
    table.className = "resume-table";

    for (let r = 0; r < rows; r++) {
      const tr = document.createElement("tr");

      for (let c = 0; c < cols; c++) {
        const td = document.createElement("td");
        td.contentEditable = "true";
        td.innerHTML = "<br/>";
        tr.appendChild(td);
      }

      table.appendChild(tr);
    }

    insertNodeAtCursor(table);
    saveHistory();
    syncEditorHtml();
  }

  function handleInsertPageBreak() {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const page = document.createElement("div");
    page.className = "resume-page";
    page.innerHTML = "<br/>";

    editor.appendChild(page);
    moveCursorToElement(page);

    saveHistory();
    syncEditorHtml();
  }

  function updatePageColor(nextColor: string) {
    setPageColor(nextColor);
  }

  function insertNodeAtCursor(node: Node) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(node);

    range.setStartAfter(node);
    range.setEndAfter(node);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function moveCursorToElement(element: HTMLElement) {
    const range = document.createRange();
    const sel = window.getSelection();
    if (!sel) return;

    range.selectNodeContents(element);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function addSectionTemplate(section: "experience" | "projects" | "skills" | "education" | "achievements") {
    if (!resume) return;
    const exists = resume.sections.some((s) => s.section === section);
    if (exists) return;

    setResume({
      ...resume,
      sections: [
        ...resume.sections,
        {
          section,
          title: section.charAt(0).toUpperCase() + section.slice(1),
          bullets: [],
        },
      ],
    });
  }

  async function handleResumeUpload(file: File) {
    setUploading(true);
    setUploadError(undefined);
    setUploadSuccess(false);

    try {
      const userId = "00000000-0000-0000-0000-000000000001";
      const uploadResult = await apiService.uploadResumeFile(userId, file);
      const parsed = uploadResult.parseResult;

      const mkBullets = (
        section: "experience" | "projects" | "skills" | "education" | "achievements",
        items: string[],
      ) => items.map((content, index) => ({
        id: `${section}-${index}-${Date.now()}`,
        section,
        content,
        createdAt: new Date().toISOString(),
      }));

      const sections: ResumeSectionData[] = [
        { section: "experience", title: "Experience", bullets: mkBullets("experience", parsed.experience ?? []) },
        { section: "projects", title: "Projects", bullets: mkBullets("projects", parsed.projects ?? []) },
        { section: "skills", title: "Skills", bullets: mkBullets("skills", parsed.skills ?? []) },
        { section: "education", title: "Education", bullets: mkBullets("education", parsed.education ?? []) },
        { section: "achievements", title: "Achievements", bullets: [] },
      ];

      setResume({
        id: uploadResult.resumeId || `uploaded-${Date.now()}`,
        header: {
          name: parsed.name || "Uploaded Candidate",
          title: "",
          email: parsed.email || "",
          phone: parsed.phone || "",
          location: "",
        },
        summary: parsed.summary || "",
        sections,
      });

      setUploadSuccess(true);
    } catch (error) {
      try {
        const parsed = await parseResumeFileLocally(file);

        const mkBullets = (
          section: "experience" | "projects" | "skills" | "education" | "achievements",
          items: string[],
        ) => items.map((content, index) => ({
          id: `${section}-${index}-${Date.now()}`,
          section,
          content,
          createdAt: new Date().toISOString(),
        }));

        const sections: ResumeSectionData[] = [
          { section: "experience", title: "Experience", bullets: mkBullets("experience", parsed.experience ?? []) },
          { section: "projects", title: "Projects", bullets: mkBullets("projects", parsed.projects ?? []) },
          { section: "skills", title: "Skills", bullets: mkBullets("skills", parsed.skills ?? []) },
          { section: "education", title: "Education", bullets: mkBullets("education", parsed.education ?? []) },
          { section: "achievements", title: "Achievements", bullets: [] },
        ];

        setResume({
          id: `local-${Date.now()}`,
          header: {
            name: parsed.name || "Uploaded Candidate",
            title: "",
            email: parsed.email || "",
            phone: parsed.phone || "",
            location: "",
          },
          summary: parsed.summary || "",
          sections,
        });

        setUploadSuccess(true);
        setUploadError("Server unavailable: parsed locally and loaded your resume.");
      } catch {
        setUploadError(error instanceof Error ? error.message : "Failed to parse uploaded resume");
      }
    } finally {
      setUploading(false);
    }
  }

  if (!resume) {
    return null;
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center gap-2">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowLeftPanel((v) => !v)}
          className="rounded border border-slate-500 bg-slate-700 px-2 py-1 hover:bg-slate-600 transition-colors"
          title="Toggle sections panel"
        >
          {showLeftPanel ? <PanelLeftClose className="h-4 w-4 text-slate-200" /> : <PanelLeftOpen className="h-4 w-4 text-slate-200" />}
        </button>

        <div className="flex-1">
          <RibbonToolbar
            onBold={handleBold}
            onItalic={handleItalic}
            onUnderline={handleUnderline}
            onFontSizeChange={handleFontSizeChange}
            onFontFamilyChange={handleFontFamilyChange}
            onTextColorChange={handleTextColorChange}
            selectedFontSize={fontSizeInput}
            selectedFontFamily={fontFamily}
            selectedTextColor={textColor}
            onAlignLeft={handleAlignLeft}
            onAlignCenter={handleAlignCenter}
            onAlignRight={handleAlignRight}
            onJustify={handleJustify}
            onInsertHorizontalLine={handleInsertHorizontalLine}
            onInsertTable={handleInsertTable}
            onInsertPageBreak={handleInsertPageBreak}
          />
        </div>

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowRightPanel((v) => !v)}
          className="rounded border border-slate-500 bg-slate-700 px-2 py-1 hover:bg-slate-600 transition-colors"
          title="Toggle templates panel"
        >
          {showRightPanel ? <PanelRightClose className="h-4 w-4 text-slate-200" /> : <PanelRightOpen className="h-4 w-4 text-slate-200" />}
        </button>
      </div>

      <div className="grid h-full min-h-0 gap-4" style={{ gridTemplateColumns: `${showLeftPanel ? "220px" : "0px"} 1fr ${showRightPanel ? "140px" : "40px"}` }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className={`overflow-y-auto ${showLeftPanel ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          <div className="rounded-lg border border-slate-700 bg-slate-600/40 p-3">
            <h3 className="mb-2 text-sm font-semibold text-slate-100">Section Templates</h3>
            <div className="grid gap-2">
              <button onClick={() => addSectionTemplate("experience")} className="rounded bg-slate-700 px-2 py-1 text-left text-xs">+ Experience</button>
              <button onClick={() => addSectionTemplate("projects")} className="rounded bg-slate-700 px-2 py-1 text-left text-xs">+ Projects</button>
              <button onClick={() => addSectionTemplate("skills")} className="rounded bg-slate-700 px-2 py-1 text-left text-xs">+ Skills</button>
              <button onClick={() => addSectionTemplate("education")} className="rounded bg-slate-700 px-2 py-1 text-left text-xs">+ Education</button>
              <button onClick={() => addSectionTemplate("achievements")} className="rounded bg-slate-700 px-2 py-1 text-left text-xs">+ Achievements</button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
            <h3 className="mb-2 text-sm font-semibold text-slate-100">Upload Resume</h3>
            <ResumeFileUpload
              onFileSelected={handleResumeUpload}
              loading={uploading}
              error={uploadError}
              success={uploadSuccess}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex min-h-0 items-start justify-center overflow-auto rounded-lg bg-[#98a09a] p-4"
        >
          <ResumeEditor
            editorRef={editorRef}
            editableHtml={editableHtml}
            pageColor={pageColor}
            onSelectionUpdate={saveSelection}
            onContentInput={setEditableHtml}
            onSaveHistory={saveHistory}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className={`${showRightPanel ? "space-y-3 overflow-y-auto" : "hidden"}`}
        >
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`w-full overflow-hidden rounded border ${selectedTemplate === template.id ? "border-cyan-400" : "border-slate-700"}`}
            >
              <div className="aspect-[210/297] w-full overflow-hidden bg-white">
                <div
                  className="origin-top-left scale-[0.18] p-1"
                  style={{ width: "560%" }}
                  dangerouslySetInnerHTML={{
                    __html: render_template(template.id as TemplateId, templateData),
                  }}
                />
              </div>
            </button>
          ))}
        </motion.div>
      </div>

    </div>
  );
}
