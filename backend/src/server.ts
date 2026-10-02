import path from 'node:path';
import { buildApp } from './app.js';

const port = Number(process.env.PORT ?? 3000);
const staticDir = process.env.STATIC_DIR
  ? path.resolve(process.env.STATIC_DIR)
  : undefined;
const app = buildApp({ staticDir });

app.listen({ port, host: '0.0.0.0' }).catch((err) => {
  console.error(err);
  process.exit(1);
});
