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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `NetSuite API error (${response.status}): ${errorText}`
      );
    }

    return response.json();
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

