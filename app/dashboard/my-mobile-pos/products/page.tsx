'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Package,
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  X,
  Search,
  Grid3x3,
  List,
} from 'lucide-react';
import { posDB, POSItem } from '@/lib/indexeddb-pos';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// 簡單的 toast 通知系統
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${
    type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
};

type ViewMode = 'card' | 'list';

export default function POSProductsPage() {
  const [products, setProducts] = useState<POSItem[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<POSItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<POSItem | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<POSItem | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    price: '',
    unit: '個',
    category: '',
    image: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化並載入產品
  useEffect(() => {
    const init = async () => {
      try {
        await posDB.init();
        setIsInitialized(true);
        await loadProducts();
      } catch (error) {
        console.error('初始化失敗:', error);
        showToast('系統初始化失敗', 'error');
      }
    };

    init();
  }, []);

  // 搜尋功能
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.barcode.toLowerCase().includes(query) ||
          (product.category && product.category.toLowerCase().includes(query))
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  // 載入產品列表
  const loadProducts = async () => {
    try {
      const allProducts = await posDB.getAllItems();
      setProducts(allProducts);
      setFilteredProducts(allProducts);
    } catch (error) {
      console.error('載入產品失敗:', error);
      showToast('載入產品失敗', 'error');
    }
  };

  // 開啟新增/編輯對話框
  const handleOpenDialog = (product?: POSItem) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        barcode: product.barcode,
        name: product.name,
        price: product.price.toString(),
        unit: product.unit || '個',
        category: product.category || '',
        image: product.image || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({
        barcode: '',
        name: '',
        price: '',
        unit: '個',
        category: '',
        image: '',
      });
    }
    setIsDialogOpen(true);
  };

  // 關閉對話框
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormData({
      barcode: '',
      name: '',
      price: '',
      unit: '個',
      category: '',
      image: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 處理圖片上傳
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      showToast('請選擇圖片檔案', 'error');
      return;
    }

    // 檢查檔案大小（限制 2MB）
    if (file.size > 2 * 1024 * 1024) {
      showToast('圖片大小不能超過 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData({ ...formData, image: base64 });
      showToast('圖片上傳成功', 'success');
    };
    reader.onerror = () => {
      showToast('圖片讀取失敗', 'error');
    };
    reader.readAsDataURL(file);
  };

  // 移除圖片
  const handleRemoveImage = () => {
    setFormData({ ...formData, image: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 儲存產品
  const handleSave = async () => {
    // 驗證必填欄位
    if (!formData.barcode.trim()) {
      showToast('請輸入條碼', 'error');
      return;
    }
    if (!formData.name.trim()) {
      showToast('請輸入產品名稱', 'error');
      return;
    }
    if (!formData.price.trim()) {
      showToast('請輸入價格', 'error');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      showToast('價格格式錯誤', 'error');
      return;
    }

    try {
      const productData: POSItem = {
        barcode: formData.barcode.trim(),
        name: formData.name.trim(),
        price,
        unit: formData.unit || '個',
        category: formData.category.trim() || undefined,
        image: formData.image || undefined,
      };

      // 如果是編輯模式，保留 ID
      if (editingProduct?.id) {
        productData.id = editingProduct.id;
      }

      await posDB.upsertItem(productData);
      await loadProducts();
      handleCloseDialog();
      showToast(editingProduct ? '產品更新成功' : '產品新增成功', 'success');
    } catch (error) {
      console.error('儲存產品失敗:', error);
      showToast('儲存產品失敗', 'error');
    }
  };

  // 開啟刪除確認對話框
  const handleOpenDeleteDialog = (product: POSItem) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  };

  // 確認刪除
  const handleConfirmDelete = async () => {
    if (!deletingProduct?.id) return;

    try {
      await posDB.deleteItem(deletingProduct.id);
      await loadProducts();
      setIsDeleteDialogOpen(false);
      setDeletingProduct(null);
      showToast('產品已刪除', 'success');
    } catch (error) {
      console.error('刪除產品失敗:', error);
      showToast('刪除產品失敗', 'error');
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
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1419] pb-6">
      <div className="max-w-6xl mx-auto p-4">
        {/* 標題列 */}
        <div className="bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">POS產品主檔維護</h1>
              <Badge variant="secondary" className="ml-2">
                {filteredProducts.length} 項
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {/* 視圖切換 */}
              <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-md p-1">
                <Button
                  variant={viewMode === 'card' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('card')}
                  className={`h-8 px-2 ${
                    viewMode === 'card'
                      ? 'dark:bg-blue-600 dark:hover:bg-blue-700'
                      : 'dark:hover:bg-gray-700'
                  }`}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`h-8 px-2 ${
                    viewMode === 'list'
                      ? 'dark:bg-blue-600 dark:hover:bg-blue-700'
                      : 'dark:hover:bg-gray-700'
                  }`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadProducts}
                className="dark:border-gray-600 dark:text-gray-300"
              >
                重新整理
              </Button>
              <Button
                size="sm"
                onClick={() => handleOpenDialog()}
                className="dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                新增產品
              </Button>
            </div>
          </div>
        </div>

        {/* 搜尋列 */}
        <Card className="mb-4 dark:bg-[#1a2332] dark:border-gray-700">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="搜尋產品名稱、條碼或分類..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* 產品列表 */}
        {filteredProducts.length === 0 ? (
          <Card className="dark:bg-[#1a2332] dark:border-gray-700">
            <CardContent className="py-12">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{searchQuery ? '找不到符合條件的產品' : '尚無產品資料'}</p>
                <p className="text-sm mt-1">
                  {searchQuery ? '請嘗試其他關鍵字' : '點擊「新增產品」開始建立產品主檔'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'card' ? (
          /* 卡片視圖 */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="dark:bg-[#1a2332] dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  {/* 產品圖片 */}
                  <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    )}
                  </div>

                  {/* 產品資訊 */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        ${product.price}
                      </span>
                      {product.category && (
                        <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                          {product.category}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>條碼：{product.barcode}</p>
                      <p>單位：{product.unit}</p>
                    </div>
                  </div>

                  {/* 操作按鈕 */}
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(product)}
                      className="flex-1 dark:border-gray-600 dark:text-gray-300"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      編輯
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDeleteDialog(product)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* 列表視圖 */
          <Card className="dark:bg-[#1a2332] dark:border-gray-700">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-gray-700">
                      <TableHead className="w-16 dark:text-gray-300">圖片</TableHead>
                      <TableHead className="dark:text-gray-300">產品名稱</TableHead>
                      <TableHead className="dark:text-gray-300">條碼</TableHead>
                      <TableHead className="dark:text-gray-300">價格</TableHead>
                      <TableHead className="dark:text-gray-300">單位</TableHead>
                      <TableHead className="dark:text-gray-300">分類</TableHead>
                      <TableHead className="w-32 text-right dark:text-gray-300">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow
                        key={product.id}
                        className="dark:border-gray-700 dark:hover:bg-gray-800"
                      >
                        <TableCell>
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex items-center justify-center">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400">
                          {product.barcode}
                        </TableCell>
                        <TableCell className="font-semibold text-blue-600 dark:text-blue-400">
                          ${product.price}
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400">
                          {product.unit}
                        </TableCell>
                        <TableCell>
                          {product.category ? (
                            <Badge
                              variant="outline"
                              className="dark:border-gray-600 dark:text-gray-300"
                            >
                              {product.category}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(product)}
                              className="h-8 w-8 p-0 dark:text-gray-300"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDeleteDialog(product)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 新增/編輯產品對話框 */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? '編輯產品' : '新增產品'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? '修改產品資訊' : '請填寫產品基本資訊'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* 產品圖片 */}
              <div>
                <Label>產品圖片</Label>
                <div className="mt-2">
                  {formData.image ? (
                    <div className="relative">
                      <img
                        src={formData.image}
                        alt="預覽"
                        className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        點擊上傳圖片（最大 2MB）
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        選擇圖片
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 條碼 */}
              <div>
                <Label htmlFor="barcode">
                  條碼 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="barcode"
                  type="text"
                  placeholder="輸入產品條碼"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  disabled={!!editingProduct}
                  className="mt-1"
                />
                {editingProduct && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    條碼無法修改
                  </p>
                )}
              </div>

              {/* 產品名稱 */}
              <div>
                <Label htmlFor="name">
                  產品名稱 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="輸入產品名稱"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>

              {/* 價格和單位 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">
                    價格 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    min="0"
                    step="0.01"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="unit">單位</Label>
                  <Input
                    id="unit"
                    type="text"
                    placeholder="個、包、瓶..."
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* 分類 */}
              <div>
                <Label htmlFor="category">分類（選填）</Label>
                <Input
                  id="category"
                  type="text"
                  placeholder="例如：飲料、食品、日用品..."
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                取消
              </Button>
              <Button onClick={handleSave}>
                {editingProduct ? '更新' : '新增'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 刪除確認對話框 */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>確認刪除</DialogTitle>
              <DialogDescription>
                確定要刪除產品「{deletingProduct?.name}」嗎？此操作無法復原。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                取消
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                確認刪除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

