/**
 * 完整系統測試 API
 * 
 * GET /api/test/all
 * 
 * 測試所有服務的連接狀態：
 * - PostgreSQL (Supabase)
 * - Redis
 * - n8n
 * - NetSuite API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cache } from '@/lib/redis-client';

interface TestResult {
  service: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  duration?: number;
  details?: any;
}

export async function GET(request: NextRequest) {
  const results: TestResult[] = [];
  const startTime = Date.now();
  
  // === 測試 1: PostgreSQL (Supabase) ===
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      results.push({
        service: 'PostgreSQL (Supabase)',
        status: 'error',
        message: 'Supabase 環境變數未設定',
      });
    } else {
      const testStart = Date.now();
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // 嘗試查詢一個簡單的表
      const { data, error } = await supabase
        .from('sync_logs')
        .select('id')
        .limit(1);
      
      results.push({
        service: 'PostgreSQL (Supabase)',
        status: error ? 'error' : 'success',
        message: error ? error.message : '資料庫連接正常',
        duration: Date.now() - testStart,
        details: {
          url: supabaseUrl,
          hasData: data && data.length > 0,
        }
      });
    }
  } catch (error) {
    results.push({
      service: 'PostgreSQL (Supabase)',
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
  
  // === 測試 2: Redis ===
  try {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      results.push({
        service: 'Redis',
        status: 'error',
        message: 'REDIS_URL 環境變數未設定',
      });
    } else {
      const testStart = Date.now();
      const testKey = 'test:healthcheck';
      const testValue = { timestamp: new Date().toISOString() };
      
      await cache.set(testKey, testValue, 30);
      const retrieved = await cache.get(testKey);
      await cache.del(testKey);
      
      results.push({
        service: 'Redis',
        status: 'success',
        message: 'Redis 連接正常',
        duration: Date.now() - testStart,
        details: {
          readWrite: retrieved?.timestamp === testValue.timestamp ? '正常' : '異常',
        }
      });
    }
  } catch (error) {
    results.push({
      service: 'Redis',
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
  
  // === 測試 3: n8n ===
  try {
    const n8nUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    
    if (!n8nUrl) {
      results.push({
        service: 'n8n',
        status: 'warning',
        message: 'n8n Webhook URL 未設定（可選）',
      });
    } else {
      const testStart = Date.now();
      
      // 只測試可達性，不實際調用 webhook
      const response = await fetch(`${n8nUrl}/healthz`, {
        method: 'GET',
      }).catch(() => null);
      
      results.push({
        service: 'n8n',
        status: response?.ok ? 'success' : 'warning',
        message: response?.ok ? 'n8n 服務可達' : 'n8n 健康檢查端點無回應',
        duration: Date.now() - testStart,
        details: {
          url: n8nUrl,
          statusCode: response?.status,
        }
      });
    }
  } catch (error) {
    results.push({
      service: 'n8n',
      status: 'warning',
      message: error instanceof Error ? error.message : String(error),
    });
  }
  
  // === 測試 4: NetSuite API ===
  try {
    const accountId = process.env.NETSUITE_ACCOUNT_ID;
    const consumerKey = process.env.NETSUITE_CONSUMER_KEY;
    
    if (!accountId || !consumerKey) {
      results.push({
        service: 'NetSuite API',
        status: 'warning',
        message: 'NetSuite 環境變數未完整設定',
        details: {
          hasAccountId: !!accountId,
          hasConsumerKey: !!consumerKey,
        }
      });
    } else {
      results.push({
        service: 'NetSuite API',
        status: 'success',
        message: 'NetSuite 環境變數已設定（未測試實際連接）',
        details: {
          accountId,
        }
      });
    }
  } catch (error) {
    results.push({
      service: 'NetSuite API',
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
  
  // === 統計結果 ===
  const totalDuration = Date.now() - startTime;
  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  
  const overallStatus = errorCount > 0 ? 'partial' : (warningCount > 0 ? 'warning' : 'success');
  
  return NextResponse.json({
    status: overallStatus,
    message: `系統測試完成: ${successCount} 成功, ${errorCount} 錯誤, ${warningCount} 警告`,
    timestamp: new Date().toISOString(),
    duration: `${totalDuration}ms`,
    summary: {
      total: results.length,
      success: successCount,
      error: errorCount,
      warning: warningCount,
    },
    results,
    recommendations: generateRecommendations(results),
  });
}

/**
 * 根據測試結果生成建議
 */
function generateRecommendations(results: TestResult[]): string[] {
  const recommendations: string[] = [];
  
  for (const result of results) {
    if (result.status === 'error') {
      switch (result.service) {
        case 'PostgreSQL (Supabase)':
          recommendations.push('❌ 請檢查 Supabase 環境變數設定');
          recommendations.push('   - NEXT_PUBLIC_SUPABASE_URL');
          recommendations.push('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
          break;
        case 'Redis':
          recommendations.push('❌ 請檢查 Redis 連接設定');
          recommendations.push('   - REDIS_URL (格式: redis://:<password>@redis.zeabur.internal:6379)');
          break;
        case 'NetSuite API':
          recommendations.push('❌ 請檢查 NetSuite OAuth 憑證');
          break;
      }
    } else if (result.status === 'warning') {
      switch (result.service) {
        case 'n8n':
          recommendations.push('⚠️  n8n 為可選服務，如需使用請在 Zeabur 中部署');
          break;
      }
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ 所有核心服務運行正常！');
  }
  
  return recommendations;
}

