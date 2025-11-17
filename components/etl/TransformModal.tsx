'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

export interface TransformConfig {
  type: 'direct' | 'default' | 'vlookup' | 'aggregate' | 'expression';
  config?: any;
}

interface TransformModalProps {
  open: boolean;
  onClose: () => void;
  sourceField: string;
  targetField: string;
  currentTransform?: TransformConfig;
  onSave: (transform: TransformConfig) => void;
}

/**
 * NetSuite 風格的轉換規則設定 Modal
 * 
 * 點擊智慧箭頭後開啟，可設定：
 * - Direct Map（直接映射）
 * - Default Value（預設值）
 * - VLOOKUP（查表）
 * - Aggregate（聚合函數）
 * - SQL Expression（自訂表達式）
 */
export function TransformModal({
  open,
  onClose,
  sourceField,
  targetField,
  currentTransform,
  onSave,
}: TransformModalProps) {
  const [transformType, setTransformType] = useState<TransformConfig['type']>(
    currentTransform?.type || 'direct'
  );
  const [config, setConfig] = useState<any>(currentTransform?.config || {});

  const handleSave = () => {
    onSave({
      type: transformType,
      config: transformType === 'direct' ? undefined : config,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl ns-font">
        <DialogHeader>
          <DialogTitle className="text-base">欄位轉換設定</DialogTitle>
          <DialogDescription className="text-xs">
            設定 <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{sourceField}</code>{' '}
            到 <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{targetField}</code>{' '}
            的資料轉換規則
          </DialogDescription>
        </DialogHeader>

        <Tabs value={transformType} onValueChange={(v) => setTransformType(v as any)}>
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="direct" className="text-xs py-2">
              直接映射
            </TabsTrigger>
            <TabsTrigger value="default" className="text-xs py-2">
              預設值
            </TabsTrigger>
            <TabsTrigger value="vlookup" className="text-xs py-2">
              VLOOKUP
            </TabsTrigger>
            <TabsTrigger value="aggregate" className="text-xs py-2">
              聚合函數
            </TabsTrigger>
            <TabsTrigger value="expression" className="text-xs py-2">
              自訂表達式
            </TabsTrigger>
          </TabsList>

          {/* Direct Map */}
          <TabsContent value="direct" className="space-y-4 mt-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-4 text-xs">
              <p className="text-blue-800 font-medium mb-2">📌 直接映射模式</p>
              <p className="text-blue-700">
                來源欄位的值將直接複製到目標欄位，系統會自動根據目標欄位型別進行型別轉換。
              </p>
            </div>
          </TabsContent>

          {/* Default Value */}
          <TabsContent value="default" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="defaultValue" className="text-xs">
                預設值
              </Label>
              <Input
                id="defaultValue"
                placeholder="當來源欄位為空時使用此值"
                value={config.defaultValue || ''}
                onChange={(e) =>
                  setConfig({ ...config, defaultValue: e.target.value })
                }
                className="text-xs"
              />
              <p className="text-xs text-gray-500">
                範例：若來源欄位為空，填入「未設定」或「0」
              </p>
            </div>
          </TabsContent>

          {/* VLOOKUP */}
          <TabsContent value="vlookup" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lookupTable" className="text-xs">
                  查表名稱
                </Label>
                <Input
                  id="lookupTable"
                  placeholder="例如：ns_subsidiary"
                  value={config.lookupTable || ''}
                  onChange={(e) =>
                    setConfig({ ...config, lookupTable: e.target.value })
                  }
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lookupKey" className="text-xs">
                  查詢鍵（Join 欄位）
                </Label>
                <Input
                  id="lookupKey"
                  placeholder="例如：id"
                  value={config.lookupKey || ''}
                  onChange={(e) =>
                    setConfig({ ...config, lookupKey: e.target.value })
                  }
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="returnField" className="text-xs">
                  返回欄位
                </Label>
                <Input
                  id="returnField"
                  placeholder="例如：full_name"
                  value={config.returnField || ''}
                  onChange={(e) =>
                    setConfig({ ...config, returnField: e.target.value })
                  }
                  className="text-xs"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs">
                <p className="text-amber-800">
                  <strong>範例：</strong> 用 Subsidiary ID 查找 Subsidiary Name
                  <br />
                  查表：<code>ns_subsidiary</code> | 查詢鍵：<code>id</code> | 返回：
                  <code>full_name</code>
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Aggregate */}
          <TabsContent value="aggregate" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">聚合函數</Label>
                <RadioGroup
                  value={config.aggregateFunction || 'SUM'}
                  onValueChange={(v) =>
                    setConfig({ ...config, aggregateFunction: v })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SUM" id="sum" />
                    <Label htmlFor="sum" className="text-xs font-normal">
                      SUM - 加總
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="AVG" id="avg" />
                    <Label htmlFor="avg" className="text-xs font-normal">
                      AVG - 平均值
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="COUNT" id="count" />
                    <Label htmlFor="count" className="text-xs font-normal">
                      COUNT - 計數
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="MAX" id="max" />
                    <Label htmlFor="max" className="text-xs font-normal">
                      MAX - 最大值
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="MIN" id="min" />
                    <Label htmlFor="min" className="text-xs font-normal">
                      MIN - 最小值
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupBy" className="text-xs">
                  群組欄位（可選）
                </Label>
                <Input
                  id="groupBy"
                  placeholder="例如：customer_id"
                  value={config.groupBy || ''}
                  onChange={(e) =>
                    setConfig({ ...config, groupBy: e.target.value })
                  }
                  className="text-xs"
                />
              </div>
            </div>
          </TabsContent>

          {/* SQL Expression */}
          <TabsContent value="expression" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expression" className="text-xs">
                  SQL 表達式
                </Label>
                <Textarea
                  id="expression"
                  placeholder="例如：CONCAT(first_name, ' ', last_name)&#10;或：CASE WHEN amount > 1000 THEN 'High' ELSE 'Low' END"
                  value={config.expression || ''}
                  onChange={(e) =>
                    setConfig({ ...config, expression: e.target.value })
                  }
                  className="text-xs font-mono h-32"
                />
                <p className="text-xs text-gray-500">
                  使用 <code>${'{'}value{'}'}</code> 代表來源欄位的值
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded p-3 text-xs space-y-2">
                <p className="text-purple-800 font-medium">常用範例：</p>
                <ul className="list-disc list-inside space-y-1 text-purple-700">
                  <li>
                    字串組合：<code>CONCAT(${'{'} value{'}'}, '_suffix')</code>
                  </li>
                  <li>
                    條件判斷：
                    <code>CASE WHEN ${'{'} value{'}'} &gt; 100 THEN 'High' ELSE 'Low' END</code>
                  </li>
                  <li>
                    數學運算：<code>${'{'}value{'}'} * 1.1</code>
                  </li>
                  <li>
                    日期格式：<code>TO_CHAR(${'{'} value{'}'}, 'YYYY-MM-DD')</code>
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="text-xs">
            取消
          </Button>
          <Button onClick={handleSave} className="text-xs">
            儲存轉換規則
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

