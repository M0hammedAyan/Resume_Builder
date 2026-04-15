import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SectionSearchBar } from "../SectionSearchBar";

describe("SectionSearchBar", () => {
  it("renders input and calls onChange", () => {
    const onChange = vi.fn();
    render(<SectionSearchBar value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText(/search sections/i);
    fireEvent.change(input, { target: { value: "research" } });

    expect(onChange).toHaveBeenCalledWith("research");
  });

  it("shows clear button when value exists and clears", () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    render(<SectionSearchBar value="abc" onChange={onChange} onClear={onClear} />);

    const clearButton = screen.getByRole("button");
    fireEvent.click(clearButton);

    expect(onChange).toHaveBeenCalledWith("");
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
