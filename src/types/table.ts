export type TableBorderStyle = "full" | "none" | "left" | "right" | "top" | "bottom";

export type TableSelectionScope = "cell" | "row" | "column" | "table";

export type TableInsertOptions = {
  rows: number;
  cols: number;
  borderStyle: TableBorderStyle;
  borderWidth: number;
  borderColor: string;
  tableFill: string;
  cellFill: string;
  selectionScope?: TableSelectionScope;
};