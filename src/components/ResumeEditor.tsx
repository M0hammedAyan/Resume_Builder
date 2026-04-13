import type { RefObject } from "react";

type ResumeEditorProps = {
  editorRef: RefObject<HTMLDivElement>;
  editableHtml: string;
  pageColor: string;
  onSelectionUpdate: () => void;
  onContentInput: (html: string) => void;
  onSaveHistory: () => void;
};

export function ResumeEditor({
  editorRef,
  editableHtml,
  pageColor,
  onSelectionUpdate,
  onContentInput,
  onSaveHistory,
}: ResumeEditorProps) {
  return (
    <div
      className="resume-live-editor bg-white shadow-2xl"
      style={{
        width: "210mm",
        minHeight: "297mm",
        overflow: "hidden",
        backgroundColor: pageColor,
        direction: "ltr",
        unicodeBidi: "plaintext",
        textAlign: "left",
      }}
      ref={editorRef}
      dir="ltr"
      lang="en"
      contentEditable
      suppressContentEditableWarning
      onMouseUp={onSelectionUpdate}
      onKeyUp={onSelectionUpdate}
      onInput={(e) => {
        const html = (e.currentTarget as HTMLDivElement).innerHTML;
        onContentInput(html);
        onSaveHistory();
      }}
      dangerouslySetInnerHTML={{ __html: editableHtml }}
    />
  );
}