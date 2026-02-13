import { Queue, Worker, Processor, type ConnectionOptions } from 'bullmq';

const connection: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

export const syncQueue = new Queue('product-sync', { connection });
export const webhookQueue = new Queue('webhooks', { connection });

export function createSyncWorker(processor: Processor): Worker {
  return new Worker('product-sync', processor, { connection, concurrency: 2 });
}

export function createWebhookWorker(processor: Processor): Worker {
  return new Worker('webhooks', processor, { connection, concurrency: 5 });
}
