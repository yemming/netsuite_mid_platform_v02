'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, Loader2, AlertCircle, CheckCircle2, HelpCircle, X, ArrowLeftRight, Settings } from 'lucide-react';
import '@/components/etl/netsuite-style.css';

// 導入我們的 NetSuite 風格元件（但適配 Field Mapping 場景）
import { TransformModal, TransformConfig } from '@/components/etl/TransformModal';

interface NetSuiteField {
  name: string;
  type?: string;
  label?: string;
  isCustom: boolean;
  isMapped: boolean;
}

interface SupabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
}

interface MappingRule {
  id: string;
  netsuiteField: string;
  supabaseColumn: string;
  netsuiteType?: string;
  supabaseType: string;
  transform: TransformConfig;
  isActive: boolean;
}

export default function FieldMappingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const mappingKey = params.mappingKey as string;

  // 狀態管理
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // 表資訊
  const [tableInfo, setTableInfo] = useState<{ label: string; supabaseTable: string; netsuiteTable?: string } | null>(null);
  
  // 欄位列表
  const [netsuiteFields, setNetsuiteFields] = useState<NetSuiteField[]>([]);
  const [supabaseColumns, setSupabaseColumns] = useState<SupabaseColumn[]>([]);

  // 映射規則
  const [mappings, setMappings] = useState<MappingRule[]>([]);

  // 轉換規則 Modal
  const [selectedMapping, setSelectedMapping] = useState<MappingRule | null>(null);
  const [transformModalOpen, setTransformModalOpen] = useState(false);

  // 拖拽狀態
  const [draggedItem, setDraggedItem] = useState<{ type: 'netsuite' | 'supabase'; data: any } | null>(null);
  const [insertIndicator, setInsertIndicator] = useState<{ mappingId: string; position: 'before' | 'after' } | null>(null);
  const [hoverCompleteMappingId, setHoverCompleteMappingId] = useState<string | null>(null);
  const [hoverAddAggregateMappingId, setHoverAddAggregateMappingId] = useState<string | null>(null); // 拖拽到聚合映射
  const [selectedFields, setSelectedFields] = useState<string[]>([]); // Ctrl 多選

  /**
   * 重新計算所有欄位的 isMapped 狀態（基於當前所有映射）
   */
  const recalculateAllFieldMappedStatus = (mappingList: MappingRule[]) => {
    // 收集所有已映射的欄位名稱（包括 AGGREGATE 中的欄位）
    const mappedFieldNames = new Set<string>();
    
    mappingList.forEach(m => {
      if (m.netsuiteField.includes(',')) {
        // AGGREGATE 映射：分割多個欄位
        m.netsuiteField.split(',').forEach(f => {
          const trimmedField = f.trim();
          if (trimmedField) {
            mappedFieldNames.add(trimmedField);
          }
        });
      } else {
        // 單一欄位映射
        const trimmedField = m.netsuiteField.trim();
        if (trimmedField) {
          mappedFieldNames.add(trimmedField);
        }
      }
    });
    
    // 更新所有欄位的 isMapped 狀態
    setNetsuiteFields(prevFields =>
      prevFields.map(f => ({
        ...f,
        isMapped: mappedFieldNames.has(f.name)
      }))
    );
  };

  /**
   * 載入資料
   */
  useEffect(() => {
    loadData();
  }, [mappingKey]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. 載入表映射配置
      const tableResponse = await fetch('/api/table-mapping');
      const tableResult = await tableResponse.json();
      const currentTable = tableResult.data?.mappings?.find((t: any) => t.mapping_key === mappingKey);
      
      if (currentTable) {
        setTableInfo({
          label: currentTable.label,
          supabaseTable: currentTable.supabase_table_name,
          netsuiteTable: currentTable.netsuite_table_name,
        });
      }

      // 2. 載入 NetSuite 欄位
      const nsResponse = await fetch(`/api/field-mapping/netsuite-fields?mappingKey=${mappingKey}`);
      const nsResult = await nsResponse.json();
      
      if (nsResult.success && nsResult.data?.fields) {
        setNetsuiteFields(
          nsResult.data.fields.map((f: any) => ({
            name: f.name || '',
            type: f.type || 'text',
            label: f.label || f.name,
            isCustom: f.isCustom || false,
            isMapped: f.isMapped || false,
          }))
        );
      }

      // 3. 載入 Supabase 欄位（需要 tableName 不是 mappingKey）
      const supabaseTableName = currentTable?.supabase_table_name || tableInfo?.supabaseTable;
      
      console.log('🔍 載入 Supabase 欄位，表名:', supabaseTableName);
      
      if (supabaseTableName) {
        const sbResponse = await fetch(`/api/field-mapping/supabase-columns?tableName=${supabaseTableName}`);
        const sbResult = await sbResponse.json();

        console.log('📊 Supabase 欄位結果:', sbResult);

        if (sbResult.success && sbResult.data?.columns) {
          setSupabaseColumns(sbResult.data.columns);
        } else {
          console.warn('⚠️ 載入 Supabase 欄位失敗，嘗試 fallback');
          // 使用測試資料作為 fallback
          const testResponse = await fetch(`/api/field-mapping/test-data?type=supabase`);
          const testResult = await testResponse.json();
          if (testResult.success && testResult.data?.columns) {
            setSupabaseColumns(testResult.data.columns);
          }
        }
      } else {
        console.warn('⚠️ 沒有 Supabase 表名，使用測試資料');
        // 直接使用測試資料
        const testResponse = await fetch(`/api/field-mapping/test-data?type=supabase`);
        const testResult = await testResponse.json();
        if (testResult.success && testResult.data?.columns) {
          setSupabaseColumns(testResult.data.columns);
        }
      }

      // 4. 載入現有映射
      const mappingResponse = await fetch(`/api/field-mapping?mappingKey=${mappingKey}`);
      const mappingResult = await mappingResponse.json();

      if (mappingResult.success && mappingResult.data?.fields) {
        const existingMappings = mappingResult.data.fields.map((m: any) => ({
          id: m.id || `${Date.now()}_${Math.random()}`,
          netsuiteField: m.netsuite_field_name,
          supabaseColumn: m.supabase_column_name,
          netsuiteType: m.netsuite_field_type || 'text',
          supabaseType: m.supabase_column_type || 'text',
          transform: m.transformation_rule || { type: 'direct' },
          isActive: m.is_active !== false,
        }));

        setMappings(existingMappings);

        // 使用統一的函數來重新計算所有欄位的映射狀態
        recalculateAllFieldMappedStatus(existingMappings);
      }

      // 移除這行，避免在 render 時 setState
      // showAlert('info', '資料載入完成');
    } catch (error: any) {
      showAlert('error', `載入失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 建立映射
   */
  const handleAddMapping = (netsuiteField: string, supabaseColumn: string) => {
    const nsField = netsuiteFields.find((f) => f.name === netsuiteField);
    const sbColumn = supabaseColumns.find((c) => c.name === supabaseColumn);

    if (!nsField || !sbColumn) return;

    // 檢查是否已存在
    if (mappings.some((m) => m.netsuiteField === netsuiteField)) {
      showAlert('error', `欄位 ${netsuiteField} 已經映射過了`);
      return;
    }

    const newMapping: MappingRule = {
      id: `${Date.now()}_${Math.random()}`,
      netsuiteField: nsField.name,
      supabaseColumn: sbColumn.name,
      netsuiteType: nsField.type || 'text',
      supabaseType: sbColumn.type,
      transform: { type: 'direct' },
      isActive: true,
    };

    // 插入到列表開頭，這樣新的映射會在最上面
    setMappings([newMapping, ...mappings]);

    // 標記為已映射
    setNetsuiteFields(
      netsuiteFields.map((f) => (f.name === netsuiteField ? { ...f, isMapped: true } : f))
    );

    showAlert('success', `✓ ${netsuiteField} → ${supabaseColumn}`);
  };

  /**
   * 刪除映射
   */
  const handleRemoveMapping = (id: string) => {
    const mapping = mappings.find((m) => m.id === id);
    if (!mapping) return;

    // 刪除映射
    const updatedMappings = mappings.filter((m) => m.id !== id);
    setMappings(updatedMappings);

    // 重新計算所有欄位的映射狀態（這樣可以正確處理 AGGREGATE 映射中的多個欄位）
    recalculateAllFieldMappedStatus(updatedMappings);

    // 顯示提示訊息
    const fieldNames = mapping.netsuiteField.includes(',') 
      ? mapping.netsuiteField.split(',').map(f => f.trim()).join(', ')
      : mapping.netsuiteField;
    showAlert('info', `已刪除映射：${fieldNames}`);
  };

  /**
   * 更新轉換規則
   */
  const handleUpdateTransform = (id: string, transform: TransformConfig) => {
    setMappings(mappings.map((m) => (m.id === id ? { ...m, transform } : m)));
    showAlert('success', '轉換規則已更新');
  };

  /**
   * 儲存映射
   */
  const handleSave = async () => {
    setSaving(true);
    try {
      // 批次儲存所有映射
      const savePromises = mappings.map(async (mapping) => {
        const payload = {
          mappingKey,
              netsuiteFieldName: mapping.netsuiteField,
              supabaseColumnName: mapping.supabaseColumn,
          supabaseColumnType: mapping.supabaseType,
          transformationRule: mapping.transform,
          isCustomField: netsuiteFields.find((f) => f.name === mapping.netsuiteField)?.isCustom || false,
        };

        if (mapping.id.includes('_')) {
          // 新建
          return fetch('/api/field-mapping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } else {
          // 更新
          return fetch('/api/field-mapping', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: mapping.id, ...payload }),
          });
        }
      });

      await Promise.all(savePromises);
      showAlert('success', `成功儲存 ${mappings.length} 個映射！`);

      // 重新載入
      setTimeout(() => loadData(), 1500);
    } catch (error: any) {
      showAlert('error', `儲存失敗: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  /**
   * 顯示提示訊息
   */
  const showAlert = (type: 'success' | 'error' | 'info', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  /**
   * 從聚合映射中移除單個字段
   */
  const handleRemoveFieldFromAggregate = (mappingId: string, fieldToRemove: string) => {
    const mapping = mappings.find(m => m.id === mappingId);
    if (!mapping || !mapping.netsuiteField.includes(',')) return;

    const fields = mapping.netsuiteField.split(',').map(f => f.trim());
    const newFields = fields.filter(f => f !== fieldToRemove);

    if (newFields.length === 0) {
      // 所有字段都移除了，刪除整個映射
      const updatedMappings = mappings.filter(m => m.id !== mappingId);
      setMappings(updatedMappings);
      
      // 重新計算所有欄位的映射狀態
      recalculateAllFieldMappedStatus(updatedMappings);
      
      // 從 selectedFields 中移除這些欄位
      setSelectedFields(selectedFields.filter(f => !fields.includes(f)));
    } else if (newFields.length === 1) {
      // 只剩一個字段，轉換為普通映射
      const updatedMapping = {
        ...mapping,
        netsuiteField: newFields[0],
        netsuiteType: netsuiteFields.find(f => f.name === newFields[0])?.type || 'text',
        transform: { type: 'direct' as const },
      };
      const updatedMappings = mappings.map(m => m.id === mappingId ? updatedMapping : m);
      setMappings(updatedMappings);
      
      // 重新計算所有欄位的映射狀態
      recalculateAllFieldMappedStatus(updatedMappings);
      
      // 從 selectedFields 中移除該欄位
      setSelectedFields(selectedFields.filter(f => f !== fieldToRemove));
    } else {
      // 還有多個字段，更新聚合映射
      const updatedMapping = {
        ...mapping,
        netsuiteField: newFields.join(', '),
      };
      const updatedMappings = mappings.map(m => m.id === mappingId ? updatedMapping : m);
      setMappings(updatedMappings);
      
      // 重新計算所有欄位的映射狀態
      recalculateAllFieldMappedStatus(updatedMappings);
      
      // 從 selectedFields 中移除該欄位
      setSelectedFields(selectedFields.filter(f => f !== fieldToRemove));
    }
  };

  /**
   * 添加字段到已存在的聚合映射
   */
  const handleAddToAggregate = (e: React.DragEvent, mappingId: string) => {
    const netsuiteField = e.dataTransfer.getData('netsuiteField');
    if (!netsuiteField) return false; // 只支援添加 NetSuite 字段

    const mapping = mappings.find(m => m.id === mappingId);
    if (!mapping) return false;

    // 檢查是否是多選（已經是聚合的多個字段）
    const isMultiple = e.dataTransfer.getData('isMultiple') === 'true';
    const newFields = netsuiteField.split(',').map(f => f.trim());

    // 獲取現有字段
    const existingFields = mapping.netsuiteField 
      ? mapping.netsuiteField.split(',').map(f => f.trim()).filter(f => f)
      : [];

    // 合併字段，去重
    const allFields = [...existingFields, ...newFields].filter((f, i, arr) => arr.indexOf(f) === i);

    // 如果只有一個字段，不是聚合
    if (allFields.length === 1) {
      const updatedMapping = {
        ...mapping,
        netsuiteField: allFields[0],
        netsuiteType: netsuiteFields.find(f => f.name === allFields[0])?.type || 'text',
        transform: { type: 'direct' as const },
        isActive: mapping.supabaseColumn ? true : false, // 如果有目標欄位就是完成的
      };
      setMappings(mappings.map(m => m.id === mappingId ? updatedMapping : m));
    } else {
      // 多個字段，保持或轉為聚合
      const updatedMapping = {
        ...mapping,
        netsuiteField: allFields.join(', '),
        netsuiteType: 'aggregate',
        transform: { type: 'aggregate' as const },
        isActive: mapping.supabaseColumn ? true : false,
      };
      setMappings(mappings.map(m => m.id === mappingId ? updatedMapping : m));
    }

    // 標記新增字段為已映射
    setNetsuiteFields(
      netsuiteFields.map(f => 
        newFields.includes(f.name) ? { ...f, isMapped: true } : f
      )
    );

    // 清空多選狀態
    setSelectedFields([]);

    return true; // 表示已處理
  };

  /**
   * 拖拽處理：Drop 到中欄的空白行（創建半成品映射）
   * @param e - 拖曳事件
   * @param insertPosition - 插入位置（在現有映射中的索引）
   */
  const handleDropToMappingZone = (e: React.DragEvent, insertPosition: number) => {
    e.preventDefault();
    
    const netsuiteField = e.dataTransfer.getData('netsuiteField');
    const netsuiteType = e.dataTransfer.getData('netsuiteType');
    const supabaseColumn = e.dataTransfer.getData('supabaseColumn');
    const supabaseType = e.dataTransfer.getData('supabaseType');

    // Case 1: 拖入 NetSuite 欄位 → 創建半成品映射（等待右側）
    if (netsuiteField) {
      const isMultiple = e.dataTransfer.getData('isMultiple') === 'true';
      
      if (isMultiple) {
        // Ctrl + 拖曳：多個字段（聚合）
        const fields = netsuiteField.split(',').map(f => f.trim());
        
        const newMapping: MappingRule = {
          id: `${Date.now()}_${Math.random()}`,
          netsuiteField: fields.join(', '), // 多個字段用逗號分隔
          supabaseColumn: '', // 空的，等待右側補完
          netsuiteType: 'aggregate',
          supabaseType: '',
          transform: { type: 'aggregate' }, // 聚合類型
          isActive: false,
        };

        // 在指定位置插入
        const newMappings = [...mappings];
        newMappings.splice(insertPosition, 0, newMapping);
        setMappings(newMappings);
        
        // 標記所有字段為已映射
        setNetsuiteFields(
          netsuiteFields.map((f) => 
            fields.includes(f.name) ? { ...f, isMapped: true } : f
          )
        );
        
        // 清空多選狀態
        setSelectedFields([]);
      } else {
        // 普通拖曳：單個字段
        const nsField = netsuiteFields.find((f) => f.name === netsuiteField);
        if (!nsField) return;

        // 檢查是否已存在
        if (mappings.some((m) => m.netsuiteField === netsuiteField)) {
          showAlert('error', `欄位 ${netsuiteField} 已經映射過了`);
          return;
        }

        const newMapping: MappingRule = {
          id: `${Date.now()}_${Math.random()}`,
          netsuiteField: nsField.name,
          supabaseColumn: '', // 空的，等待右側補完
          netsuiteType: nsField.type || 'text',
          supabaseType: '',
          transform: { type: 'direct' },
          isActive: false, // 未完成的映射設為 inactive
        };

        // 在指定位置插入
        const newMappings = [...mappings];
        newMappings.splice(insertPosition, 0, newMapping);
        setMappings(newMappings);
        
        setNetsuiteFields(
          netsuiteFields.map((f) => (f.name === netsuiteField ? { ...f, isMapped: true } : f))
        );
      }
      // 不顯示提示，避免頁面跳動
      return;
    }

    // Case 2: 拖入 Supabase 欄位 → 創建半成品映射（等待左側）
    if (supabaseColumn) {
      const sbColumn = supabaseColumns.find((c) => c.name === supabaseColumn);
      if (!sbColumn) return;

      const newMapping: MappingRule = {
        id: `${Date.now()}_${Math.random()}`,
        netsuiteField: '', // 空的，等待左側補完
        supabaseColumn: sbColumn.name,
        netsuiteType: '',
        supabaseType: sbColumn.type,
        transform: { type: 'direct' },
        isActive: false, // 未完成的映射設為 inactive
      };

      // 在指定位置插入
      const newMappings = [...mappings];
      newMappings.splice(insertPosition, 0, newMapping);
      setMappings(newMappings);
      
      // 不顯示提示，避免頁面跳動
      return;
    }
  };

  /**
   * 拖拽處理：Drop 到已存在的映射行（補完映射）
   */
  const handleDropToExistingMapping = (e: React.DragEvent, mappingId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const netsuiteField = e.dataTransfer.getData('netsuiteField');
    const netsuiteType = e.dataTransfer.getData('netsuiteType');
    const supabaseColumn = e.dataTransfer.getData('supabaseColumn');
    const supabaseType = e.dataTransfer.getData('supabaseType');

    const mapping = mappings.find((m) => m.id === mappingId);
    if (!mapping) return;

    // Case 1: 這是一個等待右側的映射，拖入 Supabase 欄位
    if (!mapping.supabaseColumn && supabaseColumn) {
      setMappings(
        mappings.map((m) =>
          m.id === mappingId
            ? {
                ...m,
                supabaseColumn,
                supabaseType: supabaseType || 'text',
                isActive: true, // 完成映射
              }
            : m
        )
      );
      // 不顯示提示，避免頁面跳動
      return;
    }

    // Case 2: 這是一個等待左側的映射，拖入 NetSuite 欄位
    if (!mapping.netsuiteField && netsuiteField) {
      const nsField = netsuiteFields.find((f) => f.name === netsuiteField);
      if (!nsField) return;

      // 檢查是否已存在
      if (mappings.some((m) => m.netsuiteField === netsuiteField && m.id !== mappingId)) {
        showAlert('error', `欄位 ${netsuiteField} 已經映射過了`);
        return;
      }

      setMappings(
        mappings.map((m) =>
          m.id === mappingId
            ? {
                ...m,
                netsuiteField: nsField.name,
                netsuiteType: nsField.type || 'text',
                isActive: true, // 完成映射
              }
            : m
        )
      );
      setNetsuiteFields(
        netsuiteFields.map((f) => (f.name === netsuiteField ? { ...f, isMapped: true } : f))
      );
      // 不顯示提示，避免頁面跳動
      return;
    }
  };

  if (loading) {
  return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 ns-font">
      {/* NetSuite 風格的 Header */}
      <div className="bg-white border-b-2 border-gray-300 shadow-sm">
        <div className="max-w-[1000px] mx-auto px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Field Mapping</h1>
                <p className="text-xs text-gray-600">
                  {tableInfo?.label || mappingKey} ({mappings.length} 個映射)
                </p>
        </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('https://system.netsuite.com/help/helpcenter/en_US/srbrowser/Browser2023_2/schema/record/subsidiary.html', '_blank')}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
            Get help with creating Field Mapping
          </Button>

              <Button onClick={handleSave} disabled={saving || mappings.length === 0} size="sm">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    儲存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
            儲存 ({mappings.length})
                  </>
                )}
          </Button>
        </div>
      </div>

          {/* Alert - 已移除，避免頁面跳動 */}
        </div>
      </div>

      {/* NetSuite 風格的三欄式佈局 */}
      <div className="max-w-[1000px] mx-auto p-2">
        <div className="ns-three-column">
          {/* 左欄：NetSuite Fields */}
          <div className="ns-column">
            <div className="ns-panel">
              <div className="ns-header">NetSuite Fields ({netsuiteFields.length})</div>

              <div className="ns-column-body">
                {netsuiteFields.length === 0 ? (
                  <div className="ns-empty-state">
                    <div className="ns-empty-state-description">沒有可用的 NetSuite 欄位</div>
                  </div>
                ) : (
                  netsuiteFields.map((field) => (
                    <div
                      key={field.name}
                      className={`ns-field-item ${field.isMapped ? 'disabled' : ''} ${
                        selectedFields.includes(field.name) ? 'selected' : ''
                      }`}
                      draggable={!field.isMapped}
                      onDragStart={(e) => {
                        if (!field.isMapped) {
                          // 設置拖拽效果，允許在按住 Ctrl 時拖拽
                          e.dataTransfer.effectAllowed = 'copyMove';
                          
                          // 檢查是否按下 Ctrl 鍵
                          if (e.ctrlKey || e.metaKey) {
                            // Ctrl + 拖曳：多選模式
                            if (!selectedFields.includes(field.name)) {
                              setSelectedFields([...selectedFields, field.name]);
                            }
                            // 傳遞多個字段（用逗號分隔）
                            const allFields = [...selectedFields, field.name].filter((f, i, arr) => arr.indexOf(f) === i);
                            e.dataTransfer.setData('netsuiteField', allFields.join(','));
                            e.dataTransfer.setData('netsuiteType', 'aggregate');
                            e.dataTransfer.setData('isMultiple', 'true');
                            
                            // 創建自定義拖拽預覽（扑克牌层叠效果）
                            const dragPreview = document.createElement('div');
                            dragPreview.style.cssText = `
                              position: absolute;
                              top: -9999px;
                              left: -9999px;
                              z-index: 9999;
                            `;
                            
                            // 创建层叠的卡片效果（最多显示前5张）
                            const cardsToShow = allFields.slice(0, 5);
                            const cardHTML = cardsToShow.map((fieldName, idx) => {
                              const offset = idx * 3; // 每张卡片偏移 3px
                              const opacity = 1 - (idx * 0.1); // 越后面的卡片越透明
                              return `
                                <div style="
                                  position: absolute;
                                  top: ${offset}px;
                                  left: ${offset}px;
                                  padding: 8px 16px;
                                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                  color: white;
                                  border-radius: 6px;
                                  font-size: 13px;
                                  font-weight: 600;
                                  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                                  white-space: nowrap;
                                  opacity: ${opacity};
                                  border: 2px solid rgba(255,255,255,0.3);
                                ">
                                  ${idx === 0 ? `<span style="background: rgba(255,255,255,0.3); padding: 2px 6px; border-radius: 3px; margin-right: 8px; font-size: 11px;">${allFields.length} 個</span>` : ''}${fieldName}
                                </div>
                              `;
                            }).join('');
                            
                            dragPreview.innerHTML = `
                              <div style="position: relative; width: 250px; height: ${60 + cardsToShow.length * 3}px;">
                                ${cardHTML}
                              </div>
                            `;
                            document.body.appendChild(dragPreview);
                            e.dataTransfer.setDragImage(dragPreview, 20, 20);
                            setTimeout(() => document.body.removeChild(dragPreview), 0);
                          } else {
                            // 普通拖曳：單個字段
                            setSelectedFields([]); // 清空多選
                            e.dataTransfer.setData('netsuiteField', field.name);
                            e.dataTransfer.setData('netsuiteType', field.type || 'text');
                          }
                        }
                      }}
                      onClick={(e) => {
                        if (!field.isMapped) {
                          // Ctrl + 點擊：多選模式
                          if (e.ctrlKey || e.metaKey) {
                            if (selectedFields.includes(field.name)) {
                              // 取消選中
                              setSelectedFields(selectedFields.filter(f => f !== field.name));
                            } else {
                              // 加入選中
                              setSelectedFields([...selectedFields, field.name]);
                            }
                            return;
                          }
                          
                          // 普通點擊：自動在最下面排隊
                          const newMapping: MappingRule = {
                            id: `mapping-${Date.now()}-${Math.random()}`,
                            netsuiteField: field.name,
                            supabaseColumn: '',
                            netsuiteType: field.type || 'text',
                            supabaseType: '',
                            transform: { type: 'direct' },
                            isActive: false, // 未完成的映射
                          };
                          setMappings([...mappings, newMapping]);
                          
                          // 標記為已映射（反灰）
                          setNetsuiteFields(
                            netsuiteFields.map((f) => (f.name === field.name ? { ...f, isMapped: true } : f))
                          );
                          
                          // 滾動到底部
                          setTimeout(() => {
                            const mappingArea = document.querySelector('.ns-column-body');
                            if (mappingArea) {
                              mappingArea.scrollTop = mappingArea.scrollHeight;
                            }
                          }, 100);
                        }
                      }}
                    >
                      <div className="flex-1 flex items-center gap-1.5">
                        <span className="font-medium text-xs">{field.name}</span>
                        <span className={`ns-type-badge ${field.type || 'text'}`}>{field.type || 'text'}</span>
                        {field.isCustom && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">Custom</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 統計資訊 */}
              {netsuiteFields.length > 0 && (
                <div className="ns-stats">
                  <div className="ns-stat">
                    <span>總欄位：</span>
                    <span className="ns-stat-value">{netsuiteFields.length}</span>
            </div>
                  <div className="ns-stat">
                    <span>已映射：</span>
                    <span className="ns-stat-value">{netsuiteFields.filter((f) => f.isMapped).length}</span>
              </div>
                </div>
              )}
            </div>
          </div>

          {/* 中欄：Mapping Canvas */}
          <div className="ns-column">
            <div className="ns-panel">
              <div className="ns-header">Field Mapping ({mappings.length})</div>

              <div className="ns-column-body">
              {mappings.length === 0 ? (
                  <div className="ns-empty-state">
                    <div className="ns-empty-state-icon">
                      <ArrowLeft size={64} strokeWidth={1} style={{ transform: 'rotate(180deg)' }} />
                    </div>
                    <div className="ns-empty-state-title">尚無映射關係</div>
                    <div className="ns-empty-state-description">
                      從左側或右側拖曳欄位到下方空白行
                    </div>
                </div>
              ) : (
                  <>
                    {mappings.map((mapping, index) => (
                      <React.Fragment key={mapping.id}>
                        {/* 在每個映射前面加一個可插入的間隙 */}
                        <div
                          className="ns-insert-gap"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move'; // 允許在按住 Ctrl 時放下
                            e.currentTarget.classList.add('drag-over');
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('drag-over');
                          }}
                          onDrop={(e) => {
                            e.currentTarget.classList.remove('drag-over');
                            handleDropToMappingZone(e, index);
                          }}
                        >
                          <div className="ns-insert-hint">
                            <span className="text-gray-300 text-[10px]">← 拖入此處插入新映射 →</span>
                          </div>
                        </div>
                        
                        {/* 原本的映射行 */}
                        <div 
                          className={`ns-mapping-row animate-fade-in ${!mapping.isActive ? 'incomplete' : ''} ${
                            insertIndicator?.mappingId === mapping.id && insertIndicator.position === 'before' ? 'insert-before' : ''
                          } ${
                            insertIndicator?.mappingId === mapping.id && insertIndicator.position === 'after' ? 'insert-after' : ''
                          } ${
                            hoverCompleteMappingId === mapping.id ? 'hover-complete' : ''
                          } ${
                            hoverAddAggregateMappingId === mapping.id ? 'hover-add-aggregate' : ''
                          }`}
                          style={{ 
                            animationDelay: index < 10 ? `${index * 0.01}s` : '0s', // 前10行有微小延迟，新增的立刻出現
                            animationFillMode: 'both'
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move'; // 允許在按住 Ctrl 時放下
                            
                            const netsuiteField = e.dataTransfer.types.includes('netsuiteField');
                            
                            // 檢查是否拖拽到聚合映射（準備添加字段）
                            if (netsuiteField && (mapping.netsuiteField?.includes(',') || mapping.netsuiteType === 'aggregate')) {
                              setInsertIndicator(null);
                              setHoverCompleteMappingId(null);
                              setHoverAddAggregateMappingId(mapping.id);
                              return;
                            }
                            
                            // 如果是未完成的映射，顯示藍色框框（補完映射提示）
                            if (!mapping.isActive) {
                              setInsertIndicator(null);
                              setHoverAddAggregateMappingId(null);
                              setHoverCompleteMappingId(mapping.id);
                              return;
                            }
                            // 否則計算插入位置
                            setHoverCompleteMappingId(null);
                            setHoverAddAggregateMappingId(null);
                            const rect = e.currentTarget.getBoundingClientRect();
                            const y = e.clientY - rect.top;
                            const position = y < rect.height / 2 ? 'before' : 'after';
                            setInsertIndicator({ mappingId: mapping.id, position });
                          }}
                          onDragLeave={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX;
                            const y = e.clientY;
                            if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
                              setInsertIndicator(null);
                              setHoverCompleteMappingId(null);
                              setHoverAddAggregateMappingId(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setInsertIndicator(null);
                            setHoverCompleteMappingId(null);
                            setHoverAddAggregateMappingId(null);
                            
                            const netsuiteField = e.dataTransfer.getData('netsuiteField');
                            
                            // 檢查是否要添加到聚合映射
                            if (netsuiteField && (mapping.netsuiteField?.includes(',') || mapping.netsuiteType === 'aggregate')) {
                              // 拖拽 NetSuite 字段到聚合映射 → 添加到聚合列表
                              const added = handleAddToAggregate(e, mapping.id);
                              if (added) return; // 已處理，不繼續
                            }
                            
                            // 如果是未完成的映射，嘗試補完
                            if (!mapping.isActive) {
                              handleDropToExistingMapping(e, mapping.id);
                            } else {
                              // 否則在上方或下方插入新行
                              const targetIndex = mappings.findIndex(m => m.id === mapping.id);
                              const insertPos = insertIndicator?.position === 'before' ? targetIndex : targetIndex + 1;
                              handleDropToMappingZone(e, insertPos);
                            }
                          }}
                        >
                      {/* NetSuite 欄位 */}
                      <div className="ns-mapping-cell">
                        {mapping.netsuiteField ? (
                          <>
                            {mapping.netsuiteField.includes(',') ? (
                              // 多個字段（聚合）
                              <div className="flex flex-col gap-0.5 w-full py-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-semibold">
                                    AGGREGATE
                                  </span>
                                  <span className="text-[10px] text-gray-500">
                                    ({mapping.netsuiteField.split(',').length} 個欄位)
                                  </span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  {mapping.netsuiteField.split(',').map((field, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5 group">
                                      <span className="text-[10px] text-gray-400">{idx + 1}.</span>
                                      <span className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded font-medium border border-blue-200 flex items-center gap-1">
                                        {field.trim()}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveFieldFromAggregate(mapping.id, field.trim());
                                          }}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 rounded flex items-center justify-center w-4 h-4 min-w-4 min-h-4 p-0"
                                          title="移除此欄位"
                                        >
                                          <X size={8} className="text-red-600" />
                                        </button>
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              // 單個字段
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-xs">{mapping.netsuiteField}</span>
                                {mapping.netsuiteType && mapping.netsuiteType !== 'aggregate' && (
                                  <span className={`ns-type-badge ${mapping.netsuiteType}`}>{mapping.netsuiteType}</span>
              )}
            </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-400 text-xs italic">
                            <span>← 拖入左側欄位</span>
                          </div>
                        )}
          </div>

                      {/* 智慧箭頭 + 轉換規則顯示 */}
                      <div className="flex items-center justify-center relative" style={{ width: '100%', height: '100%' }}>
                        <button
                          className={`ns-arrow-button ${mapping.transform.type !== 'direct' ? 'has-transform' : ''}`}
                          onClick={() => {
                            if (mapping.isActive) {
                              setSelectedMapping(mapping);
                              setTransformModalOpen(true);
                            }
                          }}
                          disabled={!mapping.isActive}
                          title={mapping.isActive ? "點擊設定轉換規則" : "請先完成欄位映射"}
                        >
                          <ArrowLeftRight className="ns-arrow-icon" size={12} />
                        </button>
                        {/* 顯示轉換規則類型 */}
                        {mapping.transform.type !== 'direct' && mapping.isActive && (
                          <div className="text-[9px] text-center absolute" style={{ bottom: '-12px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
                            {mapping.transform.type === 'aggregate' && mapping.transform.config?.aggregateFunction === 'CONCAT' && (
                              <span className="px-1 py-0.5 bg-green-100 text-green-700 rounded">CONCAT</span>
                            )}
                            {mapping.transform.type === 'aggregate' && mapping.transform.config?.aggregateFunction === 'JS_EXPRESSION' && (
                              <span className="px-1 py-0.5 bg-orange-100 text-orange-700 rounded">JS</span>
                            )}
                            {mapping.transform.type === 'aggregate' && 
                              mapping.transform.config?.aggregateFunction !== 'CONCAT' && 
                              mapping.transform.config?.aggregateFunction !== 'JS_EXPRESSION' && (
                              <span className="px-1 py-0.5 bg-purple-100 text-purple-700 rounded">
                                {mapping.transform.config?.aggregateFunction || 'AGG'}
                              </span>
                            )}
                            {mapping.transform.type === 'default' && (
                              <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded">DEF</span>
                            )}
                            {mapping.transform.type === 'vlookup' && (
                              <span className="px-1 py-0.5 bg-yellow-100 text-yellow-700 rounded">VLOOKUP</span>
                            )}
                            {mapping.transform.type === 'expression' && (
                              <span className="px-1 py-0.5 bg-red-100 text-red-700 rounded">SQL</span>
                            )}
            </div>
                        )}
              </div>

                      {/* Supabase 欄位 */}
                      <div className="ns-mapping-cell">
                        {mapping.supabaseColumn ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-xs">{mapping.supabaseColumn}</span>
                              <span className={`ns-type-badge ${mapping.supabaseType}`}>{mapping.supabaseType}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-400 text-xs italic">
                            <span>拖入右側欄位 →</span>
                          </div>
                        )}
                      </div>

                      {/* 刪除按鈕 */}
                      <div>
                        <button className="ns-delete-button" onClick={() => handleRemoveMapping(mapping.id)} title="刪除映射">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                      </React.Fragment>
                    ))}
                  </>
                )}
                
                {/* 空白行（Drop Zone）- 像 NetSuite 一樣預留 5 行 */}
                {[...Array(1)].map((_, index) => {
                  // 底部只保留一個空白插入行
                  const insertPosition = mappings.length + index;
                  
                    return (
                    <div
                      key={`placeholder-${index}`}
                      className="ns-drop-placeholder"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('drag-over');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('drag-over');
                      }}
                      onDrop={(e) => {
                        e.currentTarget.classList.remove('drag-over');
                        // 插入到這個空白行對應的位置
                        handleDropToMappingZone(e, insertPosition);
                      }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <ArrowLeft size={14} className="text-gray-400" />
                        <span className="text-gray-400 text-xs">拖入左側欄位</span>
                      </div>
                      <div className="flex items-center justify-center" style={{ width: '100%', height: '100%' }}>
                        {/* 空白區域，不顯示齒輪圖案 */}
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-gray-400 text-xs">拖入右側欄位</span>
                        <ArrowLeft size={14} className="text-gray-400" style={{ transform: 'rotate(180deg)' }} />
                      </div>
                      <div></div>
                    </div>
                    );
                  })}
                </div>

              {/* 統計資訊 */}
              {mappings.length > 0 && (
                <div className="ns-stats">
                  <div className="ns-stat">
                    <span>總映射數：</span>
                    <span className="ns-stat-value">{mappings.length}</span>
            </div>
                  <div className="ns-stat">
                    <span>有轉換規則：</span>
                    <span className="ns-stat-value">{mappings.filter((m) => m.transform.type !== 'direct').length}</span>
          </div>
        </div>
              )}
            </div>
          </div>

          {/* 右欄：Supabase Columns */}
          <div className="ns-column">
            <div className="ns-panel">
              <div className="ns-header">
                {tableInfo?.supabaseTable || 'Supabase'} Fields ({supabaseColumns.length})
              </div>

              <div className="ns-column-body">
                {supabaseColumns.length === 0 ? (
                  <div className="ns-empty-state">
                    <div className="ns-empty-state-description">沒有可用的 Supabase 欄位</div>
                  </div>
                ) : (
                  supabaseColumns.map((column) => {
                    // 檢查此欄位是否已被映射
                    const isMapped = mappings.some(m => m.supabaseColumn === column.name);
                    
                    return (
                      <div
                        key={column.name}
                        className={`ns-field-item ${isMapped ? 'disabled' : ''}`}
                        draggable={!isMapped}
                        onDragStart={(e) => {
                          if (!isMapped) {
                            // 設置拖拽效果，允許在按住 Ctrl 時拖拽
                            e.dataTransfer.effectAllowed = 'copyMove';
                            e.dataTransfer.setData('supabaseColumn', column.name);
                            e.dataTransfer.setData('supabaseType', column.type);
                          }
                        }}
              onClick={() => {
                          if (!isMapped) {
                            // 點擊自動在最下面排隊
                            const newMapping: MappingRule = {
                              id: `mapping-${Date.now()}-${Math.random()}`,
                              netsuiteField: '',
                              supabaseColumn: column.name,
                              netsuiteType: '',
                              supabaseType: column.type,
                              transform: { type: 'direct' },
                              isActive: false, // 未完成的映射
                            };
                            setMappings([...mappings, newMapping]);
                            
                            // 右側欄位不需要標記 isMapped，因為是動態計算的
                            // mappings.some(m => m.supabaseColumn === column.name) 會自動處理
                            
                            // 滾動到底部
                            setTimeout(() => {
                              const mappingArea = document.querySelector('.ns-column-body');
                              if (mappingArea) {
                                mappingArea.scrollTop = mappingArea.scrollHeight;
                              }
                            }, 100);
                          }
                        }}
                      >
                        <div className="flex-1 flex items-center gap-1.5">
                          <span className="font-medium text-xs">{column.name}</span>
                          <span className={`ns-type-badge ${column.type}`}>{column.type}</span>
                          {column.nullable && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">Nullable</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* 統計資訊 */}
              {supabaseColumns.length > 0 && (
                <div className="ns-stats">
                  <div className="ns-stat">
                    <span>總欄位：</span>
                    <span className="ns-stat-value">{supabaseColumns.length}</span>
                  </div>
                  <div className="ns-stat">
                    <span>必填：</span>
                    <span className="ns-stat-value">{supabaseColumns.filter((c) => !c.nullable).length}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 快速操作提示 */}
        <div className="mt-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 shadow-sm">
          <h3 className="font-semibold text-blue-900 mb-3 text-sm flex items-center gap-2">
            💡 使用提示
          </h3>
          <ul className="text-xs text-blue-800 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              <span>從<strong>左欄拖曳 NetSuite 欄位</strong>到<strong>中欄空白行</strong>（會創建待完成的映射）</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              <span>再從<strong>右欄拖曳對應的 Supabase 欄位</strong>到該行（完成映射！）</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 font-bold">⚠</span>
              <span>未完成的映射會以<strong>黃色背景</strong>標示，需要補完另一側欄位</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">3.</span>
              <span>點擊中欄的<strong>箭頭圖示（⟷）</strong>設定資料轉換規則（5 種轉換類型）</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 font-bold">✗</span>
              <span>點擊<strong>「X」</strong>刪除映射</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">💾</span>
              <span>完成後點擊右上角<strong>「儲存」</strong>按鈕</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 轉換規則 Modal */}
      {selectedMapping && (
        <TransformModal
          open={transformModalOpen}
          onClose={() => {
            setTransformModalOpen(false);
            setSelectedMapping(null);
          }}
          sourceField={selectedMapping.netsuiteField}
          targetField={selectedMapping.supabaseColumn}
          currentTransform={selectedMapping.transform}
          onSave={(transform) => {
            handleUpdateTransform(selectedMapping.id, transform);
            setTransformModalOpen(false);
            setSelectedMapping(null);
          }}
        />
      )}
    </div>
  );
}
