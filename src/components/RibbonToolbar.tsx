import { useState } from "react";
import { HomeTools } from "./HomeTools";
import { InsertTools } from "./InsertTools";

type RibbonToolbarProps = {
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
  onInsertTable: (rows: number, cols: number) => void;
  onInsertPageBreak: () => void;
};

export function RibbonToolbar({
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
  onInsertTable,
  onInsertPageBreak,
}: RibbonToolbarProps) {
  const [activeTab, setActiveTab] = useState<"home" | "insert">("home");

  return (
    <div className="bg-slate-800 border-b border-slate-700">
      {/* Tab Bar */}
      <div className="flex gap-0 px-4 py-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab("home")}
          className={`px-3 py-1 text-xs font-semibold transition-colors ${
            activeTab === "home"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Home
        </button>
        <button
          onClick={() => setActiveTab("insert")}
          className={`px-3 py-1 text-xs font-semibold transition-colors ${
            activeTab === "insert"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Insert
        </button>
      </div>

      {/* Tools Section */}
      {activeTab === "home" && (
        <HomeTools
          onBold={onBold}
          onItalic={onItalic}
          onUnderline={onUnderline}
          onFontSizeChange={onFontSizeChange}
          onFontFamilyChange={onFontFamilyChange}
          onTextColorChange={onTextColorChange}
          selectedFontSize={selectedFontSize}
          selectedFontFamily={selectedFontFamily}
          selectedTextColor={selectedTextColor}
          onAlignLeft={onAlignLeft}
          onAlignCenter={onAlignCenter}
          onAlignRight={onAlignRight}
          onJustify={onJustify}
          onInsertHorizontalLine={onInsertHorizontalLine}
        />
      )}

      {activeTab === "insert" && (
        <InsertTools onInsertTable={onInsertTable} onInsertPageBreak={onInsertPageBreak} />
      )}
    </div>
  );
}
