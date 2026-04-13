# CareerOS Frontend - Architecture & Component Hierarchy

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                       App.tsx                              │ │
│  │  - Routes to views based on currentPage                   │ │
│  │  - Manages layout (sidebar + main)                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌──────────────────┐  ┌────────────────────────────────────┐  │
│  │    Sidebar       │  │      Main Content Area             │  │
│  │    (Left 264px)  │  │   (Dynamic Views)                  │  │
│  │                  │  │                                    │  │
│  │ • Chat           │  │ ┌──────────────────────────────┐  │  │
│  │ • Resume Studio  │  │ │                              │  │  │
│  │ • Recruiter Lens │  │ │ Current View:                │  │  │
│  │ • Templates      │  │ │ - ChatView                   │  │  │
│  │ • Insights       │  │ │ - ResumeStudioView           │  │  │
│  │                  │  │ │ - RecruiterLensView          │  │  │
│  │                  │  │ │ - TemplateGalleryView        │  │  │
│  │                  │  │ │ - InsightsView               │  │  │
│  │                  │  │ │                              │  │  │
│  │                  │  │ └──────────────────────────────┘  │  │
│  └──────────────────┘  └────────────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │       Zustand Store (useCareerOSStore)                 │    │
│  │                                                         │    │
│  │  State:                  Actions:                      │    │
│  │  - chatMessages          - addChatMessage()           │    │
│  │  - resume                - setResume()                │    │
│  │  - selectedTemplate      - setSelectedTemplate()      │    │
│  │  - templateSettings      - updateTemplateSettings()   │    │
│  │  - jobDescription        - setJobDescription()        │    │
│  │  - jobMatchAnalysis      - setJobMatchAnalysis()      │    │
│  │  - currentPage           - setCurrentPage()           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App
├── Sidebar (uses useCareerOSStore)
│   ├── Navigation Items (5)
│   │   ├── Chat button
│   │   ├── Resume Studio button
│   │   ├── Recruiter Lens button
│   │   ├── Templates button
│   │   └── Insights button
│   └── Tip Section
│
├── Header (displays currentPage title)
│
└── Main Content (AnimatePresence)
    ├── ChatView (when currentPage === "chat")
    │   ├── Message History
    │   │   └── MessageBubble[] (animated)
    │   └── Input Area
    │       └── Send Button
    │
    ├── ResumeStudioView (when currentPage === "resume")
    │   ├── Left Sidebar
    │   │   ├── TemplateSelector (6 templates)
    │   │   └── Design Settings Panel
    │   │       ├── Font selector
    │   │       ├── Font size slider
    │   │       ├── Color picker
    │   │       └── Line height slider
    │   └── Main Area
    │       └── ResumePreview
    │           ├── Toolbar
    │           │   ├── PDF Download button
    │           │   ├── DOCX Download button
    │           │   └── Auto Format button
    │           └── Resume Renderer (styled by template)
    │               ├── Header (name, title, contact)
    │               ├── Summary
    │               └── Sections
    │                   ├── Experience
    │                   ├── Education
    │                   └── Skills
    │
    ├── RecruiterLensView (when currentPage === "recruiter")
    │   ├── Left Panel
    │   │   ├── Job Description textarea
    │   │   └── "Check Fit" button
    │   └── Right Panel (Results)
    │       ├── Match Score Card (0-100%)
    │       ├── Matched Skills (green tags)
    │       ├── Missing Skills (yellow tags)
    │       ├── Weak Areas (list)
    │       └── Suggestions (recommendations)
    │
    ├── TemplateGalleryView (when currentPage === "templates")
    │   ├── Header
    │   ├── Template Grid
    │   │   └── Template Card[] (6 total)
    │   │       ├── Preview
    │   │       ├── Name & Description
    │   │       ├── Recommended For badges
    │   │       └── Selection indicator
    │   └── Template Details Section
    │       ├── Features list
    │       └── Font information
    │
    └── InsightsView (when currentPage === "insights")
        ├── Header
        ├── Growth Trend Card
        ├── Grid Layout
        │   ├── Strength Areas Card
        │   └── Areas to Develop Card
        ├── Recommendations Grid
        └── Next Steps Card
```

## Data Flow Diagram

```
User Interaction
│
├─ Chat Message
│  └─> ChatView.addChatMessage()
│      └─> useCareerOSStore.addChatMessage()
│          └─> chatMessages state updated
│              └─> ChatView re-renders
│
├─ Select Template
│  └─> TemplateSelector.setSelectedTemplate()
│      └─> useCareerOSStore.setSelectedTemplate()
│          └─> selectedTemplate state updated
│              └─> ResumePreview re-renders with new styles
│
├─ Adjust Font Size
│  └─> FontControls.updateTemplateSettings()
│      └─> useCareerOSStore.updateTemplateSettings()
│          └─> templateSettings state updated
│              └─> ResumePreview re-renders with new size
│
├─ Paste Job Description
│  └─> RecruiterLensView.setJobDescription()
│      └─> useCareerOSStore.setJobDescription()
│          └─> jobDescription state updated
│              └─> Input re-renders with value
│
└─ Analyze Job Fit
   └─> RecruiterLensView.handleAnalyze()
       └─> Mock API call (ready for real API)
           └─> useCareerOSStore.setJobMatchAnalysis()
               └─> jobMatchAnalysis state updated
                   └─> Results Card re-renders
```

## State Flow Example: Template Switching

```
1. User clicks template in TemplateSelector
   ↓
2. TemplateSelector calls setSelectedTemplate("technical-dense")
   ↓
3. Zustand updates: selectedTemplate = "technical-dense"
   ↓
4. Subscribers re-render:
   - ResumePreview (uses selectedTemplate)
   - TemplateGalleryView (shows visual indication)
   ↓
5. ResumePreview fetches template config:
   template = getTemplateById("technical-dense")
   ↓
6. ResumePreview applies styles from template:
   - fontFamily, fontSize, colors, spacing, layout
   ↓
7. Resume preview renders with new styling
```

## File Dependencies

```
App.tsx
├── imports Sidebar.tsx
├── imports ChatView.tsx
├── imports ResumeStudioView.tsx
│   ├── imports TemplateSelector.tsx
│   │   └── imports getcareeros.store.ts
│   │       └── imports careeros.store.ts
│   └── imports ResumePreview.tsx
│       ├── imports useCareerOSStore
│       └── imports getTemplateById from resume.templates.ts
├── imports RecruiterLensView.tsx
│   └── imports useCareerOSStore
├── imports TemplateGalleryView.tsx
│   ├── imports getAllTemplates from resume.templates.ts
│   └── imports useCareerOSStore
└── imports InsightsView.tsx

careeros.store.ts
├── uses resume.ts types
└── manages all app state

resume.templates.ts
├── defines 6 template objects
└── exports suggestTemplate() function

Layout & Styling
├── Tailwind config (dark theme)
├── index.css (global styles)
└── All components use Tailwind classes
```

## State Persistence Strategy (Future)

```
Current: In-memory state (resets on page reload)

Future Implementation:
┌─────────┐      ┌──────────┐      ┌────────────┐
│ LocalStorage │ ← → │ Zustand │ ← → │ Components │
└─────────┘      └──────────┘      └────────────┘
  - resume       - Cached state     - Subscribe
  - templates    - Hydration        - Update
  - settings     - Persistence      - Render

API Integration (Future):
┌──────────┐      ┌──────┐      ┌────────────┐
│ Backend  │ ← → │ Zustand │ ← → │ Components │
│ Database │      └──────┘      └────────────┘
└──────────┘
```

## Performance Considerations

### Component Re-renders
- Only components subscribed to changed state re-render
- Zustand selectors optimize subscription

### Memoization
- Sidebar: Static, memoizable
- ChatView: Re-renders on new messages
- ResumePreview: Re-renders on template/resume change
- RecruiterLensView: Re-renders on analysis change

### Animations
- Framer Motion handles smooth transitions
- CSS transforms used for performance
- AnimatePresence manages mount/unmount animations

## Scaling Considerations

### Adding New Views
1. Create component in `src/components/`
2. Add type to `currentPage` in store
3. Add navigation item to Sidebar
4. Add case to App.tsx AnimatePresence

### Adding New State
1. Update `CareerOSStore` interface
2. Initialize in store
3. Create setter action
4. Use in components via hook

### API Integration
1. Create API service file
2. Replace mock implementations with real calls
3. Handle loading/error states
4. Update store with results

## Testing Strategy

### Unit Tests (components)
```typescript
// ChatView.test.tsx
- Test message sending
- Test message display
- Test input clearing

// TemplateSelector.test.tsx
- Test template selection
- Test preview rendering
- Test active state
```

### Integration Tests (store)
```typescript
// careeros.store.test.ts
- Test state initialization
- Test all actions
- Test state updates
```

### E2E Tests (user flows)
```typescript
// scenarios:
- User creates resume
- User selects template
- User checks job fit
- User exports PDF
```

---

## Quick Navigation

- **See component code**: `/src/components/`
- **See store code**: `/src/store/careeros.store.ts`
- **See templates**: `/src/config/resume.templates.ts`
- **See types**: `/src/types/`
- **See main app**: `/src/App.tsx`

---

**Last Updated**: 2026-04-13
**Architecture Version**: 1.0
