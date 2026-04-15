import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SectionConfig } from "../../../types/section-management";
import { DraggableSectionList } from "../DraggableSectionList";

const sections: SectionConfig[] = [
  { id: "header", label: "Header", enabled: true, order: 0, type: "text", content: [] },
  { id: "skills", label: "Skills", enabled: true, order: 1, type: "list", content: [] },
  { id: "custom-1", label: "Custom", enabled: true, order: 2, type: "bullet", content: [], isCustom: true },
];

describe("DraggableSectionList", () => {
  it("renders section labels", () => {
    render(<DraggableSectionList sections={sections} onReorder={vi.fn()} onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });

  it("calls onToggle when Hide is clicked", () => {
    const onToggle = vi.fn();
    render(<DraggableSectionList sections={sections} onReorder={vi.fn()} onToggle={onToggle} onDelete={vi.fn()} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Hide" })[0]);
    expect(onToggle).toHaveBeenCalledWith("header");
  });

  it("calls onDelete for custom section", () => {
    const onDelete = vi.fn();
    render(<DraggableSectionList sections={sections} onReorder={vi.fn()} onToggle={vi.fn()} onDelete={onDelete} />);

    const allButtons = screen.getAllByRole("button");
    fireEvent.click(allButtons[allButtons.length - 1]);
    expect(onDelete).toHaveBeenCalledWith("custom-1");
  });

  it("calls onReorder on drop", () => {
    const onReorder = vi.fn();
    const { container } = render(
      <DraggableSectionList sections={sections} onReorder={onReorder} onToggle={vi.fn()} onDelete={vi.fn()} />,
    );

    const draggables = container.querySelectorAll("[draggable='true']");
    fireEvent.dragStart(draggables[0]);
    fireEvent.dragOver(draggables[1]);
    fireEvent.drop(draggables[1]);

    expect(onReorder).toHaveBeenCalledWith(0, 1);
  });
});
