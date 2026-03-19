import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";

function getRendererUrl() {
  // Dev: use running Next dev server (fixed port 13200)
  if (!app.isPackaged)
    return process.env.ELECTRON_RENDERER_URL ?? "http://localhost:13200";

  // Prod: placeholder (later you can switch to loadFile for static export)
  return process.env.ELECTRON_RENDERER_URL ?? "http://localhost:13200";
}

async function createMainWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs")
    }
  });

  win.once("ready-to-show", () => win.show());

  const url = getRendererUrl();
  try {
    await win.loadURL(url);
  } catch (error) {
    if (!app.isPackaged) {
      const message =
        "无法连接到渲染端（Next dev server）。\n\n" +
        "请先在项目根目录运行：npm run dev\n" +
        "或单独运行：npm run dev:web\n\n" +
        `当前尝试访问：${url}`;

      await win.loadURL(
        `data:text/html,${encodeURIComponent(
          `<html><head><meta charset="utf-8"/></head><body style="font-family: system-ui; padding: 24px;"><h2>Renderer 未启动</h2><pre>${message}</pre></body></html>`
        )}`
      );
      return;
    }
    throw error;
  }

  if (!app.isPackaged) {
    win.webContents.openDevTools({ mode: "detach" });
  }
}

ipcMain.handle("app:ping", async () => {
  return { ok: true, ts: Date.now() };
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.whenReady().then(async () => {
  await createMainWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) await createMainWindow();
  });
});

