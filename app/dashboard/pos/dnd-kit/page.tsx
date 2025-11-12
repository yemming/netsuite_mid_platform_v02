'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Move } from 'lucide-react';
import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 基本列表項目類型
type ListItem = {
  id: string;
  content: string;
};

// 看板卡片類型
type KanbanCard = {
  id: string;
  title: string;
  description: string;
};

// 基本可排序列表組件
function SortableItem({ id, content }: { id: string; content: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-4 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow touch-none"
    >
      <div className="flex items-center gap-3">
        <Move className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <span className="text-gray-900 dark:text-gray-100">{content}</span>
      </div>
    </div>
  );
}

// 看板卡片組件
function KanbanCardItem({ id, title, description }: KanbanCard) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-4 mb-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-grab active:cursor-grabbing hover:shadow-lg transition-all touch-none"
    >
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

// 水平拖拽項目
function HorizontalItem({ id, content }: { id: string; content: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-4 mr-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg cursor-grab active:cursor-grabbing hover:shadow-lg transition-all flex-shrink-0 w-48 touch-none"
    >
      <div className="flex items-center gap-2">
        <Move className="w-5 h-5" />
        <span className="font-medium">{content}</span>
      </div>
    </div>
  );
}

// 看板列表容器（可接收拖拽）
function KanbanList({
  id,
  title,
  cards,
  children,
}: {
  id: string;
  title: string;
  cards: KanbanCard[];
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg p-4 min-h-[200px] transition-colors ${
        isOver
          ? 'bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-400 border-dashed'
          : 'bg-gray-50 dark:bg-gray-800'
      }`}
    >
      <h3 className="font-semibold mb-4 text-gray-700 dark:text-gray-300">{title}</h3>
      <SortableContext items={cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
        <div>{children}</div>
      </SortableContext>
      {cards.length === 0 && (
        <div className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm">
          拖拽卡片到此處
        </div>
      )}
    </div>
  );
}

export default function DndKitShowcasePage() {
  // 基本列表數據
  const [listItems, setListItems] = useState<ListItem[]>([
    { id: '1', content: '任務一：完成專案規劃' },
    { id: '2', content: '任務二：設計 UI 介面' },
    { id: '3', content: '任務三：實作核心功能' },
    { id: '4', content: '任務四：進行測試' },
    { id: '5', content: '任務五：部署上線' },
  ]);

  // 看板數據
  const [todoCards, setTodoCards] = useState<KanbanCard[]>([
    { id: 'todo-1', title: '設計登入頁面', description: '完成使用者登入介面設計' },
    { id: 'todo-2', title: '實作 API 整合', description: '連接後端 API 服務' },
  ]);

  const [inProgressCards, setInProgressCards] = useState<KanbanCard[]>([
    { id: 'progress-1', title: '優化資料庫查詢', description: '提升查詢效能' },
  ]);

  const [doneCards, setDoneCards] = useState<KanbanCard[]>([
    { id: 'done-1', title: '設定 CI/CD', description: '完成持續整合部署流程' },
    { id: 'done-2', title: '撰寫文件', description: '完成專案技術文件' },
  ]);

  // 水平拖拽數據
  const [horizontalItems, setHorizontalItems] = useState<ListItem[]>([
    { id: 'h-1', content: '項目 A' },
    { id: 'h-2', content: '項目 B' },
    { id: 'h-3', content: '項目 C' },
    { id: 'h-4', content: '項目 D' },
    { id: 'h-5', content: '項目 E' },
  ]);

  // 優化感應器配置 - 添加激活約束以改善拖拽體驗
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 移動 8 像素後才觸發拖拽，避免誤觸
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 處理基本列表拖拽結束
  const handleListDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setListItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // 處理看板拖拽結束 - 改進版本
  const handleKanbanDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // 定義列表配置
    const listConfigs = [
      { id: 'todo', cards: todoCards, setter: setTodoCards },
      { id: 'progress', cards: inProgressCards, setter: setInProgressCards },
      { id: 'done', cards: doneCards, setter: setDoneCards },
    ];

    // 找出卡片所在的列表
    const findCardList = (cardId: string) => {
      for (const config of listConfigs) {
        if (config.cards.find((c) => c.id === cardId)) {
          return config;
        }
      }
      return null;
    };

    // 找出目標列表（可能是列表 ID 或卡片 ID）
    const findTargetList = (id: string) => {
      // 先檢查是否為列表 ID
      const listConfig = listConfigs.find((c) => c.id === id);
      if (listConfig) return listConfig;

      // 否則查找卡片所在的列表
      return findCardList(id);
    };

    const activeList = findCardList(activeId);
    const targetList = findTargetList(overId);

    if (!activeList || !targetList) return;

    const activeCard = activeList.cards.find((c) => c.id === activeId);
    if (!activeCard) return;

    // 如果在同一個列表內移動
    if (activeList.id === targetList.id) {
      const targetCard = targetList.cards.find((c) => c.id === overId);
      if (targetCard) {
        // 在同一個列表內重新排序
        activeList.setter((items) => {
          const oldIndex = items.findIndex((item) => item.id === activeId);
          const newIndex = items.findIndex((item) => item.id === overId);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    } else {
      // 跨列表移動
      // 從原列表移除
      activeList.setter((items) => items.filter((item) => item.id !== activeId));

      // 添加到目標列表
      targetList.setter((items) => {
        // 如果拖拽到列表區域（不是卡片上），添加到末尾
        if (targetList.id === overId) {
          return [...items, activeCard];
        }
        // 如果拖拽到卡片上，插入到該卡片位置
        const targetIndex = items.findIndex((item) => item.id === overId);
        if (targetIndex >= 0) {
          const newItems = [...items];
          newItems.splice(targetIndex, 0, activeCard);
          return newItems;
        }
        return [...items, activeCard];
      });
    }
  };

  // 處理水平拖拽結束
  const handleHorizontalDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setHorizontalItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Move className="h-5 w-5" />
            核心拖拽引擎 - dnd-kit 展示（優化版）
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
              <h3 className="font-semibold mb-2">觸控支援</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">完美支援觸控裝置</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="font-semibold mb-2">鍵盤操作</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">支援鍵盤無障礙操作</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h3 className="font-semibold mb-2">高性能</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">輕量級且高效能</p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <h3 className="font-semibold mb-2">靈活擴展</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">高度可自訂與擴展</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 基本可排序列表 */}
      <Card>
        <CardHeader>
          <CardTitle>基本可排序列表（垂直）</CardTitle>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragEnd={handleListDragEnd}
          >
            <SortableContext
              items={listItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {listItems.map((item) => (
                  <SortableItem key={item.id} id={item.id} content={item.content} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            提示：拖拽項目可以重新排序，支援滑鼠和觸控操作
          </p>
        </CardContent>
      </Card>

      {/* 水平拖拽列表 */}
      <Card>
        <CardHeader>
          <CardTitle>水平拖拽列表</CardTitle>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragEnd={handleHorizontalDragEnd}
          >
            <SortableContext
              items={horizontalItems.map((item) => item.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex overflow-x-auto pb-4">
                {horizontalItems.map((item) => (
                  <HorizontalItem key={item.id} id={item.id} content={item.content} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            提示：可以水平拖拽重新排列項目
          </p>
        </CardContent>
      </Card>

      {/* 看板風格拖拽 - 優化版 */}
      <Card>
        <CardHeader>
          <CardTitle>看板風格拖拽（跨列表）- 優化版</CardTitle>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragEnd={handleKanbanDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 待辦 */}
              <KanbanList id="todo" title="待辦" cards={todoCards}>
                {todoCards.map((card) => (
                  <KanbanCardItem
                    key={card.id}
                    id={card.id}
                    title={card.title}
                    description={card.description}
                  />
                ))}
              </KanbanList>

              {/* 進行中 */}
              <KanbanList id="progress" title="進行中" cards={inProgressCards}>
                {inProgressCards.map((card) => (
                  <KanbanCardItem
                    key={card.id}
                    id={card.id}
                    title={card.title}
                    description={card.description}
                  />
                ))}
              </KanbanList>

              {/* 已完成 */}
              <KanbanList id="done" title="已完成" cards={doneCards}>
                {doneCards.map((card) => (
                  <KanbanCardItem
                    key={card.id}
                    id={card.id}
                    title={card.title}
                    description={card.description}
                  />
                ))}
              </KanbanList>
            </div>
          </DndContext>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            提示：可以在不同列表間拖拽卡片，也可以在同一列表內重新排序。拖拽到列表空白區域會自動添加。
          </p>
        </CardContent>
      </Card>

      {/* 使用說明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用說明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>• <strong>滑鼠操作：</strong>點擊並拖拽項目到目標位置</p>
            <p>• <strong>觸控操作：</strong>長按項目後拖拽</p>
            <p>• <strong>鍵盤操作：</strong>選中項目後使用方向鍵移動</p>
            <p>• <strong>跨列表拖拽：</strong>在看板中，可以將卡片拖拽到不同的列表或列表空白區域</p>
            <p>• <strong>即時反饋：</strong>拖拽時項目會變半透明，目標區域會高亮顯示</p>
            <p>• <strong>優化改進：</strong>添加了激活約束、改進碰撞檢測、支援空列表拖拽</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
