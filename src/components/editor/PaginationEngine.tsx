import { Page } from "./Page";

export const PAGE_WIDTH = 794;
export const PAGE_HEIGHT = 1122;
export const PAGE_PADDING = 96;
export const PAGE_CONTENT_HEIGHT = PAGE_HEIGHT - PAGE_PADDING * 2;

export type PaginationPage = {
  id: string;
  html: string;
};

function getNodeOuterHeight(node: HTMLElement): number {
  const styles = window.getComputedStyle(node);
  const marginTop = Number.parseFloat(styles.marginTop || "0") || 0;
  const marginBottom = Number.parseFloat(styles.marginBottom || "0") || 0;
  return node.offsetHeight + marginTop + marginBottom;
}

function isPageBreakNode(node: HTMLElement): boolean {
  if (node.tagName.toLowerCase() !== "hr") return false;
  return node.dataset.pageBreak === "true" || node.classList.contains("doc-page-break");
}

export function paginateEditorContent(editorContentRoot: HTMLElement, maxPageHeight = PAGE_CONTENT_HEIGHT): PaginationPage[] {
  const nodes = Array.from(editorContentRoot.children) as HTMLElement[];

  if (nodes.length === 0) {
    return [{ id: "page-1", html: "<p></p>" }];
  }

  const pageNodes: string[][] = [];
  let currentPageNodes: string[] = [];
  let currentHeight = 0;

  const pushCurrentPage = () => {
    if (currentPageNodes.length === 0) {
      pageNodes.push(["<p></p>"]);
    } else {
      pageNodes.push(currentPageNodes);
    }
    currentPageNodes = [];
    currentHeight = 0;
  };

  nodes.forEach((node) => {
    if (isPageBreakNode(node)) {
      pushCurrentPage();
      return;
    }

    const nodeHeight = getNodeOuterHeight(node);

    if (currentHeight > 0 && currentHeight + nodeHeight > maxPageHeight) {
      pushCurrentPage();
    }

    currentPageNodes.push(node.outerHTML);
    currentHeight += nodeHeight;
  });

  if (currentPageNodes.length === 0 && pageNodes.length === 0) {
    currentPageNodes.push("<p></p>");
  }

  if (currentPageNodes.length > 0) {
    pageNodes.push(currentPageNodes);
  }

  return pageNodes.map((content, index) => ({
    id: `page-${index + 1}`,
    html: content.join(""),
  }));
}

type PaginationEngineProps = {
  pages: PaginationPage[];
};

export function PaginationEngine({ pages }: PaginationEngineProps) {
  return (
    <div className="doc-pages-canvas" aria-hidden="true">
      {pages.map((page, index) => (
        <Page key={page.id} pageNumber={index + 1} html={page.html} />
      ))}
    </div>
  );
}
