import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

export const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (err) => console.error('[Redis Error]', err));
redisClient.on('connect', () => console.log('🚀 Connected to Redis Successfully'));

// Self-invoking connection for the module
await redisClient.connect();