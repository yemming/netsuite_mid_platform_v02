'use client';

import { useState, useRef } from 'react';
import { Upload, FileUp, Play, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SourceFieldList, SourceField } from '@/components/etl/SourceFieldList';
import { TargetFieldList, TargetTable, TargetField } from '@/components/etl/TargetFieldList';
import { MappingCanvas, MappingRule } from '@/components/etl/MappingCanvas';
import { TransformConfig } from '@/components/etl/TransformModal';
import '@/components/etl/netsuite-style.css';

type Step = 'upload' | 'mapping' | 'review' | 'execute' | 'complete';

export default function ETLImportPage() {
  // 步驟控制
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [loading, setLoading] = useState(false);

  // CSV 資料
  const [fileName, setFileName] = useState('');
  const [sourceFields, setSourceFields] = useState<SourceField[]>([]);
  const [csvData, setCsvData] = useState<Record<string, any>[]>([]);

  // 目標表設定
  const [targetTable, setTargetTable] = useState('');
  const [primaryKey, setPrimaryKey] = useState('');
  const [targetTables, setTargetTables] = useState<TargetTable[]>([]);

  // 映射規則
  const [mappings, setMappings] = useState<MappingRule[]>([]);

  // SQL 生成結果
  const [generatedSQL, setGeneratedSQL] = useState('');
  const [sqlMode, setSqlMode] = useState<'create' | 'upsert'>('create');

  // ETL 執行結果
  const [importedCount, setImportedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 步驟 1: 上傳 CSV
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/csv-upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setFileName(result.data.fileName);
        setSourceFields(result.data.fields);
        setCsvData(result.data.sampleData);

        // 載入目標表（這裡先用假資料，實際應該從 table_mapping_config 讀取）
        await loadTargetTables();

        setCurrentStep('mapping');
      } else {
        alert(`上傳失敗: ${result.error}`);
      }
    } catch (error: any) {
      alert(`上傳錯誤: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 載入目標表結構
   */
  const loadTargetTables = async () => {
    try {
      // 這裡應該從 API 讀取，暫時用假資料示範
      const mockTables: TargetTable[] = [
        {
          name: 'sales_orders',
          displayName: 'Sales Order（銷售訂單）',
          fields: [
            { name: 'external_id', type: 'text', isRequired: true },
            { name: 'customer_name', type: 'text', isRequired: true },
            { name: 'order_date', type: 'date', isRequired: true },
            { name: 'amount', type: 'numeric' },
            { name: 'status', type: 'text' },
            { name: 'location', type: 'text' },
          ],
        },
        {
          name: 'ns_subsidiary',
          displayName: 'Subsidiary（子公司）',
          fields: [
            { name: 'id', type: 'bigint', isRequired: true },
            { name: 'full_name', type: 'text', isRequired: true },
            { name: 'country', type: 'text' },
            { name: 'currency', type: 'text' },
            { name: 'is_elimination', type: 'boolean' },
          ],
        },
      ];

      setTargetTables(mockTables);
    } catch (error) {
      console.error('載入目標表失敗:', error);
    }
  };

  /**
   * 步驟 2: 建立映射（拖拉邏輯）
   */
  const handleAddMapping = (sourceField: string, targetField: string) => {
    const source = sourceFields.find((f) => f.name === sourceField);
    if (!source) return;

    // 找到目標欄位的型別
    let targetType = 'text';
    for (const table of targetTables) {
      const field = table.fields.find((f) => f.name === targetField);
      if (field) {
        targetType = field.type;
        break;
      }
    }

    const newMapping: MappingRule = {
      id: `${Date.now()}_${Math.random()}`,
      sourceField: source.name,
      targetField,
      sourceType: source.inferredType,
      targetType,
      transform: { type: 'direct' },
    };

    setMappings([...mappings, newMapping]);

    // 標記來源欄位為已映射
    setSourceFields(
      sourceFields.map((f) =>
        f.name === sourceField ? { ...f, isMapped: true } : f
      )
    );
  };

  const handleRemoveMapping = (id: string) => {
    const mapping = mappings.find((m) => m.id === id);
    if (!mapping) return;

    setMappings(mappings.filter((m) => m.id !== id));

    // 取消來源欄位的映射狀態
    setSourceFields(
      sourceFields.map((f) =>
        f.name === mapping.sourceField ? { ...f, isMapped: false } : f
      )
    );
  };

  const handleUpdateTransform = (id: string, transform: TransformConfig) => {
    setMappings(
      mappings.map((m) => (m.id === id ? { ...m, transform } : m))
    );
  };

  // 拖放邏輯（在中欄的 Drop Zone）
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const sourceField = e.dataTransfer.getData('sourceField');
    const targetField = e.dataTransfer.getData('targetField');

    if (sourceField && targetField) {
      handleAddMapping(sourceField, targetField);
    }
  };

  /**
   * 步驟 3: 生成 SQL
   */
  const handleGenerateSQL = async () => {
    if (!targetTable) {
      alert('請輸入目標表名稱');
      return;
    }

    if (mappings.length === 0) {
      alert('請至少建立一個映射關係');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/generate-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetTable,
          mappings: mappings.map((m) => ({
            sourceField: m.sourceField,
            targetField: m.targetField,
            transformType: m.transform.type,
            transformConfig: m.transform.config,
            sourceType: m.sourceType,
            targetType: m.targetType,
          })),
          primaryKey: primaryKey || undefined,
          createIfNotExists: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedSQL(result.data.sql);
        setSqlMode(result.data.mode);
        setCurrentStep('review');
      } else {
        alert(`SQL 生成失敗: ${result.error}`);
      }
    } catch (error: any) {
      alert(`生成錯誤: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 步驟 4: 執行 ETL
   */
  const handleExecuteETL = async () => {
    setLoading(true);
    setCurrentStep('execute');

    try {
      // 先上傳完整的 CSV 資料（這裡假設已經有，實際應該重新讀取）
      const response = await fetch('/api/execute-etl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetTable,
          mappings: mappings.map((m) => ({
            sourceField: m.sourceField,
            targetField: m.targetField,
            sourceType: m.sourceType,
            targetType: m.targetType,
            transform: m.transform,
          })),
          csvData, // 注意：這裡只有範例資料，實際應該讀取完整 CSV
          primaryKey: primaryKey || undefined,
          mode: sqlMode,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setImportedCount(result.data.imported);
        setCurrentStep('complete');
      } else {
        alert(`ETL 執行失敗: ${result.error}`);
        setCurrentStep('review');
      }
    } catch (error: any) {
      alert(`執行錯誤: ${error.message}`);
      setCurrentStep('review');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 重置流程
   */
  const handleReset = () => {
    setCurrentStep('upload');
    setFileName('');
    setSourceFields([]);
    setCsvData([]);
    setTargetTable('');
    setPrimaryKey('');
    setMappings([]);
    setGeneratedSQL('');
    setImportedCount(0);
  };

  return (
    <div className="min-h-screen bg-gray-50 ns-font">
      {/* NetSuite 風格的步驟指示器 */}
      <div className="bg-white border-b-2 border-gray-300">
        <div className="ns-steps max-w-7xl mx-auto">
          <div className={`ns-step ${currentStep === 'upload' ? 'active' : currentStep !== 'upload' ? 'completed' : ''}`}>
            <div className="ns-step-number">1</div>
            <span>掃描 & 上傳 CSV</span>
          </div>
          <div className={`ns-step ${currentStep === 'mapping' ? 'active' : ['review', 'execute', 'complete'].includes(currentStep) ? 'completed' : ''}`}>
            <div className="ns-step-number">2</div>
            <span>欄位映射</span>
          </div>
          <div className={`ns-step ${currentStep === 'review' ? 'active' : ['execute', 'complete'].includes(currentStep) ? 'completed' : ''}`}>
            <div className="ns-step-number">3</div>
            <span>檢視 SQL</span>
          </div>
          <div className={`ns-step ${['execute', 'complete'].includes(currentStep) ? 'active' : ''}`}>
            <div className="ns-step-number">4</div>
            <span>執行匯入</span>
          </div>
        </div>
      </div>

      {/* 主內容區 */}
      <div className="max-w-7xl mx-auto p-6">
        {/* 步驟 1: 上傳 CSV */}
        {currentStep === 'upload' && (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="max-w-xl mx-auto text-center space-y-6">
                <div className="flex justify-center">
                  <FileUp size={64} className="text-blue-500" strokeWidth={1.5} />
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-2">上傳 CSV 檔案</h2>
                  <p className="text-gray-600 text-sm">
                    選擇你要匯入的 CSV 檔案，系統會自動解析欄位和資料型別
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <Button
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="w-full max-w-xs"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      解析中...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      選擇檔案
                    </>
                  )}
                </Button>

                <div className="text-xs text-gray-500">
                  支援格式：CSV（逗號分隔）
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 步驟 2: 欄位映射（NetSuite 三欄式佈局） */}
        {currentStep === 'mapping' && (
          <div className="space-y-4">
            {/* 目標表設定 */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetTable" className="text-xs">
                      目標表名稱 *
                    </Label>
                    <Input
                      id="targetTable"
                      placeholder="例如：sales_orders"
                      value={targetTable}
                      onChange={(e) => setTargetTable(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="primaryKey" className="text-xs">
                      主鍵欄位（可選）
                    </Label>
                    <Input
                      id="primaryKey"
                      placeholder="例如：external_id"
                      value={primaryKey}
                      onChange={(e) => setPrimaryKey(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded p-3">
                  <div>
                    <strong>檔案：</strong> {fileName} | <strong>欄位：</strong>{' '}
                    {sourceFields.length} | <strong>映射：</strong>{' '}
                    {mappings.length}
                  </div>
                  <Button
                    onClick={handleGenerateSQL}
                    disabled={loading || !targetTable || mappings.length === 0}
                    size="sm"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-3 w-3" />
                    )}
                    下一步：生成 SQL
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 三欄式映射界面 */}
            <div
              className="ns-three-column"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              {/* 左欄：來源欄位 */}
              <SourceFieldList
                fields={sourceFields}
                onFieldSelect={(fieldName) => {
                  // 快速映射：點擊後提示選擇目標欄位
                  console.log('Selected source field:', fieldName);
                }}
              />

              {/* 中欄：映射畫布 */}
              <MappingCanvas
                mappings={mappings}
                onAddMapping={handleAddMapping}
                onRemoveMapping={handleRemoveMapping}
                onUpdateTransform={handleUpdateTransform}
              />

              {/* 右欄：目標欄位 */}
              <TargetFieldList
                tables={targetTables}
                onFieldSelect={(fieldName, fieldType) => {
                  console.log('Selected target field:', fieldName, fieldType);
                }}
              />
            </div>
          </div>
        )}

        {/* 步驟 3: 檢視 SQL */}
        {currentStep === 'review' && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">檢視生成的 SQL</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      模式：
                      <span
                        className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                          sqlMode === 'create'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {sqlMode === 'create' ? 'CREATE TABLE' : 'UPSERT'}
                      </span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setCurrentStep('mapping')}>
                      返回修改
                    </Button>
                    <Button onClick={handleExecuteETL} disabled={loading}>
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="mr-2 h-4 w-4" />
                      )}
                      執行匯入
                    </Button>
                  </div>
                </div>

                <Textarea
                  value={generatedSQL}
                  readOnly
                  className="font-mono text-xs h-96 bg-gray-50"
                />

                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-3 w-3" />
                  下載 SQL
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 步驟 4: 執行中 */}
        {currentStep === 'execute' && (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="max-w-xl mx-auto text-center space-y-6">
                <Loader2 size={64} className="mx-auto text-blue-500 animate-spin" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">執行中...</h2>
                  <p className="text-gray-600 text-sm">
                    正在匯入資料到表 <code className="bg-gray-100 px-2 py-1 rounded">{targetTable}</code>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 步驟 5: 完成 */}
        {currentStep === 'complete' && (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="max-w-xl mx-auto text-center space-y-6">
                <CheckCircle2 size={64} className="mx-auto text-green-500" />
                <div>
                  <h2 className="text-2xl font-bold mb-2 text-green-700">
                    匯入成功！
                  </h2>
                  <p className="text-gray-600 text-sm">
                    已成功匯入 <strong className="text-green-700">{importedCount}</strong> 筆資料到{' '}
                    <code className="bg-gray-100 px-2 py-1 rounded">{targetTable}</code>
                  </p>
                </div>

                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={handleReset}>
                    再匯入一次
                  </Button>
                  <Button onClick={() => (window.location.href = '/dashboard')}>
                    返回儀表板
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

