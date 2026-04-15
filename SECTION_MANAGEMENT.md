# Resume Section Management System

A flexible, drag-and-drop enabled section management system for dynamic resume building.

## Features

### 1. Core Sections (Always Visible)
- Header (Contact Info)
- Summary / Objective
- Skills
- Experience
- Education

### 2. Secondary Sections (Toggle)
- Projects
- Certifications  
- Achievements / Awards

### 3. Hidden Sections (Searchable)
- Publications
- Research
- Volunteer Experience
- Leadership
- Extracurricular Activities
- Languages
- Interests
- Portfolio
- Conferences / Workshops

### 4. Custom Sections
- Create unlimited custom sections
- Choose content type: list, bullet, text, table
- Fully manage (add, edit, delete)

### 5. Advanced Features
- **Drag-and-drop reordering** of visible sections
- **Search-based discovery** of hidden sections
- **Experience-level optimization**:
  - Fresher: emphasize Projects
  - Intermediate: Projects optional
  - Experienced: Projects optional, Leadership emphasized
  - Senior: Leadership & Achievements prioritized
- **Real-time visibility toggle**
- **Persistent ordering**

## Usage

### Basic Implementation

```tsx
import { SectionManager } from "@/components/sections";

export function ResumeBuilder() {
  const handleSectionsChange = (sections) => {
    console.log("Sections updated:", sections);
    // Save to backend, update store, etc.
  };

  return (
    <SectionManager
      experienceLevel="intermediate"
      onSectionsChange={handleSectionsChange}
    />
  );
}
```

### Using the Hook Directly

```tsx
import { useSectionManager } from "@/hooks/useSectionManager";

export function CustomSectionUI() {
  const {
    visibleSections,
    hiddenSections,
    searchResults,
    searchQuery,
    actions,
  } = useSectionManager({
    initialExperience: "intermediate",
  });

  return (
    <div>
      {/* Render visible sections */}
      {visibleSections.map(section => (
        <div key={section.id}>
          <h3>{section.label}</h3>
          <button onClick={() => actions.disableSection(section.id)}>
            Hide
          </button>
        </div>
      ))}

      {/* Search and add new sections */}
      <input
        onChange={(e) => actions.searchSections(e.target.value)}
        placeholder="Search sections..."
      />

      {/* Show search results */}
      {searchResults.map(section => (
        <button
          key={section.id}
          onClick={() => actions.enableSection(section.id)}
        >
          Add {section.label}
        </button>
      ))}
    </div>
  );
}
```

### Working with Sections

```tsx
const {
  sections,           // All sections (visible + hidden)
  visibleSections,    // Only enabled sections
  hiddenSections,     // Only disabled sections
  searchResults,      // Filtered hidden sections
  experience,         // Current experience level
  actions: {
    enableSection(id),           // Make section visible
    disableSection(id),          // Hide section
    toggleSection(id),           // Toggle visibility
    reorderSections(from, to),   // Drag-drop reorder
    searchSections(query),       // Search hidden sections
    createCustomSection(name, type),  // Add custom section
    deleteCustomSection(id),     // Remove custom section
    updateSectionContent(id, content), // Update section data
    changeExperience(level),     // Update experience level
  },
} = useSectionManager();
```

## Section Types

- **list**: Comma-separated items (e.g., skills, languages)
- **bullet**: Indented bullet points (e.g., experience, projects)
- **text**: Long-form paragraph (e.g., summary, objectives)
- **table**: Structured data table (e.g., courses, certifications)

## Data Structure

```typescript
interface SectionConfig {
  id: string;              // Unique identifier
  label: string;           // Display name
  enabled: boolean;        // Visibility toggle
  order: number;           // Display order
  type: SectionType;       // content type: list|bullet|text|table
  content: unknown[];      // Section data
  isCustom?: boolean;      // User-created flag
  icon?: string;          // Optional icon name (lucide-react)
}
```

## Experience Levels

Automatically adjusts which sections are prioritized:

```typescript
type ExperienceLevel = "fresher" | "intermediate" | "experienced" | "senior";

// Fresher: emphasize skills and projects
// Intermediate: balance experience with projects
// Experienced: experience and projects prominent
// Senior: experience, achievements, and leadership
```

## Utilities

### Search Sections

```typescript
import { searchSections } from "@/utils/section-utils";

const results = searchSections(hiddenSections, "research");
// Returns sections with "research" in name or id
```

### Reorder Sections

```typescript
import { reorderSections } from "@/utils/section-utils";

const reordered = reorderSections(sections, 0, 2);
// Moves section at index 0 to index 2, updates all orders
```

### Create Custom Section

```typescript
import { createCustomSection } from "@/utils/section-utils";

const updated = createCustomSection(sections, "Speaking", "bullet");
// Adds new custom section at the end
```

### Validate Section Name

```typescript
import { validateSectionName } from "@/utils/section-utils";

const error = validateSectionName("My Section");
// null if valid, error message if invalid
```

## Integration with Store

Save sections to your state management:

```tsx
// Zustand example
const useResumeStore = create((set) => ({
  sections: [],
  setSections: (sections) => set({ sections }),
}));

// In component
const { setSections } = useResumeStore();

<SectionManager
  onSectionsChange={(sections) => setSections(sections)}
/>
```

## Backend Integration

Send sections to API for persistence:

```typescript
async function saveSections(userId: string, sections: SectionConfig[]) {
  const response = await fetch("/api/resume/sections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, sections }),
  });
  return response.json();
}
```

## Schema Validation

Use Zod schemas for type safety:

```typescript
import { SectionConfigSchema, SectionManagerStateSchema } from "@/schemas";

// Validate incoming data
const parsed = SectionConfigSchema.parse(data);

// Parse full state
const state = SectionManagerStateSchema.parse(incoming);
```

## Styling Customization

Components use Tailwind CSS with dark mode support. Override in your CSS:

```css
/* Customize drag indicator color */
.dragging {
  @apply border-cyan-500 bg-cyan-100;
}

/* Customize section blocks */
.section-block {
  @apply rounded-lg border px-4 py-3;
}
```

## Accessibility

- Full keyboard navigation support
- ARIA labels on interactive elements
- High contrast dark mode
- Touch-friendly drag targets (50px+ height)

## Performance

- Lazy-loaded hidden sections list
- Memoized search for large section lists
- Efficient state updates via useCallback
- Optimized reordering algorithm

## Future Enhancements

- [ ] Keyboard shortcuts for section management
- [ ] Bulk import/export of section configurations
- [ ] Section templates for different industries
- [ ] Collaborative section editing
- [ ] Section analytics (which sections are most viewed by recruiters)
