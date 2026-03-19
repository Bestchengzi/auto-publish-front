import { contextBridge, ipcRenderer } from "electron";

export type DesktopApi = {
  ping: () => Promise<{ ok: true; ts: number }>;
};

const api: DesktopApi = {
  ping: () => ipcRenderer.invoke("app:ping")
};

contextBridge.exposeInMainWorld("desktop", api);

