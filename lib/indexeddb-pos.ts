/**
 * IndexedDB 工具類別 - 行動POS系統
 * 用於離線儲存商品資料、購物車和交易記錄
 */

export interface POSItem {
  id?: number;
  barcode: string; // 條碼
  name: string; // 商品名稱
  price: number; // 單價
  unit: string; // 單位（如：個、包、瓶）
  category?: string; // 分類
  image?: string; // 商品圖片URL
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CartItem {
  id?: number;
  itemId: number; // 商品ID
  barcode: string; // 條碼（快取）
  name: string; // 商品名稱（快取）
  price: number; // 單價（快取）
  quantity: number; // 數量
  subtotal: number; // 小計
  createdAt?: Date;
}

export interface Transaction {
  id?: number;
  transactionNumber: string; // 交易編號
  items: CartItem[]; // 交易商品
  subtotal: number; // 小計
  tax: number; // 稅額（5%）
  total: number; // 總額
  paymentMethod: 'cash' | 'linepay' | 'credit'; // 付款方式
  mobileCarrier?: string; // 手機載具
  taxIdNumber?: string; // 統編（統一編號）
  cashReceived?: number; // 現金收款金額
  cashChange?: number; // 找零
  createdAt: Date;
}

export interface ReceivingItem {
  id?: number;
  itemId: number; // 商品ID
  barcode: string; // 條碼（快取）
  name: string; // 商品名稱（快取）
  unit: string; // 單位（快取）
  quantity: number; // 收貨數量
  createdAt?: Date;
}

export interface ReceivingRecord {
  id?: number;
  receivingNumber: string; // 收貨單號
  items: ReceivingItem[]; // 收貨商品
  supplier?: string; // 供應商（選填）
  memo?: string; // 備註（選填）
  createdAt: Date;
}

export interface OrderingItem {
  id?: number;
  itemId: number; // 商品ID
  barcode: string; // 條碼（快取）
  name: string; // 商品名稱（快取）
  unit: string; // 單位（快取）
  quantity: number; // 訂購數量
  createdAt?: Date;
}

export interface OrderingRecord {
  id?: number;
  orderingNumber: string; // 訂貨單號
  items: OrderingItem[]; // 訂貨商品
  supplier?: string; // 供應商（選填）
  memo?: string; // 備註（選填）
  createdAt: Date;
}

const DB_NAME = 'MobilePOS';
const DB_VERSION = 3;

// Store 名稱
const STORES = {
  ITEMS: 'items',
  CART: 'cart',
  TRANSACTIONS: 'transactions',
  RECEIVINGS: 'receivings',
  ORDERINGS: 'orderings',
} as const;

class IndexedDBPOS {
  private db: IDBDatabase | null = null;

  /**
   * 初始化資料庫
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('無法開啟 IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 商品資料表
        if (!db.objectStoreNames.contains(STORES.ITEMS)) {
          const itemStore = db.createObjectStore(STORES.ITEMS, {
            keyPath: 'id',
            autoIncrement: true,
          });
          itemStore.createIndex('barcode', 'barcode', { unique: true });
          itemStore.createIndex('name', 'name');
        }

        // 購物車表
        if (!db.objectStoreNames.contains(STORES.CART)) {
          const cartStore = db.createObjectStore(STORES.CART, {
            keyPath: 'id',
            autoIncrement: true,
          });
          cartStore.createIndex('barcode', 'barcode');
        }

        // 交易記錄表
        if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
          const transactionStore = db.createObjectStore(STORES.TRANSACTIONS, {
            keyPath: 'id',
            autoIncrement: true,
          });
          transactionStore.createIndex('transactionNumber', 'transactionNumber', { unique: true });
          transactionStore.createIndex('createdAt', 'createdAt');
        }

        // 收貨記錄表
        if (!db.objectStoreNames.contains(STORES.RECEIVINGS)) {
          const receivingStore = db.createObjectStore(STORES.RECEIVINGS, {
            keyPath: 'id',
            autoIncrement: true,
          });
          receivingStore.createIndex('receivingNumber', 'receivingNumber', { unique: true });
          receivingStore.createIndex('createdAt', 'createdAt');
        }

        // 訂貨記錄表
        if (!db.objectStoreNames.contains(STORES.ORDERINGS)) {
          const orderingStore = db.createObjectStore(STORES.ORDERINGS, {
            keyPath: 'id',
            autoIncrement: true,
          });
          orderingStore.createIndex('orderingNumber', 'orderingNumber', { unique: true });
          orderingStore.createIndex('createdAt', 'createdAt');
        }
      };
    });
  }

  /**
   * 確保資料庫已初始化
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('資料庫初始化失敗');
    }
    return this.db;
  }

  // ==================== 商品管理 ====================

  /**
   * 新增或更新商品
   */
  async upsertItem(item: POSItem): Promise<number> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ITEMS], 'readwrite');
      const store = transaction.objectStore(STORES.ITEMS);
      const index = store.index('barcode');

      // 檢查是否已存在相同條碼的商品
      const request = index.get(item.barcode);

      request.onsuccess = () => {
        const existing = request.result;
        const now = new Date();

        if (existing) {
          // 更新現有商品
          const updated: POSItem = {
            ...existing,
            ...item,
            updatedAt: now,
          };
          const updateRequest = store.put(updated);
          updateRequest.onsuccess = () => resolve(existing.id!);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          // 新增新商品
          const newItem: POSItem = {
            ...item,
            createdAt: now,
            updatedAt: now,
          };
          const addRequest = store.add(newItem);
          addRequest.onsuccess = () => resolve(addRequest.result as number);
          addRequest.onerror = () => reject(addRequest.error);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 批次新增商品
   */
  async batchUpsertItems(items: POSItem[]): Promise<void> {
    for (const item of items) {
      await this.upsertItem(item);
    }
  }

  /**
   * 根據條碼查詢商品
   */
  async getItemByBarcode(barcode: string): Promise<POSItem | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ITEMS], 'readonly');
      const store = transaction.objectStore(STORES.ITEMS);
      const index = store.index('barcode');
      const request = index.get(barcode);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 取得所有商品
   */
  async getAllItems(): Promise<POSItem[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ITEMS], 'readonly');
      const store = transaction.objectStore(STORES.ITEMS);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 刪除商品
   */
  async deleteItem(id: number): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ITEMS], 'readwrite');
      const store = transaction.objectStore(STORES.ITEMS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== 購物車管理 ====================

  /**
   * 新增商品到購物車
   */
  async addToCart(item: POSItem, quantity: number = 1): Promise<number> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CART], 'readwrite');
      const store = transaction.objectStore(STORES.CART);
      const index = store.index('barcode');

      // 檢查購物車中是否已有此商品
      const request = index.get(item.barcode);

      request.onsuccess = () => {
        const existing = request.result;

        if (existing) {
          // 更新數量
          const updated: CartItem = {
            ...existing,
            quantity: existing.quantity + quantity,
            subtotal: (existing.quantity + quantity) * existing.price,
          };
          const updateRequest = store.put(updated);
          updateRequest.onsuccess = () => resolve(existing.id!);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          // 新增到購物車
          const cartItem: CartItem = {
            itemId: item.id!,
            barcode: item.barcode,
            name: item.name,
            price: item.price,
            quantity,
            subtotal: quantity * item.price,
            createdAt: new Date(),
          };
          const addRequest = store.add(cartItem);
          addRequest.onsuccess = () => resolve(addRequest.result as number);
          addRequest.onerror = () => reject(addRequest.error);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 取得購物車所有商品
   */
  async getCartItems(): Promise<CartItem[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CART], 'readonly');
      const store = transaction.objectStore(STORES.CART);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 更新購物車商品數量
   */
  async updateCartItemQuantity(id: number, quantity: number): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CART], 'readwrite');
      const store = transaction.objectStore(STORES.CART);
      const request = store.get(id);

      request.onsuccess = () => {
        const item = request.result;
        if (!item) {
          reject(new Error('購物車商品不存在'));
          return;
        }

        if (quantity <= 0) {
          // 數量為0或負數，刪除此商品
          const deleteRequest = store.delete(id);
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => reject(deleteRequest.error);
        } else {
          // 更新數量
          const updated: CartItem = {
            ...item,
            quantity,
            subtotal: quantity * item.price,
          };
          const updateRequest = store.put(updated);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 從購物車移除商品
   */
  async removeFromCart(id: number): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CART], 'readwrite');
      const store = transaction.objectStore(STORES.CART);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 清空購物車
   */
  async clearCart(): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CART], 'readwrite');
      const store = transaction.objectStore(STORES.CART);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== 交易管理 ====================

  /**
   * 建立交易記錄
   */
  async createTransaction(transactionData: Transaction): Promise<number> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const dbTransaction = db.transaction([STORES.TRANSACTIONS], 'readwrite');
      const store = dbTransaction.objectStore(STORES.TRANSACTIONS);
      const request = store.add(transactionData);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 取得所有交易記錄
   */
  async getAllTransactions(limit?: number): Promise<Transaction[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.TRANSACTIONS], 'readonly');
      const store = transaction.objectStore(STORES.TRANSACTIONS);
      const index = store.index('createdAt');
      const request = index.openCursor(null, 'prev'); // 從新到舊

      const results: Transaction[] = [];
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor && (!limit || count < limit)) {
          results.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 根據交易編號查詢交易
   */
  async getTransactionByNumber(transactionNumber: string): Promise<Transaction | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.TRANSACTIONS], 'readonly');
      const store = transaction.objectStore(STORES.TRANSACTIONS);
      const index = store.index('transactionNumber');
      const request = index.get(transactionNumber);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // ==================== 收貨管理 ====================

  /**
   * 建立收貨記錄
   */
  async createReceiving(receivingData: ReceivingRecord): Promise<number> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.RECEIVINGS], 'readwrite');
      const store = transaction.objectStore(STORES.RECEIVINGS);
      const request = store.add(receivingData);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 取得所有收貨記錄
   */
  async getAllReceivings(limit?: number): Promise<ReceivingRecord[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.RECEIVINGS], 'readonly');
      const store = transaction.objectStore(STORES.RECEIVINGS);
      const index = store.index('createdAt');
      const request = index.openCursor(null, 'prev'); // 從新到舊

      const results: ReceivingRecord[] = [];
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor && (!limit || count < limit)) {
          results.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 根據收貨單號查詢收貨記錄
   */
  async getReceivingByNumber(receivingNumber: string): Promise<ReceivingRecord | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.RECEIVINGS], 'readonly');
      const store = transaction.objectStore(STORES.RECEIVINGS);
      const index = store.index('receivingNumber');
      const request = index.get(receivingNumber);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 刪除收貨記錄
   */
  async deleteReceiving(id: number): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.RECEIVINGS], 'readwrite');
      const store = transaction.objectStore(STORES.RECEIVINGS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== 訂貨管理 ====================

  /**
   * 建立訂貨記錄
   */
  async createOrdering(orderingData: OrderingRecord): Promise<number> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ORDERINGS], 'readwrite');
      const store = transaction.objectStore(STORES.ORDERINGS);
      const request = store.add(orderingData);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 取得所有訂貨記錄
   */
  async getAllOrderings(limit?: number): Promise<OrderingRecord[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ORDERINGS], 'readonly');
      const store = transaction.objectStore(STORES.ORDERINGS);
      const index = store.index('createdAt');
      const request = index.openCursor(null, 'prev'); // 從新到舊

      const results: OrderingRecord[] = [];
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor && (!limit || count < limit)) {
          results.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 根據訂貨單號查詢訂貨記錄
   */
  async getOrderingByNumber(orderingNumber: string): Promise<OrderingRecord | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ORDERINGS], 'readonly');
      const store = transaction.objectStore(STORES.ORDERINGS);
      const index = store.index('orderingNumber');
      const request = index.get(orderingNumber);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 刪除訂貨記錄
   */
  async deleteOrdering(id: number): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ORDERINGS], 'readwrite');
      const store = transaction.objectStore(STORES.ORDERINGS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 清空所有商品資料（用於重新初始化）
   */
  async clearAllItems(): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ITEMS], 'readwrite');
      const store = transaction.objectStore(STORES.ITEMS);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 清空整個資料庫（刪除資料庫）
   */
  async deleteDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => {
        this.db = null;
        resolve();
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => {
        // 如果資料庫被其他連線使用，等待一下再重試
        setTimeout(() => {
          const retryRequest = indexedDB.deleteDatabase(DB_NAME);
          retryRequest.onsuccess = () => {
            this.db = null;
            resolve();
          };
          retryRequest.onerror = () => reject(retryRequest.error);
        }, 100);
      };
    });
  }
}

// 匯出單例
export const posDB = new IndexedDBPOS();

