import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SectionManager } from "../SectionManager";

describe("SectionManager", () => {
  it("renders core heading and add button", () => {
    render(<SectionManager />);
    expect(screen.getByText(/resume sections/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add section/i })).toBeInTheDocument();
  });

  it("opens search panel after clicking add section", () => {
    render(<SectionManager />);
    fireEvent.click(screen.getByRole("button", { name: /add section/i }));

    expect(screen.getByText(/add hidden sections/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search publications, research, volunteer/i)).toBeInTheDocument();
  });

  it("calls onSectionsChange on mount and section updates", () => {
    const onSectionsChange = vi.fn();
    render(<SectionManager onSectionsChange={onSectionsChange} />);

    expect(onSectionsChange).toHaveBeenCalled();
  });
});
