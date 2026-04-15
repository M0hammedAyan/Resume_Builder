import { useState } from "react";
import { Table, PlusSquare } from "lucide-react";
import { TableGridPicker } from "./TableGridPicker";
import type { TableInsertOptions } from "../types/table";

type InsertToolsProps = {
  onInsertTable: (rows: number, cols: number, options?: Omit<TableInsertOptions, "rows" | "cols">) => void;
  onInsertPageBreak: () => void;
};

export function InsertTools({ onInsertTable, onInsertPageBreak }: InsertToolsProps) {
  const [showTablePicker, setShowTablePicker] = useState(false);

  return (
    <div className="flex gap-6 px-4 py-2">
      {/* Table Group */}
      <div className="flex gap-2 border-r border-slate-600 pr-4 relative">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowTablePicker(!showTablePicker)}
          className="p-1.5 bg-slate-700 rounded hover:bg-slate-600 transition-colors relative"
          title="Insert table"
        >
          <Table className="w-4 h-4 text-slate-200" />
          {showTablePicker && (
            <TableGridPicker
              onTableCreate={(rows, cols) => {
                onInsertTable(rows, cols, {
                  borderStyle: "full",
                  borderWidth: 1,
                  borderColor: "#333333",
                  tableFill: "#ffffff",
                  cellFill: "#ffffff",
                });
                setShowTablePicker(false);
              }}
              onClose={() => setShowTablePicker(false)}
            />
          )}
        </button>
      </div>

      {/* Page Break Group */}
      <div className="flex gap-2">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={onInsertPageBreak}
          className="p-1.5 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
          title="Insert page break"
        >
          <PlusSquare className="w-4 h-4 text-slate-200" />
        </button>
      </div>
    </div>
  );
}
