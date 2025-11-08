import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試 Group 和 CRMGroup record types
 * 根據 URL 中有 crmgroup.nl，可能是 crmgroup
 */
export async function POST() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
    };

    // 嘗試各種可能的 record type 名稱
    const groupTypes = [
      'group',
      'crmgroup',
      'employeegroup',
      'staticemployeegroup',
      'manufacturingworkcenter',
      'workcenter',
    ];

    for (const groupType of groupTypes) {
      try {
        const groupList = await netsuite.getRecordList(groupType, {
          fetchAll: false,
          limit: 5,
        });
        
        results[`group_${groupType}`] = {
          success: true,
          count: groupList.items?.length || 0,
          items: groupList.items || [],
        };

        // 如果有資料，取得第一個的詳細資訊
        if (groupList.items && groupList.items.length > 0) {
          try {
            const firstGroup = await netsuite.getRecord(groupType, groupList.items[0].id);
            results[`group_${groupType}`].detail = {
              fields: Object.keys(firstGroup),
              sample: firstGroup,
              // 檢查是否有 manufacturing work center 相關欄位
              manufacturingWorkCenterFields: Object.keys(firstGroup).filter(k => 
                k.toLowerCase().includes('manufacturing') || 
                k.toLowerCase().includes('workcenter') ||
                k.toLowerCase().includes('work_center')
              ),
            };
          } catch (detailError: any) {
            results[`group_${groupType}`].detailError = detailError.message;
          }
        }
      } catch (error: any) {
        results[`group_${groupType}`] = {
          success: false,
          error: error.message,
        };
      }
    }

    // 嘗試查詢特定的 Group ID（2266，從截圖中看到）
    const specificGroupTypes = ['group', 'crmgroup', 'employeegroup'];
    for (const groupType of specificGroupTypes) {
      try {
        const specificGroup = await netsuite.getRecord(groupType, '2266');
        results[`specificGroup_${groupType}_2266`] = {
          success: true,
          fields: Object.keys(specificGroup),
          fullStructure: specificGroup,
        };
      } catch (error: any) {
        results[`specificGroup_${groupType}_2266`] = {
          success: false,
          error: error.message,
        };
      }
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
    message: '請使用 POST 方法測試 Group 相關的 record types',
    endpoint: '/api/test-group-crmgroup',
    method: 'POST',
  });
}

