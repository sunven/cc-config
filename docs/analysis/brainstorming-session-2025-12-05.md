---
stepsCompleted: [1, 2, 3]
inputDocuments: []
session_topic: 'Claude Code 配置可视化和管理工具'
session_goals: '解决配置作用域混淆、提供配置发现机制、显示配置生效状态、提供直观配置编辑界面'
selected_approach: 'Progressive Technique Flow'
techniques_used: ['What If Scenarios', 'Mind Mapping', 'SCAMPER Method', 'Decision Tree Mapping']
ideas_generated: [8]
context_file: '/Users/sunven/github/cc-config/.bmad/bmm/data/project-context-template.md'
---

# Brainstorming Session Results

**Facilitator:** Sunven
**Date:** 2025-12-05

## Session Overview

**Topic:** Claude Code 配置可视化和管理工具

**Goals:**
- 解决配置作用域混淆问题（用户级 vs 项目级）
- 提供清晰的配置发现机制（列出所有可用配置）
- 显示配置生效状态（哪些配置实际在工作）
- 提供直观的配置编辑界面

### Context Guidance

本次头脑风暴聚焦于软件和产品开发，重点探索：
- **用户问题和痛点：** Claude Code 用户对配置系统的困惑
- **功能创意和能力：** 可视化、配置管理、作用域展示
- **技术方法：** 如何解析和展示配置层级
- **用户体验：** 直观的界面设计
- **市场差异化：** 解决开发者工具配置管理的痛点

### Session Setup

会话已确认，我们将探索如何为 Claude Code 创建一个解决配置管理痛点的可视化工具。

## Technique Selection

**Approach:** Progressive Technique Flow
**Journey Design:** 从探索到行动的系统化开发

**Progressive Techniques:**

- **Phase 1 - 扩展性探索：** What If Scenarios - 最大化想法生成
- **Phase 2 - 模式识别：** Mind Mapping - 组织洞察
- **Phase 3 - 想法发展：** SCAMPER Method - 完善概念
- **Phase 4 - 行动规划：** Decision Tree Mapping - 实施规划

**Journey Rationale:** 这个四阶段旅程将带领我们从无限制的创意探索，通过模式识别和概念细化，最终到达具体的实施计划。每个技巧都专门选择来服务于其阶段目标，确保我们全面覆盖从问题探索到解决方案执行的完整创新周期。

---

## Phase 1: Expansive Exploration - What If Scenarios (完成)

**Technique Focus:** 通过质疑约束和假设探索激进可能性

**Interactive Exploration Summary:**

我们通过 "What If" 提问深入探索了配置工具的核心设计，从"配置自我解释"的概念出发，逐步揭示了用户的真实痛点和解决方案。

**Key Breakthroughs:**

1. **配置继承可见性问题**
   - 用户级和项目级有相同配置项结构，但值不同
   - 项目未设置的配置实际上继承自用户级
   - **核心痛点：** 用户看不到这个继承关系和来源

2. **运行时上下文盲区**
   - Claude Code 运行在特定项目上下文中
   - 用户不知道"此时此刻有什么可用"
   - **关键需求：** 可见的运行时能力清单（MCP、Sub Agents 等）
   - 需要显示每个能力的来源（用户级继承 vs 项目级配置）

3. **Tab = 作用域的核心设计**
   - 第一个 tab：用户级配置
   - 后续每个 tab：具体项目
   - **操作语义：** 在哪个 tab 操作 = 在哪个作用域生效
   - **空间隐喻：** 零歧义，心智模型简单

4. **配置操作权限分层**
   - **继承的配置：** 只读 + 仅可覆盖（灰色显示）
   - **本项目配置：** 完全控制（可编辑、可删除）
   - **删除语义：** 物理删除字段，自动回退到继承（如果有）

5. **可视化继承链**
   - 颜色编码：蓝色（用户级）、绿色（项目级覆盖）、灰色（继承）
   - 来源标注：每个配置项显示来自哪里
   - 覆盖路径视图：`默认值 → 用户级值 → 项目级值`

**Ideas Generated:** 8 个核心设计洞察

**Creative Energy:** 高度聚焦，从抽象概念快速收敛到具体交互设计

**User Creative Strengths:**
- 清晰的问题定义能力
- 从用户视角思考交互逻辑
- 快速做出简洁的设计决策

**Research Insights Discovered:**

在第1阶段后，我们深入研究了 Claude Code 的配置系统，发现了关键技术细节：

- **配置层级：** 实际有3层（User、Project、Local），不考虑 Enterprise 层
- **配置文件结构：**
  - User: `~/.claude/settings.json` + `~/.claude.json`
  - Project: `.claude/settings.json` + `.mcp.json`
  - Local: `.claude/settings.local.json`
- **项目发现：** `~/.claude.json` 的 `projects` 对象存储所有项目路径
- **MCP 配置：** 3个作用域（User/Project/Local），precedence: Local > Project > User
- **Sub Agents：** 2个作用域（Project > User），以 `.md` 文件存储在 `agents/` 目录

**MVP 范围确认：**
- 只显示 MCP 服务器 和 Sub Agents
- 不包含配置操作（只读展示工具）
- 不显示 Enterprise 层级

---

## Phase 2: Pattern Recognition - Mind Mapping (完成)

**Technique Focus:** 识别主题、组织洞察、建立信息架构

**Interactive Exploration Summary:**

通过思维导图技术，我们将第1阶段的洞察组织成三个清晰的功能模块，建立了工具的整体架构。

### **核心架构：**

```
            Claude Code 配置可视化工具
                     |
    _________________|_________________
    |                |                |
项目发现与管理   作用域展示      配置可视化
                (Tab系统)     (MCP + Agents)
```

### **模块1：项目发现与管理**

**职责：** 工具的入口点，发现和管理所有 Claude Code 项目

```
项目发现与管理
├─ 数据源: ~/.claude.json 的 projects 对象
├─ 项目列表展示
│  ├─ 显示所有已使用 Claude Code 的项目
│  ├─ 显示项目路径
│  └─ 项目元数据（最后使用时间、会话ID等）
└─ 用户级配置入口
```

**关键洞察：**
- `projects` 对象的键 = 项目路径
- 无需文件系统扫描，直接读取即可
- 提供统一的项目访问入口

### **模块2：作用域展示（Tab 系统）**

**职责：** 通过空间隐喻清晰展示配置作用域

```
作用域展示 (Tab 系统)
├─ Tab 结构
│  ├─ [用户级] - 固定第一个
│  ├─ [项目A] - 动态生成
│  ├─ [项目B] - 动态生成
│  └─ [项目C] - 动态生成
├─ Tab 语义: 当前 Tab = 当前查看的作用域
└─ 作用域层级
   ├─ User (用户级)
   ├─ Project (项目级 - 团队共享)
   └─ Local (本地级 - 个人)
```

**关键洞察：**
- Tab = 作用域的核心 UX 创新
- 零歧义的空间隐喻
- 视觉上直接映射配置层级

### **模块3：配置可视化（MCP + Sub Agents）**

**职责：** 清晰展示配置内容、来源和继承关系

```
配置可视化
│
├─ MCP 服务器展示
│  ├─ 数据来源
│  │  ├─ User: ~/.claude.json
│  │  ├─ Project: .mcp.json
│  │  └─ Local: .claude/settings.local.json
│  ├─ 展示信息
│  │  ├─ 服务器名称
│  │  ├─ 来源标注
│  │  ├─ 类型（http/stdio/sse）
│  │  └─ 配置详情
│  └─ 视觉区分
│     ├─ 继承的（灰色）
│     ├─ 项目级（正常）
│     └─ 本地级（高亮）
│
└─ Sub Agents 展示
   ├─ 数据来源
   │  ├─ User: ~/.claude/agents/*.md
   │  └─ Project: .claude/agents/*.md
   ├─ 展示信息
   │  ├─ Agent 名称
   │  ├─ 来源标注
   │  ├─ 描述
   │  ├─ 模型配置
   │  └─ 权限模式
   └─ 视觉区分
      ├─ 继承的（灰色）
      └─ 项目级（正常）
```

**关键洞察：**
- 三层继承链可视化：User → Project → Local
- 配置来源追溯：每个配置都标注来源
- 继承状态区分：视觉上区分继承 vs 覆盖

### **模块关系流程：**

```
项目发现 → 作用域展示 → 配置可视化
   ↓           ↓            ↓
projects    Tab切换     读取配置文件
 列表      改变作用域   展示MCP+Agents
```

### **识别的核心模式：**

1. **三层继承模式：** User (基础) → Project (覆盖) → Local (最终覆盖)
2. **来源追溯模式：** 用户始终能看到"这个配置从哪来？"
3. **视角切换模式：** 切换 Tab = 切换到不同项目的视角

### **架构验证：**

✅ 三个模块职责清晰，边界明确
✅ 模块间依赖关系简单（单向流动）
✅ 完整覆盖 MVP 需求（只读展示 MCP + Agents）
✅ 可扩展性好（未来可添加配置操作功能）

**Ideas Organized:** 3 个主要功能模块，9 个子功能点

**Pattern Insights:** 3 个核心设计模式识别

---

## Phase 3: Idea Development - SCAMPER Method (完成)

**Technique Focus:** 通过7个系统化视角深化和完善核心模块

**Interactive Exploration Summary:**

使用 SCAMPER 方法对三个核心模块进行了多角度审视，发现了多个增强机会和优化方向。

### **S - Substitute（替代）优化**

**Tab 标签显示方案：**
- 方案A：只显示项目名 `[project-a]`
- 方案B：显示相对路径 `[~/project-a]`
- 方案C：项目名 + tooltip 完整路径
- 方案D：用户自定义别名

**视觉区分"继承"方式：**
- 当前：灰色显示
- 替代选项：图标标识（🔗）、虚线边框、背景色、文字前缀

### **C - Combine（组合）创新**

**组合1：统一能力面板**
```
🎯 当前项目可用能力 (7个)
  🔌 MCP 服务器 (3)
  🤖 Sub Agents (4)
```
将 MCP 和 Agents 视为统一的"扩展能力"类别

**组合2：来源标注 + 配置预览**
点击来源标签 → 弹出该层级完整配置

### **A - Adapt（调整）借鉴**

**借鉴 VS Code Settings UI：**
- 覆盖指示器（蓝色小点）
- 搜索栏快速查找
- "仅显示已修改"过滤器

**借鉴 Git Diff 视图：**
- 比较模式：并排显示 User vs Project
- 高亮差异部分

### **M - Modify（修改）增强**

**增强1：项目列表**
```
📁 项目列表
  🟢 project-a
     /Users/sunven/project-a
     最后使用: 2小时前
     MCP: 3个 | Agents: 2个

  🔴 project-b (路径不存在)
```
添加：状态指示、使用时间、配置统计、快速预览

**增强2：配置详情**
```
🔌 notion
   来源: User
   类型: http
   [展开完整配置]
   💡 提示: NOTION_API_KEY 未设置
```
添加：配置验证、环境变量检查、错误提示

### **P - Put to other uses（其他用途）**

**用途1：配置诊断工具**
- 诊断问题："为什么这个 MCP 不工作？"
- 环境变量检查
- 配置冲突检测

**用途2：配置学习工具**
- 示例配置库
- 配置模板展示
- 文档链接

**用途3：团队配置审计**
- 配置差异报告
- 最佳实践检查
- 配置同步建议

### **E - Eliminate（消除）简化**

**消除1：认知负担**
- 简单模式：只显示实际生效配置
- 高级模式：显示完整继承链
- 一键切换

**消除2：信息过载**
- 默认显示核心信息
- 按需展开详细配置
- 避免一次性展示所有字段

### **R - Reverse（反转）视角**

**反转1：配置索引视图**
```
🔌 notion MCP
   使用项目:
   • project-a (Project 层级)
   • project-b (User 继承)
   • project-c (Local 覆盖)
```
从配置反查项目：回答"改这个配置会影响哪些项目？"

**反转2：问题驱动查询**
- 输入："为什么 project-a 没有 github MCP？"
- 工具分析并给出答案

### **优先级分类：**

**🔥 MVP 高优先级：**
1. Tab 标签优化 - 显示项目名而非完整路径
2. 统一能力面板 - MCP + Agents 一起展示
3. 简单/高级模式切换 - 降低认知负担

**⚡ 中优先级（MVP 可选）：**
4. 项目状态指示 - 路径存在性检查
5. 配置详情展开 - 按需显示
6. 视觉区分优化 - 图标 + 颜色

**💡 低优先级（未来迭代）：**
7. 配置诊断 - 环境变量检查
8. 配置索引视图 - 反向查询
9. 比较模式 - 并排对比
10. 学习工具 - 示例和文档
11. 团队审计 - 配置治理

**Enhancement Ideas Generated:** 11 个增强点

**Design Refinements:** 6 个核心设计优化方向

---

## Phase 4: Action Planning - Decision Tree Mapping (完成)

**Technique Focus:** 将想法转化为具体实施计划，建立决策路径和里程碑

**Interactive Exploration Summary:**

使用决策树映射技术，将前三个阶段的创意转化为可执行的实施计划，包括技术选型、架构设计、开发路线图和风险管理。

### **决策树 1：技术栈选择**

**前端框架决策：**
```
选项评估：
├─ Electron (桌面应用)
│  ✅ 原生体验
│  ✅ 完整文件系统访问
│  ❌ 打包体积大
│
├─ Web (浏览器应用)
│  ✅ 轻量级
│  ❌ 文件访问受限
│
└─ CLI + TUI (终端界面)
   ✅ 轻量级
   ❌ 交互能力有限
```

**推荐决策：Electron + React + TypeScript**
- 完整的文件系统访问能力
- 成熟的生态系统
- 类型安全保障

**UI 框架：** React + TypeScript + Tailwind CSS
**状态管理：** Zustand（轻量级）
**文件监听：** chokidar（实时更新配置）

### **决策树 2：数据层架构**

**配置读取策略：**
- ✅ 缓存 + 文件监听（chokidar）
- 平衡性能和实时性
- 自动检测配置文件变化

**数据模型：**
```typescript
interface Project {
  path: string
  mcpServers: McpServer[]
  agents: Agent[]
  metadata: ProjectMetadata
}

interface McpServer {
  name: string
  source: 'user' | 'project' | 'local'
  type: 'http' | 'stdio' | 'sse'
  config: Record<string, any>
  isInherited: boolean
}

interface Agent {
  name: string
  source: 'user' | 'project'
  description: string
  model?: string
  permissionMode?: string
  isInherited: boolean
}

interface ProjectMetadata {
  lastUsed: string
  sessionId: string
  pathExists: boolean
}
```

### **决策树 3：MVP 功能范围与里程碑**

**Sprint 1: 基础架构 (Week 1)**
```
任务：
├─ 初始化 Electron + React 项目
├─ 配置 TypeScript + Tailwind
├─ 实现配置文件读取逻辑
└─ 定义核心类型接口

交付物：
└─ 可以读取 ~/.claude.json 的基础应用
```

**Sprint 2: 核心 UI (Week 2-3)**
```
任务：
├─ Tab 系统组件（用户级 + 项目级）
├─ MCP 列表组件
├─ Sub Agents 列表组件
└─ 来源标注显示

交付物：
└─ 可切换项目查看配置的工作原型
```

**Sprint 3: 视觉优化 (Week 4)**
```
任务：
├─ 继承状态视觉区分
├─ 统一能力面板
├─ 项目状态指示
└─ 简单/高级模式切换

交付物：
└─ 视觉完整、UX 良好的 MVP
```

**Sprint 4: 打磨发布 (Week 5)**
```
任务：
├─ 错误处理和边界情况
├─ 性能优化
├─ 文档编写
└─ 打包和发布

交付物：
└─ 可分发的 MVP 版本
```

### **决策树 4：项目结构**

```
cc-config-viewer/
├─ src/
│  ├─ main/                    # Electron 主进程
│  │  ├─ index.ts
│  │  ├─ fileWatcher.ts        # 配置文件监听
│  │  └─ configReader.ts       # 配置读取逻辑
│  │
│  ├─ renderer/                # React 前端
│  │  ├─ components/
│  │  │  ├─ ProjectTabs.tsx    # Tab 系统
│  │  │  ├─ McpList.tsx        # MCP 列表
│  │  │  ├─ AgentList.tsx      # Agent 列表
│  │  │  ├─ ConfigPanel.tsx    # 统一能力面板
│  │  │  └─ ConfigDetail.tsx   # 配置详情
│  │  │
│  │  ├─ hooks/
│  │  │  ├─ useProjects.ts     # 项目数据钩子
│  │  │  ├─ useConfig.ts       # 配置数据钩子
│  │  │  └─ useViewMode.ts     # 简单/高级模式
│  │  │
│  │  ├─ store/
│  │  │  └─ configStore.ts     # Zustand 状态
│  │  │
│  │  ├─ types/
│  │  │  └─ config.ts          # TypeScript 类型
│  │  │
│  │  └─ App.tsx
│  │
│  └─ shared/                  # 共享代码
│     ├─ configParser.ts       # 配置解析
│     ├─ configMerger.ts       # 继承合并逻辑
│     └─ types.ts
│
├─ package.json
├─ tsconfig.json
├─ tailwind.config.js
└─ README.md
```

### **风险管理与缓解策略**

**风险 1：配置文件格式变化**
- **影响：** Claude Code 更新可能改变配置结构
- **概率：** 中
- **缓解：**
  - 实现版本检测机制
  - 向后兼容性设计
  - 清晰的错误提示

**风险 2：跨平台兼容性**
- **影响：** macOS/Linux/Windows 路径差异
- **概率：** 高
- **缓解：**
  - 使用 Node.js path 模块
  - 针对性测试
  - 优先支持 macOS

**风险 3：性能问题**
- **影响：** 大量项目时性能下降
- **概率：** 中
- **缓解：**
  - 虚拟滚动列表
  - 懒加载项目配置
  - 配置缓存机制

**风险 4：文件监听失效**
- **影响：** 配置变化未及时更新
- **概率：** 低
- **缓解：**
  - 手动刷新按钮
  - 定期轮询作为备用
  - 监听错误日志

### **成功指标（MVP）**

**功能指标：**
- ✅ 展示所有项目的 MCP 和 Agents
- ✅ 清晰标注配置来源（User/Project/Local）
- ✅ 准确显示继承关系
- ✅ Tab 切换流畅无卡顿

**性能指标：**
- ✅ 应用启动时间 < 3秒
- ✅ Tab 切换响应 < 100ms
- ✅ 配置文件变化检测 < 500ms

**质量指标：**
- ✅ 零崩溃（基本用例）
- ✅ 错误处理完善
- ✅ 边界情况覆盖

**用户体验指标：**
- ✅ 继承关系一目了然
- ✅ 无需文档即可理解界面
- ✅ 配置来源清晰可追溯

### **立即可执行的下一步**

**Step 1: 项目初始化**
```bash
npm create electron-vite@latest cc-config-viewer
cd cc-config-viewer
npm install
npm install zustand chokidar
npm install -D tailwindcss
```

**Step 2: 核心类型定义**
```typescript
// src/shared/types.ts
export interface ClaudeConfig {
  projects: Record<string, ProjectConfig>
}

export interface ProjectConfig {
  mcpServers: Record<string, any>
  enabledMcpjsonServers: string[]
  disabledMcpjsonServers: string[]
}

export interface Project {
  path: string
  name: string
  mcpServers: McpServer[]
  agents: Agent[]
  metadata: ProjectMetadata
}
```

**Step 3: 配置读取器实现**
```typescript
// src/main/configReader.ts
import fs from 'fs'
import path from 'path'
import os from 'os'

export async function readClaudeConfig(): Promise<ClaudeConfig> {
  const configPath = path.join(os.homedir(), '.claude.json')
  const content = await fs.promises.readFile(configPath, 'utf-8')
  return JSON.parse(content)
}

export async function readProjectMcpConfig(projectPath: string) {
  const mcpPath = path.join(projectPath, '.mcp.json')
  // ...
}

export async function readProjectAgents(projectPath: string) {
  const agentsDir = path.join(projectPath, '.claude', 'agents')
  // ...
}
```

**Step 4: 文件监听器**
```typescript
// src/main/fileWatcher.ts
import chokidar from 'chokidar'

export function watchConfigFiles(callback: () => void) {
  const homedir = os.homedir()
  const watcher = chokidar.watch([
    path.join(homedir, '.claude.json'),
    path.join(homedir, '.claude', 'settings.json'),
    path.join(homedir, '.claude', 'agents')
  ])

  watcher.on('change', callback)
  return watcher
}
```

### **实施路线图总览**

```
Week 1: 基础架构
  └─ 项目搭建 + 配置读取 + 类型定义

Week 2-3: 核心功能
  └─ Tab 系统 + 列表组件 + 数据流

Week 4: 视觉优化
  └─ 继承可视化 + 状态指示 + 模式切换

Week 5: 打磨发布
  └─ 错误处理 + 性能优化 + 文档 + 打包

未来迭代：
  └─ 配置操作 + 诊断工具 + 高级功能
```

### **技术债务管理**

**接受的技术债务（MVP）：**
- 暂不支持配置编辑功能
- 暂不实现配置诊断
- 暂不支持配置索引视图

**必须避免的技术债务：**
- 类型定义必须完整
- 错误处理必须健全
- 架构必须可扩展

**Implementation Decisions Made:** 5 个关键技术决策

**Risk Mitigation Strategies:** 4 个风险缓解方案

**Actionable Next Steps:** 4 个立即可执行的步骤

---

## 头脑风暴会话总结

### **会话统计**

- **总时长：** ~90 分钟
- **阶段完成：** 4/4 阶段全部完成
- **想法生成：** 30+ 个创意和洞察
- **设计决策：** 15+ 个关键决策点
- **可执行步骤：** 4 个立即可开始的行动

### **核心成果**

**1. 清晰的问题定义**
- 用户对 Claude Code 配置系统的困惑
- 配置作用域不清晰（用户级 vs 项目级 vs 本地级）
- 继承关系不可见
- 运行时上下文盲区

**2. 创新的解决方案**
- **Tab = 作用域** 的空间隐喻设计
- 三层继承链可视化
- 统一能力面板（MCP + Agents）
- 简单/高级模式切换

**3. 完整的技术架构**
- Electron + React + TypeScript 技术栈
- 清晰的数据模型和类型定义
- 文件监听 + 缓存的数据策略
- 模块化的项目结构

**4. 可执行的实施计划**
- 5周的开发路线图
- 4个 Sprint 里程碑
- 风险识别和缓解策略
- 明确的成功指标

### **关键洞察**

**技术洞察：**
- Claude Code 配置实际有 3 层继承（User/Project/Local）
- `~/.claude.json` 的 `projects` 对象是项目发现的关键
- MCP 和 Sub Agents 有不同的优先级规则
- 配置文件分散在多个位置需要统一读取

**设计洞察：**
- 空间隐喻比抽象概念更直观
- 信息分层展示降低认知负担
- 来源追溯是理解配置的关键
- 只读工具也能提供巨大价值

**产品洞察：**
- MVP 聚焦可视化而非配置操作
- 配置诊断和学习功能是未来方向
- 开发者工具的配置管理是普遍痛点
- 可扩展性比功能完整性更重要

### **下一步行动**

**立即执行（本周）：**
1. ✅ 创建 GitHub 仓库
2. ✅ 初始化 Electron + React 项目
3. ✅ 定义 TypeScript 类型接口
4. ✅ 实现基础配置读取逻辑

**短期目标（2-3周）：**
- 完成核心 UI 组件
- 实现 Tab 系统
- 展示 MCP 和 Agents 列表

**中期目标（4-5周）：**
- 视觉优化和交互细化
- 错误处理和性能优化
- MVP 版本发布

**长期愿景：**
- 配置编辑功能
- 配置诊断工具
- 团队配置治理
- Claude Code 配置生态的标准工具

### **文档输出**

本次头脑风暴会话产生了完整的项目文档：

✅ **问题分析** - 用户痛点和需求识别
✅ **解决方案设计** - 三大核心模块架构
✅ **功能增强** - 11 个优化方向
✅ **技术方案** - 完整的技术栈和架构
✅ **实施计划** - 5周开发路线图
✅ **风险管理** - 4个风险和缓解策略
✅ **成功指标** - 明确的验收标准

---

## 🎉 会话结束

**感谢你的参与，Sunven！**

通过这次系统化的头脑风暴，我们从一个模糊的想法发展成了一个**完整的、可执行的项目计划**。

**你的贡献：**
- 清晰的问题定义
- 快速的设计决策
- 对用户需求的深刻理解
- 实用主义的 MVP 范围控制

**这个工具的价值：**
- 解决 Claude Code 用户的真实痛点
- 填补配置管理工具的空白
- 为社区提供开源参考
- 潜在的商业化机会（企业版功能）

**准备好开始编码了吗？** 🚀

所有的规划都已就绪，现在是把想法变成现实的时候了！

---

*本文档由 BMAD Business Analyst Agent (Mary) 引导生成*
*日期：2025-12-05*
*方法：Progressive Technique Flow (What If Scenarios → Mind Mapping → SCAMPER → Decision Tree)*

