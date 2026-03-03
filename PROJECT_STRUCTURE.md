# Project Structure Guide

## Frontend Structure (Scalable)

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Shared components (Button, Input, Card)
│   ├── layout/          # Layout components (Header, Sidebar, Footer)
│   ├── templates/       # Resume templates
│   └── features/        # Feature-specific components
│       ├── auth/        # Authentication components
│       ├── resume/      # Resume-specific components
│       └── chat/        # Chat interface components
│
├── pages/               # Page-level components
│   ├── HomePage.tsx
│   ├── DashboardPage.tsx
│   ├── ResumeEditorPage.tsx
│   └── PreviewPage.tsx
│
├── hooks/               # Custom React hooks
│   ├── useAuth.ts       # Authentication hook
│   ├── useResume.ts     # Resume management hook
│   ├── useTheme.ts      # Theme management hook
│   └── useDebounce.ts   # Utility hooks
│
├── contexts/            # React contexts
│   ├── ThemeContext.tsx
│   ├── AuthContext.tsx
│   └── ResumeContext.tsx
│
├── services/            # API services
│   ├── api.ts           # Base API configuration
│   ├── authService.ts   # Auth API calls
│   ├── resumeService.ts # Resume API calls
│   └── aiService.ts     # AI API calls
│
├── types/               # TypeScript types
│   ├── index.ts         # Main types export
│   ├── resume.types.ts  # Resume-related types
│   ├── auth.types.ts    # Auth-related types
│   └── api.types.ts     # API response types
│
├── utils/               # Utility functions
│   ├── validation.ts    # Validation helpers
│   ├── formatting.ts    # Data formatting
│   ├── pdfExport.ts     # PDF generation
│   └── constants.ts     # App constants
│
├── schemas/             # Zod validation schemas
│   ├── resumeSchemas.ts
│   └── authSchemas.ts
│
├── styles/              # Global styles
│   ├── index.css
│   └── themes.css
│
├── assets/              # Static assets
│   ├── images/
│   └── icons/
│
├── App.tsx              # Root component
└── main.tsx             # Entry point
```

### Reasoning:

**components/**: Organized by type and feature for easy navigation
- `common/`: Reusable across entire app
- `layout/`: Page structure components
- `features/`: Domain-specific, co-located with related logic

**pages/**: One file per route, clear separation of concerns

**hooks/**: Custom logic extraction, promotes reusability

**services/**: Centralized API calls, easy to mock for testing

**types/**: Type safety, single source of truth for data structures

**utils/**: Pure functions, easy to test and reuse

---

## Backend Structure (Scalable)

```
backend/
├── controllers/         # Request handlers
│   ├── authController.js
│   ├── resumeController.js
│   ├── aiController.js
│   └── atsController.js
│
├── routes/              # API routes
│   ├── auth.js
│   ├── resumes.js
│   └── ai.js
│
├── models/              # Database models
│   ├── User.js
│   └── Resume.js
│
├── middleware/          # Custom middleware
│   ├── auth.js          # JWT verification
│   ├── errorHandler.js  # Error handling
│   ├── validation.js    # Request validation
│   └── rateLimiter.js   # Rate limiting
│
├── config/              # Configuration
│   ├── db.js            # Database connection
│   ├── jwt.js           # JWT configuration
│   └── constants.js     # App constants
│
├── utils/               # Utility functions
│   ├── tokenGenerator.js
│   ├── emailService.js
│   └── logger.js
│
├── validators/          # Input validation
│   ├── authValidator.js
│   └── resumeValidator.js
│
├── services/            # Business logic
│   ├── aiService.js     # AI processing
│   └── pdfService.js    # PDF generation
│
├── tests/               # Test files
│   ├── unit/
│   └── integration/
│
├── .env.example         # Environment template
├── server.js            # Entry point
└── package.json
```

### Reasoning:

**controllers/**: Handle HTTP requests, delegate to services
- Thin layer, focuses on request/response
- Easy to test with mocked services

**routes/**: Define API endpoints, apply middleware
- Clear API structure
- Middleware composition

**models/**: Database schemas and methods
- Data validation at model level
- Business logic related to data

**middleware/**: Reusable request processing
- Authentication, validation, logging
- Composable and testable

**config/**: Centralized configuration
- Environment-specific settings
- Easy to modify without touching code

**services/**: Complex business logic
- Reusable across controllers
- Easier to test in isolation

---

## Migration Path

### Step 1: Create New Structure
```bash
# Frontend
mkdir -p src/{pages,hooks,contexts,services}

# Backend
mkdir -p backend/{validators,services,tests}
```

### Step 2: Move Files Gradually
```bash
# Example: Move auth components
mv src/components/Login.tsx src/components/features/auth/
mv src/components/Register.tsx src/components/features/auth/
```

### Step 3: Update Imports
```typescript
// Old
import Login from './components/Login'

// New
import Login from './components/features/auth/Login'
```

### Step 4: Create Index Files
```typescript
// src/components/features/auth/index.ts
export { default as Login } from './Login'
export { default as Register } from './Register'

// Usage
import { Login, Register } from './components/features/auth'
```

---

## Best Practices

### Frontend

1. **Component Organization**
   - One component per file
   - Co-locate styles and tests
   - Use index.ts for exports

2. **State Management**
   - Local state for UI
   - Context for shared state
   - Consider Redux for complex apps

3. **Code Splitting**
   ```typescript
   const Dashboard = lazy(() => import('./pages/DashboardPage'))
   ```

4. **Type Safety**
   - Define types before implementation
   - Use strict TypeScript config
   - Avoid `any` type

### Backend

1. **Separation of Concerns**
   - Controllers: HTTP layer
   - Services: Business logic
   - Models: Data layer

2. **Error Handling**
   ```javascript
   // Centralized error handler
   app.use((err, req, res, next) => {
     logger.error(err)
     res.status(err.status || 500).json({
       error: err.message
     })
   })
   ```

3. **Validation**
   - Validate at route level
   - Use schemas (Joi, Zod)
   - Return clear error messages

4. **Security**
   - Use helmet.js
   - Rate limiting
   - Input sanitization
   - CORS configuration

---

## Example Refactor

### Before (Monolithic)
```typescript
// App.tsx - 500+ lines
function App() {
  // Auth logic
  // Resume logic
  // UI logic
  // API calls
  // All mixed together
}
```

### After (Modular)
```typescript
// App.tsx - 50 lines
function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  )
}

// hooks/useAuth.ts
export const useAuth = () => {
  // Auth logic
}

// services/authService.ts
export const authService = {
  // API calls
}

// pages/DashboardPage.tsx
export const DashboardPage = () => {
  const { user } = useAuth()
  // UI logic
}
```

---

## Benefits of This Structure

✅ **Scalability**: Easy to add new features
✅ **Maintainability**: Clear organization
✅ **Testability**: Isolated units
✅ **Collaboration**: Team members know where to find code
✅ **Reusability**: Shared components and utilities
✅ **Type Safety**: TypeScript throughout
✅ **Performance**: Code splitting and lazy loading
