/**
 * 檢查 NetSuite 中可用的 Record Types
 * 找出 accountingperiod、bom、workcenter 的正確名稱
 */

import { getNetSuiteAPIClient } from '../lib/netsuite-client';

async function checkRecordTypes() {
  try {
    console.log('🔍 檢查 NetSuite Record Types...\n');
    
    const netsuite = getNetSuiteAPIClient();
    
    // 取得 metadata catalog
    const catalog = await netsuite.getMetadataCatalog();
    
    if (!catalog.items || catalog.items.length === 0) {
      console.log('❌ 無法取得 metadata catalog');
      return;
    }
    
    console.log(`📋 找到 ${catalog.items.length} 個 record types\n`);
    
    // 搜尋相關的 record types
    const keywords = ['accounting', 'period', 'bom', 'bill', 'material', 'work', 'center', 'workcenter'];
    
    const relevantTypes: any[] = [];
    
    catalog.items.forEach((item: any) => {
      const name = item.name?.toLowerCase() || '';
      const matches = keywords.some(keyword => name.includes(keyword));
      
      if (matches) {
        relevantTypes.push(item);
      }
    });
    
    console.log('🎯 找到相關的 Record Types:');
    console.log('='.repeat(60));
    relevantTypes.forEach(item => {
      console.log(`  - ${item.name}`);
      if (item.links) {
        item.links.forEach((link: any) => {
          if (link.rel === 'self') {
            console.log(`    URL: ${link.href}`);
          }
        });
      }
    });
    console.log('='.repeat(60));
    
    // 特別搜尋我們需要的三個
    console.log('\n🔎 特別搜尋目標 Record Types:');
    const targets = ['accountingperiod', 'accountingperiod', 'bom', 'billofmaterials', 'workcenter', 'workcenter'];
    
    targets.forEach(target => {
      const found = catalog.items.find((item: any) => 
        item.name?.toLowerCase() === target.toLowerCase()
      );
      
      if (found) {
        console.log(`✅ 找到: ${found.name}`);
      } else {
        console.log(`❌ 未找到: ${target}`);
      }
    });
    
    // 列出所有 record types（用於搜尋）
    console.log('\n📝 所有 Record Types (前 50 個):');
    catalog.items.slice(0, 50).forEach((item: any, index: number) => {
      console.log(`  ${index + 1}. ${item.name}`);
    });
    
    if (catalog.items.length > 50) {
      console.log(`  ... 還有 ${catalog.items.length - 50} 個`);
    }
    
  } catch (error: any) {
    console.error('❌ 錯誤:', error.message);
    console.error('Stack:', error.stack);
  }
}

checkRecordTypes()
  .then(() => {
    console.log('\n✅ 檢查完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 檢查失敗:', error);
    process.exit(1);
  });

