import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Note: In a production environment, you should use environment variables
// for Redis connection details.
const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

export const taskQueue = new Queue('tasks', { connection });