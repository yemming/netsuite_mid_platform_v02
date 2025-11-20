'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Save,
  X,
  ArrowLeft,
  Loader2,
  GripVertical,
  ChevronRight,
  Eye,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import jsPDF from 'jspdf';
import { Designer } from '@pdfme/ui';
import { generate } from '@pdfme/generator';
import type { Template } from '@pdfme/common';
import { getPDFMEPlugins } from '../../pdfme-plugins';

export default function PDFTemplateDesignPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;
  const isNew = templateId === 'new';
  
  const [templateName, setTemplateName] = useState('');
  const [editMode] = useState<'visual'>('visual');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Invoice 測試相關狀態
  const [invoices, setInvoices] = useState<Array<{ id: string; tranid: string; entity: string }>>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [isLoadingInvoiceData, setIsLoadingInvoiceData] = useState(false);
  
  // Field List 側邊欄狀態
  const [fieldListOpen, setFieldListOpen] = useState(true);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  // 預覽相關狀態
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  
  // Designer 區域寬度狀態
  const [designerWidth, setDesignerWidth] = useState<number | null>(null); // null 表示使用 flex-1（自動調整）
  
  const designerRef = useRef<HTMLDivElement>(null);
  const designerInstanceRef = useRef<Designer | null>(null);

  // 初始化 PDFME Designer（當 invoiceData 載入時重新初始化以更新 sampleData）
  useEffect(() => {
    // 只在視覺化編輯模式且容器已掛載時初始化
    if (editMode === 'visual' && designerRef.current && !isLoading) {
      const createBlankPdf = async () => {
        try {
          // 使用 jsPDF 創建一個空白的 A4 PDF
          const pdf = new jsPDF('p', 'mm', 'a4');
          const arrayBuffer = pdf.output('arraybuffer');
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // 創建預設模板 - 先不包含任何欄位，讓用戶自己拖拽添加
          // 這樣可以確保拖拽功能正常運作
          const defaultTemplate: Template = {
            basePdf: uint8Array,
            schemas: [
              [
                // 預設不包含任何欄位，讓用戶從 Field List 拖拽添加
                // 如果你想要預設欄位，可以取消下面的註解
                // {
                //   name: 'title',
                //   type: 'text',
                //   position: { x: 20, y: 20 },
                //   width: 100,
                //   height: 10,
                //   fontSize: 24,
                //   fontColor: '#000000',
                // },
              ],
            ],
          };

          try {
            const plugins = getPDFMEPlugins({
              includeBarcodes: true,
              barcodeGroupName: 'barcode',
            });

            // 準備初始 sampleData（如果有 invoiceData 就用它，否則用空資料）
            const initialSampleData = invoiceData ? [
              Object.fromEntries(
                Object.entries(invoiceData)
                  .filter(([key]) => key !== 'lineItems' && key !== 'raw' && key !== 'statusColor')
                  .map(([key, value]) => [key, String(value || '')])
              ),
            ] : [
              {
                title: '',
                tranid: '',
                entity: '',
                amount: '',
              },
            ];

            // 準備 sampleData（如果有 invoiceData 就用它）
            const sampleDataForDesigner = invoiceData ? [
              Object.fromEntries(
                Object.entries(invoiceData)
                  .filter(([key]) => key !== 'lineItems' && key !== 'raw' && key !== 'statusColor')
                  .map(([key, value]) => [key, String(value || '')])
              ),
            ] : [
              {
                title: '',
                tranid: '',
                entity: '',
                amount: '',
              },
            ];

            // 如果已經有 Designer 實例，先銷毀它
            if (designerInstanceRef.current) {
              designerInstanceRef.current.destroy();
              designerInstanceRef.current = null;
            }

            const designer = new Designer({
              domContainer: designerRef.current!,
              template: defaultTemplate,
              plugins,
              // 嘗試透過 options 傳入 sampleData
              options: {
                ...(sampleDataForDesigner && { defaultInputs: sampleDataForDesigner }),
              },
            } as any);
            
            designerInstanceRef.current = designer;
            
            // 嘗試設定 sampleData（多種方式）
            const designerAny = designer as any;
            if (designerAny.sampleData !== undefined) {
              designerAny.sampleData = sampleDataForDesigner;
            }
            if (designerAny.defaultInputs !== undefined) {
              designerAny.defaultInputs = sampleDataForDesigner;
            }
            if (designerAny.designer) {
              const innerDesigner = designerAny.designer as any;
              if (innerDesigner.sampleData !== undefined) {
                innerDesigner.sampleData = sampleDataForDesigner;
              }
              if (innerDesigner.defaultInputs !== undefined) {
                innerDesigner.defaultInputs = sampleDataForDesigner;
              }
            }
            
            console.log('✅ PDFME Designer 初始化完成');
            console.log('📝 sampleData:', JSON.stringify(sampleDataForDesigner, null, 2));
            console.log('📝 sampleData currency 值:', sampleDataForDesigner[0]?.currency);
          } catch (error) {
            console.error('PDFME Designer 初始化錯誤:', error);
          }
        } catch (error) {
          console.error('創建空白 PDF 錯誤:', error);
        }
      };

      // 延遲一下確保 DOM 完全渲染
      const timer = setTimeout(() => {
        createBlankPdf();
      }, 100);

      return () => {
        clearTimeout(timer);
      };
    }

    return () => {
      // 不在這裡銷毀，讓它保持存在以便更新 sampleData
    };
  }, [editMode, isLoading, invoiceData]); // 當 invoiceData 改變時重新初始化

  // Helper 函數：更新 Designer 的 sampleData
  const updateDesignerSampleData = (data: any) => {
    if (!designerInstanceRef.current || !data) return;
    
    const sampleData = [
      Object.fromEntries(
        Object.entries(data)
          .filter(([key]) => key !== 'lineItems' && key !== 'raw' && key !== 'statusColor')
          .map(([key, value]) => {
            let stringValue = '';
            if (value !== null && value !== undefined) {
              if (typeof value === 'object') {
                stringValue = JSON.stringify(value);
              } else {
                stringValue = String(value);
              }
            }
            return [key, stringValue];
          })
      ),
    ];

    const designer = designerInstanceRef.current as any;
    
    // 嘗試多種方式更新 sampleData
    // 方法 1: 直接設定屬性
    if (designer.sampleData !== undefined) {
      designer.sampleData = sampleData;
    }
    
    // 方法 2: 透過內部實例
    if (designer.designer && (designer.designer as any).sampleData !== undefined) {
      (designer.designer as any).sampleData = sampleData;
    }
    
    // 方法 3: 更新 template 來觸發重新渲染
    try {
      const currentTemplate = designer.getTemplate();
      designer.updateTemplate(currentTemplate);
    } catch (error) {
      // 忽略錯誤
    }
    
    console.log('📝 已嘗試更新 Designer sampleData:', sampleData);
  };

  // 載入現有模板（如果是編輯模式）
  useEffect(() => {
    if (!isNew && templateId) {
      // TODO: 從 API 或本地存儲載入模板資料
      // 暫時使用模擬資料
      setTemplateName('標準樣式');
    }
    // 不需要等待載入，直接設置為 false
    setIsLoading(false);
  }, [isNew, templateId]);

  // 載入 Invoice 列表
  useEffect(() => {
    loadInvoices();
  }, []);

  // 當選擇的 Invoice 改變時，載入詳細資料
  useEffect(() => {
    if (selectedInvoiceId) {
      loadInvoiceData(selectedInvoiceId);
    }
  }, [selectedInvoiceId]);

  // 當 invoiceData 載入時，更新 PDFME Designer 的 sampleData
  useEffect(() => {
    if (invoiceData && designerInstanceRef.current) {
      // 使用 helper 函數更新 sampleData
      updateDesignerSampleData(invoiceData);
    }
  }, [invoiceData]);
  
  // 調整 PDFME Designer 左側工具列樣式（與右側 Field List 一致）
  // PDFME 自訂樣式已移除，使用預設值
  // useEffect(() => {
  //   const styleId = 'pdfme-sidebar-custom-style';
  //   
  //   // 如果樣式已存在，先移除
  //   const existingStyle = document.getElementById(styleId);
  //   if (existingStyle) {
  //     existingStyle.remove();
  //   }
  //   
  //   // 創建新的樣式元素 - 使用更精確的選擇器，只針對 PDFME Designer 的 sidebar
  //   const style = document.createElement('style');
  //   style.id = styleId;
  //   style.textContent = `
  //     /* 所有 PDFME 自訂 CSS 樣式已移除 */
  //   `;
  // 
  //   document.head.appendChild(style);
  //   
  //   // 使用 MutationObserver 監聽 DOM 變化，但只針對特定的 sidebar 元素和畫布區域
  //   const observer = new MutationObserver(() => {
  //     // 所有 PDFME MutationObserver 邏輯已移除
  //   });
  //   
  //   // 只在 designerRef 容器內觀察，避免影響其他元素
  //   if (designerRef.current) {
  //     observer.observe(designerRef.current, {
  //       childList: true,
  //       subtree: true,
  //       attributes: true,
  //       attributeFilter: ['style'],
  //     });
  //   }
  //   
  //   // 清理函數
  //   return () => {
  //     observer.disconnect();
  //     const styleToRemove = document.getElementById(styleId);
  //     if (styleToRemove) {
  //       styleToRemove.remove();
  //     }
  //   };
  // }, []);

  // 載入 Invoice 列表
  const loadInvoices = async () => {
    setIsLoadingInvoices(true);
    try {
      const response = await fetch('/api/invoices?limit=50');
      const result = await response.json();
      
      if (result.success && result.data?.items) {
        setInvoices(result.data.items);
      } else {
        console.error('載入 Invoice 列表失敗:', result.message);
      }
    } catch (error) {
      console.error('載入 Invoice 列表錯誤:', error);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  // 載入單一 Invoice 詳細資料
  const loadInvoiceData = async (invoiceId: string) => {
    setIsLoadingInvoiceData(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('✅ Invoice 資料載入成功:', result.data);
        console.log('📋 可用欄位:', Object.keys(result.data));
        setInvoiceData(result.data);
      } else {
        console.error('❌ 載入 Invoice 詳細資料失敗:', result.message);
        alert(`無法載入 Invoice 資料: ${result.message}`);
      }
    } catch (error: any) {
      console.error('❌ 載入 Invoice 詳細資料錯誤:', error);
      alert(`載入 Invoice 資料時發生錯誤: ${error.message}`);
    } finally {
      setIsLoadingInvoiceData(false);
    }
  };

  // 預覽 PDF（使用 Generator 生成實際 PDF）
  const handlePreview = async () => {
    if (!designerInstanceRef.current || !invoiceData) {
      alert('請先選擇一個 Invoice 來預覽');
      return;
    }

    setIsGeneratingPreview(true);
    try {
      const template = designerInstanceRef.current.getTemplate();
      const plugins = getPDFMEPlugins({
        includeBarcodes: true,
        barcodeGroupName: 'barcode',
      });

      // 準備 sampleData
      // 需要根據模板中的欄位類型來決定資料格式
      const allFieldNames = new Set<string>();
      
      // 收集所有欄位名稱和類型
      const fieldTypes: Record<string, string> = {};
      template.schemas?.forEach((schema) => {
        schema?.forEach((field: any) => {
          if (field.name) {
            allFieldNames.add(field.name);
            fieldTypes[field.name] = field.type || 'text';
          }
        });
      });
      
      console.log('📋 模板欄位類型:', fieldTypes);
      
      // 根據欄位類型準備資料
      // 先建立一個包含所有欄位的資料物件
      const dataMap: Record<string, any> = {};
      
      // 先從 invoiceData 填充資料
      Object.entries(invoiceData)
        .filter(([key]) => key !== 'lineItems' && key !== 'raw' && key !== 'statusColor')
        .forEach(([key, value]) => {
          dataMap[key] = value;
        });
      
      // 為模板中的所有欄位準備資料
      const sampleData = [
        Object.fromEntries(
          Array.from(allFieldNames).map((fieldName) => {
            const fieldType = fieldTypes[fieldName] || 'text';
            const value = dataMap[fieldName];
            
            // 如果是圖片欄位，需要特殊處理
            if (fieldType === 'image') {
              // PDFME 圖片欄位需要：
              // 1. 圖片 URL（http/https）
              // 2. Base64 資料 URL（data:image/...;base64,...）
              // 3. 或空字串（如果沒有圖片）
              
              // 如果值是字串且看起來像 URL 或 base64，直接使用
              if (typeof value === 'string' && value) {
                if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
                  return [fieldName, value];
                }
                // 如果是 base64 字串（沒有 data: 前綴），添加前綴
                if (value.length > 100 && /^[A-Za-z0-9+/=]+$/.test(value)) {
                  return [fieldName, `data:image/jpeg;base64,${value}`];
                }
              }
              
              // 如果沒有有效的圖片資料，使用一個測試圖片 URL
              // 或者返回空字串（PDFME 會顯示空白）
              console.warn(`⚠️ 圖片欄位 ${fieldName} 沒有有效的圖片資料，使用測試圖片`);
              // 使用一個公開的測試圖片 URL
              return [fieldName, 'https://via.placeholder.com/150/000000/FFFFFF?text=No+Image'];
            }
            
            // 其他類型的欄位：如果有值就使用，否則返回空字串
            return [fieldName, value !== null && value !== undefined ? String(value) : ''];
          })
        ),
      ];
      
      console.log('📊 準備的 sampleData:', sampleData);

      // 使用 generate 函數生成 PDF
      const pdf = await generate({ template, inputs: sampleData, plugins: plugins as any });

      // 創建 PDF URL
      const blob = new Blob([pdf.buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // 清理舊的 URL
      if (previewPdfUrl) {
        URL.revokeObjectURL(previewPdfUrl);
      }
      
      setPreviewPdfUrl(url);
      setPreviewOpen(true);
      
      console.log('✅ PDF 預覽生成成功');
    } catch (error: any) {
      console.error('預覽 PDF 時發生錯誤:', error);
      alert(`預覽失敗: ${error.message}`);
    } finally {
      setIsGeneratingPreview(false);
    }
  };
  
  // 關閉預覽時清理 PDF URL
  const handleClosePreview = () => {
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    }
  };

  // 儲存模板
  const handleSave = async () => {
    if (!templateName) {
      alert('請填寫樣式名稱');
      return;
    }

    let template = null;

    if (designerInstanceRef.current) {
      try {
        template = designerInstanceRef.current.getTemplate();
        // 將 PDFME 模板轉換為 JSON 字符串（暫時）
        const templateJson = JSON.stringify(template, null, 2);
        console.log('模板內容:', templateJson);
      } catch (error) {
        console.error('獲取 PDFME 模板錯誤:', error);
        alert('無法獲取視覺化編輯器的模板');
        return;
      }
    }

    if (!template) {
      alert('請先設計模板內容');
      return;
    }

    setIsSaving(true);
    
    // TODO: 儲存到 API 或本地存儲
    setTimeout(() => {
      setIsSaving(false);
      alert('儲存成功！');
      router.push('/dashboard/nextjs-toolbox/pdf-template-editor');
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* 頂部工具列 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card gap-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/nextjs-toolbox/pdf-template-editor')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
        </div>
        
        {/* 中間：表單欄位 */}
        <div className="flex-1 flex items-center gap-4 px-4">
          <div className="flex items-center gap-2 min-w-[200px]">
            <Label htmlFor="templateName" className="text-sm whitespace-nowrap">樣式名稱 *</Label>
            <Input
              id="templateName"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="例如：標準樣式"
              className="h-8"
            />
          </div>
          
          {/* 選擇 Invoice */}
          <div className="flex items-center gap-2">
            <Label htmlFor="invoiceSelect" className="text-sm text-muted-foreground whitespace-nowrap">
              選擇 Invoice：
            </Label>
            <Select
              value={selectedInvoiceId}
              onValueChange={setSelectedInvoiceId}
              disabled={isLoadingInvoices || isLoadingInvoiceData}
            >
              <SelectTrigger className="w-[300px] h-8">
                <SelectValue placeholder={isLoadingInvoices ? '載入中...' : '選擇 Invoice'} />
              </SelectTrigger>
              <SelectContent>
                {invoices.map((invoice) => (
                  <SelectItem key={invoice.id} value={invoice.id}>
                    {invoice.tranid} - {invoice.entity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isLoadingInvoiceData && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={!invoiceData || isSaving || isGeneratingPreview}
            title="預覽 PDF（使用當前 Invoice 資料）"
          >
            {isGeneratingPreview ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                預覽
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/nextjs-toolbox/pdf-template-editor')}
            disabled={isSaving}
          >
            <X className="h-4 w-4 mr-2" />
            取消
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                儲存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                儲存
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 中央編輯區域 - 包含設計器和 Field List */}
      <div className="flex-1 flex overflow-hidden">
        {/* 中央設計器區域 */}
        <div
          className={`relative ${isDraggingOver ? 'ring-2 ring-primary ring-offset-2' : ''}`}
          ref={designerRef}
          style={{ 
            width: designerWidth !== null ? `${designerWidth}px` : '100%',
            height: '100%',
            flex: designerWidth === null ? '1' : '0 0 auto',
            minWidth: '400px', // 最小寬度，確保 Designer 不會太小
            overflow: 'hidden', // 隱藏超出容器的內容
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={(e) => {
            // 只有當離開整個容器時才取消高亮
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsDraggingOver(false);
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            setIsDraggingOver(true);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingOver(false);
            const fieldName = e.dataTransfer.getData('fieldName');
            const fieldType = e.dataTransfer.getData('fieldType') || 'text';
            const fieldValue = e.dataTransfer.getData('fieldValue');
            
            if (fieldName && designerInstanceRef.current) {
              try {
                // 取得當前模板
                const currentTemplate = designerInstanceRef.current.getTemplate();
                
                // 計算拖拽位置（相對於畫布）
                // PDFME 使用 mm 為單位，A4 尺寸為 210mm x 297mm
                const rect = designerRef.current?.getBoundingClientRect();
                if (!rect) return;
                
                // 計算相對於容器的百分比位置
                const relativeX = (e.clientX - rect.left) / rect.width;
                const relativeY = (e.clientY - rect.top) / rect.height;
                
                // 轉換為 mm 座標（A4 尺寸）
                const x = relativeX * 210; // A4 寬度 210mm
                const y = relativeY * 297; // A4 高度 297mm
                
                // 創建新欄位 - 使用與預設模板相同的格式
                // PDFME text 欄位的基本屬性
                // 從 invoiceData 取得對應的值作為預設值（用於設計階段預覽）
                const fieldValue = invoiceData?.[fieldName] || '';
                
                const newField: any = {
                  name: fieldName,
                  type: fieldType,
                  position: { 
                    x: Math.max(0, Math.min(x - 25, 210 - 50)), // 調整位置使欄位中心對齊游標
                    y: Math.max(0, Math.min(y - 4, 297 - 10))  // 調整位置使欄位中心對齊游標
                  },
                  width: 50,
                  height: 8,
                  fontSize: 12,
                  fontColor: '#000000', // 黑色字體
                  alignment: 'left', // 左對齊
                  // 嘗試添加預設值（如果 PDFME 支援）
                  // 注意：PDFME 可能不支援 defaultValue，但我們可以嘗試
                  ...(fieldValue && { defaultValue: String(fieldValue) }),
                };
                
                console.log(`📊 欄位 ${fieldName} 的值:`, fieldValue);
                
                console.log('📝 創建新欄位:', newField);
                console.log('📋 當前模板結構:', {
                  hasSchemas: !!currentTemplate.schemas,
                  schemasLength: currentTemplate.schemas?.length,
                  firstSchemaLength: currentTemplate.schemas?.[0]?.length,
                });
                
                // 添加到第一個 schema（第一頁）
                if (currentTemplate.schemas && currentTemplate.schemas[0]) {
                  // 檢查是否已存在同名欄位
                  const existingIndex = currentTemplate.schemas[0].findIndex(
                    (field: any) => field.name === fieldName
                  );
                  
                  if (existingIndex >= 0) {
                    // 更新現有欄位
                    currentTemplate.schemas[0][existingIndex] = {
                      ...currentTemplate.schemas[0][existingIndex],
                      ...newField,
                    };
                    console.log(`🔄 更新現有欄位: ${fieldName} (索引: ${existingIndex})`);
                  } else {
                    // 添加新欄位
                    currentTemplate.schemas[0].push(newField);
                    console.log(`➕ 添加新欄位: ${fieldName} (總數: ${currentTemplate.schemas[0].length})`);
                  }
                  
                  // 更新模板 - 這會觸發 PDFME Designer 重新渲染
                  try {
                    console.log('🔄 準備更新模板...');
                    designerInstanceRef.current.updateTemplate(currentTemplate);
                    
                    // 驗證更新是否成功
                    const updatedTemplate = designerInstanceRef.current.getTemplate();
                    const fieldExists = updatedTemplate.schemas[0]?.some(
                      (f: any) => f.name === fieldName
                    );
                    
                    if (fieldExists) {
                      console.log(`✅ 模板更新成功，欄位 ${fieldName} 已添加到模板`);
                      console.log('📋 當前模板所有欄位:', updatedTemplate.schemas[0].map((f: any) => ({
                        name: f.name,
                        type: f.type,
                        position: f.position,
                      })));
                      
                      // 更新模板後，重新設定 sampleData 以確保資料顯示
                      if (invoiceData) {
                        const sampleData = [
                          Object.fromEntries(
                            Object.entries(invoiceData)
                              .filter(([key]) => key !== 'lineItems' && key !== 'raw' && key !== 'statusColor')
                              .map(([key, value]) => [key, String(value || '')])
                          ),
                        ];
                        
                        const designerAny = designerInstanceRef.current as any;
                        
                        // 嘗試多種方式設定 sampleData
                        if (designerAny.sampleData !== undefined) {
                          designerAny.sampleData = sampleData;
                          console.log('✅ 已更新 designer.sampleData');
                        }
                        if (designerAny.defaultInputs !== undefined) {
                          designerAny.defaultInputs = sampleData;
                          console.log('✅ 已更新 designer.defaultInputs');
                        }
                        if (designerAny.designer) {
                          const innerDesigner = designerAny.designer as any;
                          if (innerDesigner.sampleData !== undefined) {
                            innerDesigner.sampleData = sampleData;
                            console.log('✅ 已更新 innerDesigner.sampleData');
                          }
                          if (innerDesigner.defaultInputs !== undefined) {
                            innerDesigner.defaultInputs = sampleData;
                            console.log('✅ 已更新 innerDesigner.defaultInputs');
                          }
                          // 嘗試觸發重新渲染
                          if (typeof innerDesigner.render === 'function') {
                            innerDesigner.render();
                            console.log('✅ 已觸發 innerDesigner.render()');
                          }
                        }
                        
                        // 再次更新模板以觸發重新渲染
                        setTimeout(() => {
                          try {
                            const currentTemplate = designerInstanceRef.current?.getTemplate();
                            if (currentTemplate) {
                              designerInstanceRef.current?.updateTemplate(currentTemplate);
                              console.log('✅ 已重新更新模板以觸發渲染');
                            }
                          } catch (error) {
                            console.warn('⚠️ 重新更新模板時發生錯誤:', error);
                          }
                        }, 100);
                        
                        console.log(`📊 sampleData 中 ${fieldName} 的值:`, sampleData[0]?.[fieldName]);
                      }
                    } else {
                      console.error(`❌ 欄位 ${fieldName} 沒有出現在更新後的模板中`);
                    }
                  } catch (updateError: any) {
                    console.error('❌ 更新模板時發生錯誤:', updateError);
                    console.error('錯誤詳情:', updateError.message, updateError.stack);
                  }
                } else {
                  console.error('❌ 模板 schemas 不存在或為空');
                  console.error('當前模板:', currentTemplate);
                }
              } catch (error) {
                console.error('添加欄位到模板時發生錯誤:', error);
                alert(`無法添加欄位 ${fieldName}，請稍後再試`);
              }
            }
          }}
        />
        
        {/* Designer 和右側面板之間的可拖拽分隔線 */}
        <div
          className="w-2 cursor-ew-resize bg-transparent hover:bg-primary/40 active:bg-primary/60 transition-colors z-20 group relative flex-shrink-0"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // 添加拖拽中的樣式
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
            
            const startX = e.clientX;
            const startDesignerWidth = designerWidth ?? (designerRef.current?.offsetWidth || 800);
            
            const handleMouseMove = (moveEvent: MouseEvent) => {
              moveEvent.preventDefault();
              const deltaX = moveEvent.clientX - startX; // 向右拖拽增加 Designer 寬度
              const newWidth = Math.max(400, Math.min(2000, startDesignerWidth + deltaX));
              setDesignerWidth(newWidth);
            };
            
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
              document.body.style.cursor = '';
              document.body.style.userSelect = '';
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
          title="拖拽調整設計器區域寬度"
        >
          {/* 視覺指示器 */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-12 bg-border opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        
        {/* 右側面板區域（Field List + 預覽） */}
        <div className="flex flex-shrink-0 relative z-10 ml-auto">
          {/* Field List 側邊欄 */}
          <div
            className={`bg-card transition-all duration-300 ${
              fieldListOpen ? 'w-72' : 'w-0'
            } overflow-hidden flex flex-col relative z-10`}
          >
          {fieldListOpen && (
            <>
              {/* Field List 標題 */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <h3 className="font-semibold text-xs">NetSuite Field List</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setFieldListOpen(false)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Field List 內容 */}
              <div className="flex-1 overflow-y-auto p-1.5">
                {isLoadingInvoiceData ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">載入中...</span>
                  </div>
                ) : invoiceData ? (
                  <div className="space-y-1">
                    {(() => {
                      // 取得所有欄位，排除不需要的內部欄位
                      const fields = Object.entries(invoiceData)
                        .filter(([key]) => {
                          // 只排除內部使用的欄位
                          return key !== 'raw' && key !== 'statusColor';
                        })
                        .sort(([a], [b]) => {
                          // 排序：常用欄位優先
                          const priority: Record<string, number> = {
                            id: 1,
                            tranid: 2,
                            entity: 3,
                            amount: 4,
                            trandate: 5,
                            duedate: 6,
                            status: 7,
                            currency: 8,
                            memo: 9,
                            location: 10,
                            department: 11,
                            class: 12,
                            subsidiary: 13,
                            createdAt: 14,
                            updatedAt: 15,
                          };
                          return (priority[a] || 99) - (priority[b] || 99);
                        });
                      
                      console.log('📝 顯示欄位數量:', fields.length);
                      console.log('📝 欄位列表:', fields.map(([key]) => key));
                      console.log('📝 完整 invoiceData:', invoiceData);
                      
                      if (fields.length === 0) {
                        return (
                          <div className="text-center py-8 text-sm text-muted-foreground">
                            <p>沒有可用的欄位</p>
                            <p className="text-xs mt-2">請確認 Invoice 資料已正確載入</p>
                          </div>
                        );
                      }
                      
                      return (
                        <>
                          {/* 表頭欄位 */}
                          {fields.map(([key, value]) => {
                            // 格式化欄位名稱（將 camelCase 轉換為可讀格式）
                            const fieldLabel = key
                              .replace(/([A-Z])/g, ' $1')
                              .replace(/^./, (str) => str.toUpperCase())
                              .trim();
                            
                            // 格式化值顯示
                            let displayValue = '(空)';
                            if (value !== null && value !== undefined) {
                              if (typeof value === 'object' && !Array.isArray(value)) {
                                // 如果是物件，嘗試取得 name 或 id 屬性
                                const objValue = value as any;
                                if (objValue.name) {
                                  displayValue = objValue.name;
                                } else if (objValue.id) {
                                  displayValue = `ID: ${objValue.id}`;
                                } else {
                                  displayValue = JSON.stringify(value).substring(0, 30) + '...';
                                }
                              } else if (Array.isArray(value)) {
                                displayValue = `[${value.length} 項]`;
                              } else {
                                const strValue = String(value);
                                displayValue = strValue.substring(0, 30) + (strValue.length > 30 ? '...' : '');
                              }
                            }
                            
                            return (
                              <div
                                key={key}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.effectAllowed = 'copy';
                                  e.dataTransfer.setData('fieldName', key);
                                  e.dataTransfer.setData('fieldType', 'text');
                                  // 如果是物件，傳遞字串化的值
                                  const valueToTransfer = typeof value === 'object' && value !== null
                                    ? JSON.stringify(value)
                                    : String(value || '');
                                  e.dataTransfer.setData('fieldValue', valueToTransfer);
                                }}
                                className="group flex items-center gap-1.5 p-1.5 rounded-md border border-border bg-background hover:bg-accent hover:border-accent-foreground/20 cursor-move transition-colors"
                                title={`${fieldLabel}: ${typeof value === 'object' ? JSON.stringify(value) : value}`}
                              >
                                <GripVertical className="h-3 w-3 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium text-foreground truncate">
                                    {key}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground truncate">
                                    {displayValue}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Line Items 區塊 */}
                          {invoiceData.lineItems && invoiceData.lineItems.length > 0 && (
                            <>
                              <div className="mt-4 pt-4 border-t border-border">
                                <div className="px-2 mb-2">
                                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    明細項目 (Line Items)
                                  </h4>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {invoiceData.lineItems.length} 項
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  {invoiceData.lineItems.map((item: any, index: number) => (
                                    <div key={index} className="space-y-1 pl-2 border-l-2 border-primary/20">
                                      {/* Line Item 的欄位 */}
                                      {Object.entries(item)
                                        .filter(([key]) => key !== 'raw')
                                        .map(([itemKey, itemValue]) => {
                                          const displayValue = itemValue !== null && itemValue !== undefined
                                            ? String(itemValue).substring(0, 25) + (String(itemValue).length > 25 ? '...' : '')
                                            : '(空)';
                                          
                                          return (
                                            <div
                                              key={`lineItem_${index}_${itemKey}`}
                                              draggable
                                              onDragStart={(e) => {
                                                e.dataTransfer.effectAllowed = 'copy';
                                                // 使用陣列索引來識別 line item
                                                e.dataTransfer.setData('fieldName', `lineItems[${index}].${itemKey}`);
                                                e.dataTransfer.setData('fieldType', 'text');
                                                e.dataTransfer.setData('fieldValue', String(itemValue || ''));
                                              }}
                                              className="group flex items-center gap-2 p-1.5 rounded border border-border/50 bg-muted/30 hover:bg-accent hover:border-accent-foreground/20 cursor-move transition-colors"
                                              title={`Line ${index + 1} - ${itemKey}: ${itemValue}`}
                                            >
                                              <GripVertical className="h-3 w-3 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
                                              <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium text-foreground truncate">
                                                  <span className="text-muted-foreground">[{index + 1}]</span> {itemKey}
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate">
                                                  {displayValue}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      請先選擇一個 Invoice
                    </p>
                    <p className="text-xs text-muted-foreground">
                      選擇後，這裡會顯示所有可用的欄位
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
          </div>
        </div>
        
        {/* Field List 切換按鈕（當側邊欄關閉時顯示） */}
        {!fieldListOpen && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="outline"
              size="sm"
              className="rounded-l-md rounded-r-none border-r-0 h-16"
              onClick={() => setFieldListOpen(true)}
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </Button>
          </div>
        )}
      </div>
      
      {/* PDF 預覽 Dialog */}
      <Dialog open={previewOpen} onOpenChange={(open) => {
        setPreviewOpen(open);
        if (!open) {
          handleClosePreview();
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>PDF 預覽</DialogTitle>
            <DialogDescription>
              預覽使用當前 Invoice 資料生成的 PDF
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-gray-100 rounded-lg p-4 min-h-[500px]">
            {isGeneratingPreview ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">生成 PDF 中...</span>
              </div>
            ) : previewPdfUrl ? (
              <iframe
                src={previewPdfUrl}
                className="w-full h-full border border-border rounded"
                title="PDF 預覽"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">沒有可預覽的 PDF</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

