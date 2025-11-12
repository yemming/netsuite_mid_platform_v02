'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCounterStore } from './stores/counterStore';
import { useCartStore } from './stores/cartStore';
import { useUserStore } from './stores/userStore';
import { useTodoStore } from './stores/todoStore';
import { useEffect, useState } from 'react';

// 計數器組件
function CounterDemo() {
  const { count, increment, decrement, reset, incrementBy } = useCounterStore();
  const [customAmount, setCustomAmount] = useState('10');

  return (
    <Card>
      <CardHeader>
        <CardTitle>計數器 Store</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">{count}</div>
        </div>
        <div className="flex gap-2 justify-center">
          <Button onClick={decrement} variant="outline">-1</Button>
          <Button onClick={increment} variant="outline">+1</Button>
          <Button onClick={reset} variant="outline">重置</Button>
        </div>
        <div className="flex gap-2 items-center justify-center">
          <Input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="w-20"
          />
          <Button onClick={() => incrementBy(Number(customAmount) || 0)} variant="outline">
            增加
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// 購物車組件
function CartDemo() {
  const { items, addItem, removeItem, updateQuantity, clearCart, getTotal, getItemCount } =
    useCartStore();
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  const handleAddItem = () => {
    if (newItemName && newItemPrice) {
      addItem({
        id: Date.now().toString(),
        name: newItemName,
        price: Number(newItemPrice),
      });
      setNewItemName('');
      setNewItemPrice('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>購物車 Store</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="商品名稱"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />
          <Input
            type="number"
            placeholder="價格"
            value={newItemPrice}
            onChange={(e) => setNewItemPrice(e.target.value)}
            className="w-24"
          />
          <Button onClick={handleAddItem}>新增</Button>
        </div>

        {items.length === 0 ? (
          <p className="text-center text-gray-500 py-4">購物車是空的</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">${item.price}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                  >
                    -
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => removeItem(item.id)}>
                    移除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between">
            <span>商品數量：</span>
            <span className="font-semibold">{getItemCount()}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>總計：</span>
            <span>${getTotal().toFixed(2)}</span>
          </div>
          {items.length > 0 && (
            <Button onClick={clearCart} variant="outline" className="w-full">
              清空購物車
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// 使用者資訊組件
function UserDemo() {
  const { user, isAuthenticated, login, logout, updateUser } = useUserStore();
  const [name, setName] = useState('張三');
  const [email, setEmail] = useState('zhang@example.com');

  const handleLogin = () => {
    login({
      id: '1',
      name,
      email,
      role: '管理員',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>使用者資訊 Store</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAuthenticated ? (
          <>
            <div className="space-y-2">
              <Input
                placeholder="姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder="電子郵件"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button onClick={handleLogin} className="w-full">
              登入
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-sm text-green-600 dark:text-green-400 mb-2">已登入</div>
              <div className="space-y-1">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">姓名：</span>
                  <span className="font-medium">{user?.name}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">電子郵件：</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">角色：</span>
                  <span className="font-medium">{user?.role}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="新姓名"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    updateUser({ name: e.currentTarget.value });
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
            <Button onClick={logout} variant="outline" className="w-full">
              登出
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 待辦事項組件
function TodoDemo() {
  const { todos, loading, addTodo, toggleTodo, deleteTodo, clearCompleted, fetchTodos } =
    useTodoStore();
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    if (todos.length === 0) {
      fetchTodos();
    }
  }, []);

  const handleAddTodo = () => {
    if (newTodo.trim()) {
      addTodo(newTodo);
      setNewTodo('');
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;
  const activeCount = todos.length - completedCount;

  return (
    <Card>
      <CardHeader>
        <CardTitle>待辦事項 Store（異步操作）</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="新增待辦事項..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddTodo();
              }
            }}
          />
          <Button onClick={handleAddTodo}>新增</Button>
        </div>

        {loading ? (
          <div className="text-center py-4 text-gray-500">載入中...</div>
        ) : (
          <>
            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>全部：{todos.length}</span>
              <span>進行中：{activeCount}</span>
              <span>已完成：{completedCount}</span>
            </div>

            {todos.length === 0 ? (
              <p className="text-center text-gray-500 py-4">沒有待辦事項</p>
            ) : (
              <div className="space-y-2">
                {todos.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id)}
                      className="w-4 h-4"
                    />
                    <span
                      className={`flex-1 ${
                        todo.completed
                          ? 'line-through text-gray-500'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {todo.text}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => deleteTodo(todo.id)}>
                      刪除
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {completedCount > 0 && (
              <Button onClick={clearCompleted} variant="outline" className="w-full">
                清除已完成 ({completedCount})
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// 狀態監聽組件（展示訂閱功能）
function StateWatcher() {
  const count = useCounterStore((state) => state.count);
  const cartItemCount = useCartStore((state) => state.getItemCount());
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  return (
    <Card>
      <CardHeader>
        <CardTitle>狀態監聽（跨 Store 訂閱）</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>計數器值：</span>
            <span className="font-semibold">{count}</span>
          </div>
          <div className="flex justify-between">
            <span>購物車商品數：</span>
            <span className="font-semibold">{cartItemCount}</span>
          </div>
          <div className="flex justify-between">
            <span>登入狀態：</span>
            <span className={`font-semibold ${isAuthenticated ? 'text-green-600' : 'text-gray-500'}`}>
              {isAuthenticated ? '已登入' : '未登入'}
            </span>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          此組件訂閱了多個 store 的狀態，當任何一個狀態改變時會自動更新
        </p>
      </CardContent>
    </Card>
  );
}

export default function ZustandShowcasePage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box className="h-5 w-5" />
            狀態管理 - Zustand 展示
          </CardTitle>
        </CardHeader>
      </Card>

      {/* 功能說明 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">功能特色</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-semibold mb-2">輕量級</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">僅 1KB 大小，無依賴</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="font-semibold mb-2">簡單 API</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">直觀易用的 API 設計</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h3 className="font-semibold mb-2">TypeScript</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">完整的型別支援</p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <h3 className="font-semibold mb-2">高效能</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">精確的重新渲染控制</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 狀態監聽組件 */}
      <StateWatcher />

      {/* 計數器 */}
      <CounterDemo />

      {/* 購物車和使用者資訊並排 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CartDemo />
        <UserDemo />
      </div>

      {/* 待辦事項 */}
      <TodoDemo />

      {/* 使用說明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用說明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>• <strong>Store 定義：</strong>使用 <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">create</code> 建立 store</p>
            <p>• <strong>狀態更新：</strong>使用 <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">set</code> 函數更新狀態</p>
            <p>• <strong>選擇性訂閱：</strong>可以只訂閱需要的狀態片段，減少重新渲染</p>
            <p>• <strong>異步操作：</strong>支援 async/await，適合處理 API 調用</p>
            <p>• <strong>多 Store：</strong>可以建立多個獨立的 store，按功能模組化</p>
            <p>• <strong>無 Provider：</strong>不需要 Provider 包裹，直接使用 hook</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
