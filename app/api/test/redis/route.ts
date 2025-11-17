/**
 * Redis 連接測試 API
 * 
 * GET /api/test/redis
 * 
 * 測試項目：
 * 1. Redis 連接狀態
 * 2. 讀寫操作
 * 3. 快取功能
 * 4. 過期時間設定
 */

import { NextRequest, NextResponse } from 'next/server';
import { cache, getRedisClient } from '@/lib/redis-client';

export async function GET(request: NextRequest) {
  try {
    // 測試 1: 連接 Redis
    const client = await getRedisClient();
    
    // 測試 2: 基本讀寫
    const testKey = 'test:connection';
    const testValue = {
      message: 'Hello from Zeabur',
      timestamp: new Date().toISOString(),
      random: Math.random()
    };
    
    await cache.set(testKey, testValue, 60); // 60 秒過期
    const retrieved = await cache.get(testKey);
    
    // 測試 3: 檢查過期時間
    const ttl = await client.ttl(testKey);
    
    // 測試 4: 計數操作
    const counterKey = 'test:counter';
    await client.incr(counterKey);
    const counter = await client.get(counterKey);
    
    // 測試 5: 列表操作
    const listKey = 'test:list';
    await client.lPush(listKey, ['item1', 'item2', 'item3']);
    const listLength = await client.lLen(listKey);
    
    // 清理測試資料
    await client.del([testKey, counterKey, listKey]);
    
    return NextResponse.json({
      status: 'success',
      message: 'Redis 連接測試通過',
      tests: {
        connection: '✅ 連接成功',
        readWrite: retrieved?.message === testValue.message ? '✅ 讀寫正常' : '❌ 讀寫失敗',
        expiration: ttl > 0 && ttl <= 60 ? `✅ 過期時間設定正常 (${ttl}s)` : '❌ 過期時間異常',
        counter: counter ? `✅ 計數器正常 (${counter})` : '❌ 計數器異常',
        list: listLength === 3 ? '✅ 列表操作正常' : '❌ 列表操作異常',
      },
      data: {
        original: testValue,
        retrieved: retrieved,
        ttl: ttl,
      }
    });
    
  } catch (error) {
    console.error('Redis 測試失敗:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Redis 連接測試失敗',
      error: error instanceof Error ? error.message : String(error),
      tips: [
        '檢查 REDIS_URL 環境變數是否正確設定',
        '確認 Redis 服務是否在 Zeabur 上運行',
        '驗證 Redis 密碼是否正確',
        '確認使用內部域名: redis.zeabur.internal',
      ]
    }, { status: 500 });
  }
}

/**
 * POST /api/test/redis
 * 
 * 測試自訂資料的快取
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, ttl = 3600 } = body;
    
    if (!key || !value) {
      return NextResponse.json({
        status: 'error',
        message: '請提供 key 和 value',
      }, { status: 400 });
    }
    
    // 設定快取
    await cache.set(key, value, ttl);
    
    // 立即讀取驗證
    const retrieved = await cache.get(key);
    
    return NextResponse.json({
      status: 'success',
      message: '快取設定成功',
      data: {
        key,
        value,
        ttl,
        retrieved,
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: '快取設定失敗',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

/**
 * DELETE /api/test/redis
 * 
 * 清除測試快取
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (!key) {
      // 清除所有測試相關的快取
      const keys = await cache.keys('test:*');
      
      if (keys.length > 0) {
        const client = await getRedisClient();
        await client.del(keys);
      }
      
      return NextResponse.json({
        status: 'success',
        message: `已清除 ${keys.length} 個測試快取`,
        keys,
      });
    }
    
    // 刪除特定 key
    await cache.del(key);
    
    return NextResponse.json({
      status: 'success',
      message: `已刪除快取: ${key}`,
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: '清除快取失敗',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

