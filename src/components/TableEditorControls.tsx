import { Table } from "lucide-react";
import { useState } from "react";
import type { TableBorderStyle, TableInsertOptions } from "../types/table";

type TableEditorControlsProps = {
  onInsertTable: (settings: TableInsertOptions) => void;
};

const BORDER_STYLE_OPTIONS: Array<{ value: TableBorderStyle; label: string }> = [
  { value: "full", label: "Full border" },
  { value: "none", label: "No border" },
  { value: "left", label: "Left border" },
  { value: "right", label: "Right border" },
  { value: "top", label: "Top border" },
  { value: "bottom", label: "Bottom border" },
];

export function TableEditorControls({ onInsertTable }: TableEditorControlsProps) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [borderStyle, setBorderStyle] = useState<TableBorderStyle>("full");
  const [borderWidth, setBorderWidth] = useState(1);
  const [borderColor, setBorderColor] = useState("#2f2f2f");
  const [tableFill, setTableFill] = useState("#ffffff");
  const [cellFill, setCellFill] = useState("#ffffff");

  return (
    <div className="border-t border-slate-700/70 px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <Table className="h-4 w-4" />
        Table editor
      </div>

      <div className="grid gap-3 rounded-lg border border-slate-700 bg-slate-900/40 p-3 text-xs text-slate-200 md:grid-cols-2 xl:grid-cols-3">
        <label className="grid gap-1">
          <span className="text-slate-400">Rows</span>
          <input
            type="number"
            min={1}
            max={20}
            value={rows}
            onChange={(e) => setRows(Math.max(1, Number(e.target.value) || 1))}
            className="rounded border border-slate-600 bg-slate-800 px-2 py-1"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-slate-400">Columns</span>
          <input
            type="number"
            min={1}
            max={20}
            value={cols}
            onChange={(e) => setCols(Math.max(1, Number(e.target.value) || 1))}
            className="rounded border border-slate-600 bg-slate-800 px-2 py-1"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-slate-400">Border style</span>
          <select
            value={borderStyle}
            onChange={(e) => setBorderStyle(e.target.value as TableBorderStyle)}
            className="rounded border border-slate-600 bg-slate-800 px-2 py-1"
          >
            {BORDER_STYLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-slate-400">Border thickness</span>
          <input
            type="number"
            min={0}
            max={10}
            value={borderWidth}
            onChange={(e) => setBorderWidth(Math.max(0, Number(e.target.value) || 0))}
            className="rounded border border-slate-600 bg-slate-800 px-2 py-1"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-slate-400">Border color</span>
          <input
            type="color"
            value={borderColor}
            onChange={(e) => setBorderColor(e.target.value)}
            className="h-9 w-full rounded border border-slate-600 bg-slate-800 p-1"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-slate-400">Table fill</span>
          <input
            type="color"
            value={tableFill}
            onChange={(e) => setTableFill(e.target.value)}
            className="h-9 w-full rounded border border-slate-600 bg-slate-800 p-1"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-slate-400">Cell fill</span>
          <input
            type="color"
            value={cellFill}
            onChange={(e) => setCellFill(e.target.value)}
            className="h-9 w-full rounded border border-slate-600 bg-slate-800 p-1"
          />
        </label>

        <div className="flex items-end md:col-span-2 xl:col-span-3">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() =>
              onInsertTable({
                rows,
                cols,
                borderStyle,
                borderWidth,
                borderColor,
                tableFill,
                cellFill,
              })
            }
            className="inline-flex items-center gap-2 rounded bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            <Table className="h-4 w-4" />
            Insert table
          </button>
        </div>
      </div>
    </div>
  );
}