import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 檢查 NetSuite 中可用的 Record Types
 * 找出 accountingperiod、bom、workcenter 的正確名稱
 */
export async function GET() {
  try {
    const netsuite = getNetSuiteAPIClient();
    
    // 取得 metadata catalog
    const catalog = await netsuite.getMetadataCatalog();
    
    if (!catalog.items || catalog.items.length === 0) {
      return NextResponse.json({
        success: false,
        error: '無法取得 metadata catalog',
      });
    }
    
    // 搜尋相關的 record types
    const keywords = ['accounting', 'period', 'bom', 'bill', 'material', 'work', 'center'];
    
    const relevantTypes: any[] = [];
    
    catalog.items.forEach((item: any) => {
      const name = item.name?.toLowerCase() || '';
      const matches = keywords.some(keyword => name.includes(keyword));
      
      if (matches) {
        relevantTypes.push({
          name: item.name,
          links: item.links,
        });
      }
    });
    
    // 特別搜尋我們需要的三個
    const targets = [
      'accountingperiod',
      'accountingperiod',
      'bom',
      'billofmaterials',
      'workcenter',
      'workcenter',
    ];
    
    const foundTargets: any = {};
    targets.forEach(target => {
      const found = catalog.items.find((item: any) => 
        item.name?.toLowerCase() === target.toLowerCase()
      );
      
      if (found) {
        foundTargets[target] = {
          found: true,
          name: found.name,
          links: found.links,
        };
      } else {
        foundTargets[target] = {
          found: false,
        };
      }
    });
    
    return NextResponse.json({
      success: true,
      totalRecordTypes: catalog.items.length,
      relevantTypes: relevantTypes,
      targetSearch: foundTargets,
      allRecordTypes: catalog.items.slice(0, 100).map((item: any) => item.name),
    });
  } catch (error: any) {
    console.error('檢查 Record Types 錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '檢查失敗',
        message: error.message || '檢查 Record Types 時發生錯誤',
        details: error,
      },
      { status: 500 }
    );
  }
}

