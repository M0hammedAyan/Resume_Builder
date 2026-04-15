import type { JSONContent } from "@tiptap/core";
import type { TemplateStyle } from "../../config/resume.templates";

export type TableScope = "cell" | "row" | "column" | "table";
export type ContentBlock = JSONContent;

export type DocumentTemplateStyle = {
  fontFamily: {
    heading: string;
    body: string;
  };
  fontSize: {
    name: string;
    title: string;
    section: string;
    body: string;
  };
  colors: {
    heading: string;
    subheading: string;
    body: string;
    background: string;
  };
  spacing: {
    sectionGap: string;
    lineHeight: number;
  };
  layout: {
    sectionBorder: boolean;
  };
  sections: string[];
};

export type PageDocument = {
  id: string;
  content: JSONContent;
};

export type RichDocumentModel = {
  pages: PageDocument[];
};

export const createEmptyDoc = (): JSONContent => ({
  type: "doc",
  content: [{ type: "paragraph" }],
});

export const createPage = (id: string, content?: JSONContent): PageDocument => ({
  id,
  content: content ?? createEmptyDoc(),
});

export const buildTemplateStyle = (template?: TemplateStyle): DocumentTemplateStyle => ({
  fontFamily: {
    heading: template?.fontFamily.heading ?? "Arial",
    body: template?.fontFamily.body ?? "Arial",
  },
  fontSize: {
    name: `${template?.fontSize.name ?? 28}px`,
    title: `${template?.fontSize.title ?? 12}px`,
    section: `${template?.fontSize.section ?? 16}px`,
    body: `${template?.fontSize.body ?? 13}px`,
  },
  colors: {
    heading: template?.colors.accent ?? "#111111",
    subheading: template?.colors.secondary ?? "#334155",
    body: template?.colors.text ?? "#111111",
    background: template?.colors.background ?? "#ffffff",
  },
  spacing: {
    sectionGap: `${Math.max(10, Math.round((template?.lineHeight ?? 1.4) * 10))}px`,
    lineHeight: template?.lineHeight ?? 1.4,
  },
  layout: {
    sectionBorder: template?.layout.sectionBorder ?? false,
  },
  sections: ["header", "summary", "experience", "projects", "education", "skills"],
});
