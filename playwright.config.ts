import { defineConfig } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

function getWindowsChromiumExecutablePath(): string | undefined {
  if (process.platform !== 'win32') return undefined;

  const localAppData =
    process.env.LOCALAPPDATA ||
    (process.env.USERPROFILE
      ? path.join(process.env.USERPROFILE, 'AppData', 'Local')
      : undefined);
  if (!localAppData) return undefined;

  const browsersRoot = path.join(localAppData, 'ms-playwright');
  if (!fs.existsSync(browsersRoot)) return undefined;

  const chromiumDirs = fs
    .readdirSync(browsersRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^chromium-\d+$/.test(d.name))
    .map((d) => d.name)
    .sort((a, b) => {
      const an = Number(a.split('-')[1]);
      const bn = Number(b.split('-')[1]);
      return bn - an;
    });

  for (const dirName of chromiumDirs) {
    const exe = path.join(browsersRoot, dirName, 'chrome-win64', 'chrome.exe');
    if (fs.existsSync(exe)) return exe;
  }

  return undefined;
}

const windowsChromiumExe = getWindowsChromiumExecutablePath();

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: 'http://localhost:4200',
    headless: true,
    viewport: { width: 1280, height: 720 },
    launchOptions: windowsChromiumExe ? { executablePath: windowsChromiumExe } : undefined,
  },
});
