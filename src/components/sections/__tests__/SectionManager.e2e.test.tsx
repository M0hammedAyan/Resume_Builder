import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SectionManager } from "../SectionManager";

describe("SectionManager e2e", () => {
  it("creates a custom section from the search panel flow", () => {
    const onSectionsChange = vi.fn();
    render(<SectionManager onSectionsChange={onSectionsChange} />);

    fireEvent.click(screen.getByRole("button", { name: /add section/i }));
    fireEvent.change(screen.getByPlaceholderText(/search publications, research, volunteer/i), {
      target: { value: "Patents" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create "patents" section/i }));
    fireEvent.change(screen.getByPlaceholderText(/publications, speaking engagements/i), {
      target: { value: "Patents" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^create$/i }));

    const snapshots = onSectionsChange.mock.calls.map((args) => args[0] as Array<{ label: string }>);
    expect(snapshots.some((sections) => sections.some((section) => section.label === "Patents"))).toBe(true);
  });

  it("enables a hidden section from search results", () => {
    const onSectionsChange = vi.fn();
    render(<SectionManager onSectionsChange={onSectionsChange} />);

    fireEvent.click(screen.getByRole("button", { name: /add section/i }));
    fireEvent.change(screen.getByPlaceholderText(/search publications, research, volunteer/i), {
      target: { value: "research" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));

    const snapshots = onSectionsChange.mock.calls.map((args) => args[0] as Array<{ id: string; enabled: boolean }>);
    expect(snapshots.some((sections) => sections.some((section) => section.id === "research" && section.enabled))).toBe(true);
  });
});
