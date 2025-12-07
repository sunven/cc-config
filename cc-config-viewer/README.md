# CC-Config Viewer

Claude Code 配置可视化工具 - 一个用于查看和管理 Claude Code 配置的桌面应用程序。

## 项目概述

CC-Config Viewer 是一个基于 Tauri + React + TypeScript 构建的桌面应用，帮助开发者：

- **查看配置作用域**：区分用户级和项目级配置
- **识别配置来源**：颜色编码显示配置继承关系
- **管理 MCP 服务器**：查看已配置的 MCP 服务器列表
- **管理 Sub Agents**：查看和理解 Agent 权限设置
- **跨项目对比**：比较不同项目的配置差异

## 系统要求

### 必需软件

- **Node.js 18+** (推荐 LTS 版本)
- **npm 8+** 或 pnpm
- **Rust 工具链** (通过 [rustup](https://rustup.rs/) 安装)

### 平台特定依赖

#### Windows
- Visual Studio Build Tools 2019 或更高版本
- C++ 桌面开发工作负载

#### macOS
- Xcode Command Line Tools
  ```bash
  xcode-select --install
  ```

#### Linux (Debian/Ubuntu)
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libxdo-dev \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/sunven/cc-config.git
cd cc-config/cc-config-viewer
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run tauri dev
```

首次运行会编译 Rust 后端，可能需要几分钟时间。

### 4. 构建生产版本

```bash
npm run tauri build
```

构建产物位于 `src-tauri/target/release/bundle/`。

## 开发命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 仅启动前端开发服务器 (Vite) |
| `npm run tauri dev` | 启动完整的 Tauri 开发环境 |
| `npm run tauri build` | 构建生产版本 |
| `npm run build` | 构建前端资源 |
| `npm test` | 运行前端测试 |
| `npm run test:coverage` | 运行测试并生成覆盖率报告 |

### Rust 后端测试

```bash
cd src-tauri
cargo test
```

## 项目结构

```
cc-config-viewer/
├── README.md                 # 项目文档（本文件）
├── DEVELOPMENT.md            # 开发者指南
├── ARCHITECTURE.md           # 架构快速参考
├── package.json              # 前端依赖配置
├── tsconfig.json             # TypeScript 配置
├── vite.config.ts            # Vite 构建配置
├── vitest.config.ts          # Vitest 测试配置
├── tailwind.config.js        # Tailwind CSS 配置
│
├── src/                      # React 前端源码
│   ├── main.tsx              # 应用入口
│   ├── App.tsx               # 根组件
│   ├── components/           # UI 组件
│   │   ├── ui/               # shadcn/ui 基础组件
│   │   ├── ProjectTab.tsx    # 项目标签页
│   │   ├── ConfigList.tsx    # 配置列表
│   │   ├── McpBadge.tsx      # MCP 徽章
│   │   └── ErrorBoundary.tsx # 错误边界
│   ├── hooks/                # 自定义 Hooks
│   │   ├── useProjects.ts    # 项目管理 Hook
│   │   ├── useConfig.ts      # 配置管理 Hook
│   │   └── useFileWatcher.ts # 文件监听 Hook
│   ├── stores/               # Zustand 状态管理
│   │   ├── projectsStore.ts  # 项目状态
│   │   ├── configStore.ts    # 配置状态
│   │   └── uiStore.ts        # UI 状态
│   ├── lib/                  # 工具库
│   │   ├── tauriApi.ts       # Tauri API 封装
│   │   ├── configParser.ts   # 配置解析器
│   │   └── utils.ts          # 通用工具函数
│   └── types/                # TypeScript 类型定义
│       ├── index.ts          # 类型导出
│       ├── config.ts         # 配置类型
│       ├── mcp.ts            # MCP 类型
│       └── project.ts        # 项目类型
│
├── src-tauri/                # Rust 后端源码
│   ├── Cargo.toml            # Rust 依赖配置
│   ├── tauri.conf.json       # Tauri 配置
│   ├── capabilities/         # Tauri 权限配置
│   └── src/
│       ├── main.rs           # Rust 入口
│       ├── lib.rs            # 库入口
│       ├── commands/         # Tauri 命令
│       │   ├── mod.rs        # 命令模块
│       │   └── config.rs     # 配置命令
│       ├── config/           # 配置模块
│       │   ├── mod.rs        # 模块导出
│       │   ├── reader.rs     # 文件读取
│       │   ├── watcher.rs    # 文件监听
│       │   └── settings.rs   # 设置管理
│       └── types/            # 类型定义
│           ├── mod.rs        # 类型模块
│           └── app.rs        # 应用类型
│
├── .vscode/                  # VS Code 配置
│   ├── settings.json         # 编辑器设置
│   ├── extensions.json       # 推荐扩展
│   └── launch.json           # 调试配置
│
└── docs/                     # 详细文档
    ├── architecture.md       # 完整架构文档
    ├── prd.md                # 产品需求文档
    └── epics.md              # 功能史诗
```

## 技术栈

### 前端
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite 7** - 构建工具
- **Tailwind CSS 4** - 样式方案
- **shadcn/ui** - UI 组件库
- **Zustand 5** - 状态管理
- **Vitest** - 测试框架

### 后端
- **Rust** - 系统编程语言
- **Tauri 2** - 桌面应用框架
- **notify** - 文件监听
- **serde** - 序列化/反序列化

## 配置文件说明

CC-Config Viewer 读取以下 Claude Code 配置文件：

| 文件 | 位置 | 说明 |
|------|------|------|
| `settings.json` | `~/.claude/` | 用户级全局设置 |
| `.mcp.json` | 项目根目录 | 项目级 MCP 配置 |
| `settings.local.json` | `.claude/` | 项目级本地设置 |
| `*.md` | `.claude/agents/` | Sub Agent 定义 |

## 故障排除

### 常见问题

#### 1. Rust 编译错误

确保已安装最新的 Rust 工具链：
```bash
rustup update
```

#### 2. Node.js 版本不兼容

检查 Node.js 版本：
```bash
node --version  # 应为 v18.x 或更高
```

#### 3. Windows 上的 WebView2 问题

确保系统已安装 Microsoft Edge WebView2 Runtime。

#### 4. Linux 上的 webkit2gtk 错误

安装必要的系统依赖（见上方 Linux 依赖部分）。

#### 5. 首次启动缓慢

Rust 首次编译需要下载和编译依赖，请耐心等待。后续启动会使用缓存，速度会快很多。

### 获取帮助

- 查看 [DEVELOPMENT.md](./DEVELOPMENT.md) 了解开发规范
- 查看 [ARCHITECTURE.md](./ARCHITECTURE.md) 了解架构设计
- 查看完整的 [架构文档](../docs/architecture.md)

## 相关链接

- [Tauri 官方文档](https://v2.tauri.app/)
- [React 官方文档](https://react.dev/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [shadcn/ui 文档](https://ui.shadcn.com/)
- [Zustand 文档](https://docs.pmnd.rs/zustand/)
- [Vitest 文档](https://vitest.dev/)

## 许可证

MIT License
