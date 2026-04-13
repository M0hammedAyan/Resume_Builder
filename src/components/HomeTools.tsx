import {
  Bold,
  Italic,
  Underline,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Minus,
} from "lucide-react";
import { FormattingToolbar } from "./FormattingToolbar";

type HomeToolsProps = {
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onFontSizeChange: (size: string) => void;
  onFontFamilyChange: (font: string) => void;
  onTextColorChange: (color: string) => void;
  selectedFontSize: string;
  selectedFontFamily: string;
  selectedTextColor: string;
  onAlignLeft: () => void;
  onAlignCenter: () => void;
  onAlignRight: () => void;
  onJustify: () => void;
  onInsertHorizontalLine: () => void;
};

export function HomeTools({
  onBold,
  onItalic,
  onUnderline,
  onFontSizeChange,
  onFontFamilyChange,
  onTextColorChange,
  selectedFontSize,
  selectedFontFamily,
  selectedTextColor,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onJustify,
  onInsertHorizontalLine,
}: HomeToolsProps) {
  return (
    <div className="flex gap-6 px-4 py-2">
      {/* Font Group */}
      <div className="flex gap-2 border-r border-slate-600 pr-4">
        <select
          value={selectedFontFamily}
          onChange={(e) => onFontFamilyChange(e.target.value)}
          className="text-xs bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-200 hover:bg-slate-600"
          title="Font family"
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
          className="w-14 text-xs bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-200 hover:bg-slate-600"
          title="Font size"
        >
          <option value="">--</option>
          <option value="12">12px</option>
          <option value="14">14px</option>
          <option value="16">16px</option>
          <option value="18">18px</option>
          <option value="20">20px</option>
          <option value="24">24px</option>
          <option value="28">28px</option>
        </select>

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={onBold}
          className="p-1.5 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4 text-slate-200" />
        </button>

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={onItalic}
          className="p-1.5 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4 text-slate-200" />
        </button>

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={onUnderline}
          className="p-1.5 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4 text-slate-200" />
        </button>

        <button
          onMouseDown={(e) => e.preventDefault()}
          className="p-1.5 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
          title="Text color"
        >
          <input
            type="color"
            value={selectedTextColor}
            onChange={(e) => onTextColorChange(e.target.value)}
            className="w-4 h-4 cursor-pointer"
          />
        </button>
      </div>

      {/* Alignment Group */}
      <div className="flex gap-2 border-r border-slate-600 pr-4">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={onAlignLeft}
          className="p-1.5 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
          title="Align left"
        >
          <AlignLeft className="w-4 h-4 text-slate-200" />
        </button>

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={onAlignCenter}
          className="p-1.5 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
          title="Align center"
        >
          <AlignCenter className="w-4 h-4 text-slate-200" />
        </button>

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={onAlignRight}
          className="p-1.5 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
          title="Align right"
        >
          <AlignRight className="w-4 h-4 text-slate-200" />
        </button>

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={onJustify}
          className="p-1.5 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
          title="Justify"
        >
          <Maximize2 className="w-4 h-4 text-slate-200" />
        </button>
      </div>

      {/* Insert Lines Group */}
      <div className="flex gap-2">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={onInsertHorizontalLine}
          className="p-1.5 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
          title="Insert horizontal line"
        >
          <Minus className="w-4 h-4 text-slate-200" />
        </button>
      </div>
    </div>
  );
}
