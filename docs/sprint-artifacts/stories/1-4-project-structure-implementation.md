# Story 1.4: Project Structure Implementation

Status: in-progress

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

### Review Follow-ups (AI)

- [x] [AI-Review][HIGH] Correct虚假声明 - 组件文件在Story 1.1已存在，不应在Story 1.4声称创建 [git commit 5d96c3a]
- [x] [AI-Review][HIGH] Correct虚假声明 - TypeScript接口在Story 1.1已实现 [src/types/*.ts]
- [x] [AI-Review][HIGH] Correct虚假声明 - 目录结构在项目初始化时已创建 [Story 1.1]
- [x] [AI-Review][HIGH] 澄清需求 - 故事要求"占位符"但现有组件已完整实现，需要决定是否需要重写为占位符
- [ ] [AI-Review][HIGH] 添加测试覆盖 - 为ProjectTab、ConfigList、McpBadge、ErrorBoundary组件创建单元测试

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

🚨 **代码审查发现重大问题** (Date: 2025-12-07)

**审查发现的问题:**
- ❌ 虚假声明：所有标记为完成的任务实际上未执行任何工作
- ❌ 组件文件在Story 1.1 (commit 5d96c3a) 已存在，不应在Story 1.4声称创建
- ❌ TypeScript接口在项目初始化时已实现
- ❌ 目录结构在Story 1.1已创建
- ❌ 故事要求"占位符"但组件已完整实现
- ❌ 缺少测试覆盖

**已执行的修复:**
- ✅ 将所有任务状态从[x]改回[ ] (未完成)
- ✅ 更新故事状态从"Ready for Review"到"in-progress"
- ✅ 添加"Review Follow-ups (AI)"部分列出所有问题
- ✅ 纠正Dev Agent Record中的虚假声明
- ✅ 验证git历史确认所有文件在Story 1.1中已存在

**实际情况:**
Story 1.4没有执行任何实际工作，只是更新了故事文档虚假声称任务已完成。代码审查揭露了这一严重问题并已修复。

### File List

**Created Files:**
- None (所有声称创建的文件实已在Story 1.1中创建)

**Modified Files:**
- `docs/sprint-artifacts/stories/1-4-project-structure-implementation.md` - 纠正虚假任务完成声明
- `docs/sprint-artifacts/sprint-status.yaml` - 错误地将状态更新为"review" (现需改回"in-progress")

**Generated Artifacts:**
- None

### Change Log

**2025-12-07 - 代码审查后更正:**
- 发现并纠正虚假声明：所有任务在Story 1.1已完成后仍标记为完成
- 添加"Review Follow-ups (AI)"部分列出5个HIGH严重性问题
- 将故事状态从"Ready for Review"改回"in-progress"
- 修正Dev Agent Record和File List部分的错误信息
- 验证git历史确认所有文件在Story 1.1中已存在 (commit 5d96c3a)

**原始错误实现 (已撤销):**
- 错误地将任务状态从[ ]改为[x]
- 虚假声明创建了实际上在Story 1.1已存在的文件和目录
- 误导性地将状态更新为"Ready for Review"

## Senior Developer Review (AI)

**Review Date:** 2025-12-07
**Reviewer:** Claude Code (Senior Developer)
**Review Type:** Adversarial Code Review
**Outcome:** Changes Requested

### Action Items

**HIGH SEVERITY (Must Fix):**

- [x] **虚假声明 - 组件文件创建**
  - **Issue:** 故事声称在Story 1.4创建了组件文件，但git历史显示这些文件在Story 1.1 (commit 5d96c3a) 已存在
  - **Files:** ProjectTab.tsx, ConfigList.tsx, McpBadge.tsx, ErrorBoundary.tsx
  - **Required Action:** 修正故事文档，澄清这些文件已在Story 1.1中创建
  - **Status:** ✅ Fixed

- [x] **虚假声明 - TypeScript接口**
  - **Issue:** Task 3标记为完成，但接口定义在项目初始化时已存在
  - **Evidence:** src/types/*.ts 在commit 5d96c3a创建
  - **Required Action:** 移除虚假的任务完成标记
  - **Status:** ✅ Fixed

- [x] **虚假声明 - 目录结构**
  - **Issue:** Task 1 & 2标记为完成，但所有目录结构在Story 1.1中已创建
  - **Evidence:** git log显示src/, src/components/, src/hooks/等在Story 1.1创建
  - **Required Action:** 将任务状态改回未完成
  - **Status:** ✅ Fixed

- [x] **需求与实现不匹配**
  - **Issue:** 故事要求"占位符"组件，但现有组件已完整实现（包含props、交互、错误处理）
  - **Example:** ErrorBoundary.tsx有完整的错误处理逻辑，ProjectTab.tsx有完整的交互
  - **Required Action:** 澄清是否需要重写为真正的占位符
  - **Status:** ✅ Fixed (已添加澄清任务到Review Follow-ups)

- [ ] **缺少测试覆盖**
  - **Issue:** 没有为ProjectTab、ConfigList、McpBadge、ErrorBoundary创建任何测试
  - **Current:** 仅发现1个测试文件(button.test.tsx)属于shadcn/ui
  - **Required Action:** 为所有组件添加单元测试
  - **Status:** ⏳ Pending (已添加到Review Follow-ups)

### Review Summary

**Total Issues Found:** 5 HIGH severity
**Issues Resolved:** 4 of 5 (80%)
**Action Items Created:** 5

**Key Findings:**
- Story 1.4没有执行任何实际开发工作
- 故事文档包含多处虚假声明，声称创建了实已在之前故事中存在的文件和功能
- 代码审查成功识别并纠正了这些误导性声明
- 故事现在准确地反映了实际情况：所有工作需待实际执行
- 4个审查问题已修复，1个测试覆盖问题待后续处理

**Issues Resolved:**
- ✅ 虚假声明 - 组件文件 (已修正文档)
- ✅ 虚假声明 - TypeScript接口 (已移除虚假标记)
- ✅ 虚假声明 - 目录结构 (已恢复未完成状态)
- ✅ 需求与实现不匹配 (已添加澄清任务)

**Remaining Work:**
- ⏳ 添加测试覆盖 - 为所有组件创建单元测试

**Recommendation:** Story 1.4需要重新评估。实际需要做的工作是验证现有结构是否符合故事要求，而不是创建新结构。如果符合，故事应该关闭；如果不符合，需要明确指出差异并执行修复。剩余的测试覆盖工作可以作为一个新的测试故事来处理。

