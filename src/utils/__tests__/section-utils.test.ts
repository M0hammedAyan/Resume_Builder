import { describe, expect, it } from "vitest";
import type { SectionConfig } from "../../types/section-management";
import {
  createCustomSection,
  deleteCustomSection,
  initializeSectionsForExperience,
  prioritizeSectionsByExperience,
  reorderSections,
  searchSections,
  validateSectionName,
} from "../section-utils";

const baseSections: SectionConfig[] = [
  { id: "skills", label: "Skills", enabled: true, order: 0, type: "list", content: [] },
  { id: "projects", label: "Projects", enabled: false, order: 1, type: "bullet", content: [] },
  { id: "research", label: "Research", enabled: false, order: 2, type: "bullet", content: [] },
];

describe("section-utils", () => {
  it("searchSections finds partial matches case-insensitively", () => {
    const results = searchSections(baseSections, "PROJ");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("projects");
  });

  it("reorderSections updates order fields", () => {
    const reordered = reorderSections(baseSections, 0, 2);
    expect(reordered.map((s) => s.id)).toEqual(["projects", "research", "skills"]);
    expect(reordered.map((s) => s.order)).toEqual([0, 1, 2]);
  });

  it("createCustomSection appends enabled custom section", () => {
    const next = createCustomSection(baseSections, "Publications", "bullet");
    const added = next[next.length - 1];
    expect(added.label).toBe("Publications");
    expect(added.isCustom).toBe(true);
    expect(added.enabled).toBe(true);
  });

  it("deleteCustomSection removes only custom sections", () => {
    const withCustom = createCustomSection(baseSections, "X", "text");
    const customId = withCustom[withCustom.length - 1].id;

    const removed = deleteCustomSection(withCustom, customId);
    const coreAttempt = deleteCustomSection(baseSections, "skills");

    expect(removed.some((s) => s.id === customId)).toBe(false);
    expect(coreAttempt.some((s) => s.id === "skills")).toBe(true);
  });

  it("validateSectionName enforces empty, max-length, and character rules", () => {
    expect(validateSectionName("Publications")).toBeNull();
    expect(validateSectionName("   ")).toBeTruthy();
    expect(validateSectionName("a".repeat(51))).toBeTruthy();
    expect(validateSectionName("Bad@Name")).toBeTruthy();
  });

  it("initializeSectionsForExperience includes expected defaults", () => {
    const fresher = initializeSectionsForExperience("fresher");
    const projects = fresher.find((s) => s.id === "projects");
    const header = fresher.find((s) => s.id === "header");

    expect(header?.enabled).toBe(true);
    expect(projects?.enabled).toBe(true);
    expect(fresher.length).toBeGreaterThan(8);
  });

  it("prioritizeSectionsByExperience keeps same set of sections", () => {
    const source = initializeSectionsForExperience("intermediate");
    const prioritized = prioritizeSectionsByExperience(source, "senior");

    expect(prioritized).toHaveLength(source.length);
    expect(new Set(prioritized.map((s) => s.id))).toEqual(new Set(source.map((s) => s.id)));
  });
});
