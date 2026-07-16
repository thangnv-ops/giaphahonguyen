"use strict";
/**
 * @project AncestorTree Desktop
 * @file desktop/electron/server.ts
 * @description Start/stop Next.js standalone server for desktop mode
 * @version 1.0.0
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
exports.startServer = startServer;
exports.stopServer = stopServer;
exports.getServerUrl = getServerUrl;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const net = __importStar(require("net"));
const os = __importStar(require("os"));
let serverProcess = null;
let serverUrl = null;
/** Find a free port on localhost */
async function findFreePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(0, '127.0.0.1', () => {
            const address = server.address();
            if (address && typeof address !== 'string') {
                const port = address.port;
                server.close(() => resolve(port));
            }
            else {
                reject(new Error('Could not find free port'));
            }
        });
        server.on('error', reject);
    });
}
/** Wait for server to respond */
async function waitForReady(url, timeoutMs = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const response = await fetch(url);
            if (response.ok || response.status === 302) {
                return; // Server is ready (302 = redirect to login, which is fine)
            }
        }
        catch {
            // Server not ready yet
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error(`Server did not become ready within ${timeoutMs}ms`);
}
/** Get data directory path */
function getDataDir() {
    return path.join(os.homedir(), 'AncestorTree');
}
/** Start Next.js standalone server */
async function startServer(isDev) {
    const port = await findFreePort();
    const host = '127.0.0.1';
    // Path to Next.js standalone server
    // In development: ../frontend/.next/standalone/server.js
    // In production (packaged): resources/standalone/server.js
    const standaloneDir = isDev
        ? path.join(__dirname, '..', '..', '..', 'frontend', '.next', 'standalone')
        : path.join(process.resourcesPath || '', 'standalone');
    const serverScript = path.join(standaloneDir, 'server.js');
    // Dev workflow: standalone build doesn't include public/ or .next/static/
    // Copy them so the standalone server can serve assets correctly.
    // Production builds have these via electron-builder extraResources.
    if (isDev) {
        const frontendDir = path.join(__dirname, '..', '..', '..', 'frontend');
        const staticSrc = path.join(frontendDir, '.next', 'static');
        const staticDst = path.join(standaloneDir, '.next', 'static');
        // Always sync static files (overwrite) — standalone build doesn't include them
        if (fs.existsSync(staticSrc)) {
            fs.cpSync(staticSrc, staticDst, { recursive: true });
        }
        const publicSrc = path.join(frontendDir, 'public');
        const publicDst = path.join(standaloneDir, 'public');
        if (fs.existsSync(publicSrc)) {
            fs.cpSync(publicSrc, publicDst, { recursive: true });
        }
    }
    const dataDir = getDataDir();
    // CTO B-2: Resolve migrations dir based on environment
    const migrationsDir = isDev
        ? path.join(__dirname, '..', '..', 'migrations')
        : path.join(process.resourcesPath || '', 'migrations');
    console.log(`[Server] standaloneDir: ${standaloneDir}`);
    console.log(`[Server] serverScript: ${serverScript}`);
    console.log(`[Server] exists: ${fs.existsSync(serverScript)}`);
    console.log(`[Server] migrationsDir: ${migrationsDir}`);
    console.log(`[Server] port: ${port}`);
    if (!fs.existsSync(serverScript)) {
        throw new Error(`server.js not found at ${serverScript}. Run "pnpm build:next" first.`);
    }
    serverProcess = (0, child_process_1.fork)(serverScript, [], {
        env: {
            ...process.env,
            PORT: String(port),
            HOSTNAME: host,
            NEXT_PUBLIC_DESKTOP_MODE: 'true',
            DESKTOP_MODE: 'true',
            DESKTOP_DATA_DIR: dataDir,
            MIGRATIONS_DIR: migrationsDir,
            NODE_ENV: 'production',
        },
        cwd: standaloneDir,
        stdio: 'pipe',
    });
    serverProcess.stdout?.on('data', (data) => {
        console.log(`[Next.js] ${data.toString().trim()}`);
    });
    serverProcess.stderr?.on('data', (data) => {
        console.error(`[Next.js] ${data.toString().trim()}`);
    });
    serverProcess.on('exit', (code) => {
        console.log(`[Next.js] Server exited with code ${code}`);
        serverProcess = null;
    });
    serverUrl = `http://${host}:${port}`;
    await waitForReady(serverUrl);
    return serverUrl;
}
/** Stop the server */
async function stopServer() {
    if (serverProcess) {
        serverProcess.kill('SIGTERM');
        // Wait up to 5 seconds for graceful shutdown
        await new Promise((resolve) => {
            const timeout = setTimeout(() => {
                if (serverProcess) {
                    serverProcess.kill('SIGKILL');
                }
                resolve();
            }, 5000);
            serverProcess?.on('exit', () => {
                clearTimeout(timeout);
                resolve();
            });
        });
        serverProcess = null;
        serverUrl = null;
    }
}
/** Get current server URL (null if not started) */
function getServerUrl() {
    return serverUrl;
}
//# sourceMappingURL=server.js.map