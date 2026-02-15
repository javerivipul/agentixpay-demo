import 'dotenv/config';

export const config = {
  port: parseInt(process.env.API_PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:3000',
  demoUrl: process.env.DEMO_URL || 'http://localhost:3002',

  databaseUrl: process.env.DATABASE_URL || 'postgresql://agentix:agentix@localhost:5432/agentix',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  encryptionKey: process.env.ENCRYPTION_KEY || '',

  enableUcp: process.env.ENABLE_UCP === 'true',
  demoMode: process.env.DEMO_MODE === 'true',
};
