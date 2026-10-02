import { describe, expect, it } from 'vitest';
import { buildApp } from './app.js';

describe('backend smoke test', () => {
  it('responds on /health', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
    await app.close();
  });
});
