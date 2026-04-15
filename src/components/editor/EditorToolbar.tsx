import type { Editor } from "@tiptap/core";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ChevronDown,
  Download,
  Heading,
  Highlighter,
  IndentDecrease,
  IndentIncrease,
  List,
  ListOrdered,
  Minus,
  PaintBucket,
  Pilcrow,
  Rows3,
  SplitSquareVertical,
  Table,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Tooltip } from "./Tooltip";
import type { TableScope } from "./editor.types";

type EditorToolbarProps = {
  editor: Editor | null;
  onInsertPageBreak: () => void;
  onExportHtml: () => void;
  onExportJson: () => void;
};

const FONT_FAMILIES = ["Arial", "Calibri", "Times New Roman", "Georgia", "Cambria", "Helvetica"];
const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];
const LINE_HEIGHTS = ["1", "1.2", "1.4", "1.6", "1.8", "2"];
const SPACING = ["0px", "4px", "8px", "12px", "16px", "20px", "24px"];

export function EditorToolbar({ editor, onInsertPageBreak, onExportHtml, onExportJson }: EditorToolbarProps) {
  const [showTableInsert, setShowTableInsert] = useState(false);
  const [showTableDesign, setShowTableDesign] = useState(false);
  const [tableScope, setTableScope] = useState<TableScope>("cell");
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [cellPadding, setCellPadding] = useState(8);
  const [borderWidth, setBorderWidth] = useState(1);
  const [borderColor, setBorderColor] = useState("#334155");
  const [cellBg, setCellBg] = useState("#ffffff");

  const hasTable = Boolean(editor?.isActive("table"));

  const headingOptions = useMemo(
    () => [
      { label: "Paragraph", value: 0 },
      { label: "H1", value: 1 },
      { label: "H2", value: 2 },
      { label: "H3", value: 3 },
      { label: "H4", value: 4 },
      { label: "H5", value: 5 },
      { label: "H6", value: 6 },
    ],
    [],
  );

  const execute = (fn: () => void) => {
    if (!editor) return;
    fn();
  };

  const setIndent = (step: number) => {
    if (!editor) return;
    const attrs = editor.getAttributes("paragraph");
    const current = Number.parseInt(String(attrs.textIndent ?? "0"), 10);
    const next = Math.max(0, current + step);
    editor.chain().focus().setParagraphIndent(`${next}px`).run();
  };

  const applyTableStyles = () => {
    if (!editor) return;

    const applyCell = () =>
      editor
        .chain()
        .focus()
        .setCellAttribute("backgroundColor", cellBg)
        .setCellAttribute("cellPadding", cellPadding)
        .setCellAttribute("borderColor", borderColor)
        .setCellAttribute("borderWidth", borderWidth)
        .run();

    if (tableScope === "table") {
      editor.chain().focus().updateAttributes("table", { borderColor, borderWidth }).run();
      applyCell();
      return;
    }

    applyCell();
  };

  return (
    <div className="doc-toolbar">
      <div className="doc-toolbar-row">
        <Tooltip label="Font family">
          <select
            className="doc-select"
            onChange={(e) => execute(() => editor?.chain().focus().setFontFamily(e.target.value).run())}
            defaultValue={FONT_FAMILIES[0]}
          >
            {FONT_FAMILIES.map((family) => (
              <option key={family} value={family}>
                {family}
              </option>
            ))}
          </select>
        </Tooltip>

        <Tooltip label="Font size">
          <select
            className="doc-select doc-select-small"
            onChange={(e) => execute(() => editor?.chain().focus().setFontSize(e.target.value).run())}
            defaultValue={FONT_SIZES[2]}
          >
            {FONT_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </Tooltip>

        <Tooltip label="Bold"><button className="doc-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => execute(() => editor?.chain().focus().toggleBold().run())}>B</button></Tooltip>
        <Tooltip label="Italic"><button className="doc-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => execute(() => editor?.chain().focus().toggleItalic().run())}>I</button></Tooltip>
        <Tooltip label="Underline"><button className="doc-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => execute(() => editor?.chain().focus().toggleUnderline().run())}>U</button></Tooltip>
        <Tooltip label="Strikethrough"><button className="doc-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => execute(() => editor?.chain().focus().toggleStrike().run())}>S</button></Tooltip>

        <Tooltip label="Text color">
          <label className="doc-icon-input">
            <PaintBucket className="h-4 w-4" />
            <input type="color" defaultValue="#111111" onChange={(e) => execute(() => editor?.chain().focus().setColor(e.target.value).run())} />
          </label>
        </Tooltip>

        <Tooltip label="Highlight color">
          <label className="doc-icon-input">
            <Highlighter className="h-4 w-4" />
            <input type="color" defaultValue="#fff3a3" onChange={(e) => execute(() => editor?.chain().focus().setHighlight({ color: e.target.value }).run())} />
          </label>
        </Tooltip>

        <div className="doc-divider" />

        <Tooltip label="Align left"><button className="doc-icon-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => execute(() => editor?.chain().focus().setTextAlign("left").run())}><AlignLeft className="h-4 w-4" /></button></Tooltip>
        <Tooltip label="Align center"><button className="doc-icon-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => execute(() => editor?.chain().focus().setTextAlign("center").run())}><AlignCenter className="h-4 w-4" /></button></Tooltip>
        <Tooltip label="Align right"><button className="doc-icon-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => execute(() => editor?.chain().focus().setTextAlign("right").run())}><AlignRight className="h-4 w-4" /></button></Tooltip>
        <Tooltip label="Justify"><button className="doc-icon-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => execute(() => editor?.chain().focus().setTextAlign("justify").run())}><AlignJustify className="h-4 w-4" /></button></Tooltip>

        <Tooltip label="Bullet list"><button className="doc-icon-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => execute(() => editor?.chain().focus().toggleBulletList().run())}><List className="h-4 w-4" /></button></Tooltip>
        <Tooltip label="Numbered list"><button className="doc-icon-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => execute(() => editor?.chain().focus().toggleOrderedList().run())}><ListOrdered className="h-4 w-4" /></button></Tooltip>

        <Tooltip label="Bullet style">
          <select className="doc-select doc-select-small" onChange={(e) => execute(() => editor?.chain().focus().updateAttributes("bulletList", { listStyleType: e.target.value }).run())} defaultValue="disc">
            <option value="disc">disc</option>
            <option value="circle">circle</option>
            <option value="square">square</option>
          </select>
        </Tooltip>

        <Tooltip label="Number style">
          <select className="doc-select doc-select-small" onChange={(e) => execute(() => editor?.chain().focus().updateAttributes("orderedList", { listStyleType: e.target.value }).run())} defaultValue="decimal">
            <option value="decimal">1</option>
            <option value="lower-alpha">a</option>
            <option value="upper-alpha">A</option>
            <option value="lower-roman">i</option>
            <option value="upper-roman">I</option>
          </select>
        </Tooltip>
      </div>

      <div className="doc-toolbar-row">
        <Tooltip label="Heading level">
          <label className="doc-inline-label">
            <Heading className="h-4 w-4" />
            <select
              className="doc-select doc-select-small"
              defaultValue={0}
              onChange={(e) => {
                const level = Number(e.target.value);
                if (!editor) return;
                if (level === 0) {
                  editor.chain().focus().setParagraph().run();
                  return;
                }
                editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
              }}
            >
              {headingOptions.map((heading) => (
                <option key={heading.value} value={heading.value}>
                  {heading.label}
                </option>
              ))}
            </select>
          </label>
        </Tooltip>

        <Tooltip label="Line height">
          <label className="doc-inline-label">
            LH
            <select className="doc-select doc-select-small" defaultValue={LINE_HEIGHTS[2]} onChange={(e) => execute(() => editor?.chain().focus().setLineHeight(e.target.value).run())}>
              {LINE_HEIGHTS.map((lh) => (
                <option key={lh} value={lh}>{lh}</option>
              ))}
            </select>
          </label>
        </Tooltip>

        <Tooltip label="Paragraph spacing before">
          <label className="doc-inline-label">
            Before
            <select className="doc-select doc-select-small" defaultValue={SPACING[1]} onChange={(e) => execute(() => editor?.chain().focus().setParagraphSpacing(e.target.value, editor?.getAttributes("paragraph").marginBottom ?? "4px").run())}>
              {SPACING.map((sp) => (
                <option key={sp} value={sp}>{sp}</option>
              ))}
            </select>
          </label>
        </Tooltip>

        <Tooltip label="Paragraph spacing after">
          <label className="doc-inline-label">
            After
            <select className="doc-select doc-select-small" defaultValue={SPACING[1]} onChange={(e) => execute(() => editor?.chain().focus().setParagraphSpacing(editor?.getAttributes("paragraph").marginTop ?? "4px", e.target.value).run())}>
              {SPACING.map((sp) => (
                <option key={sp} value={sp}>{sp}</option>
              ))}
            </select>
          </label>
        </Tooltip>

        <Tooltip label="Decrease indent"><button className="doc-icon-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => setIndent(-12)}><IndentDecrease className="h-4 w-4" /></button></Tooltip>
        <Tooltip label="Increase indent"><button className="doc-icon-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => setIndent(12)}><IndentIncrease className="h-4 w-4" /></button></Tooltip>

        <Tooltip label="Insert paragraph"><button className="doc-icon-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => execute(() => editor?.chain().focus().insertContent({ type: "paragraph" }).run())}><Pilcrow className="h-4 w-4" /></button></Tooltip>
        <Tooltip label="Insert horizontal line"><button className="doc-icon-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => execute(() => editor?.chain().focus().setHorizontalRule().run())}><Minus className="h-4 w-4" /></button></Tooltip>
        <Tooltip label="Insert page break"><button className="doc-icon-btn" onMouseDown={(e) => e.preventDefault()} onClick={onInsertPageBreak}><SplitSquareVertical className="h-4 w-4" /></button></Tooltip>

        <div className="doc-toolbar-popover">
          <Tooltip label="Insert table">
            <button className="doc-icon-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => setShowTableInsert((v) => !v)}>
              <Table className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </button>
          </Tooltip>

          {showTableInsert && (
            <div className="doc-popover-panel">
              <label className="doc-inline-label">Rows <input type="number" min={1} max={20} value={tableRows} onChange={(e) => setTableRows(Math.max(1, Number(e.target.value) || 1))} /></label>
              <label className="doc-inline-label">Cols <input type="number" min={1} max={20} value={tableCols} onChange={(e) => setTableCols(Math.max(1, Number(e.target.value) || 1))} /></label>
              <button className="doc-btn-primary" onClick={() => execute(() => editor?.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: false }).run())}>Insert Table</button>
              <div className="doc-grid-actions">
                <button className="doc-btn" onClick={() => execute(() => editor?.chain().focus().addColumnAfter().run())}>+ Col</button>
                <button className="doc-btn" onClick={() => execute(() => editor?.chain().focus().deleteColumn().run())}>- Col</button>
                <button className="doc-btn" onClick={() => execute(() => editor?.chain().focus().addRowAfter().run())}>+ Row</button>
                <button className="doc-btn" onClick={() => execute(() => editor?.chain().focus().deleteRow().run())}>- Row</button>
                <button className="doc-btn" onClick={() => execute(() => editor?.chain().focus().mergeCells().run())}>Merge</button>
                <button className="doc-btn" onClick={() => execute(() => editor?.chain().focus().splitCell().run())}>Split</button>
              </div>
            </div>
          )}
        </div>

        <div className="doc-toolbar-popover">
          <Tooltip label="Table design">
            <button className="doc-icon-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => setShowTableDesign((v) => !v)}>
              <Rows3 className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </button>
          </Tooltip>

          {showTableDesign && (
            <div className="doc-popover-panel">
              <select className="doc-select" value={tableScope} onChange={(e) => setTableScope(e.target.value as TableScope)}>
                <option value="cell">Cell</option>
                <option value="row">Row</option>
                <option value="column">Column</option>
                <option value="table">Table</option>
              </select>

              <label className="doc-inline-label">Border <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} /></label>
              <label className="doc-inline-label">Bg <input type="color" value={cellBg} onChange={(e) => setCellBg(e.target.value)} /></label>
              <label className="doc-inline-label">Thickness <input type="number" min={0} max={8} value={borderWidth} onChange={(e) => setBorderWidth(Math.max(0, Number(e.target.value) || 0))} /></label>
              <label className="doc-inline-label">Padding <input type="number" min={0} max={32} value={cellPadding} onChange={(e) => setCellPadding(Math.max(0, Number(e.target.value) || 0))} /></label>
              <button className="doc-btn-primary" disabled={!hasTable} onClick={applyTableStyles}>Apply Table Style</button>
            </div>
          )}
        </div>

        <div className="doc-divider" />

        <Tooltip label="Export HTML"><button className="doc-icon-btn" onMouseDown={(e) => e.preventDefault()} onClick={onExportHtml}><Download className="h-4 w-4" /></button></Tooltip>
        <Tooltip label="Export JSON"><button className="doc-icon-btn" onMouseDown={(e) => e.preventDefault()} onClick={onExportJson}><Trash2 className="h-4 w-4" /></button></Tooltip>
      </div>
    </div>
  );
}
