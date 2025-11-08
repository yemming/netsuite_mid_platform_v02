/**
 * 測試 NetSuite REST API 同步功能
 * 直接調用 NetSuite API，不依賴開發伺服器
 * 
 * 執行方式：
 * npx tsx scripts/test-rest-api.ts
 */

import { getNetSuiteAPIClient } from '../lib/netsuite-client';

async function testRestAPI() {
  try {
    console.log('🚀 開始測試 NetSuite REST API...\n');
    
    const netsuite = getNetSuiteAPIClient();
    const results: any = {};

    // 1. 測試 Accounting Period
    console.log('📅 測試 Accounting Period REST API...');
    try {
      const accountingPeriodResult = await netsuite.getRecordList('accountingperiod', {
        fetchAll: false,
        limit: 3,
      });
      
      const sample = accountingPeriodResult.items?.[0] || null;
      
      results.accountingPeriod = {
        success: true,
        count: accountingPeriodResult.items?.length || 0,
        sample: sample,
        allFields: sample ? Object.keys(sample) : [],
        message: '✅ 成功取得 Accounting Period 資料',
      };
      
      console.log(`   ✅ 取得 ${accountingPeriodResult.items?.length || 0} 筆資料`);
      if (sample) {
        console.log(`   📋 欄位列表: ${Object.keys(sample).join(', ')}`);
        console.log(`   📄 範例資料:`, JSON.stringify(sample, null, 2));
      }
    } catch (error: any) {
      results.accountingPeriod = {
        success: false,
        error: error.message,
        stack: error.stack,
        message: '❌ 取得 Accounting Period 資料失敗',
      };
      console.log(`   ❌ 錯誤: ${error.message}`);
    }

    console.log('\n');

    // 2. 測試 BOM
    console.log('📦 測試 BOM REST API...');
    try {
      const bomResult = await netsuite.getRecordList('bom', {
        fetchAll: false,
        limit: 3,
      });
      
      results.bom = {
        success: true,
        count: bomResult.items?.length || 0,
        sample: bomResult.items?.[0] || null,
        message: '✅ 成功取得 BOM 資料',
      };
      
      console.log(`   ✅ 取得 ${bomResult.items?.length || 0} 筆資料`);
      
      // 如果有 BOM，嘗試獲取一個詳細資訊
      if (bomResult.items && bomResult.items.length > 0) {
        const bomId = bomResult.items[0].id;
        console.log(`   🔍 取得 BOM ${bomId} 的詳細資訊...`);
        
        try {
          const bomDetail = await netsuite.getRecord('bom', bomId);
          results.bom.detail = bomDetail;
          results.bom.detailFields = Object.keys(bomDetail);
          
          console.log(`   ✅ 詳細資訊欄位: ${Object.keys(bomDetail).join(', ')}`);
          
          // 檢查是否有 components 相關欄位
          const componentFields = Object.keys(bomDetail).filter(key => 
            key.toLowerCase().includes('item') || 
            key.toLowerCase().includes('component')
          );
          if (componentFields.length > 0) {
            console.log(`   📋 Components 相關欄位: ${componentFields.join(', ')}`);
            componentFields.forEach(field => {
              console.log(`      - ${field}:`, typeof bomDetail[field], Array.isArray(bomDetail[field]) ? `(陣列, 長度: ${bomDetail[field].length})` : '');
            });
          }
          
          console.log(`   📄 詳細資訊範例:`, JSON.stringify(bomDetail, null, 2));
        } catch (detailError: any) {
          results.bom.detailError = detailError.message;
          console.log(`   ⚠️  無法取得詳細資訊: ${detailError.message}`);
        }
      } else {
        console.log(`   ⚠️  沒有 BOM 資料可供測試`);
      }
    } catch (error: any) {
      results.bom = {
        success: false,
        error: error.message,
        stack: error.stack,
        message: '❌ 取得 BOM 資料失敗',
      };
      console.log(`   ❌ 錯誤: ${error.message}`);
    }

    console.log('\n');

    // 3. 測試 Work Center
    console.log('🏭 測試 Work Center REST API...');
    try {
      const workCenterResult = await netsuite.getRecordList('workcenter', {
        fetchAll: false,
        limit: 3,
      });
      
      const sample = workCenterResult.items?.[0] || null;
      
      results.workCenter = {
        success: true,
        count: workCenterResult.items?.length || 0,
        sample: sample,
        allFields: sample ? Object.keys(sample) : [],
        message: '✅ 成功取得 Work Center 資料',
      };
      
      console.log(`   ✅ 取得 ${workCenterResult.items?.length || 0} 筆資料`);
      if (sample) {
        console.log(`   📋 欄位列表: ${Object.keys(sample).join(', ')}`);
        console.log(`   📄 範例資料:`, JSON.stringify(sample, null, 2));
      }
    } catch (error: any) {
      results.workCenter = {
        success: false,
        error: error.message,
        stack: error.stack,
        message: '❌ 取得 Work Center 資料失敗',
      };
      console.log(`   ❌ 錯誤: ${error.message}`);
    }

    console.log('\n');
    console.log('📊 測試結果摘要:');
    console.log('='.repeat(60));
    console.log(JSON.stringify(results, null, 2));
    console.log('='.repeat(60));

    return results;
  } catch (error: any) {
    console.error('❌ 測試過程中發生錯誤:', error);
    console.error('Stack:', error.stack);
    throw error;
  }
}

// 執行測試
testRestAPI()
  .then(() => {
    console.log('\n✅ 測試完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 測試失敗:', error);
    process.exit(1);
  });

