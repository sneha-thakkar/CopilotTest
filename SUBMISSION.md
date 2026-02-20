# Submission Summary

## Track Chosen
<!-- Mark your choice with [x] -->
- [ ] Backend Only
- [x] Frontend Only
- [ ] Full-Stack (Both)

## GitHub Copilot Usage Summary
<!-- Describe how you used AI throughout the test. Be specific about when and how you leveraged AI tools. -->

GitHub Copilot was used extensively throughout this implementation:

1. **Initial Setup & Bug Fixes**: Fixed Angular template compilation errors by converting arrow function filters to component getters
2. **API Integration**: Implemented pagination, sorting, and filtering using the mock API's query parameters (_page, _limit, _sort, _order, status)
3. **Component Architecture**: Created task-page (container), task-list, and task-form components with proper separation of concerns
4. **Reactive Forms**: Built form validation including custom validators for high-priority due date constraints (within 7 days)
5. **Drag-and-Drop**: Implemented HTML5 drag-and-drop with visual feedback and priority-based reordering
6. **Offline Support**: Created localStorage cache with action queue and automatic sync on reconnection
7. **Business Logic**: Implemented read-only enforcement for completed tasks (UI + service guard)
8. **Testing Infrastructure**: Set up Karma/Jasmine unit tests, fixed webpack require.context issues
9. **UI/UX Polish**: Fixed navigation styling, added sync status indicator, implemented priority level badges

## Key Prompts Used
<!-- List 3-5 important prompts you used with your AI assistant -->

1. "Apply pagination and sorting using the api mentioned in readme.md file"
2. "Add relevant unit tests support for all the components"
3. "Implement drag-and-drop to reorder tasks with visual feedback during drag operations and persist new order"
4. "Task with high priority must have due date within 7 days"
5. "If a task is mark as done, should it be editable" - implemented UI + service guard enforcement

## Design Decisions (optional)
<!-- Explain key architectural or implementation decisions you made and why -->

- **Decision 1:** Used dual priority fields: `priority` (number for API ordering) and `priorityLevel` (low/medium/high enum)
  - **Reasoning:** `priority` handles drag-drop sequence persistence while `priorityLevel` provides user-friendly categorization and validation rules

- **Decision 2:** Implemented localStorage queue pattern for offline mutations
  - **Reasoning:** Ensures offline actions (create/update/delete) are persisted and replayed in order when connection restored, preventing data loss

- **Decision 3:** Service-level guard against editing completed tasks
  - **Reasoning:** Defensive coding - even if UI is bypassed, backend service prevents status regression and field updates on done tasks

- **Decision 4:** Explicit spec imports instead of require.context in test.ts
  - **Reasoning:** Resolved Karma webpack compatibility issue with Angular 17 while maintaining all test coverage

- **Decision 5:** Container/Presenter pattern with task-page orchestrating child components
  - **Reasoning:** Centralized state management, cleaner data flow, easier testing of isolated UI components

## Challenges Faced
<!-- Optional: Describe any challenges encountered and how you overcame them -->

1. **Angular Template Restrictions**: Arrow functions not allowed in templates - solved by moving filter logic to component getters
2. **Test Configuration**: Karma require.context error - replaced with explicit spec file imports
3. **Offline Sync Sequencing**: Needed to ensure queued actions execute in order - used RxJS concatMap instead of parallel requests
4. **Read-Only Task Enforcement**: Initially only disabled form controls, enhanced with service guard to prevent API calls for done tasks
5. **Navigation Styling**: CSS specificity issues with router-link-active - used !important overrides for proper pill styling

## Time Breakdown
<!-- Optional: Approximate time spent on each phase -->

- Planning & Setup: 10 minutes
- Core Implementation: 30 minutes (components, routing, basic CRUD)
- Testing & Debugging: 20 minutes (unit test setup, fixing template/test errors)
- Additional Requirements (30-min mark): 25 minutes (pagination, sorting, filtering, folder restructure)
- Additional Requirements (45-min mark): 35 minutes (drag-drop, offline support with localStorage)
- Optional Challenge (if attempted): 40 minutes (priority validation, due date sorting, read-only enforcement)

## Optional Challenge
<!-- If you attempted an optional challenge, specify which one -->

- [ ] Not Attempted
- [ ] Option 1: Request Logging Middleware
- [ ] Option 2: API Pagination
- [ ] Option 3: Advanced Validation
- [ ] Option 4: Task Filtering & Search
- [ ] Option 5: Form Validation & UX
- [x] Option 6: Drag-and-Drop Task Reordering
- [x] Option 7: Local Storage / Offline Support
- [ ] Option 8: Real-time Updates
- [ ] Option 9: Task Statistics Dashboard

## Additional Notes
<!-- Any other information you'd like to share about your implementation -->

**Implemented Features Beyond Core Requirements:**
- High-priority tasks enforce due date within 7 days (custom validator)
- Completed tasks are fully read-only (form disabled + service guard + UI messaging)
- Sync status indicator shows online/offline state and queue status
- Sort by created date OR due date with ascending/descending options
- Visual drag feedback with opacity changes and drag-over classes
- Comprehensive unit test coverage for all components
- Responsive navigation with proper active state styling

**Technical Highlights:**
- Type-safe task model with TypeScript enums for status and priority levels
- RxJS BehaviorSubject for reactive sync status updates
- Graceful API error handling with localStorage fallback
- Batch priority updates using forkJoin for drag-drop reordering
- Query parameter-based filtering aligned with json-server conventions

The application is production-ready with offline-first architecture and robust validation.

---

## Submission Checklist
<!-- Verify before submitting -->

- [ ] Code pushed to public GitHub repository
- [ ] All mandatory requirements completed
- [ ] Code is tested and functional
- [ ] README updated (if needed)
- [ ] This SUBMISSION.md file completed
- [ ] MS Teams recording completed and shared
- [ ] GitHub repository URL provided to RM
- [ ] MS Teams recording link provided to RM
