import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試 BOM Components 的查詢方式
 */
export async function POST() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
      bomId: '1', // AAA BOM ID
    };

    // 嘗試各種可能的 sub-resource 端點
    const subResourcePaths = [
      'component',           // 單數
      'components',         // 複數
      'item',               // 可能的欄位名
      'items',              // 複數
      'bomcomponent',       // 可能的命名
      'bomcomponents',      // 複數
      'line',               // 可能的命名
      'lines',              // 複數
    ];

    for (const path of subResourcePaths) {
      try {
        const subResource = await netsuite.request(
          `/services/rest/record/v1/bom/1/${path}`,
          'GET'
        );
        results[`subResource_${path}`] = {
          success: true,
          data: subResource,
        };
      } catch (error: any) {
        results[`subResource_${path}`] = {
          success: false,
          error: error.message,
        };
      }
    }

    // 嘗試使用 Search API 查詢 BOM Components
    try {
      const searchResult = await netsuite.request(
        '/services/rest/record/v1/bomcomponent/search',
        'POST',
        {
          basic: {
            field: 'billofmaterials',
            operator: 'anyOf',
            value: [1],
          },
        }
      );
      results.search_bomcomponent = {
        success: true,
        data: searchResult,
      };
    } catch (error: any) {
      results.search_bomcomponent = {
        success: false,
        error: error.message,
      };
    }

    // 檢查 BOM 詳細資訊中的 links，看看是否有 components 相關的 link
    try {
      const bomDetail = await netsuite.getRecord('bom', '1');
      if (bomDetail.links) {
        const componentLinks = bomDetail.links.filter((link: any) =>
          link.rel?.toLowerCase().includes('component') ||
          link.href?.toLowerCase().includes('component') ||
          link.rel?.toLowerCase().includes('item') ||
          link.href?.toLowerCase().includes('item')
        );
        results.bomLinks = {
          allLinks: bomDetail.links,
          componentRelatedLinks: componentLinks,
        };
      }
    } catch (error: any) {
      results.bomLinksError = error.message;
    }

    return NextResponse.json({
      success: true,
      message: '測試完成',
      results,
    });
  } catch (error: any) {
    console.error('測試錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '測試失敗',
        message: error.message || '測試時發生錯誤',
        details: error,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: '請使用 POST 方法測試 BOM Components',
    endpoint: '/api/test-bom-components',
    method: 'POST',
  });
}

