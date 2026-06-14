import { readEnv } from './env.js';
import { buildServer, createDeps } from './server.js';

const env = readEnv();
const app = await buildServer(createDeps(env));
await app.listen({ port: env.PORT, host: '0.0.0.0' });
