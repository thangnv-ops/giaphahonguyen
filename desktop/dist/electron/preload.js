"use strict";
/**
 * @project AncestorTree Desktop
 * @file desktop/electron/preload.ts
 * @description Minimal context bridge for Electron renderer
 * @version 1.0.0
 * @updated 2026-02-26
 */
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose minimal desktop-specific APIs to the renderer
electron_1.contextBridge.exposeInMainWorld('ancestorTree', {
    isDesktop: true,
    platform: process.platform,
});
//# sourceMappingURL=preload.js.map