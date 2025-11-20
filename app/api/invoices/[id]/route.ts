import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 使用 SuiteQL 查詢名稱（透過 ID lookup）
 */
async function lookupName(
  netsuite: ReturnType<typeof getNetSuiteAPIClient>,
  tableName: string,
  id: string | number | null | undefined,
  nameField: string = 'name'
): Promise<string> {
  if (!id) return '';
  
  try {
    const idValue = typeof id === 'object' ? (id as any)?.id || (id as any)?.internalId : id;
    if (!idValue) return '';
    
    const query = `
      SELECT ${nameField}
      FROM ${tableName}
      WHERE id = ${idValue}
      AND ROWNUM <= 1
    `;
    
    const result = await netsuite.executeSuiteQL(query, { fetchAll: false });
    if (result.items && result.items.length > 0) {
      return result.items[0][nameField] || String(idValue);
    }
    return String(idValue);
  } catch (error: any) {
    console.warn(`Lookup ${tableName} name failed for ID ${id}:`, error.message);
    return String(id);
  }
}

/**
 * 批次查詢多個 ID 的名稱
 */
async function batchLookupNames(
  netsuite: ReturnType<typeof getNetSuiteAPIClient>,
  tableName: string,
  ids: (string | number | null | undefined)[],
  nameField: string = 'name'
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const validIds = ids
    .map(id => {
      if (!id) return null;
      return typeof id === 'object' ? (id as any)?.id || (id as any)?.internalId : id;
    })
    .filter((id): id is string | number => id !== null && id !== undefined);
  
  if (validIds.length === 0) return result;
  
  try {
    const idList = validIds.join(',');
    const query = `
      SELECT id, ${nameField}
      FROM ${tableName}
      WHERE id IN (${idList})
    `;
    
    const queryResult = await netsuite.executeSuiteQL(query, { fetchAll: false });
    if (queryResult.items) {
      queryResult.items.forEach((item: any) => {
        result[String(item.id)] = item[nameField] || String(item.id);
      });
    }
  } catch (error: any) {
    console.warn(`Batch lookup ${tableName} names failed:`, error.message);
  }
  
  return result;
}

/**
 * 取得單一 NetSuite Invoice 詳細資料
 * 用於 PDF 模板編輯器的測試資料
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
    const netsuite = getNetSuiteAPIClient();

    // 判斷是 ID 還是 tranid（交易編號）
    // 如果全是數字，可能是 ID；如果包含字母或特殊字元，可能是 tranid
    const isNumericId = /^\d+$/.test(invoiceId);
    
    // 方法 1: 優先使用 REST API 取得詳細資料（包含 department, class, location 等完整欄位）
    // 僅當是數字 ID 時才能使用 REST API
    let invoiceData: any = null;
    let usedRestAPI = false;
    
    if (isNumericId) {
      try {
        // NetSuite REST API 的 invoice record type 是 customerinvoice
        invoiceData = await netsuite.getRecord('customerinvoice', invoiceId);
        usedRestAPI = true;
        console.log('使用 REST API 成功取得 Invoice 資料');
      } catch (restError: any) {
        console.warn('REST API 取得失敗，改用 SuiteQL:', restError.message);
      }
    }
    
    // 方法 2: 使用 SuiteQL 查詢（如果 REST API 失敗或使用 tranid）
    // SuiteQL 只能取得基本欄位，不包含 department, class, location, subsidiary
    if (!invoiceData) {
      try {
        let suiteqlQuery: string;
        let foundId: string | null = null;
        
        if (isNumericId) {
          // 使用 ID 查詢
          // 注意：transaction 表在 SuiteQL 中不直接支援 department, class, location, subsidiary
          // 這些欄位需要透過 REST API 或 JOIN 其他表取得
          suiteqlQuery = `
            SELECT 
              id,
              tranid,
              entity,
              trandate,
              duedate,
              status,
              currency,
              memo,
              createddate,
              lastmodifieddate
            FROM transaction
            WHERE type = 'CustInvc'
            AND id = ${invoiceId}
          `;
          foundId = invoiceId;
        } else {
          // 使用 tranid 查詢，先取得 ID
          suiteqlQuery = `
            SELECT 
              id,
              tranid,
              entity,
              trandate,
              duedate,
              status,
              currency,
              memo,
              createddate,
              lastmodifieddate
            FROM transaction
            WHERE type = 'CustInvc'
            AND tranid = '${invoiceId}'
          `;
        }

        const result = await netsuite.executeSuiteQL(suiteqlQuery, {
          fetchAll: false,
        });

        if (result.items && result.items.length > 0) {
          const suiteqlData = result.items[0];
          foundId = suiteqlData.id?.toString() || foundId;
          
          // 如果找到了 ID，嘗試用 REST API 取得完整資料（包含 department, class 等）
          if (foundId && /^\d+$/.test(foundId)) {
            try {
              invoiceData = await netsuite.getRecord('customerinvoice', foundId);
              usedRestAPI = true;
              console.log('使用 SuiteQL 找到 ID，再用 REST API 取得完整 Invoice 資料');
            } catch (restError: any) {
              // REST API 失敗，使用 SuiteQL 的基本資料
              console.warn('REST API 取得完整資料失敗，使用 SuiteQL 基本資料:', restError.message);
              invoiceData = suiteqlData;
            }
          } else {
            // 沒有 ID 或 ID 格式不對，直接使用 SuiteQL 資料
            invoiceData = suiteqlData;
            console.log('使用 SuiteQL 成功取得 Invoice 基本資料');
          }
        } else {
          return NextResponse.json(
            {
              success: false,
              error: '找不到 Invoice',
              message: `找不到 ID 或交易編號為 ${invoiceId} 的 Invoice`,
            },
            { status: 404 }
          );
        }
      } catch (suiteqlError: any) {
        console.error('SuiteQL 查詢錯誤:', suiteqlError);
        return NextResponse.json(
          {
            success: false,
            error: 'SuiteQL 查詢失敗',
            message: `無法取得 Invoice 資料: ${suiteqlError.message}`,
          },
          { status: 500 }
        );
      }
    }

    // 取得 Invoice Line Items（明細項目）
    let lineItems: any[] = [];
    const invoiceInternalId = invoiceData.id || invoiceData.internalId || invoiceData.recordId;
    
    if (invoiceInternalId) {
      try {
        // 方法 1: 嘗試從 REST API 取得 line items
        if (usedRestAPI && invoiceData.item) {
          // REST API 返回的 item 欄位包含 line items
          lineItems = Array.isArray(invoiceData.item) ? invoiceData.item : [];
        } else {
          // 方法 2: 使用 SuiteQL 查詢 transactionLine
          const lineItemsQuery = `
            SELECT 
              id,
              line,
              item,
              itemid,
              description,
              quantity,
              rate,
              amount,
              taxcode,
              taxrate1,
              tax1amt,
              department,
              class,
              location
            FROM transactionLine
            WHERE transaction = ${invoiceInternalId}
            ORDER BY line ASC
          `;
          
          const lineItemsResult = await netsuite.executeSuiteQL(lineItemsQuery, {
            fetchAll: false,
          });
          
          if (lineItemsResult.items && lineItemsResult.items.length > 0) {
            lineItems = lineItemsResult.items;
          }
        }
        
        console.log(`✅ 取得 ${lineItems.length} 個 Invoice Line Items`);
      } catch (lineItemsError: any) {
        console.warn('取得 Invoice Line Items 失敗:', lineItemsError.message);
        // 不中斷流程，繼續返回表頭資料
      }
    }

    // ============================================
    // 將 ID 轉換為名稱（分多次查詢）
    // ============================================
    console.log('開始將 ID 轉換為名稱...');
    
    // 1. 查詢 Entity (Customer) 名稱
    const entityId = invoiceData.entity?.id || invoiceData.entity || invoiceData.entityname;
    let entityName = invoiceData.entity?.name || '';
    if (!entityName && entityId) {
      console.log(`查詢 Customer 名稱 (ID: ${entityId})...`);
      entityName = await lookupName(netsuite, 'customer', entityId, 'companyname');
      if (!entityName) {
        entityName = await lookupName(netsuite, 'customer', entityId, 'fullname');
      }
    }
    
    // 2. 查詢 Currency 名稱
    const currencyId = invoiceData.currency?.id || invoiceData.currency || invoiceData.currencyname;
    let currencyName = invoiceData.currency?.name || '';
    if (!currencyName && currencyId) {
      console.log(`查詢 Currency 名稱 (ID: ${currencyId})...`);
      currencyName = await lookupName(netsuite, 'currency', currencyId, 'name');
      if (!currencyName) {
        currencyName = await lookupName(netsuite, 'currency', currencyId, 'symbol');
      }
    }
    
    // 3. 批次查詢 Location, Department, Class, Subsidiary
    const locationId = invoiceData.location?.id || invoiceData.location;
    const departmentId = invoiceData.department?.id || invoiceData.department;
    const classId = invoiceData.class?.id || invoiceData.class;
    const subsidiaryId = invoiceData.subsidiary?.id || invoiceData.subsidiary;
    
    console.log('批次查詢 Location, Department, Class, Subsidiary...');
    const [locationNames, departmentNames, classNames, subsidiaryNames] = await Promise.all([
      locationId ? batchLookupNames(netsuite, 'location', [locationId]) : Promise.resolve({}),
      departmentId ? batchLookupNames(netsuite, 'department', [departmentId]) : Promise.resolve({}),
      classId ? batchLookupNames(netsuite, 'class', [classId]) : Promise.resolve({}),
      subsidiaryId ? batchLookupNames(netsuite, 'subsidiary', [subsidiaryId]) : Promise.resolve({}),
    ]);
    
    const locationName = invoiceData.location?.name || locationNames[String(locationId)] || '';
    const departmentName = invoiceData.department?.name || departmentNames[String(departmentId)] || '';
    const className = invoiceData.class?.name || classNames[String(classId)] || '';
    const subsidiaryName = invoiceData.subsidiary?.name || subsidiaryNames[String(subsidiaryId)] || '';
    
    // 4. 處理 Line Items 的名稱轉換
    if (lineItems.length > 0) {
      console.log(`處理 ${lineItems.length} 個 Line Items 的名稱轉換...`);
      
      // 收集所有需要查詢的 ID
      const itemIds = lineItems.map(item => item.item?.id || item.item || item.itemid).filter(Boolean);
      const lineItemLocationIds = lineItems.map(item => item.location?.id || item.location).filter(Boolean);
      const lineItemDepartmentIds = lineItems.map(item => item.department?.id || item.department).filter(Boolean);
      const lineItemClassIds = lineItems.map(item => item.class?.id || item.class).filter(Boolean);
      const taxCodeIds = lineItems.map(item => item.taxcode?.id || item.taxcode).filter(Boolean);
      
      // 批次查詢所有名稱
      const [
        itemNames,
        lineItemLocationNames,
        lineItemDepartmentNames,
        lineItemClassNames,
        taxCodeNames,
      ] = await Promise.all([
        itemIds.length > 0 ? batchLookupNames(netsuite, 'item', itemIds, 'itemid') : Promise.resolve({}),
        lineItemLocationIds.length > 0 ? batchLookupNames(netsuite, 'location', lineItemLocationIds) : Promise.resolve({}),
        lineItemDepartmentIds.length > 0 ? batchLookupNames(netsuite, 'department', lineItemDepartmentIds) : Promise.resolve({}),
        lineItemClassIds.length > 0 ? batchLookupNames(netsuite, 'class', lineItemClassIds) : Promise.resolve({}),
        taxCodeIds.length > 0 ? batchLookupNames(netsuite, 'salestaxitem', taxCodeIds, 'itemid') : Promise.resolve({}),
      ]);
      
      // 更新 line items 的名稱
      lineItems = lineItems.map((item: any) => {
        const itemId = item.item?.id || item.item || item.itemid;
        const itemLocationId = item.location?.id || item.location;
        const itemDepartmentId = item.department?.id || item.department;
        const itemClassId = item.class?.id || item.class;
        const itemTaxCodeId = item.taxcode?.id || item.taxcode;
        
        return {
          ...item,
          item: item.item?.name || itemNames[String(itemId)] || item.itemid || item.item || '',
          location: item.location?.name || lineItemLocationNames[String(itemLocationId)] || '',
          department: item.department?.name || lineItemDepartmentNames[String(itemDepartmentId)] || '',
          class: item.class?.name || lineItemClassNames[String(itemClassId)] || '',
          taxcode: item.taxcode?.name || taxCodeNames[String(itemTaxCodeId)] || item.taxcode || '',
        };
      });
      
      console.log('✅ Line Items 名稱轉換完成');
    }
    
    console.log('✅ 所有 ID 轉換為名稱完成');

    // 轉換資料格式，符合 PDF 模板需要的格式
    // 注意：現在所有 ID 都已轉換為名稱
    const formattedData = {
      id: invoiceData.id || invoiceData.internalId || invoiceData.recordId,
      tranid: invoiceData.tranid || invoiceData.tranId || invoiceData.transactionnumber || `INV-${invoiceData.id}`,
      entity: entityName || invoiceData.entity?.name || invoiceData.entityname || '未知客戶',
      trandate: invoiceData.trandate || invoiceData.tranDate || invoiceData.transactiondate || new Date().toISOString().split('T')[0],
      duedate: invoiceData.duedate || invoiceData.dueDate || invoiceData.duedate || null,
      status: invoiceData.status?.name || invoiceData.status || invoiceData.statusRef || 'Pending',
      statusColor: getStatusColor(invoiceData.status?.name || invoiceData.status || invoiceData.statusRef),
      amount: formatAmount(
        invoiceData.amount || 
        invoiceData.total || 
        invoiceData.origtotal || 
        invoiceData.subtotal || 
        invoiceData.balance || 
        0,
        currencyName || invoiceData.currency?.name || invoiceData.currencyname || invoiceData.currencysymbol || 'TWD'
      ),
      currency: currencyName || invoiceData.currency?.name || invoiceData.currencyname || invoiceData.currencysymbol || 'TWD',
      memo: invoiceData.memo || invoiceData.message || '',
      location: locationName || invoiceData.location?.name || '',
      department: departmentName || invoiceData.department?.name || '',
      class: className || invoiceData.class?.name || '',
      subsidiary: subsidiaryName || invoiceData.subsidiary?.name || '',
      createdAt: invoiceData.createddate || invoiceData.createdDate || invoiceData.recordcreateddate || new Date().toISOString(),
      updatedAt: invoiceData.lastmodifieddate || invoiceData.lastModifiedDate || new Date().toISOString(),
      // Invoice Line Items（明細項目）- 已轉換為名稱
      lineItems: lineItems.map((item: any, index: number) => ({
        line: item.line || index + 1,
        item: item.item || item.itemid || '',
        itemId: item.item?.id || item.itemid || item.item || '',
        description: item.description || item.item || '',
        quantity: item.quantity || 0,
        rate: item.rate || 0,
        amount: formatAmount(
          item.amount || (item.quantity * item.rate) || 0,
          currencyName || invoiceData.currency?.name || invoiceData.currencyname || invoiceData.currencysymbol || 'TWD'
        ),
        taxCode: item.taxcode || '',
        taxRate: item.taxrate1 || item.taxRate || 0,
        taxAmount: item.tax1amt || item.taxAmount || 0,
        department: item.department || '',
        class: item.class || '',
        location: item.location || '',
      })),
      // 原始資料（供參考）
      raw: invoiceData,
    };

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error: any) {
    console.error('取得 Invoice 詳細資料錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '取得 Invoice 詳細資料失敗',
        message: error.message || '無法從 NetSuite 取得 Invoice 資料',
      },
      { status: 500 }
    );
  }
}

/**
 * 根據狀態取得對應的顏色
 */
function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    'Pending': '#f59e0b',
    'Pending Approval': '#f59e0b',
    'Pending Fulfillment': '#f59e0b',
    'Pending Billing': '#f59e0b',
    'Open': '#3b82f6', // 藍色 - 開放狀態（未付清）
    'Closed': '#10b981', // 綠色 - 已關閉
    'Voided': '#ef4444', // 紅色 - 已作廢
    'Paid': '#10b981', // 綠色 - 已付清
    'Partially Paid': '#3b82f6', // 藍色 - 部分付款
  };
  
  return statusMap[status] || '#6b7280';
}

/**
 * 格式化金額
 */
function formatAmount(amount: number | string | null, currency: string = 'TWD'): string {
  if (!amount) return 'NT$ 0.00';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return 'NT$ 0.00';
  
  const currencySymbol: Record<string, string> = {
    'TWD': 'NT$',
    'USD': '$',
    'EUR': '€',
    'JPY': '¥',
    'CNY': '¥',
  };
  
  const symbol = currencySymbol[currency] || currency;
  
  const formatted = numAmount.toLocaleString('zh-TW', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return `${symbol} ${formatted}`;
}

