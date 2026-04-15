import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSectionManager } from "../useSectionManager";

describe("useSectionManager", () => {
  it("initializes with sections and empty search query", () => {
    const { result } = renderHook(() => useSectionManager({ initialExperience: "intermediate" }));

    expect(result.current.sections.length).toBeGreaterThan(0);
    expect(result.current.searchQuery).toBe("");
  });

  it("updates search query through actions", () => {
    const { result } = renderHook(() => useSectionManager());

    act(() => {
      result.current.actions.searchSections("research");
    });

    expect(result.current.searchQuery).toBe("research");
  });

  it("creates and deletes a custom section", () => {
    const { result } = renderHook(() => useSectionManager());

    act(() => {
      result.current.actions.createCustomSection("Patents", "list");
    });

    const created = result.current.sections.find((s) => s.label === "Patents");
    expect(created?.isCustom).toBe(true);

    act(() => {
      result.current.actions.deleteCustomSection(created!.id);
    });

    expect(result.current.sections.some((s) => s.id === created!.id)).toBe(false);
  });

  it("enables hidden section through actions", () => {
    const { result } = renderHook(() => useSectionManager());
    const hidden = result.current.hiddenSections[0];

    act(() => {
      result.current.actions.enableSection(hidden.id);
    });

    expect(result.current.sections.find((s) => s.id === hidden.id)?.enabled).toBe(true);
  });

  it("reorders only visible sections", () => {
    const { result } = renderHook(() => useSectionManager());
    const initialVisible = result.current.visibleSections;

    if (initialVisible.length >= 2) {
      const first = initialVisible[0].id;
      const second = initialVisible[1].id;

      act(() => {
        result.current.actions.reorderSections(0, 1);
      });

      const reordered = result.current.visibleSections;
      expect(reordered[0].id).toBe(second);
      expect(reordered[1].id).toBe(first);
    }
  });
});
