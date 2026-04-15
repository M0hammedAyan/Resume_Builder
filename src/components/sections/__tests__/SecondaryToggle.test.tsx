import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SectionConfig } from "../../../types/section-management";
import { SecondaryToggle } from "../SecondaryToggle";

const sections: SectionConfig[] = [
  { id: "projects", label: "Projects", enabled: false, order: 0, type: "bullet", content: [] },
  { id: "certifications", label: "Certifications", enabled: false, order: 1, type: "list", content: [] },
  { id: "achievements", label: "Achievements", enabled: true, order: 2, type: "bullet", content: [] },
];

describe("SecondaryToggle", () => {
  it("renders optional sections label and section buttons", () => {
    render(<SecondaryToggle sections={sections} onToggle={vi.fn()} />);

    expect(screen.getByText(/optional sections/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Certifications" })).toBeInTheDocument();
  });

  it("calls onToggle with section id", () => {
    const onToggle = vi.fn();
    render(<SecondaryToggle sections={sections} onToggle={onToggle} />);

    fireEvent.click(screen.getByRole("button", { name: "Projects" }));
    expect(onToggle).toHaveBeenCalledWith("projects");
  });

  it("renders nothing if no secondary sections are present", () => {
    const { container } = render(
      <SecondaryToggle sections={[{ id: "custom", label: "Custom", enabled: true, order: 0, type: "text", content: [], isCustom: true }]} onToggle={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
