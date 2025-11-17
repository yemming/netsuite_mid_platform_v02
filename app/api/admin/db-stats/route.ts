/**
 * 資料庫空間使用統計 API
 * 
 * GET /api/admin/db-stats
 * 
 * 功能：
 * 1. 查看資料庫大小
 * 2. 查看各表大小
 * 3. 識別可清理的資料
 * 4. 提供清理建議
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        error: '資料庫連接未設定'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // === 1. 資料庫總大小 ===
    const { data: dbSize, error: dbSizeError } = await supabase.rpc('get_db_size', {});
    
    // === 2. 各表大小統計 ===
    const tables = [
      'sync_logs',
      'transaction_references',
      'ns_subsidiary',
      'ns_item',
      'ns_customer',
      'ns_vendor',
      'ns_employee',
      'ns_account',
      'ns_department',
      'ns_location',
      'ns_classification',
      'expense_reviews',
      'expense_lines',
    ];

    const tableSizes: any[] = [];
    
    for (const table of tables) {
      try {
        // 獲取表的記錄數
        const { count, error: countError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (!countError) {
          tableSizes.push({
            table,
            rowCount: count || 0,
            status: 'ok'
          });
        }
      } catch (err) {
        tableSizes.push({
          table,
          rowCount: 0,
          status: 'error',
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }

    // === 3. 日誌表統計（最容易爆的）===
    const { data: syncLogsStats } = await supabase
      .from('sync_logs')
      .select('status, created_at')
      .order('created_at', { ascending: false })
      .limit(1);

    const { data: oldSyncLogs } = await supabase
      .from('sync_logs')
      .select('id')
      .lt('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()) // 90 天前
      .limit(1);

    const { count: oldSyncLogsCount } = await supabase
      .from('sync_logs')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    // === 4. 生成清理建議 ===
    const recommendations: string[] = [];
    let estimatedSavings = 0;

    // 檢查 sync_logs
    const syncLogsTable = tableSizes.find(t => t.table === 'sync_logs');
    if (syncLogsTable && syncLogsTable.rowCount > 100000) {
      recommendations.push(`🔴 sync_logs 表有 ${syncLogsTable.rowCount.toLocaleString()} 筆記錄，建議清理 90 天前的舊資料`);
      estimatedSavings += (oldSyncLogsCount || 0) * 0.001; // 假設每筆 1KB
    }

    // 檢查 transaction_references
    const txnRefTable = tableSizes.find(t => t.table === 'transaction_references');
    if (txnRefTable && txnRefTable.rowCount > 50000) {
      recommendations.push(`🟡 transaction_references 表有 ${txnRefTable.rowCount.toLocaleString()} 筆記錄，考慮歸檔舊交易`);
    }

    // 檢查其他大表
    for (const table of tableSizes) {
      if (table.rowCount > 500000) {
        recommendations.push(`⚠️  ${table.table} 表有 ${table.rowCount.toLocaleString()} 筆記錄，可能需要分區或歸檔`);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ 目前資料量健康，暫無清理需求');
    }

    // === 5. 返回結果 ===
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      database: {
        totalSize: dbSize || 'N/A (需要建立 RPC 函數)',
        estimatedSavings: `${estimatedSavings.toFixed(2)} MB`,
      },
      tables: tableSizes.sort((a, b) => b.rowCount - a.rowCount),
      analysis: {
        totalTables: tableSizes.length,
        totalRows: tableSizes.reduce((sum, t) => sum + t.rowCount, 0),
        largestTable: tableSizes[0],
        oldLogsCount: oldSyncLogsCount || 0,
      },
      recommendations,
      actions: [
        {
          name: 'cleanup_old_logs',
          description: '清理 90 天前的同步日誌',
          endpoint: '/api/admin/cleanup-logs',
          estimatedSavings: `${estimatedSavings.toFixed(2)} MB`,
        },
        {
          name: 'vacuum_database',
          description: '執行 VACUUM 回收空間',
          sql: 'VACUUM FULL;',
          note: '需要資料庫管理員權限',
        }
      ]
    });

  } catch (error) {
    console.error('資料庫統計錯誤:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

