# 架构快速参考

本文档是 CC-Config Viewer 架构的快速参考指南。完整架构文档请查看 [docs/architecture.md](../docs/architecture.md)。

## 核心技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React | 18.x |
| 类型系统 | TypeScript | 5.x (strict) |
| 构建工具 | Vite | 7.x |
| 样式方案 | Tailwind CSS | 4.x |
| UI 组件库 | shadcn/ui | - |
| 状态管理 | Zustand | 5.x |
| 桌面框架 | Tauri | 2.x |
| 后端语言 | Rust | - |

## 架构决策摘要

### 1. 状态管理：Zustand

选择理由：
- 轻量级，API 简单
- 与 React 18 完美兼容
- 支持 TypeScript
- 无需 Provider 包裹

### 2. UI 组件库：shadcn/ui

选择理由：
- 基于 Radix UI，可访问性好
- 可复制代码，完全可控
- 与 Tailwind CSS 集成
- 易于定制

### 3. 桌面框架：Tauri

选择理由：
- 包体积小 (<10MB)
- 内存占用低 (50-100MB)
- 原生性能 (Rust 后端)
- 内置文件系统安全模型

## 组件架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    ErrorBoundary                         │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │                    Header                            │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │                    Main Content                      │ │ │
│  │  │  ┌───────────────┐  ┌───────────────────────────────┐ │ │ │
│  │  │  │  ProjectTab   │  │        ConfigList             │ │ │ │
│  │  │  │  (User/Proj)  │  │  ┌─────────┐  ┌─────────────┐ │ │ │ │
│  │  │  └───────────────┘  │  │McpBadge │  │SourceIndicator│ │ │ │ │
│  │  │                     │  └─────────┘  └─────────────┘ │ │ │ │
│  │  │                     └───────────────────────────────┘ │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 数据流

```
                    ┌─────────────────────────────┐
                    │      配置文件 (JSON/MD)      │
                    │  ~/.claude/settings.json    │
                    │  ./.mcp.json               │
                    └─────────────┬───────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Rust Backend (Tauri)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   reader    │  │   watcher   │  │      commands       │  │
│  │ (文件读取)   │  │ (文件监听)   │  │ (read_config等)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ invoke() / events
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   React Frontend                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   Zustand Stores                         │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │ │
│  │  │projectsStore│ │ configStore │ │      uiStore        │ │ │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘ │ │
│  └─────────────────────────┬───────────────────────────────┘ │
│                            │                                  │
│  ┌─────────────────────────▼───────────────────────────────┐ │
│  │                   React Components                       │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 核心组件职责

| 组件 | 职责 | 关联需求 |
|------|------|---------|
| `ProjectTab` | 作用域切换 (User/Project) | FR1-5 |
| `ConfigList` | 配置项展示 | FR6-10 |
| `McpBadge` | MCP 服务器标识 | FR11-15 |
| `SourceIndicator` | 配置来源颜色标识 | FR6-10 |
| `ErrorBoundary` | 错误捕获和展示 | FR32-36 |

## Store 结构

### projectsStore

```typescript
interface ProjectsStore {
  projects: Project[]
  activeProject: Project | null
  isLoading: boolean
  error: AppError | null

  setProjects: (projects: Project[]) => void
  setActiveProject: (project: Project | null) => void
  fetchProjects: () => Promise<void>
}
```

### configStore

```typescript
interface ConfigStore {
  userConfig: ClaudeConfig | null
  projectConfig: ClaudeConfig | null
  mergedConfig: ClaudeConfig | null
  isLoading: boolean
  error: AppError | null

  loadUserConfig: () => Promise<void>
  loadProjectConfig: (projectPath: string) => Promise<void>
}
```

### uiStore

```typescript
interface UiStore {
  activeTab: 'user' | 'project'
  isGlobalLoading: boolean
  theme: 'light' | 'dark'

  setActiveTab: (tab: 'user' | 'project') => void
  setGlobalLoading: (loading: boolean) => void
}
```

## Tauri 命令

| 命令 | 说明 | 返回值 |
|------|------|--------|
| `read_config` | 读取配置文件 | `Result<String, AppError>` |
| `get_project_root` | 获取项目根目录 | `Result<String, AppError>` |
| `start_watching` | 开始文件监听 | `Result<(), AppError>` |
| `stop_watching` | 停止文件监听 | `Result<(), AppError>` |

## 事件

| 事件名 | 触发时机 | 负载 |
|--------|---------|------|
| `config-changed` | 配置文件变化 | `{ path, changeType }` |
| `project-updated` | 项目状态更新 | `{ projectPath }` |

## 错误类型

```typescript
interface AppError {
  type: 'filesystem' | 'permission' | 'parse' | 'network'
  message: string
  code?: string
  details?: unknown
}
```

## 性能要求

| 指标 | 要求 |
|------|------|
| 启动时间 | < 3 秒 |
| Tab 切换 | < 100ms |
| 内存占用 | < 100MB |
| CPU 空闲 | < 1% |

## 关键路径

### 配置加载流程

```
App 启动
  ↓
useFileWatcher 初始化
  ↓
projectsStore.fetchProjects()
  ↓
invoke('get_project_root')
  ↓
configStore.loadUserConfig()
  ↓
configStore.loadProjectConfig()
  ↓
渲染 UI
```

### 文件变化处理

```
文件系统变化
  ↓
watcher.rs 检测
  ↓
emit('config-changed')
  ↓
useFileWatcher 接收
  ↓
configStore 更新
  ↓
UI 重新渲染
```

## 详细文档链接

- [完整架构文档](../docs/architecture.md)
- [产品需求文档](../docs/prd.md)
- [功能史诗](../docs/epics.md)
- [开发者指南](./DEVELOPMENT.md)
