# media-auto-publish

## 目录结构

- `apps/renderer`: Next.js 15.5.13 + shadcn/ui（Web + Electron 共用 UI）
- `apps/desktop`: Electron 主进程（加载 renderer）
- `.cursor/rules`: 本项目的 AI 开发规则

## 开发

一键启动（Web + Desktop）：

```bash
npm install
npm run dev
```

仅 Web（SEO 优先）：

```bash
npm install
npm run dev:web
```

仅 Desktop（Electron）：

```bash
npm run dev:desktop
```

