#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const electronOutDir = path.join(rootDir, 'dist-electron');

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env,
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function backendBinaryName() {
  return process.platform === 'win32' ? 'server.exe' : 'server';
}

function backendBinaryPath() {
  return path.join(rootDir, 'target', 'release', backendBinaryName());
}

function ensureBackendBinaryExists() {
  const backendPath = backendBinaryPath();
  if (!fs.existsSync(backendPath)) {
    console.error(`Expected backend binary at ${backendPath}, but it was not found.`);
    process.exit(1);
  }
}

function writeBuilderConfig() {
  const iconPath = path.join(rootDir, 'docs', 'logo', 'v-768.png');
  const backendPath = backendBinaryPath();

  const config = {
    appId: 'ai.bloop.vibekanban',
    productName: 'Vibe Kanban',
    directories: {
      output: electronOutDir,
      buildResources: path.join(rootDir, 'docs', 'logo'),
    },
    files: [
      {
        from: rootDir,
        to: '.',
        filter: ['electron/**', 'package.json'],
      },
    ],
    extraResources: [
      {
        from: backendPath,
        to: `bin/${backendBinaryName()}`,
      },
    ],
    extraMetadata: {
      main: 'electron/main.cjs',
    },
    linux: {
      target: ['AppImage', 'deb'],
      category: 'Development',
      icon: iconPath,
    },
    mac: {
      target: ['dmg', 'zip'],
      icon: iconPath,
    },
    win: {
      target: ['nsis', 'zip'],
      icon: iconPath,
    },
  };

  const configPath = path.join(rootDir, '.electron-builder.generated.json');
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  return configPath;
}

function main() {
  const builderArgs = process.argv.slice(2);
  const skipFrontendBuild = process.env.SKIP_FRONTEND_BUILD === '1';
  const skipRustBuild = process.env.SKIP_RUST_BUILD === '1';

  if (!skipFrontendBuild) {
    run('pnpm', ['--dir', 'frontend', 'run', 'build']);
  }

  if (!skipRustBuild) {
    run('cargo', ['build', '--release', '--bin', 'server']);
  }

  ensureBackendBinaryExists();

  const builderConfigPath = writeBuilderConfig();
  run('pnpm', [
    'exec',
    'electron-builder',
    '--config',
    builderConfigPath,
    ...builderArgs,
  ]);
}

main();
