import { createServer } from 'http';
import { config } from './config';
import { createApp } from './app';
import { setupSocketIO } from './socket';
import { logger } from '@agentix/core';

const app = createApp();
const server = createServer(app);

setupSocketIO(server);

server.listen(config.port, () => {
  logger.info({
    port: config.port,
    env: config.nodeEnv,
    ucp: config.enableUcp,
    demo: config.demoMode,
  }, `Agentix API server running on port ${config.port}`);
});
