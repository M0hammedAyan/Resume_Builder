type PageProps = {
  pageNumber: number;
  html: string;
};

export function Page({ pageNumber, html }: PageProps) {
  return (
    <article className="doc-page" aria-label={`Page ${pageNumber}`}>
      <div className="doc-page-inner">
        <div className="doc-editor-content" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      <footer className="doc-page-footer">Page {pageNumber}</footer>
    </article>
  );
}
