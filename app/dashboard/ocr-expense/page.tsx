'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Receipt, Calendar, Upload, Save, X, Plus, ZoomIn, ZoomOut, RotateCcw, Image, Sparkles, Loader2, Copy, Trash2, Check, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Expense Report Line 型別定義（參考 NetSuite 標準欄位）
interface ExpenseReportLine {
  id: string; // 唯一識別碼
  refNo: number; // 參考編號
  date: string; // 日期 * (必填)
  category: string; // 類別 * (必填)
  foreignAmount: string; // 外幣金額
  currency: string; // 幣別 * (必填)
  exchangeRate: string; // 匯率
  amount: string; // 金額 * (必填)
  taxCode: string; // 稅碼
  taxRate: string; // 稅率
  taxAmt: string; // 稅額
  grossAmt: string; // 總金額
  memo: string; // 備註
  department: string; // 部門
  class: string; // 類別
  location: string; // 地點
  ocrDetail: string; // OCR明細（顯示用）
  // OCR 資料（每個 line 都有自己的 OCR）
  ocrData: {
    invoiceTitle: string;
    invoicePeriod: string;
    invoiceNumber: string;
    invoiceDate: string;
    randomCode: string;
    formatCode: string;
    sellerName: string;
    sellerTaxId: string;
    sellerAddress: string;
    buyerName: string;
    buyerTaxId: string;
    buyerAddress: string;
    untaxedAmount: string;
    taxAmount: string;
    totalAmount: string;
    ocrSuccess: boolean;
    ocrConfidence: number;
    ocrDocumentType: string;
    ocrErrors: string;
    ocrWarnings: string;
    ocrErrorCount: number;
    ocrWarningCount: number;
    ocrQualityGrade: string;
    ocrFileName: string;
    ocrFileId: string;
    ocrWebViewLink: string;
    ocrProcessedAt: string;
  };
  customer: string; // 客戶
  projectTask: string; // 專案任務
  billable: boolean; // 可計費
  attachFile: string; // 附加檔案
  receipt: string; // 收據
  isEditing: boolean; // 是否正在編輯
}

export default function OCRExpensePage() {
  const router = useRouter();
  
  // 獲取今天的日期（格式：YYYY-MM-DD）
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    expenseDate: getTodayDate(),
    type: '',
    subsidiary: '',
    expenseLocation: '',
    department: '',
    class: '',
    employee: '', // 員工（Entity）
    receiptAmount: '',
    receiptCurrency: 'TWD',
    description: '',
    receiptMissing: false,
    // OCR 返回的欄位
    invoiceTitle: '',
    invoicePeriod: '',
    invoiceNumber: '',
    invoiceDate: '',
    randomCode: '',
    formatCode: '',
    sellerName: '',
    sellerTaxId: '',
    sellerAddress: '',
    buyerName: '',
    buyerTaxId: '',
    buyerAddress: '',
    untaxedAmount: '',
    taxAmount: '',
    totalAmount: '',
    // OCR 元數據欄位
    ocrSuccess: false,
    ocrConfidence: 0,
    ocrDocumentType: '',
    ocrErrors: '',
    ocrWarnings: '',
    ocrErrorCount: 0,
    ocrWarningCount: 0,
    ocrQualityGrade: '',
    ocrFileName: '',
    ocrFileId: '',
    ocrWebViewLink: '',
    ocrProcessedAt: '',
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrJobId, setOcrJobId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentJobIdRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // 表單選項資料（一次載入所有）
  const [formOptions, setFormOptions] = useState<{
    employees: Array<{ id: string; name: string; netsuite_internal_id: number }>;
    expenseCategories: Array<{ id: string; name: string; netsuite_internal_id: number }>;
    subsidiaries: Array<{ id: string; name: string; netsuite_internal_id: number }>;
    locations: Array<{ id: string; name: string; netsuite_internal_id: number }>;
    departments: Array<{ id: string; name: string; netsuite_internal_id: number }>;
    classes: Array<{ id: string; name: string; netsuite_internal_id: number }>;
    currencies: Array<{ id: string; name: string; symbol: string; netsuite_internal_id: number }>;
  }>({
    employees: [],
    expenseCategories: [],
    subsidiaries: [],
    locations: [],
    departments: [],
    classes: [],
    currencies: [],
  });
  const [loadingFormOptions, setLoadingFormOptions] = useState(false);
  
  // Expense Report Lines (表身)
  const [expenseLines, setExpenseLines] = useState<ExpenseReportLine[]>([]);
  const [nextRefNo, setNextRefNo] = useState(1);
  const [useMultiCurrency, setUseMultiCurrency] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      // 優化：只保留最新上傳的圖片（一筆報支對應一張發票）
      // 如果上傳多個文件，只取第一個圖片文件
      const firstImage = newFiles.find(file => file.type.startsWith('image/'));
      if (firstImage) {
        // 清除舊的附件，只保留新上傳的圖片
        setAttachments([firstImage]);
        
        // 自動預覽新圖片
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewImage(e.target?.result as string);
          setZoom(1);
          setPosition({ x: 0, y: 0 });
        };
        reader.readAsDataURL(firstImage);
      } else {
        // 如果沒有圖片，清除所有附件
        setAttachments([]);
        setPreviewImage(null);
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachments((prev) => {
      const newAttachments = prev.filter((_, i) => i !== index);
      // 如果移除的是當前預覽的圖片，清除預覽
      if (newAttachments.length === 0 || !newAttachments.find(f => f.type.startsWith('image/'))) {
        setPreviewImage(null);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      }
      return newAttachments;
    });
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
  };

  // 清理 polling 和 timeout
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 載入所有表單選項（一次查詢）
  useEffect(() => {
    const loadFormOptions = async () => {
      setLoadingFormOptions(true);
      try {
        const response = await fetch('/api/expense-form-options');
        const result = await response.json();
        
        if (result.success && result.data) {
          setFormOptions({
            employees: result.data.employees || [],
            expenseCategories: result.data.expenseCategories || [],
            subsidiaries: result.data.subsidiaries || [],
            locations: result.data.locations || [],
            departments: result.data.departments || [],
            classes: result.data.classes || [],
            currencies: result.data.currencies || [],
          });
          
          // 如果有警告，顯示在 console
          if (result.warnings && result.warnings.length > 0) {
            console.warn('載入表單選項時有部分錯誤:', result.warnings);
          }
        } else {
          console.error('載入表單選項失敗:', result.error || result.message);
        }
      } catch (error) {
        console.error('載入表單選項錯誤:', error);
      } finally {
        setLoadingFormOptions(false);
      }
    };

    loadFormOptions();
  }, []);

  // 取消 OCR 處理
  const handleCancelOCR = () => {
    // 停止輪詢
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    // 停止超時
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // 重置狀態
    setOcrProcessing(false);
    setOcrJobId(null);
    currentJobIdRef.current = null;
  };

  // 處理 OCR 結果
  const processOCRResult = (ocrResult: any) => {
    // 處理 output 對象中的發票數據
    if (ocrResult.output && typeof ocrResult.output === 'object') {
      const ocrData = ocrResult.output;
      
      // 填充 OCR 欄位
      handleInputChange('invoiceTitle', ocrData['發票標題'] || '');
      handleInputChange('invoicePeriod', ocrData['發票期別'] || '');
      handleInputChange('invoiceNumber', ocrData['發票號碼'] || '');
      handleInputChange('invoiceDate', ocrData['開立時間'] || '');
      handleInputChange('randomCode', ocrData['隨機碼'] || '');
      handleInputChange('formatCode', ocrData['格式代號'] || '');
      handleInputChange('sellerName', ocrData['賣方名稱'] || '');
      handleInputChange('sellerTaxId', ocrData['賣方統編'] || '');
      handleInputChange('sellerAddress', ocrData['賣方地址'] || '');
      handleInputChange('buyerName', ocrData['買方名稱'] || '');
      handleInputChange('buyerTaxId', ocrData['買方統編'] || '');
      handleInputChange('buyerAddress', ocrData['買方地址'] || '');
      handleInputChange('untaxedAmount', ocrData['未稅銷售額'] || '');
      handleInputChange('taxAmount', ocrData['稅額'] || '');
      handleInputChange('totalAmount', ocrData['總計金額'] || '');
      
      // 自動填充相關欄位
      // 注意：報支日期不從 OCR 回寫，保持預設值（今天的日期）或讓用戶自行修改
      // OCR 的「開立時間」只回寫到 invoiceDate 欄位（已在上面處理）
      if (ocrData['總計金額']) {
        handleInputChange('receiptAmount', ocrData['總計金額']);
      }
    }

    // 處理頂層元數據欄位
    handleInputChange('ocrSuccess', ocrResult.success ?? false);
    handleInputChange('ocrConfidence', ocrResult.confidence ?? 0);
    handleInputChange('ocrDocumentType', ocrResult.documentType || '');
    handleInputChange('ocrErrors', ocrResult.errors || '');
    handleInputChange('ocrWarnings', ocrResult.warnings || '');
    handleInputChange('ocrErrorCount', ocrResult.errorCount ?? 0);
    handleInputChange('ocrWarningCount', ocrResult.warningCount ?? 0);
    handleInputChange('ocrQualityGrade', ocrResult.qualityGrade || '');
    handleInputChange('ocrFileName', ocrResult.fileName || '');
    handleInputChange('ocrFileId', ocrResult.fileId || '');
    handleInputChange('ocrWebViewLink', ocrResult.webViewLink || '');
    handleInputChange('ocrProcessedAt', ocrResult.processedAt || '');
  };

  // 輪詢檢查 OCR 結果
  const pollOCRResult = async (jobId: string) => {
    try {
      const response = await fetch(`/api/ocr-callback?jobId=${jobId}`);
      
      if (response.status === 404) {
        // 結果尚未準備好，繼續輪詢
        return;
      }

      if (!response.ok) {
        throw new Error('查詢 OCR 結果失敗');
      }

      const result = await response.json();

      if (result.status === 'completed' && result.data) {
        // 停止輪詢和超時
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        // 處理結果 - 新格式：數組，第一個元素包含 output 和頂層字段
        if (Array.isArray(result.data) && result.data.length > 0) {
          // 新格式：數組中的第一個元素包含 output 對象和頂層元數據
          processOCRResult(result.data[0]);
        } else if (result.data && result.data.output) {
          // 兼容舊格式：直接包含 output 對象
          processOCRResult(result.data);
        } else if (typeof result.data === 'object' && result.data !== null) {
          // 直接使用結果數據
          processOCRResult(result.data);
        }

        setOcrProcessing(false);
        setOcrJobId(null);
        currentJobIdRef.current = null;
      } else if (result.status === 'error') {
        // 停止輪詢和超時
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        setOcrProcessing(false);
        setOcrJobId(null);
        currentJobIdRef.current = null;
        alert(`OCR 處理失敗: ${result.error || '未知錯誤'}`);
      }
    } catch (error) {
      console.error('輪詢 OCR 結果錯誤:', error);
      // 繼續輪詢，不中斷
    }
  };

  const handleAIOCR = async () => {
    if (!previewImage) {
      alert('請先上傳收據圖片');
      return;
    }

    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_OCR;
    if (!webhookUrl) {
      alert('Webhook URL 未設定，請檢查環境變數設定');
      return;
    }

    // 生成唯一的 job ID
    const jobId = `ocr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setOcrJobId(jobId);
    currentJobIdRef.current = jobId;
    setOcrProcessing(true);

    try {
      // 將 base64 圖片轉換為 Blob
      let blob: Blob;
      
      if (previewImage.startsWith('data:')) {
        // 如果是 base64 格式，直接轉換為 Blob
        const response = await fetch(previewImage);
        blob = await response.blob();
      } else {
        // 如果是 URL 格式
        const response = await fetch(previewImage);
        blob = await response.blob();
      }

      // 構建回調 URL
      const callbackUrl = `${window.location.origin}/api/ocr-callback`;
      
      // 發送請求到 N8N
      // 注意：如果 N8N 是同步返回結果，我們也會處理；如果是異步，則通過輪詢獲取
      fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': blob.type || 'image/jpeg',
          'X-Job-Id': jobId,
          'X-Callback-Url': callbackUrl,
        },
        body: blob,
      })
      .then(async (response) => {
        // 如果 N8N 同步返回結果，嘗試處理
        if (response.ok) {
          try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const result = await response.json();
              // 檢查是否包含 OCR 結果
              if (Array.isArray(result) && result.length > 0 && result[0].output) {
                // N8N 同步返回了結果，直接處理
                console.log('收到 N8N 同步響應，直接處理結果');
                
                // 停止輪詢和超時
                if (pollingIntervalRef.current) {
                  clearInterval(pollingIntervalRef.current);
                  pollingIntervalRef.current = null;
                }
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                  timeoutRef.current = null;
                }
                
                // 先保存到 API（模擬回調，以便統一處理）
                try {
                  await fetch(callbackUrl, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'X-Job-Id': jobId,
                    },
                    body: JSON.stringify(result),
                  });
                  // 保存成功後，通過輪詢機制獲取（這樣可以統一處理流程）
                  // 但我們也可以直接處理
                  processOCRResult(result[0]);
                  setOcrProcessing(false);
                  setOcrJobId(null);
                  currentJobIdRef.current = null;
                } catch (e) {
                  // 如果回調失敗，直接處理結果
                  processOCRResult(result[0]);
                  setOcrProcessing(false);
                  setOcrJobId(null);
                  currentJobIdRef.current = null;
                }
              }
            }
          } catch (e) {
            // 忽略解析錯誤，繼續輪詢
            console.log('N8N 響應不是 JSON 格式，繼續輪詢');
          }
        }
      })
      .catch((error) => {
        console.error('發送 OCR 請求錯誤:', error);
        // 即使發送失敗，也開始輪詢（N8N 可能會通過其他方式回調）
      });

      // 立即開始輪詢結果（每 2 秒檢查一次）
      pollingIntervalRef.current = setInterval(() => {
        pollOCRResult(jobId);
      }, 2000);

      // 設置超時（5 分鐘後停止輪詢）
      timeoutRef.current = setTimeout(() => {
        // 檢查是否還是同一個 job
        if (currentJobIdRef.current === jobId) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setOcrProcessing(false);
          setOcrJobId(null);
          currentJobIdRef.current = null;
          timeoutRef.current = null;
          alert('OCR 處理超時，請稍後再試');
        }
      }, 5 * 60 * 1000);
      
    } catch (error) {
      console.error('OCR 處理錯誤:', error);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setOcrProcessing(false);
      setOcrJobId(null);
      currentJobIdRef.current = null;
      alert(`OCR 處理失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      // 優化：只保留最新上傳的圖片（一筆報支對應一張發票）
      const firstImage = newFiles.find(file => file.type.startsWith('image/'));
      if (firstImage) {
        // 清除舊的附件，只保留新上傳的圖片
        setAttachments([firstImage]);
        
        // 自動預覽新圖片
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewImage(e.target?.result as string);
          setZoom(1);
          setPosition({ x: 0, y: 0 });
        };
        reader.readAsDataURL(firstImage);
      } else {
        // 如果沒有圖片，清除所有附件
        setAttachments([]);
        setPreviewImage(null);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSubmit = async () => {
    // 驗證必填欄位
    if (!formData.expenseDate || !formData.type || !formData.subsidiary || !formData.employee) {
      alert('請填寫所有必填欄位（報支日期、費用科目、員工、公司別）');
      return;
    }

    if (!formData.receiptAmount || parseFloat(formData.receiptAmount) <= 0) {
      alert('請輸入有效的收據金額');
      return;
    }

    setLoading(true);

    try {
      // 上傳附件到 Supabase Storage（如果有）
      let attachmentUrl = null;
      let attachmentBase64 = null; // 備用，如果 Storage 上傳失敗
      
      if (attachments.length > 0 && attachments[0]) {
        const file = attachments[0];
        const supabase = (await import('@/utils/supabase/client')).createClient();
        
        // 取得當前使用者 ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('無法取得使用者資訊，請重新登入');
        }

        // 產生檔案名稱：{user_id}/{timestamp}_{filename}
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${user.id}/${timestamp}_${Date.now()}.${fileExt}`;

        try {
          // 上傳到 Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('expense-receipts')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            console.warn('Storage 上傳失敗，使用 Base64 備用方案:', uploadError);
            // 如果上傳失敗，使用 Base64 備用方案
            if (previewImage && previewImage.startsWith('data:')) {
              attachmentBase64 = previewImage.split(',')[1]; // 移除 data:image/jpeg;base64, 前綴
            }
          } else {
            // 取得公開 URL（如果是 Private bucket，需要取得 Signed URL）
            const { data: urlData } = supabase.storage
              .from('expense-receipts')
              .getPublicUrl(fileName);
            
            attachmentUrl = urlData.publicUrl;
          }
        } catch (storageError: any) {
          console.warn('Storage 上傳錯誤，使用 Base64 備用方案:', storageError);
          // 如果 Storage 不可用，使用 Base64 備用方案
          if (previewImage && previewImage.startsWith('data:')) {
            attachmentBase64 = previewImage.split(',')[1];
          }
        }
      }

      // 發送請求到 API
      const response = await fetch('/api/create-expense-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          attachment_url: attachmentUrl,
          attachment: attachmentBase64, // 備用 Base64（如果 Storage 上傳失敗）
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || '提交失敗');
      }

      // 成功
      if (result.success) {
        // 清空表單
        setFormData({
          expenseDate: getTodayDate(),
          type: '',
          subsidiary: '',
          expenseLocation: '',
          department: '',
          class: '',
          employee: '',
          receiptAmount: '',
          receiptCurrency: 'TWD',
          description: '',
          receiptMissing: false,
          invoiceTitle: '',
          invoicePeriod: '',
          invoiceNumber: '',
          invoiceDate: '',
          randomCode: '',
          formatCode: '',
          sellerName: '',
          sellerTaxId: '',
          sellerAddress: '',
          buyerName: '',
          buyerTaxId: '',
          buyerAddress: '',
          untaxedAmount: '',
          taxAmount: '',
          totalAmount: '',
          ocrSuccess: false,
          ocrConfidence: 0,
          ocrDocumentType: '',
          ocrErrors: '',
          ocrWarnings: '',
          ocrErrorCount: 0,
          ocrWarningCount: 0,
          ocrQualityGrade: '',
          ocrFileName: '',
          ocrFileId: '',
          ocrWebViewLink: '',
          ocrProcessedAt: '',
        });
        setAttachments([]);
        setPreviewImage(null);
        
        // 顯示成功訊息
        alert(`報支項目已成功提交！\n\n審核編號: ${result.review_id}\n狀態: 待審核\n\n財務人員將進行檢核，審核通過後會同步到 NetSuite。`);
        
        // 導航到「我的報支」頁面
        router.push('/dashboard/ocr-expense/my-expenses');
      } else {
        alert(`提交失敗: ${result.error || result.message || '未知錯誤'}`);
      }
      
    } catch (error) {
      console.error('提交報支項目錯誤:', error);
      alert(`提交失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      {/* Page Header - SuiteQL Style */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Receipt className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">建立報支項目</h1>
        </div>
        <p className="text-muted-foreground">
          填寫報支項目資訊，可選擇使用 OCR 技術自動識別收據（選填）
        </p>
      </div>

      {/* Main Form Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>報支項目資訊</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Form Fields */}
            <div className="space-y-4">
              {/* Expense Date */}
              <div className="space-y-2">
                <Label htmlFor="expenseDate" className="text-sm font-semibold">
                  報支日期 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="expenseDate"
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) => handleInputChange('expenseDate', e.target.value)}
                    className="pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-moz-calendar-picker-indicator]:opacity-0 [&::-moz-calendar-picker-indicator]:absolute [&::-moz-calendar-picker-indicator]:right-0 [&::-moz-calendar-picker-indicator]:w-full [&::-moz-calendar-picker-indicator]:h-full [&::-moz-calendar-picker-indicator]:cursor-pointer"
                    style={{
                      paddingRight: '2.5rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      width: '100%',
                      maxWidth: '100%',
                      boxSizing: 'border-box',
                    }}
                    required
                  />
                  <Calendar 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer pointer-events-auto z-10" 
                    onClick={() => {
                      const dateInput = document.getElementById('expenseDate') as HTMLInputElement;
                      if (dateInput) {
                        if (dateInput.showPicker) {
                          dateInput.showPicker();
                        } else {
                          dateInput.click();
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-semibold">
                  費用用途 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value)}
                  disabled={loadingFormOptions}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder={loadingFormOptions ? "載入中..." : "選擇費用用途"} />
                  </SelectTrigger>
                  <SelectContent>
                    {formOptions.expenseCategories.length > 0 ? (
                      formOptions.expenseCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                        {loadingFormOptions ? "載入中..." : "無可用費用類別"}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Employee */}
              <div className="space-y-2">
                <Label htmlFor="employee" className="text-sm font-semibold">
                  員工 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.employee}
                  onValueChange={(value) => handleInputChange('employee', value)}
                  disabled={loadingFormOptions}
                >
                  <SelectTrigger id="employee">
                    <SelectValue placeholder={loadingFormOptions ? "載入中..." : "選擇員工"} />
                  </SelectTrigger>
                  <SelectContent>
                    {formOptions.employees.length > 0 ? (
                      formOptions.employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                        {loadingFormOptions ? "載入中..." : "無可用員工"}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Subsidiary */}
              <div className="space-y-2">
                <Label htmlFor="subsidiary" className="text-sm font-semibold">
                  公司別 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.subsidiary}
                  onValueChange={(value) => handleInputChange('subsidiary', value)}
                  disabled={loadingFormOptions}
                >
                  <SelectTrigger id="subsidiary">
                    <SelectValue placeholder={loadingFormOptions ? "載入中..." : "選擇公司別"} />
                  </SelectTrigger>
                  <SelectContent>
                    {formOptions.subsidiaries.length > 0 ? (
                      formOptions.subsidiaries.map((subsidiary) => (
                        <SelectItem key={subsidiary.id} value={subsidiary.id}>
                          {subsidiary.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                        {loadingFormOptions ? "載入中..." : "無可用公司別"}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Expense Location */}
              <div className="space-y-2">
                <Label htmlFor="expenseLocation" className="text-sm font-semibold">
                  地點
                </Label>
                <Select
                  value={formData.expenseLocation}
                  onValueChange={(value) => handleInputChange('expenseLocation', value)}
                  disabled={loadingFormOptions}
                >
                  <SelectTrigger id="expenseLocation">
                    <SelectValue placeholder={loadingFormOptions ? "載入中..." : "選擇地點"} />
                  </SelectTrigger>
                  <SelectContent>
                    {formOptions.locations.length > 0 ? (
                      formOptions.locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                        {loadingFormOptions ? "載入中..." : "無可用地點"}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-semibold">
                  部門
                </Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => handleInputChange('department', value)}
                  disabled={loadingFormOptions}
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder={loadingFormOptions ? "載入中..." : "選擇部門"} />
                  </SelectTrigger>
                  <SelectContent>
                    {formOptions.departments.length > 0 ? (
                      formOptions.departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                        {loadingFormOptions ? "載入中..." : "無可用部門"}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Class */}
              <div className="space-y-2">
                <Label htmlFor="class" className="text-sm font-semibold">
                  類別
                </Label>
                <Select
                  value={formData.class}
                  onValueChange={(value) => handleInputChange('class', value)}
                  disabled={loadingFormOptions}
                >
                  <SelectTrigger id="class">
                    <SelectValue placeholder={loadingFormOptions ? "載入中..." : "選擇類別"} />
                  </SelectTrigger>
                  <SelectContent>
                    {formOptions.classes.length > 0 ? (
                      formOptions.classes.map((classItem) => (
                        <SelectItem key={classItem.id} value={classItem.id}>
                          {classItem.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                        {loadingFormOptions ? "載入中..." : "無可用類別"}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Receipt Amount */}
              <div className="space-y-2">
                <Label htmlFor="receiptAmount" className="text-sm font-semibold">
                  收據金額 <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.receiptCurrency}
                    onValueChange={(value) => handleInputChange('receiptCurrency', value)}
                    disabled={loadingFormOptions}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder={loadingFormOptions ? "載入中..." : "幣別"} />
                    </SelectTrigger>
                    <SelectContent>
                      {formOptions.currencies.length > 0 ? (
                        formOptions.currencies.map((currency) => (
                          <SelectItem key={currency.id} value={currency.symbol || currency.name}>
                            {currency.symbol || currency.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                          {loadingFormOptions ? "載入中..." : "無可用幣別"}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <Input
                    id="receiptAmount"
                    type="number"
                    step="0.01"
                    value={formData.receiptAmount}
                    onChange={(e) => handleInputChange('receiptAmount', e.target.value)}
                    placeholder="0.00"
                    className="flex-1"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">
                  描述
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  placeholder="輸入報支項目描述..."
                />
              </div>
            </div>

            {/* Right Column - Attachments and Preview */}
            <div className="space-y-4 flex flex-col">
              {/* Attachments */}
              <div className="space-y-2 flex-1 flex flex-col">
                <Label className="text-sm font-semibold">附件（選填）</Label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-primary transition-colors cursor-pointer flex-1 min-h-[175px] flex flex-col"
                >
                  <input
                    type="file"
                    id="file-upload"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex items-center gap-4 flex-1">
                    {/* Decorative Icon - Leaves with Paperclip */}
                    <div className="flex-shrink-0">
                      <svg
                        width="64"
                        height="64"
                        viewBox="0 0 64 64"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="flex-shrink-0"
                      >
                        {/* Background Green Leaf (behind) */}
                        <g transform="translate(0, 0)">
                          <path
                            d="M24 18 Q20 22 20 28 Q20 38 26 44 Q32 50 38 46 Q42 42 42 36 Q42 30 38 26 Q34 22 30 20 Q28 18 24 18 Z"
                            fill="#16A34A"
                            className="dark:fill-green-600"
                            opacity="0.85"
                          />
                          <path
                            d="M24 18 Q20 22 20 28 Q20 38 26 44 Q32 50 38 46 Q42 42 42 36 Q42 30 38 26 Q34 22 30 20 Q28 18 24 18"
                            fill="none"
                            stroke="#0F5132"
                            className="dark:stroke-green-800"
                            strokeWidth="0.5"
                            opacity="0.4"
                          />
                          {/* Veins on green leaf */}
                          <path
                            d="M30 20 L30 40"
                            stroke="#0F5132"
                            className="dark:stroke-green-800"
                            strokeWidth="0.5"
                            opacity="0.3"
                          />
                          <path
                            d="M26 24 L34 32"
                            stroke="#0F5132"
                            className="dark:stroke-green-800"
                            strokeWidth="0.5"
                            opacity="0.3"
                          />
                          <path
                            d="M34 24 L26 32"
                            stroke="#0F5132"
                            className="dark:stroke-green-800"
                            strokeWidth="0.5"
                            opacity="0.3"
                          />
                        </g>
                        
                        {/* Foreground Yellow/Orange Leaf (rotated -30 degrees to the left) */}
                        <g transform="translate(32, 16) rotate(-30)">
                          <path
                            d="M0 0 Q-4 4 -4 10 Q-4 20 2 26 Q8 32 14 28 Q18 24 18 18 Q18 12 14 8 Q10 4 6 2 Q4 0 0 0 Z"
                            fill="#F59E0B"
                            className="dark:fill-amber-500"
                            opacity="0.9"
                          />
                          <path
                            d="M0 0 Q-4 4 -4 10 Q-4 20 2 26 Q8 32 14 28 Q18 24 18 18 Q18 12 14 8 Q10 4 6 2 Q4 0 0 0"
                            fill="none"
                            stroke="#D97706"
                            className="dark:stroke-amber-600"
                            strokeWidth="0.5"
                            opacity="0.5"
                          />
                          {/* Veins on yellow leaf */}
                          <path
                            d="M6 2 L6 22"
                            stroke="#D97706"
                            className="dark:stroke-amber-600"
                            strokeWidth="0.5"
                            opacity="0.4"
                          />
                          <path
                            d="M2 6 L10 14"
                            stroke="#D97706"
                            className="dark:stroke-amber-600"
                            strokeWidth="0.5"
                            opacity="0.4"
                          />
                          <path
                            d="M10 6 L2 14"
                            stroke="#D97706"
                            className="dark:stroke-amber-600"
                            strokeWidth="0.5"
                            opacity="0.4"
                          />
                        </g>
                        
                        {/* Paperclip - Dark Gray/Black (smaller, top-left, diagonal, closer to leaves) */}
                        <g transform="translate(14, 8) rotate(-20)">
                          <path
                            d="M6 3 Q4 3 3 5 L3 14 Q3 16 5 17 Q7 18 9 17 Q11 16 11 14 L11 5 Q11 3 9 3 Q8 3 7 4 Q6 3 5 3"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-800 dark:text-gray-200"
                          />
                          <path
                            d="M5 3 Q3 3 2 5 L2 14 Q2 17 5 19 Q8 21 11 19 Q14 17 14 14 L14 5 Q14 3 12 3 Q10 3 9 4 Q8 3 7 3"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-800 dark:text-gray-200"
                          />
                        </g>
                      </svg>
                    </div>
                    
                    {/* Text Content */}
                    <div className="flex-1 text-left">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">
                        將發票圖片拖曳到此處或點擊上傳
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        支援圖片格式（上傳新圖片會自動替換舊的）
                      </p>
                    </div>
                  </label>
                  {attachments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                        >
                          <span className="text-sm truncate flex-1">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFile(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Receipt Missing */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="receiptMissing"
                  checked={formData.receiptMissing}
                  onCheckedChange={(checked) =>
                    handleInputChange('receiptMissing', checked)
                  }
                  className="border-gray-300 dark:border-gray-600"
                />
                <Label htmlFor="receiptMissing" className="font-normal cursor-pointer">
                  收據遺失
                </Label>
              </div>

              {/* Image Preview */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">圖片預覽</Label>
                <div
                  className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 overflow-hidden relative"
                  style={{ minHeight: '400px', height: '400px' }}
                  onWheel={handleWheel}
                >
                  {previewImage ? (
                    <div className="relative w-full h-full" style={{ minHeight: '400px', height: '400px' }}>
                      {/* Zoom Controls */}
                      <div className="absolute top-2 right-2 z-10 flex gap-1 bg-white dark:bg-gray-800 rounded shadow-lg p-1 border border-gray-200 dark:border-gray-700">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleZoomOut}
                          disabled={zoom <= 0.5}
                          className="h-7 w-7 p-0"
                        >
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="px-2 py-1 text-sm font-medium flex items-center text-gray-700 dark:text-gray-300">
                          {Math.round(zoom * 100)}%
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleZoomIn}
                          disabled={zoom >= 3}
                          className="h-7 w-7 p-0"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleResetZoom}
                          className="h-7 w-7 p-0"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Image Container */}
                      <div
                        className="w-full h-full flex items-center justify-center overflow-hidden cursor-move"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        style={{
                          minHeight: '400px',
                          height: '400px',
                        }}
                      >
                        <img
                          src={previewImage}
                          alt="收據預覽"
                          className="max-w-full max-h-full object-contain select-none"
                          style={{
                            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                          }}
                          draggable={false}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-3" style={{ height: '400px' }}>
                      <Image className="h-16 w-16 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                      <p className="text-gray-400 dark:text-gray-500 text-center text-sm">圖片預覽</p>
                    </div>
                  )}
                </div>
                
                {/* AI OCR Button */}
                <Button
                  onClick={handleAIOCR}
                  disabled={!previewImage || ocrProcessing}
                  className="w-full text-white"
                  style={{ backgroundColor: '#1a5490' }}
                  onMouseEnter={(e) => {
                    if (!ocrProcessing && previewImage) {
                      e.currentTarget.style.backgroundColor = '#174880';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!ocrProcessing && previewImage) {
                      e.currentTarget.style.backgroundColor = '#1a5490';
                    }
                  }}
                >
                  {ocrProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      等待 OCR 辨識結果...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI OCR 識別
                    </>
                  )}
                </Button>
                
                {/* OCR 處理中的載入提示 */}
                {ocrProcessing && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>正在處理 OCR 辨識，請稍候...</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelOCR}
                        className="h-7 px-3 text-sm border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800"
                      >
                        <X className="h-3 w-3 mr-1" />
                        取消
                      </Button>
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 ml-6">
                      辨識結果將自動填入表單
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OCR 識別結果已移至表身的 OCR明細欄位中，每個 expense line 都有自己的 OCR 資料 */}

      {/* Expense Report Lines (表身) - 參考 NetSuite 標準 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="m-0">費用明細</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useMultiCurrency"
                  checked={useMultiCurrency}
                  onCheckedChange={(checked) => setUseMultiCurrency(checked === true)}
                  className="border-gray-300 dark:border-gray-600"
                />
                <Label htmlFor="useMultiCurrency" className="font-normal cursor-pointer text-sm">
                  使用多幣別
                </Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setExpenseLines([]);
                  setNextRefNo(1);
                }}
                disabled={expenseLines.length === 0}
              >
                清除所有行
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 表頭 */}
            <div className="w-full">
              <Table className="text-sm min-w-[2000px]">
                <TableHeader>
                  <TableRow className="bg-gray-100 dark:bg-gray-800">
                    <TableHead className="w-16 text-center text-sm bg-gray-100 dark:bg-gray-800 px-1">參考編號</TableHead>
                    <TableHead className="w-40 text-center text-sm bg-gray-100 dark:bg-gray-800 px-1">OCR明細</TableHead>
                    <TableHead className="w-32 text-center text-sm bg-gray-100 dark:bg-gray-800 px-1">日期 <span className="text-red-500">*</span></TableHead>
                    <TableHead className="w-40 text-center text-sm bg-gray-100 dark:bg-gray-800 px-1">類別 <span className="text-red-500">*</span></TableHead>
                    {useMultiCurrency && <TableHead className="w-32 text-center text-sm bg-gray-100 dark:bg-gray-800 px-1">外幣金額</TableHead>}
                    <TableHead className="w-32 text-center text-sm bg-gray-100 dark:bg-gray-800 px-1">幣別 <span className="text-red-500">*</span></TableHead>
                    {useMultiCurrency && <TableHead className="w-24 text-center text-sm bg-gray-100 dark:bg-gray-800 px-1">匯率</TableHead>}
                    <TableHead className="w-32 text-center text-sm bg-gray-100 dark:bg-gray-800 px-1">金額 <span className="text-red-500">*</span></TableHead>
                    <TableHead className="w-32 text-center text-sm bg-gray-100 dark:bg-gray-800 px-1">稅碼</TableHead>
                    <TableHead className="w-24 text-center text-sm bg-gray-100 dark:bg-gray-800 px-1">稅率</TableHead>
                    <TableHead className="w-32 text-center text-sm bg-gray-100 dark:bg-gray-800 px-1">稅額</TableHead>
                    <TableHead className="w-32 text-center text-sm bg-gray-100 dark:bg-gray-800 px-1">總金額</TableHead>
                    <TableHead className="w-48 text-center text-sm bg-gray-100 dark:bg-gray-800 px-1">備註</TableHead>
                    <TableHead className="w-32 text-center text-sm bg-gray-100 dark:bg-gray-800 px-1">部門</TableHead>
                    <TableHead className="w-32 text-center text-sm bg-gray-100 dark:bg-gray-800 px-1">類別</TableHead>
                    <TableHead className="w-32 text-center text-sm bg-gray-100 dark:bg-gray-800 px-1">地點</TableHead>
                    <TableHead className="w-24 text-center text-sm bg-gray-100 dark:bg-gray-800 px-1">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseLines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={useMultiCurrency ? 17 : 15} className="text-center text-gray-500 py-8 text-sm px-1">
                        尚無費用明細，請點擊「+ 新增行」新增
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenseLines.map((line, index) => (
                      <TableRow key={line.id}>
                        <TableCell className="text-center text-sm px-1">{line.refNo}</TableCell>
                        <TableCell className="text-sm px-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-sm px-1.5 w-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                {line.ocrData.ocrFileName || line.ocrData.invoiceNumber ? '查看 OCR' : '無 OCR'}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>OCR 識別結果 - 明細 #{line.refNo}</DialogTitle>
                                <DialogDescription>
                                  {line.ocrData.invoiceNumber ? `發票號碼: ${line.ocrData.invoiceNumber}` : '尚未進行 OCR 辨識'}
                                </DialogDescription>
                              </DialogHeader>
                              {line.ocrData.ocrFileName || line.ocrData.invoiceNumber ? (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label className="text-sm font-semibold">發票標題</Label>
                                      <p className="text-sm">{line.ocrData.invoiceTitle || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm font-semibold">發票期間</Label>
                                      <p className="text-sm">{line.ocrData.invoicePeriod || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm font-semibold">發票號碼</Label>
                                      <p className="text-sm">{line.ocrData.invoiceNumber || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm font-semibold">發票日期</Label>
                                      <p className="text-sm">{line.ocrData.invoiceDate || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm font-semibold">隨機碼</Label>
                                      <p className="text-sm">{line.ocrData.randomCode || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm font-semibold">格式代碼</Label>
                                      <p className="text-sm">{line.ocrData.formatCode || 'N/A'}</p>
                                    </div>
                                  </div>
                                  <div className="border-t pt-4">
                                    <h3 className="text-sm font-semibold mb-2">賣方資訊</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label className="text-sm font-semibold">賣方名稱</Label>
                                        <p className="text-sm">{line.ocrData.sellerName || 'N/A'}</p>
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-sm font-semibold">賣方統編</Label>
                                        <p className="text-sm">{line.ocrData.sellerTaxId || 'N/A'}</p>
                                      </div>
                                      <div className="space-y-2 col-span-2">
                                        <Label className="text-sm font-semibold">賣方地址</Label>
                                        <p className="text-sm">{line.ocrData.sellerAddress || 'N/A'}</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="border-t pt-4">
                                    <h3 className="text-sm font-semibold mb-2">買方資訊</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label className="text-sm font-semibold">買方名稱</Label>
                                        <p className="text-sm">{line.ocrData.buyerName || 'N/A'}</p>
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-sm font-semibold">買方統編</Label>
                                        <p className="text-sm">{line.ocrData.buyerTaxId || 'N/A'}</p>
                                      </div>
                                      <div className="space-y-2 col-span-2">
                                        <Label className="text-sm font-semibold">買方地址</Label>
                                        <p className="text-sm">{line.ocrData.buyerAddress || 'N/A'}</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="border-t pt-4">
                                    <h3 className="text-sm font-semibold mb-2">金額資訊</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                      <div className="space-y-2">
                                        <Label className="text-sm font-semibold">未稅金額</Label>
                                        <p className="text-sm">{line.ocrData.untaxedAmount || 'N/A'}</p>
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-sm font-semibold">稅額</Label>
                                        <p className="text-sm">{line.ocrData.taxAmount || 'N/A'}</p>
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-sm font-semibold">總金額</Label>
                                        <p className="text-sm font-bold">{line.ocrData.totalAmount || 'N/A'}</p>
                                      </div>
                                    </div>
                                  </div>
                                  {line.ocrData.ocrWebViewLink && (
                                    <div className="border-t pt-4">
                                      <a
                                        href={line.ocrData.ocrWebViewLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                                      >
                                        查看原始檔案
                                      </a>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <p>此明細尚未進行 OCR 辨識</p>
                                  <p className="text-xs mt-2">請先上傳收據圖片並執行 OCR 辨識</p>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                        <TableCell className="text-sm px-1">
                          <div className="relative">
                            <Input
                              type="date"
                              value={line.date || formData.expenseDate}
                              onChange={(e) => {
                                const newLines = [...expenseLines];
                                newLines[index].date = e.target.value;
                                setExpenseLines(newLines);
                              }}
                              className="h-7 text-sm px-1.5 pr-8 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-moz-calendar-picker-indicator]:opacity-0 [&::-moz-calendar-picker-indicator]:absolute [&::-moz-calendar-picker-indicator]:right-0 [&::-moz-calendar-picker-indicator]:w-full [&::-moz-calendar-picker-indicator]:h-full [&::-moz-calendar-picker-indicator]:cursor-pointer"
                            />
                            <Calendar 
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none z-10" 
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-sm px-1">
                          <Select
                            value={line.category}
                            onValueChange={(value) => {
                              const newLines = [...expenseLines];
                              newLines[index].category = value;
                              setExpenseLines(newLines);
                            }}
                          >
                            <SelectTrigger className="h-7 text-sm px-1.5">
                              <SelectValue placeholder="選擇類別" />
                            </SelectTrigger>
                            <SelectContent>
                              {formOptions.expenseCategories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        {useMultiCurrency && (
                          <TableCell className="text-sm px-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={line.foreignAmount}
                              onChange={(e) => {
                                const newLines = [...expenseLines];
                                newLines[index].foreignAmount = e.target.value;
                                setExpenseLines(newLines);
                              }}
                              className="h-7 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="0.00"
                            />
                          </TableCell>
                        )}
                        <TableCell className="text-sm px-1">
                          <Select
                            value={line.currency || formData.receiptCurrency}
                            onValueChange={(value) => {
                              const newLines = [...expenseLines];
                              newLines[index].currency = value;
                              setExpenseLines(newLines);
                            }}
                          >
                            <SelectTrigger className="h-7 text-sm px-1.5">
                              <SelectValue placeholder="選擇幣別" />
                            </SelectTrigger>
                            <SelectContent>
                              {formOptions.currencies.map((curr) => (
                                <SelectItem key={curr.id} value={curr.symbol || curr.name}>
                                  {curr.symbol || curr.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        {useMultiCurrency && (
                          <TableCell className="text-sm px-1">
                            <Input
                              type="number"
                              step="0.0001"
                              value={line.exchangeRate || '1.00'}
                              onChange={(e) => {
                                const newLines = [...expenseLines];
                                newLines[index].exchangeRate = e.target.value;
                                setExpenseLines(newLines);
                              }}
                              className="h-7 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="1.00"
                            />
                          </TableCell>
                        )}
                        <TableCell className="text-sm px-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={line.amount}
                            onChange={(e) => {
                              const newLines = [...expenseLines];
                              newLines[index].amount = e.target.value;
                              // 自動計算 Gross Amt
                              const amount = parseFloat(e.target.value) || 0;
                              const taxAmt = parseFloat(newLines[index].taxAmt) || 0;
                              newLines[index].grossAmt = (amount + taxAmt).toFixed(2);
                              setExpenseLines(newLines);
                            }}
                            className="h-7 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell className="text-sm px-1">
                          <Input
                            value={line.taxCode}
                            onChange={(e) => {
                              const newLines = [...expenseLines];
                              newLines[index].taxCode = e.target.value;
                              setExpenseLines(newLines);
                            }}
                            className="h-7 text-sm px-1.5"
                            placeholder="稅碼"
                          />
                        </TableCell>
                        <TableCell className="text-sm px-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={line.taxRate}
                            onChange={(e) => {
                              const newLines = [...expenseLines];
                              newLines[index].taxRate = e.target.value;
                              // 自動計算稅額
                              const amount = parseFloat(newLines[index].amount) || 0;
                              const rate = parseFloat(e.target.value) || 0;
                              newLines[index].taxAmt = (amount * rate / 100).toFixed(2);
                              // 重新計算 Gross Amt
                              const taxAmt = parseFloat(newLines[index].taxAmt) || 0;
                              newLines[index].grossAmt = (amount + taxAmt).toFixed(2);
                              setExpenseLines(newLines);
                            }}
                            className="h-7 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0.0%"
                          />
                        </TableCell>
                        <TableCell className="text-sm px-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={line.taxAmt}
                            onChange={(e) => {
                              const newLines = [...expenseLines];
                              newLines[index].taxAmt = e.target.value;
                              // 重新計算 Gross Amt
                              const amount = parseFloat(newLines[index].amount) || 0;
                              const taxAmt = parseFloat(e.target.value) || 0;
                              newLines[index].grossAmt = (amount + taxAmt).toFixed(2);
                              setExpenseLines(newLines);
                            }}
                            className="h-7 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell className="text-sm px-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={line.grossAmt}
                            readOnly
                            className="h-7 text-sm bg-gray-50 dark:bg-gray-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell className="text-sm px-1">
                          <Input
                            value={line.memo}
                            onChange={(e) => {
                              const newLines = [...expenseLines];
                              newLines[index].memo = e.target.value;
                              setExpenseLines(newLines);
                            }}
                            className="h-7 text-sm px-1.5 w-full"
                            placeholder="備註"
                          />
                        </TableCell>
                        <TableCell className="text-sm px-1">
                          <Select
                            value={line.department}
                            onValueChange={(value) => {
                              const newLines = [...expenseLines];
                              newLines[index].department = value;
                              setExpenseLines(newLines);
                            }}
                          >
                            <SelectTrigger className="h-7 text-sm px-1.5">
                              <SelectValue placeholder="選擇部門" />
                            </SelectTrigger>
                            <SelectContent>
                              {formOptions.departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm px-1">
                          <Select
                            value={line.class}
                            onValueChange={(value) => {
                              const newLines = [...expenseLines];
                              newLines[index].class = value;
                              setExpenseLines(newLines);
                            }}
                          >
                            <SelectTrigger className="h-7 text-sm px-1.5">
                              <SelectValue placeholder="選擇類別" />
                            </SelectTrigger>
                            <SelectContent>
                              {formOptions.classes.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id}>
                                  {cls.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm px-1">
                          <Select
                            value={line.location}
                            onValueChange={(value) => {
                              const newLines = [...expenseLines];
                              newLines[index].location = value;
                              setExpenseLines(newLines);
                            }}
                          >
                            <SelectTrigger className="h-7 text-sm px-1.5">
                              <SelectValue placeholder="選擇地點" />
                            </SelectTrigger>
                            <SelectContent>
                              {formOptions.locations.map((loc) => (
                                <SelectItem key={loc.id} value={loc.id}>
                                  {loc.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="px-1">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newLines = [...expenseLines];
                                newLines[index].isEditing = false;
                                setExpenseLines(newLines);
                              }}
                              className="h-7 w-7 p-0"
                              title="確認"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newLines = expenseLines.filter((_, i) => i !== index);
                                setExpenseLines(newLines);
                              }}
                              className="h-7 w-7 p-0"
                              title="刪除"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newLine: ExpenseReportLine = {
                                  ...line,
                                  id: `line-${Date.now()}-${Math.random()}`,
                                  refNo: nextRefNo,
                                  isEditing: true,
                                };
                                setNextRefNo(nextRefNo + 1);
                                const newLines = [...expenseLines];
                                newLines.splice(index + 1, 0, newLine);
                                setExpenseLines(newLines);
                              }}
                              className="h-7 w-7 p-0"
                              title="插入"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newLine: ExpenseReportLine = {
                                  ...line,
                                  id: `line-${Date.now()}-${Math.random()}`,
                                  refNo: nextRefNo,
                                  isEditing: true,
                                };
                                setNextRefNo(nextRefNo + 1);
                                setExpenseLines([...expenseLines, newLine]);
                              }}
                              className="h-7 w-7 p-0"
                              title="複製"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* 新增行按鈕 */}
            <div className="flex justify-start">
              <Button
                variant="outline"
                onClick={() => {
                  const newLine: ExpenseReportLine = {
                    id: `line-${Date.now()}-${Math.random()}`,
                    refNo: nextRefNo,
                    date: formData.expenseDate,
                    category: formData.type || '',
                    foreignAmount: '',
                    currency: formData.receiptCurrency || 'TWD',
                    exchangeRate: '1.00',
                    amount: formData.receiptAmount || '',
                    taxCode: '',
                    taxRate: '',
                    taxAmt: '',
                    grossAmt: formData.receiptAmount || '',
                    memo: formData.description || '',
                    department: formData.department || '',
                    class: formData.class || '',
                    location: formData.expenseLocation || '',
                    ocrDetail: '',
                    ocrData: {
                      invoiceTitle: formData.invoiceTitle || '',
                      invoicePeriod: formData.invoicePeriod || '',
                      invoiceNumber: formData.invoiceNumber || '',
                      invoiceDate: formData.invoiceDate || '',
                      randomCode: formData.randomCode || '',
                      formatCode: formData.formatCode || '',
                      sellerName: formData.sellerName || '',
                      sellerTaxId: formData.sellerTaxId || '',
                      sellerAddress: formData.sellerAddress || '',
                      buyerName: formData.buyerName || '',
                      buyerTaxId: formData.buyerTaxId || '',
                      buyerAddress: formData.buyerAddress || '',
                      untaxedAmount: formData.untaxedAmount || '',
                      taxAmount: formData.taxAmount || '',
                      totalAmount: formData.totalAmount || '',
                      ocrSuccess: formData.ocrSuccess,
                      ocrConfidence: formData.ocrConfidence,
                      ocrDocumentType: formData.ocrDocumentType || '',
                      ocrErrors: formData.ocrErrors || '',
                      ocrWarnings: formData.ocrWarnings || '',
                      ocrErrorCount: formData.ocrErrorCount,
                      ocrWarningCount: formData.ocrWarningCount,
                      ocrQualityGrade: formData.ocrQualityGrade || '',
                      ocrFileName: formData.ocrFileName || '',
                      ocrFileId: formData.ocrFileId || '',
                      ocrWebViewLink: formData.ocrWebViewLink || '',
                      ocrProcessedAt: formData.ocrProcessedAt || '',
                    },
                    customer: '',
                    projectTask: '',
                    billable: false,
                    attachFile: '',
                    receipt: '',
                    isEditing: true,
                  };
                  setNextRefNo(nextRefNo + 1);
                  setExpenseLines([...expenseLines, newLine]);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                新增行
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons - Aligned with description textarea */}
      <div className="flex justify-end gap-2" style={{ paddingLeft: '24px' }}>
        <Button variant="outline" onClick={() => window.history.back()}>
          <X className="h-4 w-4 mr-2" />
          取消
        </Button>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          建立另一個
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? '儲存中...' : '儲存並關閉'}
        </Button>
      </div>
    </div>
  );
}

