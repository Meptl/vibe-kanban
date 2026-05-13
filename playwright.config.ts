import { defineConfig, devices } from '@playwright/test';
import { execSync } from 'node:child_process';

type DiscoveredPorts = {
  frontend: number;
  backend: number;
};

function discoverPorts(): DiscoveredPorts | null {
  try {
    const output = execSync('node scripts/setup-dev-environment.js get', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const lines = output
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const candidate = lines[lines.length - 1];
    if (!candidate) return null;
    const parsed = JSON.parse(candidate) as Partial<DiscoveredPorts>;
    if (
      typeof parsed.frontend !== 'number' ||
      typeof parsed.backend !== 'number'
    ) {
      return null;
    }
    return { frontend: parsed.frontend, backend: parsed.backend };
  } catch {
    return null;
  }
}

const discoveredPorts = discoverPorts();
const frontendPort =
  process.env.FRONTEND_PORT ??
  (discoveredPorts ? String(discoveredPorts.frontend) : '3100');
const backendPort =
  process.env.BACKEND_PORT ??
  (discoveredPorts
    ? String(discoveredPorts.backend)
    : `${Number(frontendPort) + 1}`);
const baseURL = `http://127.0.0.1:${frontendPort}`;
const fixtureAssetDir = 'tests/fixtures/sparse_config';

process.env.FRONTEND_PORT = frontendPort;
process.env.BACKEND_PORT = backendPort;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    headless: true,
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `BACKEND_PORT=${backendPort} pnpm run prepare-db && (BACKEND_PORT=${backendPort} VIBOARD_ASSET_DIR=${fixtureAssetDir} cargo run --bin server & backend_pid=$!; for i in $(seq 1 600); do if ! kill -0 "$backend_pid" 2>/dev/null; then echo "Backend exited before becoming ready" >&2; wait "$backend_pid"; exit 1; fi; if curl -fsS http://127.0.0.1:${backendPort}/ >/dev/null; then cd frontend && BACKEND_PORT=${backendPort} pnpm exec vite --port ${frontendPort} --host 127.0.0.1; exit $?; fi; sleep 0.2; done; echo "Backend did not become ready on port ${backendPort}" >&2; exit 1)`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
