/**
 * @project AncestorTree Desktop
 * @file desktop/electron/main.ts
 * @description Electron main process — app lifecycle, window management, server start
 * @version 1.1.0
 * @updated 2026-02-26
 */

import { app, BrowserWindow, shell, dialog } from 'electron';
import * as path from 'path';
import { autoUpdater } from 'electron-updater';
import { startServer, stopServer, getServerUrl } from './server';

const isDev = !app.isPackaged;
console.log('[AncestorTree] Main process starting...');
console.log('[AncestorTree] isDev:', isDev);
console.log('[AncestorTree] __dirname:', __dirname);

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  console.log('[AncestorTree] Creating window...');
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: true,
    title: 'Gia Phả Điện Tử',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    // macOS: show traffic lights in titlebar
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 16, y: 16 },
  });
  console.log('[AncestorTree] Window created');

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function loadApp(): Promise<void> {
  if (!mainWindow) return;

  const serverUrl = getServerUrl();
  if (serverUrl) {
    await mainWindow.loadURL(serverUrl);
  } else {
    // Show loading screen while server starts
    mainWindow.loadURL(`data:text/html,
      <html>
        <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:system-ui;background:#0a0a0a;color:#fafafa">
          <div style="text-align:center">
            <h1>Gia Phả Điện Tử</h1>
            <p>Đang khởi động...</p>
          </div>
        </body>
      </html>
    `);
  }
}

app.whenReady().then(async () => {
  createWindow();
  await loadApp();

  // Migrations are auto-applied inside getDatabase() (sqlite-db.ts) on first request

  // Start Next.js server
  try {
    const url = await startServer(isDev);
    console.log(`[AncestorTree] Server ready at ${url}`);
    if (mainWindow) {
      await mainWindow.loadURL(url);
    }
  } catch (err) {
    console.error('[AncestorTree] Failed to start server:', err);
    if (mainWindow) {
      mainWindow.loadURL(`data:text/html,
        <html>
          <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:system-ui;background:#0a0a0a;color:#fafafa">
            <div style="text-align:center">
              <h1>Lỗi khởi động</h1>
              <p>Không thể khởi động server. Vui lòng thử lại.</p>
              <pre style="color:#ef4444;font-size:12px;max-width:600px;overflow:auto">${err}</pre>
            </div>
          </body>
        </html>
      `);
    }
  }

  // macOS: re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      void loadApp();
    }
  });

  // Check for updates (only in production, skip in dev)
  if (app.isPackaged) {
    setupAutoUpdater();
  }
});

// Quit when all windows are closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Graceful shutdown
app.on('before-quit', async () => {
  await stopServer();
});

// ─── Auto-updater ────────────────────────────────────────────────────────────

function setupAutoUpdater(): void {
  autoUpdater.autoDownload = false; // ask user before downloading

  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Có phiên bản mới',
      message: `Phiên bản ${info.version} đã có sẵn. Tải xuống ngay?`,
      buttons: ['Tải xuống', 'Để sau'],
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) autoUpdater.downloadUpdate();
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Cập nhật sẵn sàng',
      message: 'Cập nhật đã tải xong. Khởi động lại để áp dụng?',
      buttons: ['Khởi động lại', 'Để sau'],
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.on('error', (err) => {
    console.error('[AutoUpdater] Error:', err.message);
  });

  // Check once 10s after launch
  setTimeout(() => autoUpdater.checkForUpdates(), 10_000);
}
