/**
 * 驗證 Table Mapping 配置
 * 
 * 用途：檢查配置檔案中的表名和 API 路由是否正確對應
 * 
 * 執行方式：
 * npx tsx scripts/verify-table-mapping.ts
 */

import { TABLE_MAPPING, getAllTableMappings, isValidTableName, isValidApiRoute } from '../lib/table-mapping';
import { readdir } from 'fs/promises';
import { join } from 'path';

async function verifyTableMapping() {
  console.log('🔍 開始驗證 Table Mapping 配置...\n');

  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. 檢查所有配置（從資料庫或 fallback）
  const mappings = await getAllTableMappings();
  console.log(`📋 找到 ${mappings.length} 個表配置\n`);

  // 2. 檢查 API 路由檔案是否存在
  console.log('📁 檢查 API 路由檔案...');
  const apiDir = join(process.cwd(), 'app/api');
  const apiRoutes: string[] = await readdir(apiDir, { withFileTypes: true })
    .then(entries => entries.filter(e => e.isDirectory()).map(e => e.name))
    .catch(() => []);

  for (const mapping of mappings) {
    // 從 API 路由路徑提取目錄名
    const routeDir = mapping.apiRoute.replace('/api/', '');
    
    if (!apiRoutes.includes(routeDir)) {
      errors.push(`❌ API 路由不存在: ${mapping.apiRoute} (找不到目錄: ${routeDir})`);
    } else {
      console.log(`  ✅ ${mapping.label}: ${mapping.apiRoute}`);
    }

    // 檢查表名格式
    if (!mapping.tableName.startsWith('ns_')) {
      warnings.push(`⚠️  表名不符合命名規範: ${mapping.tableName} (應該以 'ns_' 開頭)`);
    }

    // 檢查衝突欄位
    if (!mapping.conflictColumn) {
      errors.push(`❌ 缺少衝突欄位配置: ${mapping.tableName}`);
    }
  }

  // 3. 檢查重複的表名
  const tableNames = mappings.map(m => m.tableName);
  const duplicateTableNames = tableNames.filter((name, index) => tableNames.indexOf(name) !== index);
  if (duplicateTableNames.length > 0) {
    errors.push(`❌ 發現重複的表名: ${duplicateTableNames.join(', ')}`);
  }

  // 4. 檢查重複的 API 路由
  const apiRoutes_list = mappings.map(m => m.apiRoute);
  const duplicateApiRoutes = apiRoutes_list.filter((route, index) => apiRoutes_list.indexOf(route) !== index);
  if (duplicateApiRoutes.length > 0) {
    errors.push(`❌ 發現重複的 API 路由: ${duplicateApiRoutes.join(', ')}`);
  }

  // 5. 驗證工具函數
  console.log('\n🔧 測試驗證工具函數...');
  const testTableName = 'ns_subsidiaries';
  const testApiRoute = '/api/sync-subsidiaries';
  
  if (isValidTableName(testTableName)) {
    console.log(`  ✅ isValidTableName('${testTableName}') = true`);
  } else {
    errors.push(`❌ isValidTableName('${testTableName}') 應該返回 true`);
  }

  if (isValidApiRoute(testApiRoute)) {
    console.log(`  ✅ isValidApiRoute('${testApiRoute}') = true`);
  } else {
    errors.push(`❌ isValidApiRoute('${testApiRoute}') 應該返回 true`);
  }

  // 6. 輸出結果
  console.log('\n' + '='.repeat(60));
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ 所有檢查通過！配置正確。\n');
    console.log('📊 配置摘要：');
    console.log(`   - 總表數: ${mappings.length}`);
    console.log(`   - 啟用: ${mappings.filter(m => !m.disabled).length}`);
    console.log(`   - 停用: ${mappings.filter(m => m.disabled).length}`);
    return 0;
  } else {
    if (warnings.length > 0) {
      console.log('\n⚠️  警告：');
      warnings.forEach(w => console.log(`  ${w}`));
    }
    if (errors.length > 0) {
      console.log('\n❌ 錯誤：');
      errors.forEach(e => console.log(`  ${e}`));
      return 1;
    }
    return 0;
  }
}

// 執行驗證
verifyTableMapping()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('❌ 驗證過程發生錯誤:', error);
    process.exit(1);
  });

