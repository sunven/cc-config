# 开发者指南

本文档提供 CC-Config Viewer 项目的开发规范和最佳实践。

## 目录

- [TypeScript 配置](#typescript-配置)
- [命名约定](#命名约定)
- [文件组织](#文件组织)
- [测试规范](#测试规范)
- [提交规范](#提交规范)
- [Pull Request 指南](#pull-request-指南)
- [代码审查清单](#代码审查清单)

## TypeScript 配置

项目使用 TypeScript 严格模式，确保类型安全。

### 编译器选项

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 类型定义要求

- **始终**为函数参数和返回值添加类型
- **避免**使用 `any` 类型，使用 `unknown` 替代
- 使用接口定义对象结构
- 导出类型供其他模块使用

```typescript
// 正确 ✅
interface ProjectConfig {
  projectName: string
  mcpServers: McpServer[]
  configPath: string
}

function parseConfig(content: string): ProjectConfig {
  // ...
}

// 避免 ❌
function parseConfig(content: any): any {
  // ...
}
```

## 命名约定

### 组件 (PascalCase)

```
ProjectTab.tsx
ConfigList.tsx
McpBadge.tsx
ErrorBoundary.tsx
```

### Tauri 命令 (snake_case)

```rust
// Rust 端
read_config
parse_config
watch_config
get_project_root
```

### TypeScript 接口 (PascalCase，无前缀)

```typescript
// 正确 ✅
interface ProjectConfig { }
interface McpServer { }

// 避免 ❌
interface IProjectConfig { }  // 不使用 I 前缀
interface ProjectConfigInterface { }  // 不使用后缀
```

### JSON 字段 (camelCase)

```typescript
{
  projectName: 'my-project',
  mcpServers: [...],
  configPath: '/path/to/config'
}
```

### Zustand Store (lowercase + Store 后缀)

```typescript
// 文件名：projectsStore.ts
export const useProjectsStore = create<ProjectsStore>((set) => ({
  // ...
}))

// 使用
import { useProjectsStore } from '@/stores/projectsStore'
```

### Tauri 事件 (kebab-case)

```typescript
// Rust 端发射
tauri::emit("config-changed", &payload);

// 前端监听
await listen('config-changed', (event) => {
  // ...
})
```

## 文件组织

### 目录结构 (按类型分组)

```
src/
├── components/          # React 组件
│   ├── ui/              # shadcn/ui 基础组件
│   ├── ProjectTab.tsx   # 功能组件
│   └── ProjectTab.test.tsx  # 测试文件（同目录）
├── hooks/               # 自定义 Hooks
│   └── useProjects.ts
├── stores/              # Zustand 状态管理
│   └── projectsStore.ts
├── lib/                 # 工具函数
│   └── configParser.ts
└── types/               # TypeScript 类型
    └── index.ts
```

### 测试文件位置

测试文件与源文件放在同一目录：

```
src/components/ProjectTab.tsx
src/components/ProjectTab.test.tsx  ✅ 推荐

src/stores/projectsStore.ts
src/stores/projectsStore.test.ts    ✅ 推荐
```

### 导入顺序

```typescript
// 1. React/框架导入
import React, { useState, useEffect } from 'react'

// 2. 第三方库
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

// 3. 内部组件
import { Button } from '@/components/ui/button'
import { ConfigList } from '@/components/ConfigList'

// 4. Hooks 和 Stores
import { useProjectsStore } from '@/stores/projectsStore'
import { useConfig } from '@/hooks/useConfig'

// 5. 工具函数和类型
import { parseConfig } from '@/lib/configParser'
import type { ProjectConfig } from '@/types'

// 6. 样式
import './styles.css'
```

## 测试规范

### 测试覆盖率要求

- **语句覆盖率**: > 80%
- **分支覆盖率**: > 75%
- **函数覆盖率**: > 80%
- **行覆盖率**: > 80%

### 测试框架

- **Vitest** - 测试运行器
- **Testing Library** - React 组件测试
- **jsdom** - DOM 模拟

### 组件测试示例

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ProjectTab } from './ProjectTab'

describe('ProjectTab', () => {
  it('renders project name correctly', () => {
    render(<ProjectTab name="my-project" />)
    expect(screen.getByText('my-project')).toBeInTheDocument()
  })

  it('calls onSelect when clicked', async () => {
    const onSelect = vi.fn()
    render(<ProjectTab name="my-project" onSelect={onSelect} />)

    fireEvent.click(screen.getByRole('tab'))
    expect(onSelect).toHaveBeenCalledWith('my-project')
  })
})
```

### Store 测试示例

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectsStore } from './projectsStore'

describe('projectsStore', () => {
  beforeEach(() => {
    useProjectsStore.setState({ projects: [], activeProject: null })
  })

  it('adds a project', () => {
    const { setProjects } = useProjectsStore.getState()
    setProjects([{ name: 'test-project', path: '/test' }])

    const { projects } = useProjectsStore.getState()
    expect(projects).toHaveLength(1)
    expect(projects[0].name).toBe('test-project')
  })
})
```

### Tauri API Mock 示例

```typescript
// src/test/setup.ts
import { vi } from 'vitest'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
  emit: vi.fn(),
}))
```

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式
npm test -- --watch

# 生成覆盖率报告
npm run test:coverage

# 运行特定文件
npm test -- ProjectTab.test.tsx
```

## 提交规范

### Commit Message 格式

```
<type>: <description>

[optional body]

[optional footer]
```

### Type 类型

| Type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 代码重构 |
| `test` | 测试相关 |
| `chore` | 构建/工具相关 |
| `perf` | 性能优化 |

### 示例

```bash
# 新功能
feat: add MCP server list component

# Bug 修复
fix: resolve config parsing error for empty files

# 文档
docs: update README with setup instructions

# 重构
refactor: extract config parsing logic to separate module
```

### 提交建议

- 使用简洁明了的描述
- 中英文均可
- 每个提交聚焦单一改动
- 避免过大的提交

## Pull Request 指南

### PR 模板

```markdown
## 概述
简要描述本 PR 的改动内容。

## 改动类型
- [ ] 新功能
- [ ] Bug 修复
- [ ] 文档更新
- [ ] 代码重构
- [ ] 测试
- [ ] 其他

## 测试说明
描述如何测试这些改动。

## 相关 Issue
关联的 Issue 编号（如有）。

## 截图
UI 相关改动请附上截图。

## 检查清单
- [ ] 代码符合项目规范
- [ ] 已添加必要的测试
- [ ] 所有测试通过
- [ ] 已更新相关文档
```

### PR 最佳实践

1. **保持 PR 小而聚焦** - 每个 PR 解决一个问题
2. **写清晰的描述** - 解释为什么做这个改动
3. **关联 Issue** - 如有相关 Issue，请关联
4. **自我审查** - 提交前先自己审查一遍
5. **回应反馈** - 及时回应 Review 意见

## 代码审查清单

### 功能

- [ ] 代码实现符合需求
- [ ] 边界情况已处理
- [ ] 错误情况有适当处理

### 代码质量

- [ ] 遵循项目命名约定
- [ ] 无未使用的变量/导入
- [ ] 无硬编码的魔法数字/字符串
- [ ] 适当的代码注释
- [ ] 无重复代码

### 类型安全

- [ ] 无 `any` 类型使用
- [ ] 接口定义完整
- [ ] 函数参数和返回值有类型

### 测试

- [ ] 有对应的测试用例
- [ ] 测试覆盖主要场景
- [ ] 测试可读性好

### 性能

- [ ] 无不必要的重渲染
- [ ] 大列表使用虚拟化
- [ ] 异步操作有适当处理

### 安全

- [ ] 无敏感信息硬编码
- [ ] 用户输入有验证
- [ ] 文件路径有验证

## 开发工具

### VS Code 扩展推荐

- **rust-analyzer** - Rust 语言支持
- **Tauri** - Tauri 开发支持
- **ESLint** - JavaScript/TypeScript 代码检查
- **Prettier** - 代码格式化
- **Tailwind CSS IntelliSense** - Tailwind 智能提示
- **Error Lens** - 内联错误显示

### 调试

```bash
# 开发模式（带调试）
npm run tauri dev

# 查看 Rust 后端日志
RUST_LOG=debug npm run tauri dev
```

## 状态管理规范

### Zustand 使用模式

```typescript
// 正确 ✅ - 使用函数式更新
setState((prev) => ({ ...prev, projects: newProjects }))

// 避免 ❌ - 在异步回调中可能导致过时状态
setState({ ...state, projects: newProjects })
```

### Store 结构

```typescript
interface ProjectsStore {
  // 状态
  projects: Project[]
  activeProject: Project | null
  isLoading: boolean
  error: AppError | null

  // 操作
  setProjects: (projects: Project[]) => void
  setActiveProject: (project: Project | null) => void
  fetchProjects: () => Promise<void>
}
```

## 错误处理规范

### 统一错误类型

```typescript
interface AppError {
  type: 'filesystem' | 'permission' | 'parse' | 'network'
  message: string
  code?: string
  details?: unknown
}
```

### 错误展示策略

| 错误类型 | 展示方式 |
|---------|---------|
| 文件读取错误 | Toast 通知 |
| 权限错误 | Alert 对话框 |
| 解析错误 | 内联提示 |
| 网络错误 | Toast 通知 |

## 相关文档

- [README.md](./README.md) - 项目概述和快速开始
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 架构快速参考
- [完整架构文档](../docs/architecture.md) - 详细架构说明
