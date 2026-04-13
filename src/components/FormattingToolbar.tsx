import { Bold, Italic, Type, Underline } from "lucide-react";

type FormattingToolbarProps = {
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onFontSizeChange: (size: string) => void;
  onFontFamilyChange: (font: string) => void;
  onTextColorChange: (color: string) => void;
  selectedFontSize: string;
  selectedFontFamily: string;
  selectedTextColor: string;
};

const FONT_SIZE_OPTIONS = ["12", "14", "16", "18", "20", "24", "28"];

export function FormattingToolbar({
  onBold,
  onItalic,
  onUnderline,
  onFontSizeChange,
  onFontFamilyChange,
  onTextColorChange,
  selectedFontSize,
  selectedFontFamily,
  selectedTextColor,
}: FormattingToolbarProps) {
  return (
    <div className="flex-1 flex justify-center gap-2">
      <Type className="h-4 w-4 self-center" />

      <select
        value={selectedFontFamily}
        onChange={(e) => onFontFamilyChange(e.target.value)}
        className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
      >
        <option value="Arial">Arial</option>
        <option value="Calibri">Calibri</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Cambria">Cambria</option>
        <option value="Georgia">Georgia</option>
      </select>

      <select
        value={selectedFontSize}
        onChange={(e) => onFontSizeChange(e.target.value)}
        className="w-20 rounded border border-slate-300 bg-white px-2 py-1 text-sm"
      >
        <option value="">--</option>
        {FONT_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size}px
          </option>
        ))}
      </select>

      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={onBold}
        className="rounded border border-slate-300 bg-white px-2 py-1"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={onItalic}
        className="rounded border border-slate-300 bg-white px-2 py-1"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={onUnderline}
        className="rounded border border-slate-300 bg-white px-2 py-1"
      >
        <Underline className="h-4 w-4" />
      </button>

      <label className="ml-1 flex items-center gap-1 text-xs">
        Text
        <input
          type="color"
          value={selectedTextColor}
          onChange={(e) => onTextColorChange(e.target.value)}
          className="h-6 w-8 border border-slate-300"
        />
      </label>
    </div>
  );
}