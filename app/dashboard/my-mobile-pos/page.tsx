'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Store, ShoppingCart, Scan, Trash2, Plus, Minus, X, CreditCard, Smartphone, CheckCircle2, Package, UtensilsCrossed, Coffee, IceCream, ShoppingBag, Cookie, ChefHat, Croissant, Soup, Flame, Sparkles, Heart } from 'lucide-react';
import { posDB, POSItem, CartItem, Transaction } from '@/lib/indexeddb-pos';
import { QRCodeSVG } from 'qrcode.react';
import { productData } from './products-data';
// 簡單的 toast 通知系統
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  // 建立 toast 元素
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${
    type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // 3秒後自動移除
  setTimeout(() => {
    toast.remove();
  }, 3000);
};

export default function MyMobilePOSPage() {
  const [items, setItems] = useState<POSItem[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'linepay' | 'credit'>('cash');
  const [mobileCarrier, setMobileCarrier] = useState('');
  const [taxIdNumber, setTaxIdNumber] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  // LINE Pay 相關狀態
  const [isLinePayQROpen, setIsLinePayQROpen] = useState(false);
  const [linePayQRUrl, setLinePayQRUrl] = useState('');
  const [linePayTransactionId, setLinePayTransactionId] = useState('');
  const [linePayOrderId, setLinePayOrderId] = useState('');
  const [linePayAmount, setLinePayAmount] = useState(0);
  const [linePayStatus, setLinePayStatus] = useState<'waiting' | 'success'>('waiting');
  const linePayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 商品分類相關狀態
  const [selectedCategory, setSelectedCategory] = useState<string>('雜貨類');
  const [filteredItems, setFilteredItems] = useState<POSItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverCart, setDragOverCart] = useState(false);
  
  // 商品分類定義（12個分類）
  const categories = [
    { id: '雜貨類', name: '雜貨類', icon: Package, color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' },
    { id: '泡麵類', name: '泡麵類', icon: UtensilsCrossed, color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' },
    { id: '飲料類', name: '飲料類', icon: Coffee, color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
    { id: '冰品類', name: '冰品類', icon: IceCream, color: 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400' },
    { id: '日常用品類', name: '日常用品類', icon: ShoppingBag, color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
    { id: '零食類', name: '零食類', icon: Cookie, color: 'bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400' },
    { id: '便當類', name: '便當類', icon: ChefHat, color: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' },
    { id: '麵包類', name: '麵包類', icon: Croissant, color: 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
    { id: '關東煮類', name: '關東煮類', icon: Soup, color: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' },
    { id: '熱食類', name: '熱食類', icon: Flame, color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' },
    { id: '美妝類', name: '美妝類', icon: Sparkles, color: 'bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' },
    { id: '保健食品類', name: '保健食品類', icon: Heart, color: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
  ];

  // 初始化資料庫和載入資料
  useEffect(() => {
    const init = async () => {
      try {
        await posDB.init();
        setIsInitialized(true);

        // 載入商品資料
        const allItems = await posDB.getAllItems();
        setItems(allItems);

        // 如果沒有商品，初始化7-11常見商品（12個分類，每個分類20項，共240項）
        if (allItems.length === 0) {
          for (const item of productData) {
            await posDB.upsertItem(item);
          }
          setItems(await posDB.getAllItems());
        }

        // 載入購物車
        const cart = await posDB.getCartItems();
        setCartItems(cart);
      } catch (error) {
        console.error('初始化失敗:', error);
        showToast('系統初始化失敗', 'error');
      }
    };

    init();
  }, []);

  // 根據選中的分類篩選商品
  useEffect(() => {
    const categoryMapping: Record<string, string[]> = {
      '雜貨類': ['雜貨', '食品', '白米', '雞蛋', '泡菜', '醬油', '醋', '鹽', '糖', '胡椒粉', '香油', '味噌'],
      '泡麵類': ['泡麵', '麵食', '速食', '統一', '維力', '來一客', '滿漢', '阿Q', '味味', '日清', '出前一丁', '農心', '辛拉麵'],
      '飲料類': ['飲料', '飲品', '水', '可樂', '礦泉水', '麥香', '茶裏王', '純喫茶', '美粒果', '黑松', '舒跑', '每朝', '義美', '豆奶'],
      '冰品類': ['冰品', '冰淇淋', '冰', '杜老爺', '小美', '義美', '曠世奇派', '百吉', '雪糕', '冰棒'],
      '日常用品類': ['日用品', '用品', '清潔', '衛生紙', '濕紙巾', '垃圾袋', '免洗', '電池', '打火機'],
      '零食類': ['零食', '品客', '樂事', '多力多滋', '義美', '小泡芙', '乖乖', '可樂果', '科學麵', '旺旺', '仙貝', '乳加', '巧克力', '森永', '牛奶糖'],
      '便當類': ['便當', '國民', '雞腿', '排骨', '三杯雞', '麻婆豆腐', '宮保雞丁', '糖醋', '滷雞腿', '香腸', '控肉'],
      '麵包類': ['麵包', '菠蘿', '紅豆', '奶酥', '肉鬆', '起司', '巧克力', '三明治', '可頌', '貝果'],
      '關東煮類': ['關東煮', '白蘿蔔', '魚丸', '貢丸', '黑輪', '米血', '油豆腐', '甜不辣', '魚板', '竹輪', '高麗菜捲'],
      '熱食類': ['熱食', '茶葉蛋', '熱狗', '大亨堡', '烤地瓜', '熱狗堡', '雞塊', '薯條', '炸雞', '烤雞腿', '滷蛋'],
      '美妝類': ['美妝', '護手霜', '護唇膏', '洗面乳', '面膜', '化妝棉', '卸妝棉', '髮圈', '髮夾', '指甲剪', '棉花棒'],
      '保健食品類': ['保健食品', '維他命', 'B群', '葉黃素', '鈣片', '魚油', '益生菌', '膠原蛋白', '蔓越莓', '葡萄糖胺'],
    };

    const keywords = categoryMapping[selectedCategory] || [];
    const filtered = items.filter((item) => {
      if (!item.category) {
        // 如果沒有分類，根據商品名稱判斷
        const itemName = item.name.toLowerCase();
        return keywords.some((keyword) => 
          itemName.includes(keyword.toLowerCase())
        );
      }
      // 根據分類或商品名稱匹配
      const categoryLower = item.category.toLowerCase();
      const nameLower = item.name.toLowerCase();
      return keywords.some((keyword) => 
        categoryLower.includes(keyword.toLowerCase()) ||
        nameLower.includes(keyword.toLowerCase())
      );
    });
    
    setFilteredItems(filtered);
  }, [selectedCategory, items]);

  // 計算單個商品的稅金（含稅價 / 21，四捨五入）
  const calculateItemTax = (price: number): number => {
    return Math.round(price / 21);
  };

  // 計算單個商品的未稅價（含稅價 - 稅金）
  const calculateItemPriceExcludingTax = (price: number): number => {
    const tax = calculateItemTax(price);
    return price - tax;
  };

  // 計算購物車總額（含稅價計算方式）
  // 商品價格是含稅價，需要計算未稅價和稅金
  const cartItemsWithTax = cartItems.map((item) => {
    const itemTax = calculateItemTax(item.price); // 單個商品的稅金
    const itemPriceExcludingTax = calculateItemPriceExcludingTax(item.price); // 單個商品的未稅價
    const totalTax = itemTax * item.quantity; // 該商品總稅金
    const totalPriceExcludingTax = itemPriceExcludingTax * item.quantity; // 該商品總未稅價
    const totalPriceIncludingTax = item.price * item.quantity; // 該商品總含稅價（等於 subtotal）

    return {
      ...item,
      itemTax,
      itemPriceExcludingTax,
      totalTax,
      totalPriceExcludingTax,
      totalPriceIncludingTax,
    };
  });

  // 小計 = 所有商品的未稅價總和
  const cartTotal = cartItemsWithTax.reduce((sum, item) => sum + item.totalPriceExcludingTax, 0);
  // 稅額 = 所有商品的稅金總和
  const tax = cartItemsWithTax.reduce((sum, item) => sum + item.totalTax, 0);
  // 總計 = 小計 + 稅額（應該等於所有商品的含稅價總和）
  const total = cartTotal + tax;

  // 掃描條碼
  const handleScan = async () => {
    if (!barcodeInput.trim()) {
      showToast('請輸入條碼', 'error');
      return;
    }

    try {
      // 從 IndexedDB 查詢商品
      let item = await posDB.getItemByBarcode(barcodeInput.trim());

      if (!item) {
        // 如果找不到商品，提示是否要新增
        const shouldAdd = confirm(`找不到條碼 ${barcodeInput} 的商品，是否要新增？`);
        if (shouldAdd) {
          const name = prompt('請輸入商品名稱：');
          if (!name) return;

          const priceStr = prompt('請輸入商品價格：');
          const price = parseFloat(priceStr || '0');
          if (isNaN(price) || price <= 0) {
            showToast('價格格式錯誤', 'error');
            return;
          }

          item = {
            barcode: barcodeInput.trim(),
            name,
            price,
            unit: '個',
          };
          await posDB.upsertItem(item);
          setItems(await posDB.getAllItems());
          showToast('商品已新增', 'success');
        } else {
          setBarcodeInput('');
          return;
        }
      }

      // 加入購物車
      await posDB.addToCart(item);
      const updatedCart = await posDB.getCartItems();
      setCartItems(updatedCart);
      setBarcodeInput('');
      barcodeInputRef.current?.focus();
      showToast(`已加入：${item.name}`, 'success');
    } catch (error) {
      console.error('掃描失敗:', error);
      showToast('掃描失敗', 'error');
    }
  };

  // 更新購物車商品數量
  const handleUpdateQuantity = async (id: number, quantity: number) => {
    try {
      await posDB.updateCartItemQuantity(id, quantity);
      const updatedCart = await posDB.getCartItems();
      setCartItems(updatedCart);
    } catch (error) {
      console.error('更新數量失敗:', error);
      showToast('更新失敗', 'error');
    }
  };

  // 移除購物車商品
  const handleRemoveItem = async (id: number) => {
    try {
      await posDB.removeFromCart(id);
      const updatedCart = await posDB.getCartItems();
      setCartItems(updatedCart);
      showToast('已移除商品', 'success');
    } catch (error) {
      console.error('移除失敗:', error);
      showToast('移除失敗', 'error');
    }
  };

  // 處理拖曳開始
  const handleDragStart = (e: React.DragEvent, item: POSItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  // 處理拖曳結束
  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    setDragOverCart(false);
  };

  // 處理拖曳到購物車
  const handleCartDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCart(false);
    setIsDragging(false);
    
    try {
      const itemData = e.dataTransfer.getData('application/json');
      if (!itemData) return;

      const item: POSItem = JSON.parse(itemData);
      await posDB.addToCart(item);
      const updatedCart = await posDB.getCartItems();
      setCartItems(updatedCart);
      showToast(`已加入：${item.name}`, 'success');
    } catch (error) {
      console.error('加入購物車失敗:', error);
      showToast('加入購物車失敗', 'error');
    }
  };

  // 處理拖曳懸停
  const handleCartDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCart(true);
  };

  // 處理拖曳離開購物車
  const handleCartDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCart(false);
  };

  // 處理點擊商品加入購物車（行動裝置友善）
  const handleItemClick = async (item: POSItem) => {
    try {
      await posDB.addToCart(item);
      const updatedCart = await posDB.getCartItems();
      setCartItems(updatedCart);
      showToast(`已加入：${item.name}`, 'success');
    } catch (error) {
      console.error('加入購物車失敗:', error);
      showToast('加入購物車失敗', 'error');
    }
  };

  // 開始 LINE Pay 付款流程（模擬）
  const startLinePayPayment = (transactionId: string, orderId: string) => {
    // 清除之前的計時器
    if (linePayTimeoutRef.current) {
      clearTimeout(linePayTimeoutRef.current);
    }

    // 設定狀態為等待中
    setLinePayStatus('waiting');

    // 5秒後自動跳轉到付款成功
    linePayTimeoutRef.current = setTimeout(() => {
      setLinePayStatus('success');
      showToast('LINE Pay 付款成功！', 'success');

      // 建立交易記錄
      const transaction: Transaction = {
        transactionNumber: orderId,
        items: [...cartItems],
        subtotal: cartTotal,
        tax,
        total: linePayAmount,
        paymentMethod: 'linepay',
        mobileCarrier: mobileCarrier || undefined,
        taxIdNumber: taxIdNumber || undefined,
        createdAt: new Date(),
      };

      posDB.createTransaction(transaction).catch((error) => {
        console.error('建立交易記錄失敗:', error);
      });

      // 建立對賬記錄到 localStorage
      const reconciliationRecord = {
        id: `LP${Date.now()}`,
        transactionId,
        orderId,
        amount: linePayAmount,
        status: 'completed',
        paymentMethod: 'linepay',
        createdAt: new Date().toISOString(),
        confirmedAt: new Date().toISOString(),
      };
      const existingReconciliations = JSON.parse(
        localStorage.getItem('pos_linepay_reconciliations') || '[]'
      );
      existingReconciliations.push(reconciliationRecord);
      localStorage.setItem('pos_linepay_reconciliations', JSON.stringify(existingReconciliations));

      // 自動關閉對話框並清空購物車
      setTimeout(() => {
        handleLinePayClose();
      }, 2000);
    }, 5000); // 5秒後自動成功
  };

  // 關閉 LINE Pay QR Code 對話框
  const handleLinePayClose = () => {
    // 清除計時器
    if (linePayTimeoutRef.current) {
      clearTimeout(linePayTimeoutRef.current);
      linePayTimeoutRef.current = null;
    }

    // 清空購物車
    posDB.clearCart().then(() => {
      setCartItems([]);
    });

    // 重置表單
    setPaymentMethod('cash');
    setMobileCarrier('');
    setTaxIdNumber('');
    setCashReceived('');
    setIsLinePayQROpen(false);
    setLinePayQRUrl('');
    setLinePayTransactionId('');
    setLinePayOrderId('');
    setLinePayAmount(0);
    setLinePayStatus('waiting');
  };

  // 結帳
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      showToast('購物車是空的', 'error');
      return;
    }

    // 驗證付款方式
    if (paymentMethod === 'cash') {
      const received = parseFloat(cashReceived);
      if (isNaN(received) || received < total) {
        showToast('現金收款金額不足', 'error');
        return;
      }
    }

    try {
      // 產生交易編號
      const transactionNumber = `POS${Date.now()}`;

      // 如果是 LINE Pay，直接顯示 QR Code（模擬流程）
      if (paymentMethod === 'linepay') {
        // 產生模擬的交易ID和QR Code URL
        const mockTransactionId = `T${Date.now()}`;
        const mockQRCodeUrl = `https://pay.line.me/linepay/payment?transactionId=${mockTransactionId}&orderId=${transactionNumber}`;

        // 設定 QR Code 資訊
        setLinePayQRUrl(mockQRCodeUrl);
        setLinePayTransactionId(mockTransactionId);
        setLinePayOrderId(transactionNumber);
        setLinePayAmount(total);
        setLinePayStatus('waiting');

        // 關閉結帳對話框，開啟 QR Code 對話框
        setIsCheckoutOpen(false);
        setIsLinePayQROpen(true);

        // 開始5秒倒數，自動跳轉到付款成功
        startLinePayPayment(mockTransactionId, transactionNumber);

        return;
      }

      // 現金或信用卡付款流程
      const transaction: Transaction = {
        transactionNumber,
        items: [...cartItems],
        subtotal: cartTotal,
        tax,
        total,
        paymentMethod,
        mobileCarrier: mobileCarrier || undefined,
        taxIdNumber: taxIdNumber || undefined,
        cashReceived: paymentMethod === 'cash' ? parseFloat(cashReceived) : undefined,
        cashChange: paymentMethod === 'cash' ? parseFloat(cashReceived) - total : undefined,
        createdAt: new Date(),
      };

      await posDB.createTransaction(transaction);

      // 清空購物車
      await posDB.clearCart();
      setCartItems([]);

      // 重置表單
      setPaymentMethod('cash');
      setMobileCarrier('');
      setTaxIdNumber('');
      setCashReceived('');
      setIsCheckoutOpen(false);

      showToast(`交易完成！交易編號：${transactionNumber}`, 'success');
    } catch (error) {
      console.error('結帳失敗:', error);
      showToast('結帳失敗', 'error');
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1419] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">初始化中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1419] pb-20">
      <div className="max-w-md mx-auto">
        {/* 標題列 */}
        <div className="bg-white dark:bg-[#1a2332] border-b border-gray-200 dark:border-gray-700 px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">我的行動POS</h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (confirm('確定要清空所有商品資料並重新初始化嗎？這將刪除所有現有商品，並載入新的240個商品。')) {
                  try {
                    await posDB.deleteDatabase();
                    // 重新初始化
                    await posDB.init();
                    // 載入新商品
                    for (const item of productData) {
                      await posDB.upsertItem(item);
                    }
                    const allItems = await posDB.getAllItems();
                    setItems(allItems);
                    showToast('資料庫已清空並重新初始化！', 'success');
                    // 重新載入頁面以確保狀態更新
                    window.location.reload();
                  } catch (error) {
                    console.error('清空資料庫失敗:', error);
                    showToast('清空資料庫失敗', 'error');
                  }
                }
              }}
              className="text-xs"
            >
              重置商品
            </Button>
          </div>
        </div>

        {/* 掃描區域 */}
        <Card className="m-4 dark:bg-[#1a2332] dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 dark:text-white">
              <Scan className="h-4 w-4" />
              掃描商品
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="輸入或掃描條碼"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleScan();
                    }
                  }}
                  className="flex-1"
                  autoFocus
                />
                <Button onClick={handleScan} className="px-6">
                  <Scan className="h-4 w-4 mr-2" />
                  掃描
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 購物車 */}
        <Card 
          className={`m-4 dark:bg-[#1a2332] dark:border-gray-700 transition-all ${
            dragOverCart ? 'ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50 dark:bg-blue-900/20' : ''
          }`}
          onDrop={handleCartDrop}
          onDragOver={handleCartDragOver}
          onDragLeave={handleCartDragLeave}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between dark:text-white">
              <div className="flex items-center gap-1.5">
                <ShoppingCart className="h-3.5 w-3.5" />
                購物車
                <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                  {cartItems.length}
                </Badge>
              </div>
              {cartItems.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    if (confirm('確定要清空購物車嗎？')) {
                      await posDB.clearCart();
                      setCartItems([]);
                      showToast('購物車已清空', 'success');
                    }
                  }}
                  className="h-7 w-7 p-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2.5 min-h-[210px]">
            {cartItems.length === 0 ? (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg h-full flex flex-col items-center justify-center min-h-[190px]">
                <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">購物車是空的</p>
                <p className="text-xs mt-1">請掃描商品或拖曳商品加入購物車</p>
              </div>
            ) : (
              <div className="h-[190px] overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    {/* 品名 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium text-gray-900 dark:text-white truncate">
                        {item.name}
                      </p>
                    </div>
                    {/* 單價 */}
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      ${item.price}
                    </span>
                    {/* 數量控制 */}
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateQuantity(item.id!, item.quantity - 1)}
                        className="h-6 w-6 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-5 text-center text-sm font-medium text-gray-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateQuantity(item.id!, item.quantity + 1)}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    {/* 總價 */}
                    <span className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap min-w-[55px] text-right">
                      ${item.subtotal}
                    </span>
                    {/* 刪除按鈕 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id!)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 flex-shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 商品分類瀏覽區塊 */}
        <Card className="m-4 dark:bg-[#1a2332] dark:border-gray-700">
          <CardHeader className="pb-1.5 px-3 pt-3">
            <CardTitle className="text-sm dark:text-white">商品分類</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 p-2.5">
            {/* 分類頁籤 */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {categories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                      isSelected
                        ? `${category.color} shadow-md scale-105`
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isSelected ? '' : 'opacity-70'}`} />
                    <span className="text-[10px] font-medium leading-tight">{category.name}</span>
                  </button>
                );
              })}
            </div>

            {/* 商品橫向滾動列表 */}
            <div className="overflow-x-auto scrollbar-hide">
              {filteredItems.length === 0 ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <Package className="h-8 w-8 mx-auto mb-1.5 opacity-50" />
                  <p className="text-xs">此分類暫無商品</p>
                </div>
              ) : (
                <div className="flex gap-2 min-h-[120px]">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleItemClick(item)}
                      className="group cursor-move active:scale-95 transition-transform flex-shrink-0"
                      style={{ width: '100px' }}
                    >
                      <div className="w-full aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-transparent group-hover:border-blue-500 dark:group-hover:border-blue-400 transition-all relative">
                        {item.image ? (
                          <>
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // 圖片載入失敗時顯示預設圖示
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) {
                                  fallback.style.display = 'flex';
                                }
                              }}
                            />
                            <div className="w-full h-full hidden flex-col items-center justify-center p-1.5">
                              <Package className="h-6 w-6 text-gray-400 dark:text-gray-500 mb-0.5" />
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center line-clamp-2 leading-tight">
                                {item.name}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-1.5">
                            <Package className="h-6 w-6 text-gray-400 dark:text-gray-500 mb-0.5" />
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center line-clamp-2 leading-tight">
                              {item.name}
                            </span>
                          </div>
                        )}
                        {/* 價格標籤 */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 text-center">
                          ${item.price}
                        </div>
                        {/* 拖曳提示 */}
                        <div className="absolute top-0.5 right-0.5 bg-blue-500/80 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          往上拖曳
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5 text-center line-clamp-1 leading-tight">
                        {item.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 結帳按鈕 */}
        {cartItems.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1a2332] border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">小計</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${cartTotal}
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">稅額</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">${tax}</span>
              </div>
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <span className="text-lg font-bold text-gray-900 dark:text-white">總計</span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${total}
                </span>
              </div>
              <Button
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full h-12 text-lg"
                size="lg"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                結帳
              </Button>
            </div>
          </div>
        )}

        {/* 結帳對話框 */}
        <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>結帳</DialogTitle>
              <DialogDescription>請選擇付款方式並完成交易</DialogDescription>
            </DialogHeader>

            {/* 金額摘要 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">小計</span>
                <span className="text-gray-900 dark:text-white">${cartTotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">稅額</span>
                <span className="text-gray-900 dark:text-white">${tax}</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-900 dark:text-white">總計</span>
                <span className="text-blue-600 dark:text-blue-400">${total}</span>
              </div>
            </div>

            <div className="space-y-4 py-4">
              {/* 載具 */}
              <div>
                <Label htmlFor="mobileCarrier">載具（選填）</Label>
                <Input
                  id="mobileCarrier"
                  type="text"
                  placeholder="輸入載具條碼"
                  value={mobileCarrier}
                  onChange={(e) => setMobileCarrier(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  例如：/ABC1234
                </p>
              </div>

              {/* 統編 */}
              <div>
                <Label htmlFor="taxIdNumber">統編（選填）</Label>
                <Input
                  id="taxIdNumber"
                  type="text"
                  placeholder="輸入統一編號"
                  value={taxIdNumber}
                  onChange={(e) => {
                    // 只允許輸入數字，最多8位
                    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setTaxIdNumber(value);
                  }}
                  maxLength={8}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  統一編號為8位數字
                </p>
              </div>

              {/* 現金收款 */}
              {paymentMethod === 'cash' && (
                <div>
                  <Label htmlFor="cashReceived">收款金額</Label>
                  <Input
                    id="cashReceived"
                    type="number"
                    placeholder="輸入收款金額"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    min={total}
                    step="1"
                  />
                  {cashReceived && parseFloat(cashReceived) >= total && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      找零：${(parseFloat(cashReceived) - total).toFixed(0)}
                    </p>
                  )}
                </div>
              )}

              {/* 付款方式 */}
              <div>
                <Label className="mb-2 block">付款方式</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value: 'cash' | 'linepay' | 'credit') => setPaymentMethod(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        現金
                      </div>
                    </SelectItem>
                    <SelectItem value="linepay">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        Line Pay
                      </div>
                    </SelectItem>
                    <SelectItem value="credit">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        信用卡
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCheckout} disabled={paymentMethod === 'cash' && (!cashReceived || parseFloat(cashReceived) < total)}>
                確認結帳
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* LINE Pay QR Code 對話框 */}
        <Dialog open={isLinePayQROpen} onOpenChange={(open) => {
          if (!open && linePayStatus !== 'success') {
            handleLinePayClose();
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>LINE Pay 付款</DialogTitle>
              <DialogDescription>
                請讓客戶使用 LINE 掃描下方條碼完成付款
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* 付款資訊 */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">訂單編號</span>
                  <span className="font-mono text-gray-900 dark:text-white">{linePayOrderId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">交易編號</span>
                  <span className="font-mono text-gray-900 dark:text-white">{linePayTransactionId}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-white">付款金額</span>
                  <span className="text-blue-600 dark:text-blue-400">NT$ {linePayAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center space-y-4">
                {linePayStatus === 'waiting' && (
                  <>
                    <div className="bg-white p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                      <QRCodeSVG
                        value={linePayQRUrl}
                        size={256}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                      請讓客戶使用 LINE 掃描上方條碼完成付款
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                      （模擬流程：5秒後自動完成付款）
                    </p>
                  </>
                )}

                {linePayStatus === 'success' && (
                  <>
                    <div className="bg-green-50 dark:bg-green-900/20 p-8 rounded-lg border-2 border-green-500">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="h-10 w-10 text-white" />
                        </div>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          付款成功！
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                      交易已完成，視窗將自動關閉
                    </p>
                  </>
                )}
              </div>
            </div>

            <DialogFooter>
              {linePayStatus === 'success' ? (
                <Button onClick={handleLinePayClose} className="w-full">
                  關閉
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleLinePayClose}
                >
                  取消付款
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
