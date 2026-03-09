// backend/src/config/redis.js
import Redis from 'ioredis';

// We'll implement this properly when we need caching
// For now, create a placeholder that won't break the app

let redisClient;

const connectRedis = async () => {
  try {
    // Only attempt connection if REDIS_URL is provided
    if (process.env.REDIS_URL) {
      redisClient = new Redis(process.env.REDIS_URL);
      
      redisClient.on('connect', () => {
        console.log('✅ Redis Connected'.cyan.underline);
      });
      
      redisClient.on('error', (err) => {
        console.error('❌ Redis Error:'.red, err);
      });
    } else {
      console.log('⚠️ Redis not configured - skipping connection'.yellow);
      // Create a mock Redis client for development
      redisClient = {
        get: async () => null,
        set: async () => 'OK',
        setex: async () => 'OK',
        del: async () => 1,
        hset: async () => 1,
        hget: async () => null,
        hdel: async () => 1,
        expire: async () => 1,
      };
    }
  } catch (error) {
    console.error('❌ Redis connection failed:'.red, error);
  }
};

export { redisClient, connectRedis };