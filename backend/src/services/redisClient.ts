import Redis from 'ioredis';
import { config } from '../config';

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (redis !== null) return redis;
  const url = config.redisUrl || process.env.REDIS_URL;
  if (!url) {
    console.warn('⚠️  REDIS_URL not set. Falling back to in-memory for OTP and rate limits.');
    redis = null;
    return redis;
  }
  try {
    redis = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
    });
    redis.on('error', (err) => console.error('❌ Redis error:', err));
    redis.connect().catch((e) => console.error('❌ Redis connect failed:', e));
    console.log('✅ Redis client initialized');
    return redis;
  } catch (e) {
    console.error('❌ Failed to initialize Redis:', e);
    redis = null;
    return redis;
  }
}
