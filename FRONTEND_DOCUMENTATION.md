# CareerOS - Startup-Grade Frontend Documentation

> Last Updated: April 13, 2026


## Overview

CareerOS is a modern, chat-first resume builder with a sophisticated template engine and AI-powered recruiting insights. The frontend is built with React, Vite, Tailwind CSS, Framer Motion, and Zustand.

## Architecture

### Technology Stack

- **React 18**: Component-based UI
- **Vite**: Fast development and production builds
- **Tailwind CSS**: Utility-first styling with dark theme
- **Framer Motion**: Smooth page transitions and animations
- **Zustand**: Lightweight state management
- **Lucide React**: Icon library
- **html2canvas & jsPDF**: Resume PDF export
- **Axios**: API client (configured for future endpoints)

### State Management (Zustand Store)

The `useCareerOSStore` hook provides centralized state for:

```typescript
- chatMessages: ChatMessage[]
- resume: ResumeData
- selectedTemplate: string
- templateSettings: {font, fontSize, color, spacing, lineHeight}
- jobDescription: string
- jobMatchAnalysis: JobMatchAnalysis
- currentPage: 'chat' | 'resume' | 'recruiter' | 'templates' | 'insights'
```

## Features

### 1. **Chat View** (Default)
- **Purpose**: Main entry point for career updates
- **Features**:
  - Send career achievements and describe updates
  - Real-time conversation history with smooth animations
  - AI assistant responses (ready for API integration)
  - Centered input with helpful placeholder text
  - Typing indicators and loading states
  - Full-screen responsive layout

### 2. **Resume Studio**
- **Purpose**: Design and customize resumes
- **Features**:
  - 6 professional templates
  - Live preview with real-time editing
  - Template selector with previews
  - Design settings panel:
    - Font selection (Inter, Arial, Garamond, Cambria)
    - Font size slider (8-16px)
    - Accent color selector
    - Line height adjustment
  - Export buttons:
    - Download PDF (functional)
    - Download DOCX (placeholder)
    - Auto Format button (placeholder)

### 3. **Recruiter Lens**
- **Purpose**: Job market alignment analysis
- **Layout**: 2-column responsive grid
- **Features**:
  - Job description textarea input
  - Analyzes resume fit for job postings
  - Displays:
    - **Match Score**: Large visual representation
    - **Matched Skills**: Green tags for aligned skills
    - **Missing Skills**: Yellow tags for required skills not in resume
    - **Weak Areas**: Areas needing development
    - **Suggestions**: AI-powered recommendations
  - "Check Fit" analysis button
  - Mock analysis with 1.5s delay (ready for API)

### 4. **Templates Gallery**
- **Purpose**: Browse and select resume designs
- **Features**:
  - 6 template previews with mockup displays
  - Template details:
    - Description and recommended use cases
    - Column layout info
    - Font families
    - Section styling options
    - Skills layout type
  - One-click template selection
  - Detailed template specifications

### 5. **Insights Page**
- **Purpose**: Career analysis and recommendations
- **Features**:
  - Growth trend indicator
  - Strength areas display
  - Areas to develop
  - Personalized recommendations
  - Next steps guidance
  - All with smooth animations

### 6. **Sidebar Navigation**
- **Features**:
  - Fixed left sidebar (256px wide)
  - CareerOS branding with gradient
  - 5 main navigation items with icons:
    - Chat (MessageSquare icon)
    - Resume Studio (FileText icon)
    - Recruiter Lens (Eye icon)
    - Templates (BookOpen icon)
    - Insights (Lightbulb icon)
  - Active state with gradient highlight
  - Hover animations
  - Helpful tip section at bottom

## Resume Templates

### 1. **ATS Minimal** 
- Simple, parseable format
- Perfect for: Early career, large companies, automated screening
- Single column, Arial font, no borders

### 2. **Professional Classic**
- Timeless design for traditional industries
- Perfect for: Finance, Legal, Management
- Garamond font, centered header, bordered sections

### 3. **Modern Blue**
- Contemporary with subtle color accents
- Perfect for: Tech, Startup, Creative
- Inter font, tag-style skills, cyan accent

### 4. **Technical Dense**
- Optimized for technical content
- Perfect for: Engineering, Data Science, DevOps
- Two-column layout, compact spacing, purple accent

### 5. **Executive Clean**
- Premium design for C-suite
- Perfect for: Executive, Director, VP level
- Cambria font, generous spacing, brown accent

### 6. **Two Column Modern**
- Two-column with optimized scanning
- Perfect for: Tech, Product, Design
- Sidebar layout, tag skills, blue accent

### Template Suggestion Engine

The `suggestTemplate()` function analyzes resumes and recommends templates based on:
- Career level (detects "senior", "lead", "director" titles)
- Industry (detects "engineer", "developer", etc.)
- Content density (bullet count)
- Role characteristics

## Animations & Transitions

- **Page transitions**: Fade + slide animations
- **Component entrance**: Staggered animations on component groups
- **Interactive elements**: Hover effects, smooth color transitions
- **Skeleton states**: Loading indicators with pulsing dots
- **Layout animations**: Smooth template switching with framer-motion

## Styling

- **Color Scheme**: Dark theme (slate-950 base)
- **Gradients**: Cyan, blue, and purple accents
- **Text**: slate-100 for primary, slate-400 for secondary
- **Borders**: slate-800 with transparency
- **Spacing**: Consistent 4px base unit
- **Shadows**: Subtle shadows with color matching

## File Structure

```
src/
├── App.tsx (main layout with sidebar + views)
├── components/
│   ├── ChatView.tsx
│   ├── ResumeStudioView.tsx
│   ├── ResumePreview.tsx
│   ├── RecruiterLensView.tsx
│   ├── TemplateGalleryView.tsx
│   ├── TemplateSelector.tsx
│   ├── InsightsView.tsx
│   ├── layout/
│   │   └── Sidebar.tsx
│   └── ...
├── store/
│   └── careeros.store.ts (Zustand store)
├── config/
│   └── resume.templates.ts (template definitions)
├── types/
│   ├── resume.ts
│   ├── app.ts
│   └── ...
└── ...
```

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Server runs at `http://localhost:5174`

### Production Build

```bash
npm run build
```

## Key Integration Points

### State Management Usage

```typescript
import { useCareerOSStore } from '@/store/careeros.store';

const MyComponent = () => {
  const { resume, selectedTemplate, setSelectedTemplate } = useCareerOSStore();
  // ...
};
```

### Adding New Features

1. **Add new view**: Create component, add route to Zustand, update sidebar
2. **Add template**: Define in `resume.templates.ts`, auto-appears in selector
3. **API integration**: Update mock functions in views with axios calls
4. **State updates**: Use Zustand actions in components

## Future Enhancements

- [ ] DOCX export functionality
- [ ] Resume auto-formatting with AI
- [ ] Real backend API integration
- [ ] Resume version history and comparison
- [ ] Skill gap training recommendations
- [ ] Job recommendation engine
- [ ] Interview preparation coaching
- [ ] Network insights
- [ ] Dark/Light theme toggle
- [ ] Mobile optimization

## Responsive Design

- Full-width layouts with no compact cards
- Sidebar: Fixed left on desktop, collapsible on mobile
- Main content: Responsive grid layouts
- Views adapt to screen size with Tailwind breakpoints (lg, md)

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (13+)
- Mobile browsers: Full support (with sidebar adaptation)

## Performance

- Production build: ~150KB JS (gzipped)
- Optimized dependencies for faster load times
- Code-splitting ready for future scaling
- Lazy loading for large components

## Design Philosophy

**"Notion + ChatGPT + Resume Builder combined"**

- Clean, minimal interface
- Focus on content over chrome
- Dark theme for reduced eye strain
- Smooth animations for delight
- Chat-first interaction paradigm
- Professional yet modern aesthetic

---

**Last Updated**: 2026-04-13
**Version**: 1.0.0
