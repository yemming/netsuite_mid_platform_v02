/**
 * Redis 客戶端 - 用於快取和 Session 管理
 * 
 * 使用場景：
 * 1. NetSuite API 回應快取
 * 2. 同步狀態暫存
 * 3. Session 管理
 * 4. 速率限制
 */

import { createClient, RedisClientType } from 'redis';

// Redis 客戶端單例
let redisClient: RedisClientType | null = null;

/**
 * 建立並連接 Redis 客戶端
 */
export async function connectRedis(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  // 從環境變數獲取 Redis URL
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error('REDIS_URL 環境變數未設定');
  }

  redisClient = createClient({
    url: redisUrl,
  });

  // 錯誤處理
  redisClient.on('error', (err) => {
    console.error('Redis 錯誤:', err);
  });

  // 連接事件
  redisClient.on('connect', () => {
    console.log('Redis 已連接');
  });

  redisClient.on('ready', () => {
    console.log('Redis 已就緒');
  });

  redisClient.on('reconnecting', () => {
    console.log('Redis 重新連接中...');
  });

  // 建立連接
  await redisClient.connect();

  return redisClient;
}

/**
 * 獲取 Redis 客戶端（如果未連接則自動連接）
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient || !redisClient.isOpen) {
    return await connectRedis();
  }
  return redisClient;
}

/**
 * 關閉 Redis 連接
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * 快取輔助函數
 */
export const cache = {
  /**
   * 設定快取（帶過期時間）
   * @param key 快取鍵
   * @param value 快取值（會自動序列化）
   * @param ttl 過期時間（秒），預設 1 小時
   */
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    const client = await getRedisClient();
    const serialized = JSON.stringify(value);
    await client.set(key, serialized, { EX: ttl });
  },

  /**
   * 獲取快取
   * @param key 快取鍵
   * @returns 快取值（自動反序列化），如果不存在返回 null
   */
  async get<T = any>(key: string): Promise<T | null> {
    const client = await getRedisClient();
    const value = await client.get(key);
    
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Redis 反序列化錯誤:', error);
      return null;
    }
  },

  /**
   * 刪除快取
   * @param key 快取鍵
   */
  async del(key: string): Promise<void> {
    const client = await getRedisClient();
    await client.del(key);
  },

  /**
   * 檢查快取是否存在
   * @param key 快取鍵
   */
  async exists(key: string): Promise<boolean> {
    const client = await getRedisClient();
    const result = await client.exists(key);
    return result === 1;
  },

  /**
   * 設定快取過期時間
   * @param key 快取鍵
   * @param ttl 過期時間（秒）
   */
  async expire(key: string, ttl: number): Promise<void> {
    const client = await getRedisClient();
    await client.expire(key, ttl);
  },

  /**
   * 清除所有快取（危險操作！）
   */
  async flush(): Promise<void> {
    const client = await getRedisClient();
    await client.flushAll();
  },

  /**
   * 獲取所有匹配的鍵
   * @param pattern 匹配模式（例如 'netsuite:*'）
   */
  async keys(pattern: string): Promise<string[]> {
    const client = await getRedisClient();
    return await client.keys(pattern);
  },
};

/**
 * NetSuite API 快取輔助函數
 */
export const netsuiteCache = {
  /**
   * 快取 NetSuite 主檔資料
   * @param recordType 記錄類型（例如 'subsidiary', 'item'）
   * @param id 記錄 ID
   * @param data 資料
   * @param ttl 過期時間（秒），預設 1 小時
   */
  async setRecord(recordType: string, id: string | number, data: any, ttl: number = 3600): Promise<void> {
    const key = `netsuite:${recordType}:${id}`;
    await cache.set(key, data, ttl);
  },

  /**
   * 獲取快取的 NetSuite 主檔資料
   * @param recordType 記錄類型
   * @param id 記錄 ID
   */
  async getRecord<T = any>(recordType: string, id: string | number): Promise<T | null> {
    const key = `netsuite:${recordType}:${id}`;
    return await cache.get<T>(key);
  },

  /**
   * 快取 SuiteQL 查詢結果
   * @param queryHash 查詢的唯一標識（可以用查詢字串的 hash）
   * @param data 查詢結果
   * @param ttl 過期時間（秒），預設 10 分鐘
   */
  async setQuery(queryHash: string, data: any, ttl: number = 600): Promise<void> {
    const key = `netsuite:query:${queryHash}`;
    await cache.set(key, data, ttl);
  },

  /**
   * 獲取快取的 SuiteQL 查詢結果
   * @param queryHash 查詢的唯一標識
   */
  async getQuery<T = any>(queryHash: string): Promise<T | null> {
    const key = `netsuite:query:${queryHash}`;
    return await cache.get<T>(key);
  },

  /**
   * 清除特定記錄類型的所有快取
   * @param recordType 記錄類型
   */
  async clearRecordType(recordType: string): Promise<void> {
    const pattern = `netsuite:${recordType}:*`;
    const keys = await cache.keys(pattern);
    
    if (keys.length > 0) {
      const client = await getRedisClient();
      await client.del(keys);
    }
  },
};

/**
 * 速率限制輔助函數
 */
export const rateLimit = {
  /**
   * 檢查並記錄請求（使用滑動視窗演算法）
   * @param identifier 識別符（例如 IP 或用戶 ID）
   * @param maxRequests 最大請求數
   * @param windowSeconds 時間視窗（秒）
   * @returns 是否允許請求
   */
  async check(identifier: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
    const client = await getRedisClient();
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    // 移除過期的請求記錄
    await client.zRemRangeByScore(key, 0, windowStart);

    // 獲取當前視窗內的請求數
    const requestCount = await client.zCard(key);

    if (requestCount >= maxRequests) {
      return false;
    }

    // 記錄這次請求
    await client.zAdd(key, { score: now, value: `${now}` });
    
    // 設定過期時間（避免鍵永久存在）
    await client.expire(key, windowSeconds);

    return true;
  },

  /**
   * 獲取剩餘請求數
   * @param identifier 識別符
   * @param maxRequests 最大請求數
   * @param windowSeconds 時間視窗（秒）
   */
  async getRemaining(identifier: string, maxRequests: number, windowSeconds: number): Promise<number> {
    const client = await getRedisClient();
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    await client.zRemRangeByScore(key, 0, windowStart);
    const requestCount = await client.zCard(key);

    return Math.max(0, maxRequests - requestCount);
  },
};

export default {
  connectRedis,
  getRedisClient,
  disconnectRedis,
  cache,
  netsuiteCache,
  rateLimit,
};

