import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createEditorExtensions } from "./editor.extensions";
import {
  buildTemplateStyle,
  type DocumentTemplateStyle,
} from "./editor.types";
import { EditorToolbar } from "./EditorToolbar";
import type { TemplateStyle } from "../../config/resume.templates";

type RichDocumentEditorProps = {
  initialHtml: string;
  templateKey?: string;
  templateStyle?: TemplateStyle;
  onEditorReady?: (editor: Editor | null) => void;
};

export function RichDocumentEditor({
  initialHtml,
  templateKey = "default",
  templateStyle,
  onEditorReady,
}: RichDocumentEditorProps) {
  const extensions = useMemo(() => createEditorExtensions(), []);
  const [docStyle, setDocStyle] = useState<DocumentTemplateStyle>(buildTemplateStyle(templateStyle));
  const currentTemplateKeyRef = useRef(templateKey);

  const editor = useEditor({
    extensions,
    content: initialHtml || "",
    editable: true,
    autofocus: false,
    editorProps: {
      attributes: {
        class: "doc-editor-content",
      },
    },
  });

  const templateCssVars = useMemo<CSSProperties>(
    () => ({
      ["--doc-font-heading" as string]: docStyle.fontFamily.heading,
      ["--doc-font-body" as string]: docStyle.fontFamily.body,
      ["--doc-font-size-name" as string]: docStyle.fontSize.name,
      ["--doc-font-size-title" as string]: docStyle.fontSize.title,
      ["--doc-font-size-section" as string]: docStyle.fontSize.section,
      ["--doc-font-size-body" as string]: docStyle.fontSize.body,
      ["--doc-color-heading" as string]: docStyle.colors.heading,
      ["--doc-color-subheading" as string]: docStyle.colors.subheading,
      ["--doc-color-body" as string]: docStyle.colors.body,
      ["--doc-color-page-bg" as string]: docStyle.colors.background,
      ["--doc-section-gap" as string]: docStyle.spacing.sectionGap,
      ["--doc-line-height" as string]: String(docStyle.spacing.lineHeight),
      ["--doc-section-border-color" as string]: `${docStyle.colors.subheading}55`,
    }),
    [docStyle],
  );

  useEffect(() => {
    console.log("Editor initialized:", editor);
  }, [editor]);

  useEffect(() => {
    onEditorReady?.(editor ?? null);
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (!editor) return;
    const incoming = initialHtml || "";
    if (editor.getHTML() !== incoming) {
      editor.commands.setContent(incoming, false);
    }
  }, [editor, initialHtml]);

  useEffect(() => {
    if (!editor) return;
    if (currentTemplateKeyRef.current === templateKey) return;

    currentTemplateKeyRef.current = templateKey;
    setDocStyle(buildTemplateStyle(templateStyle));
    editor.commands.setContent(initialHtml || "", false);
  }, [editor, initialHtml, templateKey, templateStyle]);

  useEffect(() => {
    setDocStyle(buildTemplateStyle(templateStyle));
  }, [templateStyle]);

  const handleInsertPageBreak = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertPageBreak().run();
  }, [editor]);

  const handleExportHtml = useCallback(() => {
    if (!editor) return;
    const html = editor.getHTML();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "resume-document.html";
    anchor.click();
    URL.revokeObjectURL(url);
  }, [editor]);

  const handleExportJson = useCallback(() => {
    if (!editor) return;
    const payload = JSON.stringify(editor.getJSON(), null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "resume-document.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }, [editor]);

  return (
    <div
      className={`doc-editor-layout ${docStyle.layout.sectionBorder ? "doc-has-section-borders" : ""}`}
      style={templateCssVars}
      data-template-sections={docStyle.sections.join(",")}
    >
      <EditorToolbar
        editor={editor}
        onInsertPageBreak={handleInsertPageBreak}
        onExportHtml={handleExportHtml}
        onExportJson={handleExportJson}
      />

      <div className="doc-editor-root">
        <div className="doc-pages-canvas">
          <article className="page doc-page doc-page-active">
            <div className="doc-page-inner">
              <EditorContent editor={editor} />
            </div>
            <footer className="doc-page-footer">Page 1</footer>
          </article>
        </div>
      </div>
    </div>
  );
}
