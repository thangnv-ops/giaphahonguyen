/**
 * @project AncestorTree Desktop
 * @file desktop/electron/server.ts
 * @description Start/stop Next.js standalone server for desktop mode
 * @version 1.0.0
 * @updated 2026-02-26
 */

import { ChildProcess, fork } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as net from 'net';
import * as os from 'os';

let serverProcess: ChildProcess | null = null;
let serverUrl: string | null = null;

/** Find a free port on localhost */
async function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address && typeof address !== 'string') {
        const port = address.port;
        server.close(() => resolve(port));
      } else {
        reject(new Error('Could not find free port'));
      }
    });
    server.on('error', reject);
  });
}

/** Wait for server to respond */
async function waitForReady(url: string, timeoutMs = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 302) {
        return; // Server is ready (302 = redirect to login, which is fine)
      }
    } catch {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Server did not become ready within ${timeoutMs}ms`);
}

/** Get data directory path */
function getDataDir(): string {
  return path.join(os.homedir(), 'AncestorTree');
}

/** Start Next.js standalone server */
export async function startServer(isDev: boolean): Promise<string> {
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

  serverProcess = fork(serverScript, [], {
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

  serverProcess.stdout?.on('data', (data: Buffer) => {
    console.log(`[Next.js] ${data.toString().trim()}`);
  });

  serverProcess.stderr?.on('data', (data: Buffer) => {
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
export async function stopServer(): Promise<void> {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    // Wait up to 5 seconds for graceful shutdown
    await new Promise<void>((resolve) => {
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
export function getServerUrl(): string | null {
  return serverUrl;
}
