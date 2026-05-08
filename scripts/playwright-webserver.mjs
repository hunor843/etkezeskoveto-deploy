import { spawn } from 'node:child_process';
import net from 'node:net';
import process from 'node:process';
import waitOn from 'wait-on';

function isPortListening(port) {
  return new Promise((resolve) => {
    const socket = net
      .connect({ host: '127.0.0.1', port }, () => {
        socket.end();
        resolve(true);
      })
      .on('error', () => resolve(false));

    socket.setTimeout(500, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function killTree(pid) {
  if (!pid) return;

  if (process.platform === 'win32') {
    // Best-effort: kill process tree on Windows.
    spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }

  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    // ignore
  }
}

const startBackend = !(await isPortListening(3000));
const startFrontend = !(await isPortListening(4200));

const backend = startBackend
  ? spawn(process.execPath, ['server.js'], {
      stdio: 'inherit',
      env: process.env,
    })
  : null;

const frontend = startFrontend
  ? process.platform === 'win32'
    ? spawn('cmd.exe', ['/d', '/s', '/c', 'npm run start'], {
        stdio: 'inherit',
        env: process.env,
      })
    : spawn('npm', ['run', 'start'], {
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
  process.exit(0);
});

process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
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

// Keep the process alive for Playwright; it will terminate us with SIGTERM.
// If we didn't start any child process (because servers already ran), this still holds the webServer open.
await new Promise(() => {});
