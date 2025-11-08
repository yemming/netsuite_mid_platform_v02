'use client';

import { useState, useEffect, useRef } from 'react';
import { Receipt, Calendar, Upload, Save, X, Plus, ZoomIn, ZoomOut, RotateCcw, Image, Sparkles, Loader2 } from 'lucide-react';
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

export default function OCRExpensePage() {
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
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; netsuite_internal_id: number }>>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState<Array<{ id: string; name: string; netsuite_internal_id: number }>>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

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

  // 載入員工列表
  useEffect(() => {
    const loadEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data, error } = await supabase
          .from('ns_entities_employees')
          .select('id, name, netsuite_internal_id')
          .eq('is_inactive', false)
          .order('name');
        
        if (!error && data) {
          setEmployees(data);
        } else if (error) {
          console.error('載入員工列表錯誤:', error);
        }
      } catch (error) {
        console.error('載入員工列表錯誤:', error);
      } finally {
        setLoadingEmployees(false);
      }
    };

    loadEmployees();
  }, []);

  // 載入費用類別列表
  useEffect(() => {
    const loadExpenseCategories = async () => {
      setLoadingCategories(true);
      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data, error } = await supabase
          .from('ns_expense_categories')
          .select('id, name, netsuite_internal_id')
          .eq('is_inactive', false)
          .order('name');
        
        if (!error && data) {
          setExpenseCategories(data);
        } else if (error) {
          console.error('載入費用類別列表錯誤:', error);
        }
      } catch (error) {
        console.error('載入費用類別列表錯誤:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadExpenseCategories();
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
      if (ocrData['開立時間']) {
        handleInputChange('expenseDate', ocrData['開立時間']);
      }
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

        // 先顯示返回的參數確認數據接得進來
        alert(`N8N 返回參數:\n\n${JSON.stringify(result, null, 2)}`);

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
      // 準備附件數據（如果有）
      let attachmentData = null;
      if (attachments.length > 0 && attachments[0]) {
        const file = attachments[0];
        if (previewImage && previewImage.startsWith('data:')) {
          // 將 base64 轉換為 Blob
          const response = await fetch(previewImage);
          const blob = await response.blob();
          // 轉換為 base64 字符串（用於傳輸）
          const reader = new FileReader();
          attachmentData = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
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
          attachment: attachmentData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || '提交失敗');
      }

      // 成功
      alert(`報支項目已成功建立！\n\nNetSuite ID: ${result.netsuite_id}\n交易編號: ${result.netsuite_tran_id || 'N/A'}`);
      
      // 可選：重置表單或導航
      // window.location.href = '/dashboard';
      
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
          使用 OCR 技術自動識別收據並建立報支項目
        </p>
      </div>

      {/* Main Form Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>報支項目資訊</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Attachments and Preview */}
            <div className="space-y-4">
              {/* Attachments */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">附件</Label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-primary transition-colors cursor-pointer"
                >
                  <input
                    type="file"
                    id="file-upload"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex items-center gap-4">
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
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        支援圖片格式（上傳新圖片會自動替換舊的）
                      </p>
                    </div>
                  </label>
                </div>
                {attachments.length > 0 && (
                  <div className="space-y-2 mt-2">
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

              {/* Receipt Missing */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="receiptMissing"
                  checked={formData.receiptMissing}
                  onCheckedChange={(checked) =>
                    handleInputChange('receiptMissing', checked)
                  }
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
                        <span className="px-2 py-1 text-xs font-medium flex items-center text-gray-700 dark:text-gray-300">
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
                        className="h-7 px-3 text-xs border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800"
                      >
                        <X className="h-3 w-3 mr-1" />
                        取消
                      </Button>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 ml-6">
                      辨識結果將自動填入表單
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Form Fields */}
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
                    className="pr-10"
                    required
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-semibold">
                  費用科目 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value)}
                  disabled={loadingCategories}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder={loadingCategories ? "載入中..." : "選擇費用科目"} />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.length > 0 ? (
                      expenseCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                        {loadingCategories ? "載入中..." : "無可用費用類別"}
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
                  disabled={loadingEmployees}
                >
                  <SelectTrigger id="employee">
                    <SelectValue placeholder={loadingEmployees ? "載入中..." : "選擇員工"} />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.length > 0 ? (
                      employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                        {loadingEmployees ? "載入中..." : "無可用員工"}
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
                >
                  <SelectTrigger id="subsidiary">
                    <SelectValue placeholder="選擇子公司" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subsidiary-1">子公司 1</SelectItem>
                    <SelectItem value="subsidiary-2">子公司 2</SelectItem>
                    <SelectItem value="subsidiary-3">子公司 3</SelectItem>
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
                >
                  <SelectTrigger id="expenseLocation">
                    <SelectValue placeholder="選擇地點" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="taiwan">Taiwan</SelectItem>
                    <SelectItem value="china">China</SelectItem>
                    <SelectItem value="usa">USA</SelectItem>
                    <SelectItem value="japan">Japan</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
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
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="選擇部門" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dept-1">部門 1</SelectItem>
                    <SelectItem value="dept-2">部門 2</SelectItem>
                    <SelectItem value="dept-3">部門 3</SelectItem>
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
                >
                  <SelectTrigger id="class">
                    <SelectValue placeholder="選擇類別" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class-1">類別 1</SelectItem>
                    <SelectItem value="class-2">類別 2</SelectItem>
                    <SelectItem value="class-3">類別 3</SelectItem>
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
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TWD">TWD</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="CNY">CNY</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
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
          </div>
        </CardContent>
      </Card>

      {/* OCR 識別結果 - 獨立區塊 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>OCR 識別結果</CardTitle>
        </CardHeader>
        <CardContent>
          {ocrProcessing ? (
            /* Skeleton Loading */
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50 animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 第一列：發票相關資訊 Skeleton */}
                <div className="space-y-1.5">
                  <div className="space-y-1.5">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="space-y-1">
                        <div className="h-3 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
                        <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* 第二列：賣方資訊 Skeleton */}
                <div className="space-y-1.5">
                  <div className="space-y-1.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-1">
                        <div className="h-3 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
                        <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* 第三列：買方資訊及金額 Skeleton */}
                <div className="space-y-1.5">
                  <div className="space-y-1.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-1">
                        <div className="h-3 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
                        <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    ))}
                    <div className="pt-1.5 border-t border-gray-200 dark:border-gray-700 space-y-1.5">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-1">
                          <div className="h-3 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
                          <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* OCR 元數據資訊 Skeleton */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="h-3 w-24 bg-gray-300 dark:bg-gray-700 rounded mb-3"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 第一列 Skeleton */}
                  <div className="space-y-1.5">
                    <div className="space-y-1.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-1">
                          <div className="h-3 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
                          <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* 第二列 Skeleton */}
                  <div className="space-y-1.5">
                    <div className="space-y-1.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-1">
                          <div className="h-3 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
                          <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* 第三列 Skeleton */}
                  <div className="space-y-1.5">
                    <div className="space-y-1.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-1">
                          <div className="h-3 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
                          <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 實際內容 */
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 第一列：發票相關資訊 */}
                <div className="space-y-1.5">
                  <div className="space-y-1.5">
                    <div className="space-y-1">
                      <Label htmlFor="ocr-invoiceTitle" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        發票標題
                      </Label>
                      <Input
                        id="ocr-invoiceTitle"
                        value={formData.invoiceTitle}
                        onChange={(e) => handleInputChange('invoiceTitle', e.target.value)}
                        className="text-sm h-8"
                        placeholder="發票標題"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ocr-invoicePeriod" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        發票期別
                      </Label>
                      <Input
                        id="ocr-invoicePeriod"
                        value={formData.invoicePeriod}
                        onChange={(e) => handleInputChange('invoicePeriod', e.target.value)}
                        className="text-sm h-8"
                        placeholder="發票期別"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ocr-invoiceNumber" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        發票號碼
                      </Label>
                      <Input
                        id="ocr-invoiceNumber"
                        value={formData.invoiceNumber}
                        onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                        className="text-sm h-8"
                        placeholder="發票號碼"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ocr-invoiceDate" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        開立時間
                      </Label>
                      <Input
                        id="ocr-invoiceDate"
                        value={formData.invoiceDate}
                        onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
                        className="text-sm h-8"
                        placeholder="開立時間"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ocr-randomCode" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        隨機碼
                      </Label>
                      <Input
                        id="ocr-randomCode"
                        value={formData.randomCode}
                        onChange={(e) => handleInputChange('randomCode', e.target.value)}
                        className="text-sm h-8"
                        placeholder="隨機碼"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ocr-formatCode" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        格式代號
                      </Label>
                      <Input
                        id="ocr-formatCode"
                        value={formData.formatCode}
                        onChange={(e) => handleInputChange('formatCode', e.target.value)}
                        className="text-sm h-8"
                        placeholder="格式代號"
                      />
                    </div>
                  </div>
                </div>

                {/* 第二列：賣方資訊 */}
                <div className="space-y-1.5">
                  <div className="space-y-1.5">
                    <div className="space-y-1">
                      <Label htmlFor="ocr-sellerName" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        賣方名稱
                      </Label>
                      <Input
                        id="ocr-sellerName"
                        value={formData.sellerName}
                        onChange={(e) => handleInputChange('sellerName', e.target.value)}
                        className="text-sm h-8"
                        placeholder="賣方名稱"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ocr-sellerTaxId" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        賣方統編
                      </Label>
                      <Input
                        id="ocr-sellerTaxId"
                        value={formData.sellerTaxId}
                        onChange={(e) => handleInputChange('sellerTaxId', e.target.value)}
                        className="text-sm h-8"
                        placeholder="賣方統編"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ocr-sellerAddress" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        賣方地址
                      </Label>
                      <Input
                        id="ocr-sellerAddress"
                        value={formData.sellerAddress}
                        onChange={(e) => handleInputChange('sellerAddress', e.target.value)}
                        className="text-sm h-8"
                        placeholder="賣方地址"
                      />
                    </div>
                  </div>
                </div>

                {/* 第三列：買方資訊及金額 */}
                <div className="space-y-1.5">
                  <div className="space-y-1.5">
                    <div className="space-y-1">
                      <Label htmlFor="ocr-buyerName" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        買方名稱
                      </Label>
                      <Input
                        id="ocr-buyerName"
                        value={formData.buyerName}
                        onChange={(e) => handleInputChange('buyerName', e.target.value)}
                        className="text-sm h-8"
                        placeholder="買方名稱"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ocr-buyerTaxId" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        買方統編
                      </Label>
                      <Input
                        id="ocr-buyerTaxId"
                        value={formData.buyerTaxId}
                        onChange={(e) => handleInputChange('buyerTaxId', e.target.value)}
                        className="text-sm h-8"
                        placeholder="買方統編"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ocr-buyerAddress" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        買方地址
                      </Label>
                      <Input
                        id="ocr-buyerAddress"
                        value={formData.buyerAddress}
                        onChange={(e) => handleInputChange('buyerAddress', e.target.value)}
                        className="text-sm h-8"
                        placeholder="買方地址"
                      />
                    </div>
                    <div className="pt-1.5 border-t border-gray-200 dark:border-gray-700 space-y-1.5">
                      <div className="space-y-1">
                        <Label htmlFor="ocr-untaxedAmount" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          未稅銷售額
                        </Label>
                        <Input
                          id="ocr-untaxedAmount"
                          type="number"
                          step="0.01"
                          value={formData.untaxedAmount}
                          onChange={(e) => handleInputChange('untaxedAmount', e.target.value)}
                          className="text-sm h-8"
                          placeholder="未稅銷售額"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="ocr-taxAmount" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          稅額
                        </Label>
                        <Input
                          id="ocr-taxAmount"
                          type="number"
                          step="0.01"
                          value={formData.taxAmount}
                          onChange={(e) => handleInputChange('taxAmount', e.target.value)}
                          className="text-sm h-8"
                          placeholder="稅額"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="ocr-totalAmount" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          總計金額
                        </Label>
                        <Input
                          id="ocr-totalAmount"
                          type="number"
                          step="0.01"
                          value={formData.totalAmount}
                          onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                          className="text-sm font-semibold h-8"
                          placeholder="總計金額"
                        />
                      </div>
                    </div>
                  </div>
                </div>
            </div>
            
            {/* OCR 元數據資訊 */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">OCR 處理資訊</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 第一列：處理狀態與品質 */}
                <div className="space-y-1.5">
                  <div className="space-y-1.5">
                    <div className="space-y-1">
                      <Label htmlFor="ocr-success" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        處理狀態
                      </Label>
                      <Input
                        id="ocr-success"
                        value={formData.ocrSuccess ? '成功' : '失敗'}
                        readOnly
                        className="text-sm bg-gray-100 dark:bg-gray-800 h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ocr-confidence" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        辨識信心度 (%)
                      </Label>
                      <Input
                        id="ocr-confidence"
                        type="number"
                        value={formData.ocrConfidence}
                        readOnly
                        className="text-sm bg-gray-100 dark:bg-gray-800 h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ocr-documentType" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        文件類型
                      </Label>
                      <Input
                        id="ocr-documentType"
                        value={formData.ocrDocumentType}
                        readOnly
                        className="text-sm bg-gray-100 dark:bg-gray-800 h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ocr-qualityGrade" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        品質等級
                      </Label>
                      <Input
                        id="ocr-qualityGrade"
                        value={formData.ocrQualityGrade}
                        readOnly
                        className="text-sm bg-gray-100 dark:bg-gray-800 h-8"
                      />
                    </div>
                  </div>
                </div>

                {/* 第二列：錯誤與警告 */}
                <div className="space-y-1.5">
                  <div className="space-y-1.5">
                    <div className="space-y-1">
                      <Label htmlFor="ocr-errorCount" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        錯誤數量
                      </Label>
                      <Input
                        id="ocr-errorCount"
                        type="number"
                        value={formData.ocrErrorCount}
                        readOnly
                        className="text-sm bg-gray-100 dark:bg-gray-800 h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ocr-warningCount" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        警告數量
                      </Label>
                      <Input
                        id="ocr-warningCount"
                        type="number"
                        value={formData.ocrWarningCount}
                        readOnly
                        className="text-sm bg-gray-100 dark:bg-gray-800 h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ocr-errors" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        錯誤訊息
                      </Label>
                      <Input
                        id="ocr-errors"
                        value={formData.ocrErrors || '無'}
                        readOnly
                        className="text-sm bg-gray-100 dark:bg-gray-800 h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ocr-warnings" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        警告訊息
                      </Label>
                      <Input
                        id="ocr-warnings"
                        value={formData.ocrWarnings || '無'}
                        readOnly
                        className="text-sm bg-gray-100 dark:bg-gray-800 h-8"
                      />
                    </div>
                  </div>
                </div>

                {/* 第三列：檔案資訊 */}
                <div className="space-y-1.5">
                  <div className="space-y-1.5">
                    <div className="space-y-1">
                      <Label htmlFor="ocr-fileName" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        檔案名稱
                      </Label>
                      <Input
                        id="ocr-fileName"
                        value={formData.ocrFileName || '未知檔案'}
                        readOnly
                        className="text-sm bg-gray-100 dark:bg-gray-800 h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ocr-fileId" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        檔案 ID
                      </Label>
                      <Input
                        id="ocr-fileId"
                        value={formData.ocrFileId || '無'}
                        readOnly
                        className="text-sm bg-gray-100 dark:bg-gray-800 h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ocr-processedAt" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        處理時間
                      </Label>
                      <Input
                        id="ocr-processedAt"
                        value={formData.ocrProcessedAt ? new Date(formData.ocrProcessedAt).toLocaleString('zh-TW') : ''}
                        readOnly
                        className="text-sm bg-gray-100 dark:bg-gray-800 h-8"
                      />
                    </div>
                    {formData.ocrWebViewLink && (
                      <div className="space-y-1">
                        <Label htmlFor="ocr-webViewLink" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          預覽連結
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="ocr-webViewLink"
                            value={formData.ocrWebViewLink}
                            readOnly
                            className="text-sm bg-gray-100 dark:bg-gray-800 h-8"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(formData.ocrWebViewLink, '_blank')}
                            className="flex-shrink-0 h-8"
                          >
                            開啟
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
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

