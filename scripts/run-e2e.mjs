import { spawn } from 'node:child_process';
import process from 'node:process';
import waitOn from 'wait-on';

async function isHttpUp(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 800);
  try {
    // Any HTTP response (even 404) means something is listening.
    await fetch(url, { method: 'HEAD', signal: controller.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function killTree(pid) {
  if (!pid) return;
  if (process.platform === 'win32') {
    spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }
  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    // ignore
  }
}

const startBackend = !(await isHttpUp('http://localhost:3000'));
const startFrontend = !(await isHttpUp('http://localhost:4200'));

const backend = startBackend
  ? spawn(process.execPath, ['server.js'], {
      stdio: 'inherit',
      env: process.env,
    })
  : null;

const frontend = startFrontend
  ? process.platform === 'win32'
    ? spawn('cmd.exe', ['/d', '/s', '/c', 'npm run start -- --port 4200'], {
        stdio: 'inherit',
        env: process.env,
      })
    : spawn('npm', ['run', 'start', '--', '--port', '4200'], {
        stdio: 'inherit',
        env: process.env,
      })
  : null;

const shutdown = () => {
  if (frontend?.pid) killTree(frontend.pid);
  if (backend?.pid) killTree(backend.pid);
};

process.on('SIGINT', () => {
  shutdown();
  process.exit(130);
});

process.on('SIGTERM', () => {
  shutdown();
  process.exit(143);
});

frontend?.on('exit', (code) => {
  shutdown();
  process.exit(code ?? 1);
});

backend?.on('exit', (code) => {
  shutdown();
  process.exit(code ?? 1);
});

await waitOn({
  resources: ['http://localhost:3000', 'http://localhost:4200'],
  timeout: 120_000,
  validateStatus: (status) => status >= 200 && status < 500,
});

const playwright =
  process.platform === 'win32'
    ? spawn('cmd.exe', ['/d', '/s', '/c', 'npx playwright test'], {
        stdio: 'inherit',
        env: process.env,
      })
    : spawn('npx', ['playwright', 'test'], {
        stdio: 'inherit',
        env: process.env,
      });

playwright.on('exit', (code) => {
  shutdown();
  process.exit(code ?? 1);
});
