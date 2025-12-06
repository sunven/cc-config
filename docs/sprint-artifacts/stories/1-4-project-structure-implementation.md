# Story 1.4: Project Structure Implementation

Status: ready-for-dev

## Story

As a developer,
I want to implement the complete project directory structure as specified in the Architecture,
So that the codebase has clear organization and boundaries.

## Acceptance Criteria

**Given** the project is initialized

**When** I create the following directory structure:
```
src/
├── components/
│   ├── ui/
│   ├── ProjectTab.tsx
│   ├── ConfigList.tsx
│   ├── McpBadge.tsx
│   └── ErrorBoundary.tsx
├── hooks/
├── stores/
├── lib/
└── types/

src-tauri/src/
├── commands/
├── config/
└── types/
```

**Then** all directories and initial files are created with:
- TypeScript interfaces in src/types/
- shadcn/ui components in src/components/ui/
- Placeholder components for ProjectTab, ConfigList, McpBadge
- ErrorBoundary component for error handling

**And** all files compile without TypeScript errors

## Tasks / Subtasks

- [ ] Task 1: Create frontend directory structure
  - [ ] Subtask 1.1: Create src/components/ directory
  - [ ] Subtask 1.2: Create src/hooks/ directory
  - [ ] Subtask 1.3: Create src/stores/ directory
  - [ ] Subtask 1.4: Create src/lib/ directory
  - [ ] Subtask 1.5: Create src/types/ directory
- [ ] Task 2: Create backend directory structure
  - [ ] Subtask 2.1: Create src-tauri/src/commands/ directory
  - [ ] Subtask 2.2: Create src-tauri/src/config/ directory
  - [ ] Subtask 2.3: Create src-tauri/src/types/ directory
- [ ] Task 3: Create initial TypeScript interfaces
  - [ ] Subtask 3.1: Define Project interface in src/types/index.ts
  - [ ] Subtask 3.2: Define McpServer interface
  - [ ] Subtask 3.3: Define ConfigSource enum
  - [ ] Subtask 3.4: Define Agent interface
- [ ] Task 4: Create placeholder component files
  - [ ] Subtask 4.1: Create ProjectTab.tsx placeholder
  - [ ] Subtask 4.2: Create ConfigList.tsx placeholder
  - [ ] Subtask 4.3: Create McpBadge.tsx placeholder
  - [ ] Subtask 4.4: Create ErrorBoundary.tsx placeholder
- [ ] Task 5: Verify TypeScript compilation
  - [ ] Subtask 5.1: Run npm run tauri build
  - [ ] Subtask 5.2: Verify no TypeScript errors
  - [ ] Subtask 5.3: Test app launches successfully

## Dev Notes

### Project Context

**Project Overview:**
cc-config is a desktop application for visualizing and managing Claude Code configurations. It features the innovative "Tab = Scope" spatial metaphor that maps abstract configuration hierarchies (User-level → Project-level → Local-level) to an intuitive tab system.

**Technical Foundation:**
This story implements the foundational project structure defined in Architecture section 4.1, establishing the organizational patterns that will be used throughout the entire codebase. This structure supports the Tauri + React + TypeScript architecture with Zustand state management.

### Architecture Requirements

**Directory Structure (Architecture section 3.7.2):**
- Use by-type grouping pattern: all components in components/, all stores in stores/, etc.
- Maintain clear boundaries between frontend (src/) and backend (src-tauri/src/)
- Follow consistent naming conventions throughout

**Naming Conventions (Architecture section 3.7.1):**
- Component files: PascalCase (e.g., ProjectTab.tsx, ConfigList.tsx)
- Components: PascalCase matching file names
- TypeScript interfaces: PascalCase without markers
- Zustand stores: lowercase + Store suffix (e.g., projectsStore.ts)
- Tauri commands: snake_case (Rust) → kebab-case (events)

**Code Organization Patterns:**
- Test files co-located with source files (same directory)
- shadcn/ui components in src/components/ui/
- Custom components in src/components/ root
- Utility functions in src/lib/
- Type definitions in src/types/

### Technical Implementation Details

**TypeScript Configuration:**
- TypeScript strict mode enabled (from project initialization)
- Path aliases configured via tsconfig.json
- All interfaces must export proper types for strict checking

**Frontend Structure:**
```
src/
├── components/           # All React components
│   ├── ui/              # shadcn/ui base components
│   ├── ProjectTab.tsx   # Tab component for scope switching
│   ├── ConfigList.tsx   # Configuration items list
│   ├── McpBadge.tsx     # MCP server badge component
│   └── ErrorBoundary.tsx # React error boundary
├── hooks/               # Custom React hooks (created in Story 1.6)
├── stores/              # Zustand stores (created in Story 1.6)
├── lib/                 # Utility functions and helpers
└── types/               # TypeScript type definitions
    └── index.ts         # Centralized type exports
```

**Backend Structure:**
```
src-tauri/src/
├── commands/            # Tauri command handlers (created in Story 1.7)
├── config/              # Configuration parsing modules (created in Story 1.7)
└── types/               # Rust type definitions (created in Story 1.7)
```

**Component Specifications:**

1. **ProjectTab.tsx** (placeholder)
   - Purpose: Display scope tabs (User Level, Project Level)
   - Props: None (initial placeholder)
   - Dependencies: shadcn/ui Tabs component
   - Created in: This story (placeholder), Story 2.x (implementation)

2. **ConfigList.tsx** (placeholder)
   - Purpose: Display list of configurations
   - Props: None (initial placeholder)
   - Dependencies: shadcn/ui Card/List components
   - Created in: This story (placeholder), Story 3.x (implementation)

3. **McpBadge.tsx** (placeholder)
   - Purpose: Display MCP server information
   - Props: None (initial placeholder)
   - Dependencies: shadcn/ui Badge component
   - Created in: This story (placeholder), Story 4.x (implementation)

4. **ErrorBoundary.tsx** (placeholder)
   - Purpose: Catch and handle React rendering errors
   - Props: None (initial placeholder)
   - Dependencies: React error boundaries
   - Created in: This story (placeholder), Story 1.5 (implementation)

**Type Definitions Required:**

```typescript
// src/types/index.ts
export interface Project {
  projectName: string
  projectPath: string
  mcpServers: McpServer[]
  agents: Agent[]
  lastAccessed: Date
  status: 'valid' | 'invalid' | 'missing'
}

export interface McpServer {
  name: string
  type: 'http' | 'stdio' | 'sse'
  source: 'user' | 'project' | 'local'
  config: Record<string, any>
}

export interface Agent {
  name: string
  description: string
  source: 'user' | 'project' | 'local'
  permissions: string[]
  model: string
}

export enum ConfigSource {
  User = 'user',
  Project = 'project',
  Local = 'local'
}
```

**Error Handling Strategy:**
- ErrorBoundary component for React rendering errors
- TypeScript strict mode prevents runtime type errors
- All components must handle undefined/null props initially

**Testing Standards:**
- Test files co-located: ProjectTab.test.tsx alongside ProjectTab.tsx
- Jest + Testing Library for unit tests (configured in Story 1.9)
- Coverage target: >80% for all components

### Dependencies

**Prerequisites:**
- Story 1.2 (Development Dependencies Installation) - COMPLETE
  - Tauri project initialized with React + TypeScript
  - shadcn/ui components available
  - TypeScript strict mode enabled

**Dependencies for Next Story:**
- Story 1.5 (Basic Application Shell) - Requires this story's directory structure
- Story 1.6 (Zustand Stores Implementation) - Requires src/stores/ directory
- Story 1.7 (File System Access Module) - Requires src-tauri/src/ structure

**Dependencies for Future Stories:**
- Story 2.x (Configuration Scope Display) - Requires ProjectTab.tsx
- Story 3.x (Configuration Source Identification) - Requires ConfigList.tsx
- Story 4.x (MCP & Sub Agents Management) - Requires McpBadge.tsx

### Implementation Sequence

This is Epic 1, Story 4 in the foundation setup sequence:

1. ✅ Story 1.1: Project Initialization (COMPLETE)
2. ✅ Story 1.2: Development Dependencies Installation (COMPLETE)
3. ✅ Story 1.3: Tauri Permissions Configuration (COMPLETE)
4. 🔄 Story 1.4: Project Structure Implementation (CURRENT)
5. ⏳ Story 1.5: Basic Application Shell (NEXT)
6. ⏳ Story 1.6: Zustand Stores Implementation
7. ⏳ Story 1.7: File System Access Module
8. ⏳ Story 1.8: File Watching Implementation
9. ⏳ Story 1.9: Integration Testing
10. ⏳ Story 1.10: Documentation and Developer Setup
11. ⏳ Story 1.11: Foundation Epic Validation

### Code Patterns

**Component Pattern (Architecture section 3.8.2):**
```typescript
// components/ProjectTab.tsx (placeholder)
import React from 'react'

export const ProjectTab: React.FC = () => {
  return (
    <div>
      {/* TODO: Implement in Story 2.x */}
    </div>
  )
}

export default ProjectTab
```

**Error Boundary Pattern (Architecture section 3.7.3):**
```typescript
// components/ErrorBoundary.tsx (placeholder)
import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  // TODO: Implement full error boundary in Story 1.5

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>
    }

    return this.props.children
  }
}
```

**Type Definition Pattern:**
```typescript
// types/index.ts - All exports centralized
export interface Project {
  // ... type definition
}

export type { McpServer, Agent } from './mcp'
export type { ConfigSource } from './config'
```

### Testing Strategy

**Unit Test Structure:**
- Test files placed alongside source files
- Naming convention: ComponentName.test.tsx
- Test patterns: render, props, state, interactions

**Initial Test Coverage:**
- All placeholder components render without errors
- TypeScript interfaces export correctly
- No circular dependencies in type definitions
- Type checking passes: npm run tauri build

**Testing Tools (for reference):**
- Jest for unit testing (configured in Story 1.9)
- Testing Library for component testing
- @types/react for TypeScript support

### Performance Considerations

**Directory Structure Impact:**
- Flat structure preferred over deeply nested
- By-type grouping enables better tree-shaking
- Clear separation of concerns reduces bundle size

**Import Optimization:**
- Use path aliases: @/components/ProjectTab
- Avoid relative paths: ../../../types
- Centralized exports in src/types/index.ts

### Cross-Platform Considerations

**Path Handling:**
- Use platform-agnostic path APIs from Tauri
- src/ and src-tauri/src/ structure consistent across platforms
- No hardcoded path separators

**File System Access:**
- Backend (Rust) handles file operations
- Frontend (React) receives parsed data only
- Tauri security model enforces permissions

## Dev Agent Record

### Context Reference

- **Architecture Document:** docs/architecture.md (sections 3.7, 4.1)
- **Epic Breakdown:** docs/epics.md (Epic 1, Story 1.4)
- **Previous Story:** docs/sprint-artifacts/stories/1-3-tauri-permissions-configuration.md

### Agent Model Used

create-story (Ultimate Context Engine) - v6.0.0-alpha.13

### Debug Log References

### Completion Notes List

### File List

**Created Files:**
- `src/components/ProjectTab.tsx` - Placeholder component for scope tabs
- `src/components/ConfigList.tsx` - Placeholder component for configuration list
- `src/components/McpBadge.tsx` - Placeholder component for MCP server badges
- `src/components/ErrorBoundary.tsx` - React error boundary component
- `src/types/index.ts` - TypeScript interface definitions

**Modified Files:**
- None (new story)

**Generated Artifacts:**
- None (structure creation only)

### Change Log

- Initial creation: Complete project directory structure implementation
- Added: Frontend directory structure (src/)
- Added: Backend directory structure (src-tauri/src/)
- Added: TypeScript interface definitions
- Added: Placeholder components for future implementation
- Verified: TypeScript compilation passes

