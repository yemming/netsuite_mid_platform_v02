import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 從 metadata catalog 找出所有 item 相關的 record types
 */
export async function GET() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
    };

    // 取得 metadata catalog
    const catalog = await netsuite.getMetadataCatalog();
    
    // 找出所有包含 "item" 的 record types
    const itemRelatedTypes = catalog.items?.filter((item: any) => {
      const name = item.name?.toLowerCase() || '';
      return name.includes('item') || 
             name.includes('inventory') || 
             name.includes('service') || 
             name.includes('noninventory') ||
             name.includes('discount') ||
             name.includes('group') ||
             name.includes('kit') ||
             name.includes('assembly') ||
             name.includes('gift') ||
             name.includes('markup') ||
             name.includes('download') ||
             name.includes('payment');
    }) || [];

    results.itemRelatedTypes = itemRelatedTypes.map((item: any) => ({
      name: item.name,
      links: item.links,
    }));

    // 測試每個找到的 record type 是否能取得資料
    results.tests = {};
    for (const itemType of itemRelatedTypes) {
      const typeName = itemType.name;
      try {
        const result = await netsuite.getRecordList(typeName, {
          fetchAll: false,
          limit: 10,
        });
        
        results.tests[typeName] = {
          success: true,
          count: result.items?.length || 0,
          hasMore: result.hasMore || false,
          sample: result.items?.[0] || null,
        };
      } catch (error: any) {
        results.tests[typeName] = {
          success: false,
          error: error.message || error.toString(),
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: `找到 ${itemRelatedTypes.length} 個 item 相關的 Record Types`,
      results,
    });
  } catch (error: any) {
    console.error('查詢 Item Record Types 錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '查詢失敗',
        message: error.message || '查詢時發生錯誤',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}

