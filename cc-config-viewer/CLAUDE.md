# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CC-Config Viewer is a Tauri + React + TypeScript desktop application for visualizing and managing Claude Code configurations. It displays user-level and project-level configurations, MCP servers, and Sub Agents.

## Development Commands

```bash
# Start full Tauri development environment (frontend + Rust backend)
pnpm tauri dev

# Frontend only (Vite dev server)
pnpm dev

# Run tests
pnpm test                    # Watch mode
pnpm test -- --run           # Single run
pnpm test -- ConfigList      # Run specific test file

# Run tests with coverage
pnpm test:coverage

# E2E tests (Playwright)
pnpm test:e2e

# Linting and formatting
pnpm lint
pnpm lint:fix
pnpm format
pnpm type-check

# Build
pnpm build                   # Frontend only
pnpm tauri build             # Full production build

# Rust backend tests
cd src-tauri && cargo test
```

## Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript (strict), Vite 7, Tailwind CSS 4, shadcn/ui
- **State Management**: Zustand 5
- **Desktop Framework**: Tauri 2 (Rust backend)
- **Testing**: Vitest + Testing Library, Playwright (E2E)

### Key Directories
- `src/` - React frontend
  - `components/` - React components (shadcn/ui base components in `ui/`)
  - `stores/` - Zustand stores (configStore, projectsStore, uiStore, errorStore)
  - `hooks/` - Custom React hooks
  - `lib/` - Utilities including `tauriApi.ts` for Tauri API wrapper
  - `types/` - TypeScript type definitions
- `src-tauri/` - Rust backend
  - `src/commands/` - Tauri commands (config.rs, project_commands.rs, export_commands.rs)
  - `src/config/` - Config reading, parsing, watching logic
  - `src/types/` - Rust type definitions

### Data Flow
```
Config Files (JSON/MD) → Rust Backend (reader/watcher) → Tauri IPC → Zustand Stores → React Components
```

### Tauri Commands
- `read_config(path)` - Read configuration file
- `parse_config(content)` - Parse JSON config content
- `watch_config(path)` - Start file watching
- Commands are invoked via `@tauri-apps/api/core` invoke()

### Tauri Events
- `config-changed` - Emitted when config files change
- Events are listened via `@tauri-apps/api/event` listen()

## Code Conventions

### Naming
- Components: PascalCase (`ProjectTab.tsx`)
- Tauri commands (Rust): snake_case (`read_config`)
- TypeScript interfaces: PascalCase, no I prefix (`ProjectConfig` not `IProjectConfig`)
- Zustand stores: lowercase + Store suffix (`useProjectsStore`)
- Tauri events: kebab-case (`config-changed`)

### Import Path Alias
Use `@/` for src directory imports:
```typescript
import { Button } from '@/components/ui/button'
import { useConfigStore } from '@/stores/configStore'
```

### Testing
- Test files are co-located with source files: `Component.tsx` → `Component.test.tsx`
- Coverage thresholds: 90% for branches, functions, lines, statements
- Tauri API is mocked in `src/test/setup.ts`

### Error Handling
```typescript
interface AppError {
  type: 'filesystem' | 'permission' | 'parse' | 'network'
  message: string
  code?: string
  details?: unknown
}
```

### Accessibility
- Uses `@/lib/accessibility` utilities for screen reader announcements
- `useAccessibility()` hook provides high contrast mode and screen reader helpers

## Performance Requirements
- App startup: < 3 seconds
- Tab switch: < 100ms
- Memory: < 100MB
- CPU idle: < 1%
