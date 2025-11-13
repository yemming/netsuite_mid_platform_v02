import { NextResponse } from 'next/server';
import { executeSync } from '@/lib/sync-utils';

/**
 * 同步 Tax Codes（稅碼）
 */
export async function POST() {
  const config = {
    tableName: 'ns_tax_codes',
    suiteqlQuery: `
      SELECT 
        st.id,
        st.itemid,
        st.fullname,
        st.rate,
        st.description,
        st.taxtype,
        st.isinactive,
        tt.id as taxtype_id,
        tt.name as taxtype_name,
        tt.country as tax_country,
        tt.description as taxtype_description
      FROM salestaxitem st
      LEFT JOIN taxtype tt ON st.taxtype = tt.id
      ORDER BY st.id
    `,
    transformFunction: (item: any, syncTimestamp: string) => {
      const isActive = item.isinactive !== 'T';

      // 處理 country：從 taxtype 表的 country 欄位取得
      // 根據 NetSuite 邏輯：Employee → Subsidiary → Country → Tax Code
      // 稅碼是從 salestaxitem 和 taxtype 兩張表 JOIN 出來的
      // 使用 tax_country 別名避免欄位名稱衝突
      let country = item.tax_country || null;
      
      // 如果 JOIN 沒有取得 country，嘗試從名稱中提取（作為 fallback）
      if (!country && item.itemid) {
        const itemid = item.itemid.trim();
        
        // 模式 1: VAT_TW, VAT_US 等（底線分隔，後接 2 個大寫字母）
        let countryMatch = itemid.match(/_([A-Z]{2})(?::|[-_]|$|\s)/);
        if (countryMatch) {
          country = countryMatch[1];
        }
        
        // 模式 2: WET-AU, TS-AU 等（連字號分隔，後接 2 個大寫字母）
        if (!country) {
          countryMatch = itemid.match(/-([A-Z]{2})(?::|[-_]|$|\s)/);
          if (countryMatch) {
            country = countryMatch[1];
          }
        }
        
        // 模式 3: 加拿大省份代碼（BC, ON, QC 等）→ CA
        const canadianProvinces = ['BC', 'ON', 'QC', 'AB', 'MB', 'SK', 'NB', 'NS', 'PE', 'NL', 'YT', 'NT', 'NU'];
        if (!country) {
          for (const province of canadianProvinces) {
            const provincePattern = new RegExp(`\\b${province}\\b`, 'i');
            if (provincePattern.test(itemid)) {
              country = 'CA';
              break;
            }
          }
        }
        
        // 模式 4: 美國州代碼（CA, NY, TX 等）→ US
        if (!country) {
          const usStatePattern = /(?:^|[-_\s])([A-Z]{2})(?:[-_\s]|$)/;
          const usStateMatch = itemid.match(usStatePattern);
          if (usStateMatch) {
            const stateCode = usStateMatch[1];
            const knownCountryCodes = ['AU', 'GB', 'UK', 'NZ', 'SG', 'MY', 'TH', 'PH', 'ID', 'VN', 'IN', 'CN', 'JP', 'KR', 'TW', 'HK', 'MO'];
            const isCanadianProvince = canadianProvinces.includes(stateCode);
            if (!knownCountryCodes.includes(stateCode) && !isCanadianProvince) {
              country = 'US';
            }
          }
        }
      }

      return {
        netsuite_internal_id: parseInt(item.id),
        name: item.itemid || '', // itemid 是實際欄位名
        rate: item.rate ? parseFloat(item.rate) : null,
        description: item.description || null,
        country: country, // 國家代碼（從 taxtype.country 取得，或從名稱提取）
        is_inactive: !isActive,
        sync_timestamp: syncTimestamp,
      };
    },
    conflictColumn: 'netsuite_internal_id',
  };

  const result = await executeSync(config);
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}

export async function GET() {
  const { getTableSyncStatus } = await import('@/lib/sync-utils');
  const status = await getTableSyncStatus('ns_tax_codes');
  return NextResponse.json(status);
}

