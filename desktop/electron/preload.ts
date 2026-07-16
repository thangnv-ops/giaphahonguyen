/**
 * @project AncestorTree Desktop
 * @file desktop/electron/preload.ts
 * @description Minimal context bridge for Electron renderer
 * @version 1.0.0
 * @updated 2026-02-26
 */

import { contextBridge } from 'electron';

// Expose minimal desktop-specific APIs to the renderer
contextBridge.exposeInMainWorld('ancestorTree', {
  isDesktop: true,
  platform: process.platform,
});
