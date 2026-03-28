import Bull, { Queue, QueueOptions } from 'bull';

const defaultQueueOptions: QueueOptions = {
  redis: process.env.REDIS_URL ?? 'redis://localhost:6379',
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2_000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
};

// Queue names as constants to avoid typos
export const QUEUE_NAMES = {
  EMAIL_RECEIPT: 'email:receipt',
  EMAIL_VERIFICATION: 'email:verification',
  EMAIL_CAMPAIGN: 'email:campaign',
  EMAIL_BACKER_UPDATE: 'email:backer-update',
  EMAIL_ACCOUNT_LOCKOUT: 'email:account-lockout',
  EMAIL_SUBSCRIPTION_RENEWAL: 'email:subscription-renewal',
  KYC_PROCESS: 'kyc:process',
  CAMPAIGN_AUTO_CLOSE: 'campaign:auto-close',
  BOOST_EXPIRY: 'boost:expiry',
  SUBSCRIPTION_EXPIRY: 'subscription:expiry',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// Queue registry — lazily instantiated
const queues = new Map<string, Queue>();

export function getQueue(name: QueueName): Queue {
  if (!queues.has(name)) {
    const queue = new Bull(name, defaultQueueOptions);

    queue.on('error', (err) => {
      console.error(`Queue [${name}] error:`, err);
    });

    queue.on('failed', (job, err) => {
      console.error(`Queue [${name}] job ${job.id} failed:`, err.message);
    });

    queues.set(name, queue);
  }

  return queues.get(name)!;
}

export async function closeAllQueues(): Promise<void> {
  await Promise.all([...queues.values()].map((q) => q.close()));
  queues.clear();
}
