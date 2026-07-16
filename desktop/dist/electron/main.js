"use strict";
/**
 * @project AncestorTree Desktop
 * @file desktop/electron/main.ts
 * @description Electron main process — app lifecycle, window management, server start
 * @version 1.1.0
 * @updated 2026-02-26
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const electron_updater_1 = require("electron-updater");
const server_1 = require("./server");
const isDev = !electron_1.app.isPackaged;
console.log('[AncestorTree] Main process starting...');
console.log('[AncestorTree] isDev:', isDev);
console.log('[AncestorTree] __dirname:', __dirname);
let mainWindow = null;
function createWindow() {
    console.log('[AncestorTree] Creating window...');
    mainWindow = new electron_1.BrowserWindow({
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
            electron_1.shell.openExternal(url);
        }
        return { action: 'deny' };
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
async function loadApp() {
    if (!mainWindow)
        return;
    const serverUrl = (0, server_1.getServerUrl)();
    if (serverUrl) {
        await mainWindow.loadURL(serverUrl);
    }
    else {
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
electron_1.app.whenReady().then(async () => {
    createWindow();
    await loadApp();
    // Migrations are auto-applied inside getDatabase() (sqlite-db.ts) on first request
    // Start Next.js server
    try {
        const url = await (0, server_1.startServer)(isDev);
        console.log(`[AncestorTree] Server ready at ${url}`);
        if (mainWindow) {
            await mainWindow.loadURL(url);
        }
    }
    catch (err) {
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
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
            void loadApp();
        }
    });
    // Check for updates (only in production, skip in dev)
    if (electron_1.app.isPackaged) {
        setupAutoUpdater();
    }
});
// Quit when all windows are closed (except macOS)
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// Graceful shutdown
electron_1.app.on('before-quit', async () => {
    await (0, server_1.stopServer)();
});
// ─── Auto-updater ────────────────────────────────────────────────────────────
function setupAutoUpdater() {
    electron_updater_1.autoUpdater.autoDownload = false; // ask user before downloading
    electron_updater_1.autoUpdater.on('update-available', (info) => {
        electron_1.dialog.showMessageBox({
            type: 'info',
            title: 'Có phiên bản mới',
            message: `Phiên bản ${info.version} đã có sẵn. Tải xuống ngay?`,
            buttons: ['Tải xuống', 'Để sau'],
            defaultId: 0,
        }).then(({ response }) => {
            if (response === 0)
                electron_updater_1.autoUpdater.downloadUpdate();
        });
    });
    electron_updater_1.autoUpdater.on('update-downloaded', () => {
        electron_1.dialog.showMessageBox({
            type: 'info',
            title: 'Cập nhật sẵn sàng',
            message: 'Cập nhật đã tải xong. Khởi động lại để áp dụng?',
            buttons: ['Khởi động lại', 'Để sau'],
            defaultId: 0,
        }).then(({ response }) => {
            if (response === 0)
                electron_updater_1.autoUpdater.quitAndInstall();
        });
    });
    electron_updater_1.autoUpdater.on('error', (err) => {
        console.error('[AutoUpdater] Error:', err.message);
    });
    // Check once 10s after launch
    setTimeout(() => electron_updater_1.autoUpdater.checkForUpdates(), 10_000);
}
//# sourceMappingURL=main.js.map