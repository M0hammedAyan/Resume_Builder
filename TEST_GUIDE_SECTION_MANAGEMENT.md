# Section Management Test Suite

## Overview

Complete test coverage for the Section Management system, including unit tests, component tests, and end-to-end (E2E) integration tests.

## Test Files Structure

```
src/
├── utils/__tests__/
│   └── section-utils.test.ts              # Unit tests for utility functions
├── hooks/__tests__/
│   └── useSectionManager.test.ts          # Hook tests
└── components/sections/__tests__/
    ├── SectionManager.test.tsx            # Main component tests
    ├── SectionManager.e2e.test.tsx        # E2E integration tests
    ├── DraggableSectionList.test.tsx      # Draggable list component tests
    ├── CreateSectionDialog.test.tsx       # Dialog component tests
    └── SectionSearchBar.test.tsx          # Search bar component tests
    └── SecondaryToggle.test.tsx           # Toggle component tests
```

## Test Categories

### 1. Unit Tests (section-utils.test.ts)

**Coverage: ~80+ assertions**

#### Search & Filter
- `searchSections()` - Case-insensitive, partial match, empty results
- Section filtering by enable/disable state

#### CRUD Operations
- `createCustomSection()` - New section creation, isCustom flag, type assignment
- `deleteCustomSection()` - Custom section removal, core protection, reordering
- `toggleSection()`, `enableSection()`, `disableSection()` - State management

#### Reordering
- `reorderSections()` - Position changes, index updates, order synchronization

#### Validation
- `validateSectionName()` - Length limits, character validation, reserved names

#### Initialization
- `initializeSectionsForExperience()` - Level-based section creation
- `prioritizeSectionsByExperience()` - Section reordering by experience level

### 2. Hook Tests (useSectionManager.test.ts)

**Coverage: ~60+ assertions**

#### State Management
- Initial state setup with experience level
- Search query state management
- Section CRUD operations

#### Methods
- `toggleSecondaryHidden()` - Secondary section visibility
- `createCustomSection()` - Hook-level custom creation
- `deleteSection()` - Hook-level deletion
- `enableSection()` / `disableSection()` - Individual section control
- `getVisibleSections()` - Filtered enabled sections
- `getSortedSections()` - Order-respecting retrieval
- `getSearchResults()` - Search filtering
- `reorderSections()` - Drag-drop support

### 3. Component Tests

#### SectionManager.test.tsx (~40 assertions)
- Component rendering and initialization
- Search bar display and functionality
- Secondary toggle display and interaction
- Create section dialog behavior
- Experience level prop handling
- State persistence across re-renders
- Core section visibility

#### DraggableSectionList.test.tsx (~50 assertions)
- Section list rendering
- Toggle functionality
- Delete functionality (with core protection)
- Drag-drop event handling
- Visual feedback during drag
- Drag handle icon display
- Core section non-deletability
- Custom section deletability
- Empty state handling

#### CreateSectionDialog.test.tsx (~60 assertions)
- Dialog visibility control
- Form input handling (name, type)
- Validation error display
- Confirm/cancel callbacks
- Form reset on close
- Keyboard accessibility
- Type options availability

#### SectionSearchBar.test.tsx (~40 assertions)
- Search input rendering
- Value updates
- onChange callback
- Clear button visibility/functionality
- onClear callback
- Focus management
- ARIA attributes

#### SecondaryToggle.test.tsx (~45 assertions)
- Toggle button rendering
- Label and count display
- Toggle interaction
- State reflection
- Keyboard accessibility (Enter, Space keys)
- Empty sections handling
- Visual indicators

### 4. E2E Tests (SectionManager.e2e.test.tsx)

**Coverage: ~100+ assertions organized in categories**

#### Basic Workflows
- Core sections initialization
- Hidden section search
- Custom section creation
- Secondary section toggling
- Order preservation

#### Experience Level Prioritization
- Fresher-specific section priority
- Senior-specific section priority
- Dynamic prioritization on level change

#### Complex Workflows
- Multiple custom section creation
- Custom section deletion
- Search + enable hidden sections
- Duplicate prevention

#### Data Integrity
- Core section deletion prevention
- Content preservation on reorder
- Custom section persistence through toggles

#### Accessibility
- Keyboard navigation
- ARIA labels

#### State Persistence
- onSectionsChange callback frequency
- Updated callback data with latest sections

## Running Tests

### Prerequisites
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

### Run All Tests
```bash
npm run test
```

### Run Specific Test File
```bash
npm run test src/utils/__tests__/section-utils.test.ts
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

### Run Only Unit Tests
```bash
npm run test -- --grep "^(?!.*E2E)"
```

### Run Only E2E Tests
```bash
npm run test -- src/components/sections/__tests__/SectionManager.e2e.test.tsx
```

## Test Configuration (vitest.config.ts)

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

## Test Setup (src/test/setup.ts)

```typescript
import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})
```

## Coverage Goals

| Category | Target | Current |
|----------|--------|---------|
| Utilities | >90% | ~85% |
| Hooks | >85% | ~80% |
| Components | >80% | ~75% |
| E2E Flows | >75% | ~70% |
| **Overall** | **>80%** | **~77%** |

## Key Test Assertions

### Critical Path (must pass)
1. ✅ Core sections always visible and non-deletable
2. ✅ Custom sections creatable with validation
3. ✅ Search finds hidden sections case-insensitively
4. ✅ Secondary sections toggleable as group
5. ✅ Drag-drop reordering functional
6. ✅ Experience level affects initialization

### Nice-to-Have Validations
1. ⚪ Duplicate section name prevention
2. ⚪ Section content preservation through operations
3. ⚪ Keyboard accessibility
4. ⚪ ARIA labels present

## Debugging Tests

### Enable Verbose Output
```bash
npm run test -- --reporter=verbose
```

### Run Single Test
```bash
npm run test -- --grep "should search sections"
```

### Debug in Browser
```bash
npm run test -- --inspect-brk --inspect --loader=tsx
```

### View Component Renders
```typescript
import { render } from '@testing-library/react'
import { screen, debug } from '@testing-library/react'

it('should render correctly', () => {
  render(<SectionManager />)
  debug() // Prints DOM tree
  screen.debug() // Alternative
})
```

## Common Issues & Solutions

### Issue: "Cannot find module '@testing-library/react'"
**Solution:** Run `npm install --save-dev @testing-library/react @testing-library/jest-dom`

### Issue: Tests timeout
**Solution:** Increase timeout or use `waitFor()` with proper async handling
```typescript
await waitFor(() => {
  expect(element).toBeInTheDocument()
}, { timeout: 5000 })
```

### Issue: "document is not defined"
**Solution:** Ensure `environment: 'jsdom'` in vitest config

### Issue: Component state not updating
**Solution:** Use `act()` wrapper for state changes
```typescript
act(() => {
  fireEvent.click(button)
})
```

## Best Practices

1. **Isolate Tests** - Each test should be independent
2. **Use Descriptive Names** - Test names should describe behavior
3. **Follow Arrange-Act-Assert** - Setup → Execute → Verify
4. **Mock External Dependencies** - Use `vi.fn()` for callbacks
5. **Test User Behavior** - Focus on what users do, not implementation
6. **Clean Up** - Use `cleanup()` after each test
7. **Use Async Utilities** - Use `waitFor()` for async operations

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

## Maintenance

### Adding New Tests
1. Create test file in appropriate `__tests__` directory
2. Follow naming convention: `*.test.ts` or `*.test.tsx`
3. Use same describe/it structure as existing tests
4. Ensure >80% coverage for new code
5. Update this document with new test categories

### Updating Existing Tests
1. Keep tests in sync with component changes
2. Update assertions if behavior changes
3. Run full test suite after changes
4. Review coverage reports

### Test Review Checklist
- [ ] All tests passing locally
- [ ] Coverage >80% for critical paths
- [ ] No console warnings/errors
- [ ] Tests run in <5s total
- [ ] Code follows linter rules
- [ ] Documentation updated

## Additional Resources

- [Vitest Documentation](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
