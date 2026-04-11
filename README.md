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

## Docker 构建提速

先构建依赖基础镜像。只有 `package.json`、`package-lock.json`、`.npmrc` 或 `apps/renderer/package.json` 变化时，才需要重建：

```bash
DOCKER_BUILDKIT=1 docker build -f dockerfile-base -t auto-publish-front:deps .
```

再构建业务镜像。主 `Dockerfile` 的依赖层与 `dockerfile-base` 保持一致，BuildKit 会直接复用已经下载好的依赖缓存：

```bash
DOCKER_BUILDKIT=1 docker build -t auto-publish-front:latest .
```

额外优化：

- `npm ci` 使用了 `/root/.npm` cache mount，重复构建时会减少依赖重复下载。
- `next build` 使用了 `.next/cache` cache mount，连续构建时会减少 Next.js 的重复计算。
- `.dockerignore` 排除了不参与镜像构建的目录和文件，减少 build context 传输时间。
