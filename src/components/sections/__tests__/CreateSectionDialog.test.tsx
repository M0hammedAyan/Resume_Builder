import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CreateSectionDialog } from "../CreateSectionDialog";

describe("CreateSectionDialog", () => {
  it("does not render when closed", () => {
    render(<CreateSectionDialog isOpen={false} onClose={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.queryByText(/create new section/i)).not.toBeInTheDocument();
  });

  it("renders when open", () => {
    render(<CreateSectionDialog isOpen={true} onClose={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.getByText(/create new section/i)).toBeInTheDocument();
  });

  it("creates section with selected type", () => {
    const onCreate = vi.fn();
    const onClose = vi.fn();

    render(<CreateSectionDialog isOpen={true} onClose={onClose} onCreate={onCreate} />);

    fireEvent.change(screen.getByPlaceholderText(/publications/i), { target: { value: "Patents" } });
    fireEvent.click(screen.getByDisplayValue("list"));
    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    expect(onCreate).toHaveBeenCalledWith("Patents", "list");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows validation error for invalid name", () => {
    render(<CreateSectionDialog isOpen={true} onClose={vi.fn()} onCreate={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(/publications/i), { target: { value: "@bad" } });
    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    expect(screen.getByText(/invalid characters/i)).toBeInTheDocument();
  });
});
