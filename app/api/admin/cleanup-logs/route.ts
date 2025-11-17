/**
 * 清理舊日誌 API
 * 
 * POST /api/admin/cleanup-logs
 * 
 * 功能：
 * 1. 刪除指定天數前的同步日誌
 * 2. 刪除失敗的交易記錄
 * 3. 回收資料庫空間
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      daysToKeep = 90,  // 預設保留 90 天
      dryRun = true,    // 預設為試運行模式
      tables = ['sync_logs', 'transaction_references']
    } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        error: '資料庫連接未設定'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const results: any[] = [];

    // === 清理 sync_logs ===
    if (tables.includes('sync_logs')) {
      // 先統計要刪除的記錄數
      const { count: toDeleteCount } = await supabase
        .from('sync_logs')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', cutoffDate.toISOString());

      if (!dryRun && toDeleteCount && toDeleteCount > 0) {
        // 實際刪除（分批進行，避免超時）
        const batchSize = 1000;
        let deletedCount = 0;

        for (let i = 0; i < Math.ceil(toDeleteCount / batchSize); i++) {
          const { error: deleteError } = await supabase
            .from('sync_logs')
            .delete()
            .lt('created_at', cutoffDate.toISOString())
            .limit(batchSize);

          if (deleteError) {
            throw deleteError;
          }

          deletedCount += Math.min(batchSize, toDeleteCount - deletedCount);

          // 避免過載，每批次間隔 100ms
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        results.push({
          table: 'sync_logs',
          action: 'deleted',
          count: deletedCount,
          cutoffDate: cutoffDate.toISOString(),
        });
      } else {
        results.push({
          table: 'sync_logs',
          action: 'dry_run',
          count: toDeleteCount || 0,
          message: `將會刪除 ${toDeleteCount} 筆記錄（${cutoffDate.toISOString()} 之前）`,
        });
      }
    }

    // === 清理 transaction_references（只刪除失敗的）===
    if (tables.includes('transaction_references')) {
      const { count: failedCount } = await supabase
        .from('transaction_references')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed')
        .lt('created_at', cutoffDate.toISOString());

      if (!dryRun && failedCount && failedCount > 0) {
        const { error: deleteError } = await supabase
          .from('transaction_references')
          .delete()
          .eq('status', 'failed')
          .lt('created_at', cutoffDate.toISOString());

        if (deleteError) {
          throw deleteError;
        }

        results.push({
          table: 'transaction_references',
          action: 'deleted',
          count: failedCount,
          note: '只刪除失敗的交易記錄',
        });
      } else {
        results.push({
          table: 'transaction_references',
          action: 'dry_run',
          count: failedCount || 0,
          message: `將會刪除 ${failedCount} 筆失敗的交易記錄`,
        });
      }
    }

    // === 統計清理效果 ===
    const totalDeleted = results.reduce((sum, r) => sum + (r.count || 0), 0);

    return NextResponse.json({
      status: 'success',
      mode: dryRun ? 'dry_run' : 'actual',
      timestamp: new Date().toISOString(),
      parameters: {
        daysToKeep,
        cutoffDate: cutoffDate.toISOString(),
        tables,
      },
      results,
      summary: {
        totalRecordsAffected: totalDeleted,
        estimatedSpaceSaved: `${(totalDeleted * 0.001).toFixed(2)} MB`,
      },
      nextSteps: dryRun ? [
        '確認要刪除的記錄數是否合理',
        '如果確定，請設定 dryRun: false 執行實際刪除',
        '刪除後執行 VACUUM 回收空間',
      ] : [
        '✅ 清理完成',
        '建議執行 VACUUM FULL 回收磁碟空間',
        '設定定期清理任務（例如用 n8n 每週執行）',
      ]
    });

  } catch (error) {
    console.error('清理日誌錯誤:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

/**
 * GET /api/admin/cleanup-logs
 * 
 * 查看清理配置和建議
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'info',
    description: '清理舊日誌 API',
    usage: {
      method: 'POST',
      body: {
        daysToKeep: '保留天數（預設 90）',
        dryRun: '試運行模式（預設 true）',
        tables: '要清理的表（預設 ["sync_logs", "transaction_references"]）',
      },
      example: {
        daysToKeep: 90,
        dryRun: true,
        tables: ['sync_logs']
      }
    },
    recommendations: {
      sync_logs: '建議保留 30-90 天',
      transaction_references: '建議保留 180 天，只刪除失敗記錄',
    },
    warning: '⚠️  請先用 dryRun: true 測試，確認要刪除的記錄數合理後再執行實際刪除'
  });
}

