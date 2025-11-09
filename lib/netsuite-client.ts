// NetSuite REST API 客戶端（直接連接，不使用 n8n）
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

export interface NetSuiteConfig {
  accountId: string;
  consumerKey: string;
  consumerSecret: string;
  tokenId: string;
  tokenSecret: string;
}

export class NetSuiteAPIClient {
  private config: NetSuiteConfig;
  private baseUrl: string;
  private oauth: any;

  constructor(config: NetSuiteConfig) {
    this.config = config;
    
    // 決定 API URL（根據 account ID 判斷環境）
    const isSandbox = config.accountId.startsWith('TST') || 
                      config.accountId.startsWith('SB') || 
                      config.accountId.startsWith('TD');
    this.baseUrl = `https://${config.accountId.toLowerCase()}.suitetalk.api.netsuite.com`;

    // 初始化 OAuth
    // @ts-ignore - oauth-1.0a 類型定義問題
    this.oauth = OAuth({
      consumer: {
        key: config.consumerKey,
        secret: config.consumerSecret,
      },
      signature_method: 'HMAC-SHA256',
      hash_function(baseString: string, key: string) {
        return crypto.createHmac('sha256', key).update(baseString).digest('base64');
      },
    });
  }

  // 生成 OAuth 認證標頭
  private generateAuthHeader(method: string, url: string): string {
    const token = {
      key: this.config.tokenId,
      secret: this.config.tokenSecret,
    };

    const requestData = {
      url: url,
      method: method,
    };

    const authData = this.oauth.authorize(requestData, token);
    const header = this.oauth.toHeader(authData);
    
    // NetSuite 需要加入 realm
    header.Authorization += `, realm="${this.config.accountId.toUpperCase()}"`;

    return header.Authorization;
  }

  // 通用 API 請求方法
  async request<T = any>(
    endpoint: string,
    method: string = 'GET',
    body?: any,
    params?: Record<string, string>
  ): Promise<T> {
    // 建立完整 URL
    let url = `${this.baseUrl}${endpoint}`;
    if (params && Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }

    // 生成認證標頭
    const authHeader = this.generateAuthHeader(method, url);

    // 準備請求標頭
    const headers: Record<string, string> = {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // 發送請求
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // 先讀取回應內容
    const responseText = await response.text();
    
    if (!response.ok) {
      // 檢查是否為 HTML 錯誤頁面
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
        // 嘗試從 HTML 中提取錯誤訊息
        const titleMatch = responseText.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : 'NetSuite 錯誤頁面';
        
        throw new Error(
          `NetSuite API error (${response.status}): ${title}。NetSuite 返回了 HTML 錯誤頁面，可能是：1) REST Web 服務權限未開啟 2) 端點不存在 3) 認證失敗。請檢查 NetSuite 權限設定。`
        );
      }
      
      // 嘗試解析 JSON 錯誤
      try {
        const errorJson = JSON.parse(responseText);
        const errorDetail = errorJson.error || errorJson.message || responseText;
        throw new Error(
          `NetSuite API error (${response.status}): ${errorDetail}`
        );
      } catch {
        // 如果不是 JSON，直接使用文字（限制長度避免過長）
        throw new Error(
          `NetSuite API error (${response.status}): ${responseText.substring(0, 500)}`
        );
      }
    }

    // 成功回應：檢查是否為 JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        return JSON.parse(responseText);
      } catch {
        throw new Error(
          `NetSuite API 返回了聲稱是 JSON 但無法解析的回應: ${responseText.substring(0, 200)}`
        );
      }
    } else {
      // 如果不是 JSON，可能是 HTML 或其他格式
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
        throw new Error(
          `NetSuite API 返回了 HTML 頁面而不是 JSON。可能是權限問題或端點不存在。`
        );
      }
      // 嘗試解析為 JSON（某些 API 可能沒有正確設定 Content-Type）
      try {
        return JSON.parse(responseText);
      } catch {
        throw new Error(
          `NetSuite API 返回了非 JSON 格式的回應: ${responseText.substring(0, 200)}`
        );
      }
    }
  }

  // 測試連線並取得公司名稱
  async testConnection(): Promise<{ success: boolean; message: string; companyName?: string; data?: any }> {
    try {
      // 先測試基本連線
      const catalogData = await this.request<{
        items: Array<{ name: string; links: Array<{ rel: string; href: string }> }>;
      }>('/services/rest/record/v1/metadata-catalog');
      
      // 嘗試取得公司名稱
      let companyName = '未知公司';
      try {
        // 使用 SuiteQL 查詢公司資訊
        // NetSuite SuiteQL 使用 FETCH FIRST n ROWS ONLY 而不是 LIMIT
        const suiteqlResult = await this.executeSuiteQL(
          "SELECT companyname FROM companyinformation FETCH FIRST 1 ROWS ONLY"
        );
        
        if (suiteqlResult.items && suiteqlResult.items.length > 0) {
          companyName = suiteqlResult.items[0].companyname || '未知公司';
        }
      } catch (suiteqlError) {
        // 如果 SuiteQL 失敗，嘗試其他方法
        console.log('SuiteQL 查詢失敗，嘗試其他方法:', suiteqlError);
        try {
          // 嘗試從 Account Information API 取得
          const accountInfo = await this.request('/services/rest/record/v1/metadata-catalog');
          // 如果上述方法都失敗，使用 Account ID 作為顯示名稱
          companyName = this.config.accountId;
        } catch {
          // 最後備選方案：使用 Account ID
          companyName = this.config.accountId;
        }
      }
      
      return {
        success: true,
        message: '連線成功',
        companyName: companyName,
        data: catalogData
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '連線失敗'
      };
    }
  }

  // 取得 metadata catalog（可用資料集列表）
  async getMetadataCatalog() {
    return this.request<{
      items: Array<{ name: string; links: Array<{ rel: string; href: string }> }>;
    }>('/services/rest/record/v1/metadata-catalog');
  }

  // 查詢客戶列表
  async getCustomersList(params?: {
    limit?: number;
    offset?: number;
    q?: string;
  }) {
    const queryParams: Record<string, string> = {};
    if (params?.limit) queryParams.limit = params.limit.toString();
    if (params?.offset) queryParams.offset = params.offset.toString();
    if (params?.q) queryParams.q = params.q;

    return this.request<{
      items: Array<{ id: string; links: Array<{ rel: string; href: string }> }>;
      count?: number;
      hasMore?: boolean;
    }>(
      '/services/rest/record/v1/customer',
      'GET',
      undefined,
      queryParams
    );
  }

  // 取得單一客戶
  async getCustomer(customerId: string) {
    return this.request(`/services/rest/record/v1/customer/${customerId}`);
  }

  // 查詢銷售訂單列表
  async getSalesOrdersList(params?: {
    limit?: number;
    offset?: number;
    q?: string;
  }) {
    const queryParams: Record<string, string> = {};
    if (params?.limit) queryParams.limit = params.limit.toString();
    if (params?.offset) queryParams.offset = params.offset.toString();
    if (params?.q) queryParams.q = params.q;

    return this.request<{
      items: Array<{ id: string; links: Array<{ rel: string; href: string }> }>;
      count?: number;
      hasMore?: boolean;
    }>(
      '/services/rest/record/v1/salesorder',
      'GET',
      undefined,
      queryParams
    );
  }

  // 取得單一訂單
  async getSalesOrder(orderId: string) {
    return this.request(`/services/rest/record/v1/salesorder/${orderId}`);
  }

  // 查詢產品列表
  async getItemsList(params?: {
    limit?: number;
    offset?: number;
    q?: string;
  }) {
    const queryParams: Record<string, string> = {};
    if (params?.limit) queryParams.limit = params.limit.toString();
    if (params?.offset) queryParams.offset = params.offset.toString();
    if (params?.q) queryParams.q = params.q;

    return this.request<{
      items: Array<{ id: string; links: Array<{ rel: string; href: string }> }>;
      count?: number;
      hasMore?: boolean;
    }>(
      '/services/rest/record/v1/inventoryitem',
      'GET',
      undefined,
      queryParams
    );
  }

  // 取得單一產品
  async getItem(itemId: string) {
    return this.request(`/services/rest/record/v1/inventoryitem/${itemId}`);
  }

  // 通用 REST API 記錄列表查詢（支援分頁）
  // 先嘗試直接列表 API，如果失敗則使用搜索 API
  async getRecordList(
    recordType: string,
    params?: {
      limit?: number;
      offset?: number;
      q?: string;
      fetchAll?: boolean;
    }
  ): Promise<{
    items: any[];
    count?: number;
    hasMore?: boolean;
  }> {
    const fetchAll = params?.fetchAll ?? true;
    const allItems: any[] = [];
    let offset = params?.offset || 0;
    const limit = params?.limit || 1000;

    // 直接使用列表 API（不使用 q 參數，避免被解釋為搜索查詢）
    const queryParams: Record<string, string> = {};
    if (params?.limit) queryParams.limit = params.limit.toString();
    if (params?.offset) queryParams.offset = params.offset.toString();
    // 注意：不使用 q 參數，因為會被解釋為搜索查詢

    do {
      queryParams.offset = offset.toString();
      queryParams.limit = limit.toString();

      // 注意：URL 結尾需要有斜線，NetSuite API 要求
      const endpoint = `/services/rest/record/v1/${recordType}${recordType.endsWith('/') ? '' : '/'}`;
      
      const result = await this.request<{
        items: Array<any>;
        count?: number;
        hasMore?: boolean;
      }>(
        endpoint,
        'GET',
        undefined,
        queryParams
      );

      if (result.items && Array.isArray(result.items)) {
        allItems.push(...result.items);
      }

      if (fetchAll && result.hasMore) {
        offset += limit;
      } else {
        break;
      }
    } while (fetchAll);

    return {
      items: allItems,
      count: allItems.length,
      hasMore: false,
    };
  }

  // 取得單一記錄（通用）
  async getRecord(recordType: string, recordId: string) {
    return this.request(`/services/rest/record/v1/${recordType}/${recordId}`);
  }

  // 創建記錄（通用）
  async createRecord(recordType: string, recordData: any): Promise<any> {
    const endpoint = `/services/rest/record/v1/${recordType}`;
    return this.request(endpoint, 'POST', recordData);
  }

  // 更新記錄（通用）
  async updateRecord(recordType: string, recordId: string, recordData: any): Promise<any> {
    const endpoint = `/services/rest/record/v1/${recordType}/${recordId}`;
    return this.request(endpoint, 'PUT', recordData);
  }

  // 執行 SuiteQL 查詢（支援自動分頁取得所有資料）
  async executeSuiteQL(
    query: string, 
    options?: { fetchAll?: boolean; maxRecords?: number }
  ): Promise<{
    items: any[];
    count?: number;
    hasMore?: boolean;
    links?: Array<{ rel: string; href: string }>;
  }> {
    const endpoint = '/services/rest/query/v1/suiteql';
    const fetchAll = options?.fetchAll ?? true; // 預設取得所有資料
    const maxRecords = options?.maxRecords; // 可選的最大記錄數限制
    
    // 建立完整 URL
    const url = `${this.baseUrl}${endpoint}`;
    
    // 生成認證標頭（用於首次請求）
    let authHeader = this.generateAuthHeader('POST', url);
    
    // 準備請求標頭（SuiteQL 需要 Prefer header）
    const headers: Record<string, string> = {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Prefer': 'transient',
      'Accept': 'application/json',
    };
    
    // 收集所有結果
    let allItems: any[] = [];
    let nextLink: string | null = null;
    let requestUrl = url;
    let requestBody = JSON.stringify({ q: query });
    
    do {
      // 如果是後續請求，使用 next link
      if (nextLink) {
        // 處理 next link：NetSuite 的 next link 可能是完整 URL 或相對路徑
        let parsedUrl: URL;
        try {
          if (nextLink.startsWith('http://') || nextLink.startsWith('https://')) {
            parsedUrl = new URL(nextLink);
          } else {
            // 相對路徑，加上 baseUrl
            const fullPath = nextLink.startsWith('/') ? nextLink : `/${nextLink}`;
            parsedUrl = new URL(`${this.baseUrl}${fullPath}`);
          }
          
          // 提取路徑和查詢參數
          requestUrl = `${this.baseUrl}${parsedUrl.pathname}${parsedUrl.search}`;
          
          // 從 URL 中提取可能的 cursor 或其他分頁參數
          const cursor = parsedUrl.searchParams.get('cursor');
          const offset = parsedUrl.searchParams.get('offset');
          
          // 根據 NetSuite API 文檔，分頁可能需要將 cursor 或其他參數放在 body 中
          // 但為了兼容性，我們先嘗試在 URL 中保留查詢參數，body 使用原始查詢
          // 如果失敗，我們會降級處理
          requestBody = JSON.stringify({ q: query });
          
        } catch (urlError) {
          // 如果 URL 解析失敗，嘗試直接使用 nextLink
          console.warn('無法解析 next link:', nextLink, urlError);
          requestUrl = nextLink.startsWith('http') ? nextLink : `${this.baseUrl}${nextLink}`;
          requestBody = JSON.stringify({ q: query });
        }
        
        // 重新生成認證標頭（所有請求都使用 POST）
        authHeader = this.generateAuthHeader('POST', requestUrl);
        headers['Authorization'] = authHeader;
      }
      
      // 所有請求都使用 POST 方法（NetSuite SuiteQL API 的要求）
      // 但對於 next link，如果 POST 失敗，我們嘗試使用 GET
      let response = await fetch(requestUrl, {
        method: 'POST',
        headers,
        body: requestBody,
      });
      
      // 如果是分頁請求且 POST 失敗，嘗試使用 GET 方法
      if (!response.ok && nextLink) {
        // 先檢查狀態碼，如果是 405 Method Not Allowed，直接嘗試 GET
        if (response.status === 405) {
          // 嘗試使用 GET 方法（移除 body，因為 GET 不需要 body）
          const getHeaders = { ...headers };
          delete (getHeaders as any)['Content-Type']; // GET 請求可能不需要 Content-Type
          authHeader = this.generateAuthHeader('GET', requestUrl);
          getHeaders['Authorization'] = authHeader;
          
          response = await fetch(requestUrl, {
            method: 'GET',
            headers: getHeaders,
          });
        } else {
          // 讀取錯誤文本檢查是否為方法不支持錯誤
          const errorText = await response.text();
          const isUnsupportedMethod = errorText.includes('Unsupported HTTP method') || 
                                       errorText.includes('unsupported');
          
          if (isUnsupportedMethod) {
            // 嘗試使用 GET 方法
            const getHeaders = { ...headers };
            delete (getHeaders as any)['Content-Type'];
            authHeader = this.generateAuthHeader('GET', requestUrl);
            getHeaders['Authorization'] = authHeader;
            
            response = await fetch(requestUrl, {
              method: 'GET',
              headers: getHeaders,
            });
          } else {
            // 如果不是方法錯誤，保留原始錯誤以便後續處理
            // 創建一個新的 Response 對象，因為 body 已經被讀取
            response = new Response(errorText, {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
            });
          }
        }
      }
      
      if (!response.ok) {
        // 如果是分頁請求失敗，但已經有資料，至少返回已取得的資料
        if (nextLink && allItems.length > 0) {
          console.warn('分頁請求失敗，但已取得部分資料。返回已取得的資料。', response.status);
          break; // 退出循環，返回已取得的資料
        }
        
        // 如果是第一次請求失敗，則拋出錯誤
        const errorText = await response.text();
        let errorMessage = `NetSuite API error (${response.status})`;
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson['o:errorDetails'] && errorJson['o:errorDetails'][0]) {
            errorMessage = errorJson['o:errorDetails'][0].detail || errorMessage;
          } else if (errorJson.detail) {
            errorMessage = errorJson.detail;
          } else if (errorJson.title) {
            errorMessage = errorJson.title;
          }
        } catch {
          errorMessage = errorText.substring(0, 500);
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      // 合併結果
      if (result.items && Array.isArray(result.items)) {
        allItems = allItems.concat(result.items);
      }
      
      // 檢查是否還有更多資料
      nextLink = null;
      if (fetchAll && result.hasMore && result.links) {
        // 尋找 next link
        const nextLinkObj = result.links.find((link: any) => link.rel === 'next');
        if (nextLinkObj && nextLinkObj.href) {
          nextLink = nextLinkObj.href;
        }
      }
      
      // 如果設定了最大記錄數限制，檢查是否已達到
      if (maxRecords && allItems.length >= maxRecords) {
        allItems = allItems.slice(0, maxRecords);
        nextLink = null; // 停止繼續請求
      }
    } while (nextLink && fetchAll);
    
    // 返回合併後的結果
    return {
      items: allItems,
      count: allItems.length,
      hasMore: !!nextLink, // 如果還有 nextLink，表示還有更多資料
      links: nextLink ? [{ rel: 'next', href: nextLink }] : [],
    };
  }
}

// 建立單例
let netsuiteAPIClient: NetSuiteAPIClient | null = null;

export function getNetSuiteAPIClient(): NetSuiteAPIClient {
  if (!netsuiteAPIClient) {
    const config: NetSuiteConfig = {
      accountId: process.env.NETSUITE_ACCOUNT_ID || '',
      consumerKey: process.env.NETSUITE_CONSUMER_KEY || '',
      consumerSecret: process.env.NETSUITE_CONSUMER_SECRET || '',
      tokenId: process.env.NETSUITE_TOKEN_ID || '',
      tokenSecret: process.env.NETSUITE_TOKEN_SECRET || '',
    };

    // 驗證配置
    if (!config.accountId || !config.consumerKey || !config.consumerSecret || 
        !config.tokenId || !config.tokenSecret) {
      throw new Error('NetSuite 環境變數未完整設定');
    }

    netsuiteAPIClient = new NetSuiteAPIClient(config);
  }

  return netsuiteAPIClient;
}

