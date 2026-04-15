import type { Editor, JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect } from "react";

type EditorPageProps = {
  pageId: string;
  content: JSONContent;
  extensions: ReturnType<typeof import("./editor.extensions").createEditorExtensions>;
  active: boolean;
  onReady: (pageId: string, editor: Editor) => void;
  onFocus: (pageId: string) => void;
  onUpdate: (pageId: string, content: JSONContent, overflow: boolean) => void;
};

export function EditorPage({ pageId, content, extensions, active, onReady, onFocus, onUpdate }: EditorPageProps) {
  const editor = useEditor({
    extensions,
    content,
    autofocus: false,
    editorProps: {
      attributes: {
        class: "doc-editor-content",
      },
    },
    onFocus: () => {
      onFocus(pageId);
    },
    onUpdate: ({ editor: instance }) => {
      const dom = instance.view.dom as HTMLElement;
      const pageInner = dom.closest(".doc-page-inner") as HTMLElement | null;
      const pageInnerHeight = pageInner?.clientHeight ?? dom.clientHeight;
      const overflow = dom.scrollHeight > pageInnerHeight;
      onUpdate(pageId, instance.getJSON(), overflow);
    },
  });

  useEffect(() => {
    if (!editor) return;
    onReady(pageId, editor);
  }, [editor, onReady, pageId]);

  useEffect(() => {
    if (!editor) return;
    const current = JSON.stringify(editor.getJSON());
    const incoming = JSON.stringify(content);
    if (current !== incoming) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  return (
    <article className={`doc-page ${active ? "doc-page-active" : ""}`}>
      <div className="doc-page-inner">
        <EditorContent editor={editor} />
      </div>
      <footer className="doc-page-footer">Page {pageId.replace("page-", "")}</footer>
    </article>
  );
}
