import { Extension, Node } from "@tiptap/core";
import BulletList from "@tiptap/extension-bullet-list";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import OrderedList from "@tiptap/extension-ordered-list";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";

export const PageBreak = Node.create({
  name: "pageBreak",
  group: "block",
  atom: true,
  selectable: true,

  parseHTML() {
    return [{ tag: "hr[data-page-break='true']" }];
  },

  renderHTML() {
    return ["hr", { "data-page-break": "true", class: "doc-page-break" }];
  },
});

const StyledTable = Table.extend({
  addAttributes() {
    return {
      borderColor: {
        default: "#334155",
      },
      borderWidth: {
        default: 1,
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const borderColor = String(HTMLAttributes.borderColor ?? "#334155");
    const borderWidth = Number(HTMLAttributes.borderWidth ?? 1);

    return [
      "table",
      {
        ...HTMLAttributes,
        class: "doc-table",
        style: `border-color:${borderColor};border-width:${borderWidth}px;`,
      },
      ["tbody", 0],
    ];
  },
});

const StyledBulletList = BulletList.extend({
  addAttributes() {
    return {
      listStyleType: {
        default: "disc",
        parseHTML: (element) => element.style.listStyleType || "disc",
        renderHTML: (attributes) => ({
          style: `list-style-type:${String(attributes.listStyleType ?? "disc")}`,
        }),
      },
    };
  },
});

const StyledOrderedList = OrderedList.extend({
  addAttributes() {
    return {
      listStyleType: {
        default: "decimal",
        parseHTML: (element) => element.style.listStyleType || "decimal",
        renderHTML: (attributes) => ({
          style: `list-style-type:${String(attributes.listStyleType ?? "decimal")}`,
        }),
      },
    };
  },
});

const StyledTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: "#ffffff",
      },
      cellPadding: {
        default: 8,
      },
      borderColor: {
        default: "#334155",
      },
      borderWidth: {
        default: 1,
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const padding = Number(HTMLAttributes.cellPadding ?? 8);
    const backgroundColor = String(HTMLAttributes.backgroundColor ?? "#ffffff");
    const borderColor = String(HTMLAttributes.borderColor ?? "#334155");
    const borderWidth = Number(HTMLAttributes.borderWidth ?? 1);

    return [
      "td",
      {
        ...HTMLAttributes,
        style: `padding:${padding}px;background:${backgroundColor};border:${borderWidth}px solid ${borderColor};vertical-align:top;`,
      },
      0,
    ];
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    richText: {
      setFontSize: (size: string) => ReturnType;
      setLineHeight: (lineHeight: string) => ReturnType;
      setParagraphSpacing: (before: string, after: string) => ReturnType;
      setParagraphIndent: (indent: string) => ReturnType;
      insertPageBreak: () => ReturnType;
    };
  }
}

const FontSize = Extension.create({
  name: "fontSize",

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size:${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize: size }).run(),
    };
  },
});

const ParagraphStyles = Extension.create({
  name: "paragraphStyles",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) => element.style.lineHeight || null,
            renderHTML: (attributes) => (attributes.lineHeight ? { style: `line-height:${attributes.lineHeight}` } : {}),
          },
          marginTop: {
            default: null,
            parseHTML: (element) => element.style.marginTop || null,
            renderHTML: (attributes) => (attributes.marginTop ? { style: `margin-top:${attributes.marginTop}` } : {}),
          },
          marginBottom: {
            default: null,
            parseHTML: (element) => element.style.marginBottom || null,
            renderHTML: (attributes) => (attributes.marginBottom ? { style: `margin-bottom:${attributes.marginBottom}` } : {}),
          },
          textIndent: {
            default: null,
            parseHTML: (element) => element.style.textIndent || null,
            renderHTML: (attributes) => (attributes.textIndent ? { style: `text-indent:${attributes.textIndent}` } : {}),
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight:
        (lineHeight: string) =>
        ({ commands }) =>
          commands.updateAttributes("paragraph", { lineHeight }),
      setParagraphSpacing:
        (before: string, after: string) =>
        ({ commands }) =>
          commands.updateAttributes("paragraph", { marginTop: before, marginBottom: after }),
      setParagraphIndent:
        (indent: string) =>
        ({ commands }) =>
          commands.updateAttributes("paragraph", { textIndent: indent }),
    };
  },
});

const PageBreakCommand = Extension.create({
  name: "pageBreakCommand",

  addCommands() {
    return {
      insertPageBreak:
        () =>
        ({ chain }) =>
          chain().insertContent({ type: "pageBreak" }).insertContent({ type: "paragraph" }).run(),
    };
  },
});

export const createEditorExtensions = () => [
  StarterKit.configure({
    bulletList: false,
    orderedList: false,
    heading: { levels: [1, 2, 3, 4, 5, 6] },
  }),
  Underline,
  FontFamily,
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
  StyledBulletList,
  StyledOrderedList,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  StyledTable.configure({ resizable: true }),
  TableRow,
  TableHeader,
  StyledTableCell,
  ParagraphStyles,
  FontSize,
  PageBreak,
  PageBreakCommand,
];
