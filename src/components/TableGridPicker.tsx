import { useEffect, useRef, useState } from "react";

type TableGridPickerProps = {
  onTableCreate: (rows: number, cols: number) => void;
  onClose: () => void;
};

export function TableGridPicker({ onTableCreate, onClose }: TableGridPickerProps) {
  const [selectedRows, setSelectedRows] = useState(1);
  const [selectedCols, setSelectedCols] = useState(1);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleCellHover = (row: number, col: number) => {
    setSelectedRows(row);
    setSelectedCols(col);
  };

  const handleCellClick = () => {
    onTableCreate(selectedRows, selectedCols);
    onClose();
  };

  return (
    <div
      ref={pickerRef}
      className="absolute top-full left-0 mt-2 bg-slate-800 rounded border border-slate-700 p-4 z-50 shadow-lg"
    >
      <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(10, 20px)" }}>
        {Array.from({ length: 100 }).map((_, i) => {
          const row = Math.floor(i / 10) + 1;
          const col = (i % 10) + 1;
          const isSelected = row <= selectedRows && col <= selectedCols;

          return (
            <div
              key={i}
              className={`w-5 h-5 border cursor-pointer transition-colors ${
                isSelected ? "bg-blue-500 border-blue-500" : "bg-slate-700 border-slate-600"
              }`}
              onMouseEnter={() => handleCellHover(row, col)}
              onClick={handleCellClick}
            />
          );
        })}
      </div>
      <div className="mt-2 text-xs text-slate-400">
        {selectedRows} × {selectedCols}
      </div>
    </div>
  );
}
