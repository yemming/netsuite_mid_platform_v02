/**
 * 測試查詢指定的 NetSuite Invoice
 * 使用 sample 資料中的 ID: 21845, tranid: 885194
 */

import { getNetSuiteAPIClient } from '../lib/netsuite-client';

async function testFindInvoice() {
  try {
    const netsuite = getNetSuiteAPIClient();
    
    console.log('🔍 開始測試查詢 Invoice...\n');
    
    const invoiceId = '21845';
    const tranid = '885194';
    
    // 方法 1: 使用 REST API 查詢
    console.log(`📋 方法 1: 使用 REST API 查詢 ID: ${invoiceId}`);
    try {
      const restResult = await netsuite.getRecord('customerinvoice', invoiceId);
      console.log('✅ REST API 查詢成功！');
      console.log('📊 回應資料（前 500 字）:');
      console.log(JSON.stringify(restResult, null, 2).substring(0, 500));
      console.log('\n');
    } catch (restError: any) {
      console.log('❌ REST API 查詢失敗:', restError.message);
      console.log('\n');
    }
    
    // 方法 2: 使用 SuiteQL 查詢 ID
    console.log(`📋 方法 2: 使用 SuiteQL 查詢 ID: ${invoiceId}`);
    try {
      const suiteqlQueryById = `
        SELECT 
          id,
          tranid,
          entity,
          trandate,
          duedate,
          status,
          total as amount,
          currency,
          memo,
          createddate,
          lastmodifieddate
        FROM transaction
        WHERE type = 'CustInvc'
        AND id = ${invoiceId}
      `;
      
      const suiteqlResultById = await netsuite.executeSuiteQL(suiteqlQueryById, {
        fetchAll: false,
      });
      
      if (suiteqlResultById.items && suiteqlResultById.items.length > 0) {
        console.log('✅ SuiteQL 查詢成功（使用 ID）！');
        console.log('📊 查詢結果:');
        console.log(JSON.stringify(suiteqlResultById.items[0], null, 2));
        console.log('\n');
      } else {
        console.log('❌ SuiteQL 查詢結果為空（使用 ID）');
        console.log('\n');
      }
    } catch (suiteqlError: any) {
      console.log('❌ SuiteQL 查詢失敗（使用 ID）:', suiteqlError.message);
      console.log('\n');
    }
    
    // 方法 3: 使用 SuiteQL 查詢 tranid
    console.log(`📋 方法 3: 使用 SuiteQL 查詢 tranid: ${tranid}`);
    try {
      const suiteqlQueryByTranid = `
        SELECT 
          id,
          tranid,
          entity,
          trandate,
          duedate,
          status,
          total as amount,
          currency,
          memo,
          createddate,
          lastmodifieddate
        FROM transaction
        WHERE type = 'CustInvc'
        AND tranid = '${tranid}'
      `;
      
      const suiteqlResultByTranid = await netsuite.executeSuiteQL(suiteqlQueryByTranid, {
        fetchAll: false,
      });
      
      if (suiteqlResultByTranid.items && suiteqlResultByTranid.items.length > 0) {
        console.log('✅ SuiteQL 查詢成功（使用 tranid）！');
        console.log('📊 查詢結果:');
        console.log(JSON.stringify(suiteqlResultByTranid.items[0], null, 2));
        console.log('\n');
      } else {
        console.log('❌ SuiteQL 查詢結果為空（使用 tranid）');
        console.log('\n');
      }
    } catch (suiteqlError: any) {
      console.log('❌ SuiteQL 查詢失敗（使用 tranid）:', suiteqlError.message);
      console.log('\n');
    }
    
    // 方法 4: 列出最近的幾張 Invoice，看看是否能找到
    console.log('📋 方法 4: 查詢最近的 Invoice 列表（前 10 筆）');
    try {
      const listQuery = `
        SELECT 
          id,
          tranid,
          entity,
          trandate,
          status,
          total as amount
        FROM transaction
        WHERE type = 'CustInvc'
        ORDER BY trandate DESC, id DESC
        LIMIT 10
      `;
      
      const listResult = await netsuite.executeSuiteQL(listQuery, {
        fetchAll: false,
      });
      
      if (listResult.items && listResult.items.length > 0) {
        console.log(`✅ 找到 ${listResult.items.length} 筆 Invoice`);
        console.log('📊 列表:');
        listResult.items.forEach((item: any, index: number) => {
          const isTarget = item.id === invoiceId || item.tranid === tranid;
          const marker = isTarget ? '🎯' : '  ';
          console.log(`${marker} ${index + 1}. ID: ${item.id}, tranid: ${item.tranid}, 日期: ${item.trandate}, 金額: ${item.amount}`);
        });
        console.log('\n');
      } else {
        console.log('❌ 查詢結果為空');
        console.log('\n');
      }
    } catch (listError: any) {
      console.log('❌ 列表查詢失敗:', listError.message);
      console.log('\n');
    }
    
    console.log('✅ 測試完成！');
    
  } catch (error: any) {
    console.error('❌ 測試過程發生錯誤:', error);
    process.exit(1);
  }
}

// 執行測試
testFindInvoice();





