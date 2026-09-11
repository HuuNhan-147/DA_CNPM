// config/redis.js
import { createClient } from 'redis';

let redisClient = null;

/**
 * ✅ Khởi tạo Redis client
 */
export const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD || undefined,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Redis: Too many reconnection attempts');
            return new Error('Too many retries');
          }
          return retries * 100; // Retry every 100ms * retries
        }
      }
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
    });

    redisClient.on('ready', () => {
      console.log('🚀 Redis ready');
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    await redisClient.connect();
    
    // Test connection
    await redisClient.ping();
    console.log('✅ Redis ping successful');

    return redisClient;
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    throw error;
  }
};

/**
 * ✅ Get Redis client instance
 */
export const getRedisClient = () => {
  if (!redisClient || !redisClient.isOpen) {
    console.warn('⚠️ Redis client is not initialized or disconnected. Returning null.');
    return null;
  }
  return redisClient;
};

/**
 * ✅ Graceful shutdown
 */
export const disconnectRedis = async () => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    console.log('✅ Redis disconnected');
  }
};

export default redisClient;