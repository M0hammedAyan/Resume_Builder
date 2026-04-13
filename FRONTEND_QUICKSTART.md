# CareerOS Frontend - Quick Start Guide

## Project Setup

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
# Navigate to project directory
cd d:\Resume_Builder

# Install dependencies
npm install

# Start development server
npm run dev
```

**Server starts at**: `http://localhost:5174`

## Project Structure

```
src/
├── App.tsx                    # Main app layout and routing
├── components/
│   ├── ChatView.tsx            # Chat interface
│   ├── ResumeStudioView.tsx    # Resume editor
│   ├── ResumePreview.tsx       # Resume preview/export
│   ├── RecruiterLensView.tsx   # Job matching
│   ├── TemplateGalleryView.tsx # Template browser
│   ├── TemplateSelector.tsx    # Template picker
│   ├── InsightsView.tsx        # Career insights
│   └── layout/
│       └── Sidebar.tsx         # Navigation sidebar
├── store/
│   └── careeros.store.ts       # Zustand state management
├── config/
│   └── resume.templates.ts     # Resume template definitions
└── types/
    ├── resume.ts               # Resume types
    └── app.ts                  # App types
```

## Key Commands

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Troubleshooting
npm audit           # Check dependencies
npm audit fix       # Fix vulnerabilities
```

## Understanding the Architecture

### 1. State Management (Zustand)

All app state is managed in `src/store/careeros.store.ts`:

```typescript
// Using in a component
import { useCareerOSStore } from '@/store/careeros.store';

function MyComponent() {
  const { resume, selectedTemplate, setSelectedTemplate } = useCareerOSStore();
  // State is reactive - changes update component automatically
}
```

### 2. Navigation

The app uses a single page with view switching via Zustand `currentPage`:

```typescript
// In Sidebar.tsx
const { setCurrentPage } = useCareerOSStore();

// In App.tsx
const { currentPage } = useCareerOSStore();
// Render different views based on currentPage
```

### 3. Resume Templates

Templates are defined in `src/config/resume.templates.ts`:

```typescript
// Access templates
import { RESUME_TEMPLATES, getTemplateById, suggestTemplate } from '@/config/resume.templates';

const template = getTemplateById(selectedTemplate);
// template contains: colors, fonts, spacing, layout config
```

## Component Integration Guide

### Adding a New Feature

1. **Define types** in `src/types/app.ts` or `src/types/resume.ts`

2. **Add to Zustand store** in `src/store/careeros.store.ts`:
```typescript
export interface CareerOSStore {
  myNewFeature: MyType;
  setMyNewFeature: (value: MyType) => void;
  // ...
}
```

3. **Create component** in `src/components/MyFeature.tsx`:
```typescript
import { useCareerOSStore } from '@/store/careeros.store';

export function MyFeature() {
  const { myNewFeature, setMyNewFeature } = useCareerOSStore();
  // ...
}
```

4. **Add to sidebar** in `src/components/layout/Sidebar.tsx`:
```typescript
const items = [
  // ...
  { id: "myfeature", label: "My Feature", icon: <Icon /> }
];
```

5. **Add to App.tsx** view switching:
```typescript
{currentPage === "myfeature" && <MyFeature />}
```

## API Integration

### Setting Up API Calls

1. **Create API client** (or use existing axios):
```typescript
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE,
});
```

2. **Call from components**:
```typescript
const handleAnalyze = async () => {
  try {
    const response = await apiClient.post('/job-match/analyze', {
      resume: resume,
      jobDescription: jobDescription,
    });
    // Update store with results
    setJobMatchAnalysis(response.data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Environment Variables

Create `.env.local` for development:
```
VITE_API_BASE_URL=http://localhost:8000
```

## Styling Guide

### Tailwind CSS

All styling uses Tailwind utilities. Dark theme colors:
- `slate-950` - Darkest background
- `slate-900` - Main background
- `slate-800` - Borders, secondary bg
- `slate-100` - Primary text
- `slate-400` - Secondary text

Accents:
- `cyan-400/500` - Primary accent
- `blue-500/600` - Secondary accent
- `purple-400/500` - Tertiary accent

### Adding Custom Styles

1. **Use Tailwind utilities** (preferred):
```typescript
<div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
```

2. **Use CSS-in-JS** if needed:
```typescript
<div style={{ backgroundColor: template.colors.background }}>
```

## Testing

### Manual Testing Checklist

- [ ] Chat view: Send message, see response
- [ ] Resume Studio: Select template, see preview update
- [ ] Recruiter Lens: Paste job description, check fit
- [ ] Templates: Browse all 6 templates
- [ ] Insights: View recommendations
- [ ] Sidebar: Click all navigation items
- [ ] Animations: Check smooth transitions
- [ ] Responsive: Resize window, check layouts

### Development Tips

1. **React DevTools**: Install React DevTools browser extension
2. **Zustand DevTools**: Messages logged to console
3. **Vite HMR**: Hot Module Replacement for fast iteration
4. **Console**: Check browser console for errors

## Common Issues

### Port Already in Use
```bash
# Vite automatically tries next port (5175, 5176, etc.)
# Or kill process on 5173/5174
```

### Missing Dependencies
```bash
npm install zustand
npm install framer-motion lucide-react html2canvas jspdf
```

### Build Errors
```bash
# Clear vite cache
rm -r node_modules/.vite
npm run build
```

### Component Not Rendering
1. Check Zustand store has the data
2. Verify component imports are correct
3. Check if `currentPage` is set to show this view

## Performance Tips

1. **Use React.memo** for expensive components
2. **Lazy load views** with dynamic imports
3. **Debounce heavy operations** (template switching)
4. **Optimize images** before use

## Version Control

```bash
# See what changed
git status

# Stage and commit
git add src/
git commit -m "feat: add template suggestion engine"

# Push to GitHub
git push origin main
```

## Deployment

### Production Build
```bash
npm run build
# Creates optimized dist/ folder
```

### Deploy to Vercel (recommended)
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
# Connect GitHub repo at netlify.com
# Auto-deploys on push to main
```

## Resources

- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://framer.com/motion)
- [Zustand](https://github.com/pmndrs/zustand)
- [Vite Docs](https://vitejs.dev)

## Support

For issues:
1. Check browser console for errors
2. Verify all dependencies installed: `npm list`
3. Clear cache: `rm -rf dist node_modules/.vite`
4. Restart dev server: `npm run dev`

---

**Happy coding! 🚀**
