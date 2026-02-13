import { Job } from 'bullmq';
import { logger } from '../../logger';

export interface WebhookJobData {
  tenantId: string;
  event: string;
  payload: unknown;
}

export async function processWebhookJob(job: Job<WebhookJobData>): Promise<void> {
  const { tenantId, event } = job.data;
  logger.info({ tenantId, event, jobId: job.id }, 'Processing webhook');

  // TODO: Implement webhook delivery
  // 1. Load tenant webhook URL
  // 2. POST payload to webhook URL
  // 3. Handle retries on failure

  logger.info({ tenantId, event, jobId: job.id }, 'Webhook delivered');
}
