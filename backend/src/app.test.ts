import { describe, expect, it, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildApp } from './app.js';

const tempDirs: string[] = [];

function staticDir() {
  const dir = mkdtempSync(join(tmpdir(), 'static-'));
  writeFileSync(join(dir, 'index.html'), '<!doctype html><html></html>');
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

describe('backend smoke test', () => {
  it('responds on /health', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
    await app.close();
  });
});

describe('SPA fallback', () => {
  it('serves index.html for a non-GET request that is not under /api', async () => {
    const app = buildApp({ staticDir: staticDir() });
    const res = await app.inject({ method: 'POST', url: '/book' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ message: 'Не найдено' });
    await app.close();
  });
});
