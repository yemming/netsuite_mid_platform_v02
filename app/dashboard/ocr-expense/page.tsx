'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Receipt, Calendar, Upload, Save, X, Plus, ZoomIn, ZoomOut, RotateCcw, Image, Sparkles, Loader2, Copy, Trash2, Check, Eye, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
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
    expenseType?: string; // OCR 辨識的費用類型（原始值，用於 mapping 到 expense category）
    attachmentImageData?: string; // 附件圖片的 base64 數據（用於在 OCR 明細中顯示）
    attachmentFileType?: string; // 附件檔案類型（用於判斷是圖片還是 PDF）
    attachmentUrl?: string; // 附件 URL（Supabase Storage URL）
  };
  customer: string; // 客戶
  projectTask: string; // 專案任務
  billable: boolean; // 可計費
  attachFile: string; // 附加檔案
  receipt: string; // 收據
  isEditing: boolean; // 是否正在編輯
  isProcessing?: boolean; // 是否正在 OCR 處理中
}

export default function OCRExpensePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 格式化金額顯示（加上千分位，TWD 不顯示小數點）
  const formatAmountDisplay = (value: string | number | null | undefined, currency: string = 'TWD'): string => {
    if (!value && value !== 0) return '';
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '';
    
    // 判斷是否為 TWD（不顯示小數點）
    const isTWD = currency === 'TWD' || currency === 'NTD' || currency === '新台幣';
    
    if (isTWD) {
      // TWD：不顯示小數點，只顯示整數部分
      const intValue = Math.floor(numValue);
      return intValue.toLocaleString('zh-TW', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    } else {
      // 其他幣別：顯示小數點
      return numValue.toLocaleString('zh-TW', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  };
  
  // 從格式化字串中解析數字（移除千分位符號）
  const parseAmountValue = (formattedValue: string): string => {
    if (!formattedValue) return '';
    // 移除所有千分位符號（逗號）和空格
    return formattedValue.replace(/,/g, '').trim();
  };
  
  // 編輯模式：從 URL 參數讀取 expense_review_id
  const expenseReviewId = searchParams.get('id');
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  
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
  const [previewImageIndex, setPreviewImageIndex] = useState<number>(0);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewFileTypes, setPreviewFileTypes] = useState<string[]>([]); // 追蹤每個預覽檔案的類型
  const [zoom, setZoom] = useState(1);

  // 當附件改變時，自動載入預覽檔案（圖片和 PDF）
  useEffect(() => {
    loadPreviewImages(attachments);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachments.length]); // 只在附件數量改變時觸發
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrJobId, setOcrJobId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentJobIdRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 多附件 OCR 任務追蹤
  const [multiOcrTasks, setMultiOcrTasks] = useState<Map<number, {
    jobId: string;
    status: 'processing' | 'completed' | 'error';
    fileIndex: number;
    fileName: string;
  }>>(new Map());
  const multiOcrPollingIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const multiOcrTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  // 追蹤已經處理過的 jobId，避免重複建立 expense line
  const processedJobIdsRef = useRef<Set<string>>(new Set());
  // 追蹤已經建立 expense line 的 fileIndex，避免重複建立
  const createdExpenseLineFileIndexesRef = useRef<Set<number>>(new Set());
  // 表單選項資料（一次載入所有）
  const [formOptions, setFormOptions] = useState<{
    employees: Array<{ id: string; name: string; netsuite_internal_id: number }>;
    expenseCategories: Array<{ id: string; name: string; netsuite_internal_id: number }>;
    subsidiaries: Array<{ id: string; name: string; netsuite_internal_id: number; country: string | null }>;
    locations: Array<{ id: string; name: string; netsuite_internal_id: number }>;
    departments: Array<{ id: string; name: string; netsuite_internal_id: number }>;
    classes: Array<{ id: string; name: string; netsuite_internal_id: number }>;
    currencies: Array<{ id: string; name: string; symbol: string; netsuite_internal_id: number }>;
    taxCodes: Array<{ id: string; name: string; rate: number | null; description: string | null; country: string | null; netsuite_internal_id: number }>;
  }>({
    employees: [],
    expenseCategories: [],
    subsidiaries: [],
    locations: [],
    departments: [],
    classes: [],
    currencies: [],
    taxCodes: [],
  });
  
  // 根據選定的 subsidiary 的 country 篩選後的稅碼
  const [filteredTaxCodes, setFilteredTaxCodes] = useState<Array<{ id: string; name: string; rate: number | null; description: string | null; country: string | null; netsuite_internal_id: number }>>([]);
  const [loadingFormOptions, setLoadingFormOptions] = useState(false);
  
  // Expense Report Lines (表身)
  const [expenseLines, setExpenseLines] = useState<ExpenseReportLine[]>([]);
  // 追蹤正在編輯的金額欄位（用於格式化顯示）
  const [editingAmountFields, setEditingAmountFields] = useState<Set<string>>(new Set());
  const [nextRefNo, setNextRefNo] = useState(1);
  const [useMultiCurrency, setUseMultiCurrency] = useState(false);

  // 當 expenseLines 改變時，自動更新收據金額（一律由 expense line items 的總金額加總）
  useEffect(() => {
    // 計算所有 expense lines 的總金額
    const total = expenseLines.reduce((sum, line) => {
      const grossAmt = parseFloat(line.grossAmt || '0') || 0;
      return sum + grossAmt;
    }, 0);
    const totalAmount = total.toFixed(2);
    setFormData(prev => {
      // 只有當金額改變時才更新，避免不必要的重新渲染
      if (prev.receiptAmount !== totalAmount) {
        return {
          ...prev,
          receiptAmount: totalAmount,
        };
      }
      return prev;
    });
  }, [expenseLines]);
  
  // 拖拽相關 state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // 拖拽排序行的處理函數
  const handleRowDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleRowDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleRowDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleRowDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // 重新排序行
    const newLines = [...expenseLines];
    const draggedLine = newLines[draggedIndex];
    newLines.splice(draggedIndex, 1);
    newLines.splice(dropIndex, 0, draggedLine);

    // 重新編號所有行，從 1 開始依序遞增
    const renumberedLines = newLines.map((line, i) => ({
      ...line,
      refNo: i + 1,
    }));

    setExpenseLines(renumberedLines);

    // 更新 nextRefNo 為下一個可用的編號（基於重新編號後的最大編號）
    const maxRefNo = renumberedLines.length > 0
      ? Math.max(...renumberedLines.map(line => line.refNo || 0))
      : 0;
    setNextRefNo(maxRefNo + 1);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleRowDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 更新 OCR 資料的處理函數
  const handleOcrDataChange = (lineIndex: number, field: string, value: string) => {
    setExpenseLines(prev => {
      const newLines = [...prev];
      if (newLines[lineIndex]) {
        newLines[lineIndex] = {
          ...newLines[lineIndex],
          ocrData: {
            ...newLines[lineIndex].ocrData,
            [field]: value,
          },
        };
      }
      return newLines;
    });
  };

  // 在指定行下方插入空白行的函數
  const insertBlankLineAfter = (index: number) => {
    const newLine: ExpenseReportLine = {
      id: `line-${Date.now()}-${Math.random()}`,
      refNo: 0, // 暫時設為 0，稍後會重新編號
      date: formData.expenseDate || '',
      category: '',
      foreignAmount: '',
      currency: formData.receiptCurrency || 'TWD',
      exchangeRate: '1.00',
      amount: '', // 空白，不複製上一行的金額
      taxCode: '',
      taxRate: '',
      taxAmt: '', // 空白，不複製上一行的稅額
      grossAmt: '', // 空白，不複製上一行的總金額
      memo: '',
      department: '',
      class: '',
      location: '',
      ocrDetail: '',
      ocrData: {
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
      },
      customer: '',
      projectTask: '',
      billable: false,
      attachFile: '',
      receipt: '',
      isEditing: true,
    };
    
    // 插入新行到指定位置
    const newLines = [...expenseLines];
    newLines.splice(index + 1, 0, newLine);
    
    // 重新編號所有行，從 1 開始依序遞增
    const renumberedLines = newLines.map((line, i) => ({
      ...line,
      refNo: i + 1,
    }));
    
    setExpenseLines(renumberedLines);
    
    // 更新 nextRefNo 為下一個可用的編號（基於重新編號後的最大編號）
    const maxRefNo = renumberedLines.length > 0
      ? Math.max(...renumberedLines.map(line => line.refNo || 0))
      : 0;
    setNextRefNo(maxRefNo + 1);
  };

  const handleInputChange = (field: string, value: any) => {
    // 當選擇 subsidiary 時，根據 country 篩選稅碼
    if (field === 'subsidiary') {
      const selectedSubsidiary = formOptions.subsidiaries.find(sub => sub.id === value);
      const country = selectedSubsidiary?.country || null;
      
      // 根據 country 篩選稅碼
      if (country) {
        const filtered = formOptions.taxCodes.filter(tc => tc.country === country);
        setFilteredTaxCodes(filtered);
      } else {
        // 如果沒有 country，顯示所有稅碼
        setFilteredTaxCodes(formOptions.taxCodes);
      }
    }
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 將所有圖片和 PDF 附件轉換為 base64 預覽
  const loadPreviewImages = async (files: File[]) => {
    const supportedFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );
    const promises = supportedFiles.map(file => {
      return new Promise<{ data: string; type: string }>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            data: e.target?.result as string,
            type: file.type
          });
        };
        reader.readAsDataURL(file);
      });
    });
    const results = await Promise.all(promises);
    const images = results.map(r => r.data);
    const fileTypes = results.map(r => r.type);
    setPreviewImages(images);
    setPreviewFileTypes(fileTypes);
    if (images.length > 0) {
      // 如果當前沒有預覽檔案，顯示第一個
      if (!previewImage) {
        setPreviewImage(images[0]);
        setPreviewImageIndex(0);
      } else {
        // 如果有預覽檔案，檢查當前索引是否有效
        if (previewImageIndex >= images.length) {
          setPreviewImageIndex(0);
          setPreviewImage(images[0]);
        } else {
          setPreviewImage(images[previewImageIndex]);
        }
      }
    } else {
      setPreviewImage(null);
      setPreviewImageIndex(0);
      setPreviewFileTypes([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      // 支援多個附件：將新檔案添加到現有附件列表中
      const imageFiles = newFiles.filter(file => file.type.startsWith('image/') || file.type === 'application/pdf');
      if (imageFiles.length > 0) {
        // 將新檔案添加到現有附件列表
        setAttachments(prev => {
          const updated = [...prev, ...imageFiles];
          loadPreviewImages(updated);
          return updated;
        });
      }
      // 重置 input，讓使用者可以再次選擇同一個檔案
      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachments((prev) => {
      const newAttachments = prev.filter((_, i) => i !== index);
      // 重新載入預覽圖片
      loadPreviewImages(newAttachments);
      return newAttachments;
    });
  };

  // 切換到上一張圖片
  const handlePreviousImage = () => {
    if (previewImages.length > 0) {
      const newIndex = previewImageIndex === 0 ? previewImages.length - 1 : previewImageIndex - 1;
      setPreviewImageIndex(newIndex);
      setPreviewImage(previewImages[newIndex]);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  // 切換到下一張圖片
  const handleNextImage = () => {
    if (previewImages.length > 0) {
      const newIndex = previewImageIndex === previewImages.length - 1 ? 0 : previewImageIndex + 1;
      setPreviewImageIndex(newIndex);
      setPreviewImage(previewImages[newIndex]);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  // 點擊附件時切換到對應的檔案預覽（圖片或 PDF）
  const handleAttachmentClick = (fileIndex: number) => {
    const file = attachments[fileIndex];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      // 找到該檔案在所有支援檔案中的索引
      const supportedFiles = attachments.filter(f => 
        f.type.startsWith('image/') || f.type === 'application/pdf'
      );
      const fileIndexInPreview = supportedFiles.findIndex(f => f === file);
      if (fileIndexInPreview !== -1 && fileIndexInPreview < previewImages.length) {
        setPreviewImageIndex(fileIndexInPreview);
        setPreviewImage(previewImages[fileIndexInPreview]);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  // 檢查附件是否為當前預覽的檔案
  const isAttachmentSelected = (fileIndex: number) => {
    const file = attachments[fileIndex];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      const supportedFiles = attachments.filter(f => 
        f.type.startsWith('image/') || f.type === 'application/pdf'
      );
      const fileIndexInPreview = supportedFiles.findIndex(f => f === file);
      return fileIndexInPreview === previewImageIndex;
    }
    return false;
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

  // 更新預覽區域顯示對應行的附件（圖片或 PDF）
  const updatePreviewForLine = (line: ExpenseReportLine) => {
    if (line.ocrData?.attachmentImageData) {
      setPreviewImage(line.ocrData.attachmentImageData);
      // 設定檔案類型，讓預覽區域能正確顯示 PDF 或圖片
      if (line.ocrData.attachmentFileType) {
        setPreviewFileTypes([line.ocrData.attachmentFileType]);
        setPreviewImageIndex(0);
      }
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
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

  // 預覽區域的 ref（用於添加 wheel 事件監聽器）
  const previewRef = useRef<HTMLDivElement>(null);

  // 使用原生事件監聽器處理 wheel 事件（避免 passive event listener 警告）
  useEffect(() => {
    const previewElement = previewRef.current;
    if (!previewElement) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
    };

    // 添加事件監聽器，設置 passive: false 以允許 preventDefault
    previewElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      previewElement.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // 清理 polling 和 timeout
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // 清理多附件 OCR 的輪詢和超時
      multiOcrPollingIntervalsRef.current.forEach((interval) => {
        clearInterval(interval);
      });
      multiOcrPollingIntervalsRef.current.clear();
      multiOcrTimeoutsRef.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
      multiOcrTimeoutsRef.current.clear();
    };
  }, []);

  // 載入所有表單選項（一次查詢）
  useEffect(() => {
    const loadFormOptions = async () => {
      setLoadingFormOptions(true);
      try {
        const supabase = createClient();
        
        // 先取得使用者資料和 mapping 的員工
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoadingFormOptions(false);
          return;
        }
        
        // 取得使用者的員工 mapping
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('netsuite_employee_id')
          .eq('id', user.id)
          .maybeSingle();
        
        // 載入表單選項（先載入所有稅碼，之後根據 country 篩選）
        const response = await fetch('/api/expense-form-options');
        const result = await response.json();
        
        if (result.success && result.data) {
          const subsidiaries = result.data.subsidiaries || [];
          const taxCodes = result.data.taxCodes || [];
          
          setFormOptions({
            employees: result.data.employees || [],
            expenseCategories: result.data.expenseCategories || [],
            subsidiaries: subsidiaries,
            locations: result.data.locations || [],
            departments: result.data.departments || [],
            classes: result.data.classes || [],
            currencies: result.data.currencies || [],
            taxCodes: taxCodes,
          });
          
          // 如果有警告，顯示在 console
          if (result.warnings && result.warnings.length > 0) {
            console.warn('載入表單選項時有部分錯誤:', result.warnings);
          }
          
          // 如果有 mapping 的員工，自動填入員工和公司別（僅在非編輯模式時執行）
          // 編輯模式時不執行，避免覆蓋已載入的資料
          if (!expenseReviewId && userProfile?.netsuite_employee_id) {
            // 查詢員工資料
            const { data: employeeData } = await supabase
              .from('ns_entities_employees')
              .select('id, netsuite_internal_id, subsidiary_id, department_id')
              .eq('netsuite_internal_id', userProfile.netsuite_employee_id)
              .eq('is_inactive', false)
              .single();
            
            if (employeeData) {
              // 找到對應的員工 ID（使用 formOptions 中的 id）
              const matchedEmployee = result.data.employees?.find(
                (emp: any) => emp.netsuite_internal_id === employeeData.netsuite_internal_id
              );
              
              if (matchedEmployee) {
                setFormData(prev => ({
                  ...prev,
                  employee: matchedEmployee.id,
                }));
              }
              
              // 如果有 subsidiary_id，自動填入公司別
              if (employeeData.subsidiary_id) {
                const matchedSubsidiary = subsidiaries.find(
                  (sub: any) => sub.netsuite_internal_id === employeeData.subsidiary_id
                );
                
                if (matchedSubsidiary) {
                  setFormData(prev => ({
                    ...prev,
                    subsidiary: matchedSubsidiary.id,
                  }));
                  
                  // 根據 subsidiary 的 country 篩選稅碼
                  const country = matchedSubsidiary.country;
                  if (country) {
                    const filtered = taxCodes.filter((tc: any) => tc.country === country);
                    setFilteredTaxCodes(filtered);
                  } else {
                    setFilteredTaxCodes(taxCodes);
                  }
                }
              }
              
              // 部門、地點、類別現在只在表身的每一行中選擇，不再在表頭
            }
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

  // 當 formOptions 或 formData.subsidiary 改變時，更新篩選後的稅碼和記賬幣別
  useEffect(() => {
    const updateTaxCodesAndCurrency = async () => {
      // 如果正在載入資料，不執行自動更新（避免覆蓋載入的幣別）
      if (loadingData) {
        return;
      }

      if (formData.subsidiary && formOptions.subsidiaries.length > 0) {
        const selectedSubsidiary = formOptions.subsidiaries.find(sub => sub.id === formData.subsidiary);
        
        if (selectedSubsidiary) {
          // 1. 更新稅碼篩選（根據 country）
          if (formOptions.taxCodes.length > 0) {
            const country = selectedSubsidiary.country || null;
            
            if (country) {
              const filtered = formOptions.taxCodes.filter(tc => tc.country === country);
              setFilteredTaxCodes(filtered);
            } else {
              setFilteredTaxCodes(formOptions.taxCodes);
            }
          }

          // 2. 更新記賬幣別（根據公司別的 base_currency_id）
          try {
            const supabase = createClient();
            
            // 查詢公司別的 base_currency_id
            const { data: subsidiaryData } = await supabase
              .from('ns_subsidiaries')
              .select('base_currency_id')
              .eq('id', formData.subsidiary)
              .maybeSingle();

            if (subsidiaryData?.base_currency_id && formOptions.currencies.length > 0) {
              // 找到對應的幣別（根據 netsuite_internal_id）
              const matchedCurrency = formOptions.currencies.find(
                (curr: any) => curr.netsuite_internal_id === subsidiaryData.base_currency_id
              );

              if (matchedCurrency) {
                // 更新記賬幣別（使用 symbol 或 name）
                const currencyValue = matchedCurrency.symbol || matchedCurrency.name || 'TWD';
                setFormData(prev => ({
                  ...prev,
                  receiptCurrency: currencyValue,
                }));
              }
            }
          } catch (error) {
            console.error('根據公司別更新幣別時發生錯誤:', error);
          }
        }
      } else if (formOptions.taxCodes.length > 0) {
        // 如果沒有選擇 subsidiary，顯示所有稅碼
        setFilteredTaxCodes(formOptions.taxCodes);
      }
    };

    updateTaxCodesAndCurrency();
  }, [formData.subsidiary, formOptions.subsidiaries, formOptions.taxCodes, formOptions.currencies, loadingData]);

  // 當員工改變時，自動更新公司別（僅在非載入狀態時執行，避免載入資料時覆蓋）
  useEffect(() => {
    const updateSubsidiaryFromEmployee = async () => {
      // 如果正在載入資料，不執行自動更新（避免覆蓋載入的公司別）
      if (loadingData) {
        return;
      }

      // 如果沒有選擇員工或表單選項還沒載入完成，不執行
      if (!formData.employee || formOptions.employees.length === 0 || formOptions.subsidiaries.length === 0) {
        return;
      }

      try {
        const supabase = createClient();
        
        // 找到選中的員工
        const selectedEmployee = formOptions.employees.find(
          (emp: any) => emp.id === formData.employee
        );

        if (!selectedEmployee?.netsuite_internal_id) {
          return;
        }

        // 查詢員工資料以取得 subsidiary_id
        const { data: employeeData } = await supabase
          .from('ns_entities_employees')
          .select('id, netsuite_internal_id, subsidiary_id')
          .eq('netsuite_internal_id', selectedEmployee.netsuite_internal_id)
          .eq('is_inactive', false)
          .maybeSingle();

        if (employeeData?.subsidiary_id) {
          // 找到對應的公司別
          const matchedSubsidiary = formOptions.subsidiaries.find(
            (sub: any) => sub.netsuite_internal_id === employeeData.subsidiary_id
          );

          if (matchedSubsidiary) {
            // 更新公司別
            setFormData(prev => ({
              ...prev,
              subsidiary: matchedSubsidiary.id,
            }));

            // 根據 subsidiary 的 country 篩選稅碼
            const country = matchedSubsidiary.country;
            if (country) {
              const filtered = formOptions.taxCodes.filter((tc: any) => tc.country === country);
              setFilteredTaxCodes(filtered);
            } else {
              setFilteredTaxCodes(formOptions.taxCodes);
            }
          }
        }
      } catch (error) {
        console.error('根據員工更新公司別時發生錯誤:', error);
      }
    };

    updateSubsidiaryFromEmployee();
  }, [formData.employee, formOptions.employees, formOptions.subsidiaries, formOptions.taxCodes, loadingData]);

  // 載入報支資料（編輯模式）
  useEffect(() => {
    const loadExpenseReport = async () => {
      if (!expenseReviewId) {
        setIsEditMode(false);
        return;
      }

      setIsEditMode(true);
      setLoadingData(true);

      try {
        const response = await fetch(`/api/expense-reports/${expenseReviewId}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || result.message || '載入報支資料失敗');
        }

        const { header, lines } = result.data;

        // 載入表頭資料
        setFormData(prev => ({
          ...prev,
          expenseDate: header.expense_date || getTodayDate(),
          employee: header.employee_id || '',
          subsidiary: header.subsidiary_id || '',
          description: header.description || '',
        }));
        
        // 載入「使用多幣別」設定
        setUseMultiCurrency(header.use_multi_currency || false);

        // 載入 lines 資料
        if (lines && lines.length > 0) {
          const loadedLines: ExpenseReportLine[] = lines.map((line: any) => {
            // 格式化日期
            const formatDate = (date: string | null) => {
              if (!date) return '';
              const d = new Date(date);
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            };

            // 格式化金額
            const formatAmount = (amount: number | null) => {
              return amount ? amount.toString() : '';
            };

            // 處理 currency：優先使用 currency（符號），如果沒有則從 currency_id 查找
            let currencyValue = line.currency || '';
            if (!currencyValue && line.currency_id) {
              // 如果 currency 為空但 currency_id 有值，從 formOptions 中查找
              const currencyOption = formOptions.currencies.find(
                (curr) => curr.id === line.currency_id
              );
              if (currencyOption) {
                currencyValue = currencyOption.symbol || currencyOption.name || '';
              } else {
                // 如果找不到，使用 currency_id 作為 fallback
                currencyValue = line.currency_id;
              }
            }

            return {
              id: line.id || `line-${Date.now()}-${Math.random()}`,
              refNo: line.line_number || 0,
              date: formatDate(line.date),
              category: line.category_id || '',
              foreignAmount: formatAmount(line.foreign_amount),
              exchangeRate: line.exchange_rate ? line.exchange_rate.toString() : '1.00',
              currency: currencyValue,
              amount: formatAmount(line.amount),
              taxCode: line.tax_code || '',
              taxRate: line.tax_rate ? line.tax_rate.toString() : '',
              taxAmt: formatAmount(line.tax_amt),
              grossAmt: formatAmount(line.gross_amt),
              memo: line.memo || '',
              department: line.department_id || '',
              class: line.class_id || '',
              location: line.location_id || '',
              customer: line.customer_id || '',
              projectTask: line.project_task_id || '',
              billable: line.billable || false,
              ocrDetail: line.ocr_success ? '有OCR' : '無OCR',
              ocrData: {
                invoiceTitle: line.invoice_title || '',
                invoicePeriod: line.invoice_period || '',
                invoiceNumber: line.invoice_number || '',
                invoiceDate: formatDate(line.invoice_date),
                randomCode: line.random_code || '',
                formatCode: line.format_code || '',
                sellerName: line.seller_name || '',
                sellerTaxId: line.seller_tax_id || '',
                sellerAddress: line.seller_address || '',
                buyerName: line.buyer_name || '',
                buyerTaxId: line.buyer_tax_id || '',
                buyerAddress: line.buyer_address || '',
                untaxedAmount: formatAmount(line.untaxed_amount),
                taxAmount: formatAmount(line.tax_amount),
                totalAmount: formatAmount(line.total_amount),
                ocrSuccess: line.ocr_success || false,
                ocrConfidence: line.ocr_confidence ? parseFloat(line.ocr_confidence.toString()) : 0,
                ocrDocumentType: line.ocr_document_type || '',
                ocrErrors: line.ocr_errors || '',
                ocrWarnings: line.ocr_warnings || '',
                ocrErrorCount: line.ocr_error_count || 0,
                ocrWarningCount: line.ocr_warning_count || 0,
                ocrQualityGrade: line.ocr_quality_grade || '',
                ocrFileName: line.ocr_file_name || '',
                ocrFileId: line.ocr_file_id || '',
                ocrWebViewLink: line.ocr_web_view_link || '',
                ocrProcessedAt: line.ocr_processed_at || '',
                // 附件處理：優先使用 attachment_url，如果沒有則使用 base64
                // 注意：attachment_url 需要在前端載入時取得 Signed URL
                attachmentImageData: line.attachment_base64 ? `data:image/jpeg;base64,${line.attachment_base64}` : undefined,
                attachmentFileType: line.document_file_name?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
                // 保存 attachment_url 以便後續使用
                attachmentUrl: line.attachment_url || undefined,
              },
              attachFile: '',
              receipt: '',
              isEditing: false,
            };
          });

          setExpenseLines(loadedLines);
          
          // 設定 nextRefNo
          const maxRefNo = loadedLines.length > 0
            ? Math.max(...loadedLines.map(line => line.refNo || 0))
            : 0;
          setNextRefNo(maxRefNo + 1);
        }
      } catch (error) {
        console.error('載入報支資料錯誤:', error);
        alert(`載入報支資料失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
        // 載入失敗時，清除編輯模式
        setIsEditMode(false);
        router.push('/dashboard/ocr-expense');
      } finally {
        setLoadingData(false);
      }
    };

    loadExpenseReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseReviewId]);

  // 取消 OCR 處理
  const handleCancelOCR = () => {
    // 停止單一附件的輪詢和超時
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // 重置單一附件狀態
    setOcrProcessing(false);
    setOcrJobId(null);
    currentJobIdRef.current = null;
    
    // 停止所有多附件 OCR 的輪詢和超時
    multiOcrPollingIntervalsRef.current.forEach((interval) => {
      clearInterval(interval);
    });
    multiOcrPollingIntervalsRef.current.clear();
    multiOcrTimeoutsRef.current.forEach((timeout) => {
      clearTimeout(timeout);
    });
    multiOcrTimeoutsRef.current.clear();
    
    // 重置多附件任務狀態
    setMultiOcrTasks(new Map());
    
    // 清空已處理的 jobId 記錄
    processedJobIdsRef.current.clear();
    // 清空已建立 expense line 的 fileIndex 記錄
    createdExpenseLineFileIndexesRef.current.clear();
  };

  // 處理 OCR 結果（單一附件，填入 formData）
  // 支援新格式：陣列格式 [ { output: {...}, success: true, ... } ]
  const processOCRResult = (ocrResult: any) => {
    // 如果 ocrResult 是陣列格式（新格式），提取第一個元素
    const result = Array.isArray(ocrResult) && ocrResult.length > 0 ? ocrResult[0] : ocrResult;
    
    // 處理 output 對象中的發票數據
    if (result.output && typeof result.output === 'object') {
      const ocrData = result.output;
      
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
      // 注意：收據金額不再從 OCR 直接填入，而是由 expense line items 的總金額自動加總
    }

    // 處理頂層元數據欄位
    handleInputChange('ocrSuccess', result.success ?? false);
    // 統一 confidence 格式：如果 > 1 表示是百分比（如 85），轉換為小數（0.85）
    const confidence = result.confidence ?? 0;
    const normalizedConfidence = confidence > 1 ? confidence / 100 : confidence;
    handleInputChange('ocrConfidence', normalizedConfidence);
    handleInputChange('ocrDocumentType', result.documentType || '');
    handleInputChange('ocrErrors', result.errors || '');
    handleInputChange('ocrWarnings', result.warnings || '');
    handleInputChange('ocrErrorCount', result.errorCount ?? 0);
    handleInputChange('ocrWarningCount', result.warningCount ?? 0);
    handleInputChange('ocrQualityGrade', result.qualityGrade || '');
    handleInputChange('ocrFileName', result.fileName || '');
    handleInputChange('ocrFileId', result.fileId || '');
    handleInputChange('ocrWebViewLink', result.webViewLink || '');
    handleInputChange('ocrProcessedAt', result.processedAt || '');
  };

  // 將 OCR 結果轉換為 expense line 的 ocrData 格式
  // 支援新格式：陣列格式 [ { output: {...}, success: true, ... } ]
  const convertOCRResultToLineData = (ocrResult: any): ExpenseReportLine['ocrData'] => {
    // 如果 ocrResult 是陣列格式（新格式），提取第一個元素
    const result = Array.isArray(ocrResult) && ocrResult.length > 0 ? ocrResult[0] : ocrResult;
    const ocrData = result.output || {};
    
    return {
      invoiceTitle: ocrData['發票標題'] || '',
      invoicePeriod: ocrData['發票期別'] || '',
      invoiceNumber: ocrData['發票號碼'] || '',
      invoiceDate: ocrData['開立時間'] || '',
      randomCode: ocrData['隨機碼'] || '',
      formatCode: ocrData['格式代號'] || '',
      sellerName: ocrData['賣方名稱'] || '',
      sellerTaxId: ocrData['賣方統編'] || '',
      sellerAddress: ocrData['賣方地址'] || '',
      buyerName: ocrData['買方名稱'] || '',
      buyerTaxId: ocrData['買方統編'] || '',
      buyerAddress: ocrData['買方地址'] || '',
      untaxedAmount: ocrData['未稅銷售額'] || '',
      taxAmount: ocrData['稅額'] || '',
      totalAmount: ocrData['總計金額'] || '',
      ocrSuccess: result.success ?? false,
      // 統一 confidence 格式：如果 > 1 表示是百分比（如 85），轉換為小數（0.85）
      ocrConfidence: (() => {
        const confidence = result.confidence ?? 0;
        return confidence > 1 ? confidence / 100 : confidence;
      })(),
      ocrDocumentType: result.documentType || '',
      ocrErrors: result.errors || '',
      ocrWarnings: result.warnings || '',
      ocrErrorCount: result.errorCount ?? 0,
      ocrWarningCount: result.warningCount ?? 0,
      ocrQualityGrade: result.qualityGrade || '',
      ocrFileName: result.fileName || '',
      ocrFileId: result.fileId || '',
      ocrWebViewLink: result.webViewLink || '',
      ocrProcessedAt: result.processedAt || '',
      expenseType: ocrData['費用類型'] || ocrData['費用類別'] || undefined, // OCR 辨識的費用類型
    };
  };

  // 建立 expense line 並填入 OCR 結果
  const createExpenseLineFromOCR = (ocrResult: any, fileIndex: number) => {
    // 檢查這個 fileIndex 是否已經建立過 expense line
    if (createdExpenseLineFileIndexesRef.current.has(fileIndex)) {
      return;
    }
    
    // 標記為已建立（在建立之前就標記，防止競態條件）
    createdExpenseLineFileIndexesRef.current.add(fileIndex);
    
    // 取得對應的檔案數據（圖片或 PDF）
    const file = attachments[fileIndex];
    let attachmentData: string | undefined = undefined;
    let attachmentFileType: string | undefined = undefined;
    
    // 從 previewImages 和 previewFileTypes 中取得對應的檔案數據
    if (file && previewImages.length > 0) {
      const supportedFiles = attachments.filter(f => 
        f.type.startsWith('image/') || f.type === 'application/pdf'
      );
      const fileIndexInPreview = supportedFiles.indexOf(file);
      if (fileIndexInPreview >= 0 && fileIndexInPreview < previewImages.length) {
        attachmentData = previewImages[fileIndexInPreview];
        attachmentFileType = previewFileTypes[fileIndexInPreview] || file.type;
      }
    }
    
    // 如果 ocrResult 是陣列格式（新格式），提取第一個元素
    const result = Array.isArray(ocrResult) && ocrResult.length > 0 ? ocrResult[0] : ocrResult;
    const ocrData = convertOCRResultToLineData(result);
    const ocrOutput = result.output || {};
    const uniqueId = ocrData.ocrFileId || `fileIndex_${fileIndex}_${Date.now()}_${Math.random()}`;
    
    // 從 OCR 結果取得費用類型，並匹配到 expense category
    const expenseTypeFromOCR = ocrOutput['費用類型'] || ocrOutput['費用類別'] || '';
    // 取得費用描述（新格式中的欄位）
    const expenseDescription = ocrOutput['費用描述'] || '';
    let matchedCategoryId = '';
    
    if (expenseTypeFromOCR && formOptions.expenseCategories.length > 0) {
      // 優先嘗試：將費用類型轉換為數字，用 netsuite_internal_id 匹配
      // N8N 傳回的「費用類型」通常是 NetSuite 的 internal ID（如 "11"）
      const expenseTypeAsNumber = parseInt(String(expenseTypeFromOCR).trim());
      if (!isNaN(expenseTypeAsNumber)) {
        const idMatch = formOptions.expenseCategories.find(
          cat => cat.netsuite_internal_id === expenseTypeAsNumber
        );
        
        if (idMatch) {
          matchedCategoryId = idMatch.id;
          console.log(`[createExpenseLineFromOCR] 透過 netsuite_internal_id (${expenseTypeAsNumber}) 匹配到費用類別: ${idMatch.name}`);
        }
      }
      
      // 如果 ID 匹配失敗，嘗試用名稱匹配（作為 fallback）
      if (!matchedCategoryId) {
        // 將費用類型轉換為小寫以便進行大小寫不敏感匹配
        const expenseTypeLower = String(expenseTypeFromOCR).trim().toLowerCase();
        
        // 嘗試精確匹配名稱（大小寫不敏感）
        const exactMatch = formOptions.expenseCategories.find(
          cat => cat.name.trim().toLowerCase() === expenseTypeLower
        );
        
        if (exactMatch) {
          matchedCategoryId = exactMatch.id;
          console.log(`[createExpenseLineFromOCR] 透過名稱匹配到費用類別: ${exactMatch.name}`);
        } else {
          // 嘗試模糊匹配（包含關係，大小寫不敏感）
          const fuzzyMatch = formOptions.expenseCategories.find(
            cat => {
              const catNameLower = cat.name.trim().toLowerCase();
              return catNameLower.includes(expenseTypeLower) || expenseTypeLower.includes(catNameLower);
            }
          );
          
          if (fuzzyMatch) {
            matchedCategoryId = fuzzyMatch.id;
            console.log(`[createExpenseLineFromOCR] 透過模糊匹配到費用類別: ${fuzzyMatch.name}`);
          } else {
            // 如果找不到匹配，記錄到 console 以便除錯
            console.warn(`[createExpenseLineFromOCR] 無法匹配費用類型 "${expenseTypeFromOCR}" 到任何 expense category`);
            console.log(`[createExpenseLineFromOCR] 可用的 expense categories:`, formOptions.expenseCategories.map(c => ({ id: c.netsuite_internal_id, name: c.name })));
          }
        }
      }
    }
    
    // 將檔案數據和類型添加到 ocrData 中
    const ocrDataWithAttachment = {
      ...ocrData,
      attachmentImageData: attachmentData,
      attachmentFileType: attachmentFileType,
    };
    
    // 檢查是否有稅額，如果有則自動填入「5%營業稅」
    const taxAmount = ocrOutput['稅額'] || '';
    const taxAmountNum = parseFloat(String(taxAmount).trim());
    let matchedTaxCode = '';
    let matchedTaxRate = '';
    
    // 如果有稅額且大於 0，嘗試匹配「5%營業稅」
    if (taxAmountNum > 0 && filteredTaxCodes.length > 0) {
      // 優先匹配「5%營業稅」，然後是「5%」，最後是「營業稅」
      let taxCodeMatch = filteredTaxCodes.find(tc => {
        const name = String(tc.name || '').trim();
        return name.includes('5%營業稅');
      });
      
      // 如果沒找到「5%營業稅」，嘗試匹配「5%」
      if (!taxCodeMatch) {
        taxCodeMatch = filteredTaxCodes.find(tc => {
          const name = String(tc.name || '').trim();
          return name.includes('5%');
        });
      }
      
      // 如果還是沒找到，嘗試匹配「營業稅」
      if (!taxCodeMatch) {
        taxCodeMatch = filteredTaxCodes.find(tc => {
          const name = String(tc.name || '').trim();
          return name.includes('營業稅');
        });
      }
      
      if (taxCodeMatch) {
        matchedTaxCode = taxCodeMatch.name || '';
        // 如果稅碼有 rate，自動填入稅率
        if (taxCodeMatch.rate !== null && taxCodeMatch.rate !== undefined) {
          matchedTaxRate = (taxCodeMatch.rate * 100).toFixed(2);
        }
        console.log(`[createExpenseLineFromOCR] 自動填入稅碼: ${matchedTaxCode}`);
      }
    }
    
    // 優化：從 OCR 結果取得發票日期（開立時間），優先使用 OCR 日期而非打單日期
    let expenseLineDate = formData.expenseDate; // 預設使用打單日期
    const ocrInvoiceDate = ocrOutput['開立時間'] || ocrData.invoiceDate || '';
    if (ocrInvoiceDate) {
      try {
        // 嘗試解析 OCR 日期（可能是 "2019-11-07" 或 "2019/11/07" 等格式）
        let parsedDate: Date | null = null;
        
        // 處理常見的日期格式
        if (ocrInvoiceDate.includes('-')) {
          // ISO 格式：2019-11-07
          parsedDate = new Date(ocrInvoiceDate);
        } else if (ocrInvoiceDate.includes('/')) {
          // 斜線格式：2019/11/07
          const parts = ocrInvoiceDate.split('/');
          if (parts.length === 3) {
            parsedDate = new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`);
          }
        } else {
          // 嘗試直接解析
          parsedDate = new Date(ocrInvoiceDate);
        }
        
        // 驗證日期是否有效
        if (parsedDate && !isNaN(parsedDate.getTime())) {
          // 轉換為 YYYY-MM-DD 格式
          const year = parsedDate.getFullYear();
          const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
          const day = String(parsedDate.getDate()).padStart(2, '0');
          expenseLineDate = `${year}-${month}-${day}`;
          console.log(`[createExpenseLineFromOCR] 使用 OCR 發票日期: ${expenseLineDate} (原始值: ${ocrInvoiceDate})`);
        } else {
          console.warn(`[createExpenseLineFromOCR] OCR 發票日期格式無法解析: ${ocrInvoiceDate}，使用打單日期`);
        }
      } catch (error) {
        console.warn(`[createExpenseLineFromOCR] 解析 OCR 發票日期時發生錯誤: ${error}，使用打單日期`);
      }
    }
    
    // 使用函數式更新確保 refNo 的正確順序
    setExpenseLines(prev => {
      // 找到第一個 isProcessing 為 true 的行並替換它
      const processingIndex = prev.findIndex(line => line.isProcessing);
      
      if (processingIndex !== -1) {
        // 取得正在處理行的參考編號（保持原來的編號）
        const processingRefNo = prev[processingIndex].refNo;
        
        const newLine: ExpenseReportLine = {
          id: `line-${uniqueId}`,
          refNo: processingRefNo, // 使用正在處理行的參考編號，保持連續性
          date: expenseLineDate, // 優先使用 OCR 發票日期，如果沒有則使用打單日期
          category: matchedCategoryId, // 自動填入 OCR 辨識的費用類別
          foreignAmount: '',
          currency: formData.receiptCurrency || 'TWD',
          exchangeRate: '1.00',
          amount: ocrOutput['總計金額'] || formData.receiptAmount || '',
          taxCode: matchedTaxCode, // 如果有稅額，自動填入「5%營業稅」
          taxRate: matchedTaxRate, // 如果有稅額，自動填入稅率
          taxAmt: taxAmount, // OCR 辨識的稅額
          grossAmt: ocrOutput['總計金額'] || formData.receiptAmount || '',
          memo: expenseDescription || formData.description || '', // 優先使用 OCR 辨識的費用描述
          department: '', // 部門在表身每一行中選擇
          class: '', // 類別在表身每一行中選擇
          location: '', // 地點在表身每一行中選擇
          ocrDetail: ocrOutput['發票號碼'] || ocrData.ocrFileName || '',
          ocrData: ocrDataWithAttachment,
          customer: '',
          projectTask: '',
          billable: false,
          attachFile: '',
          receipt: '',
          isEditing: true,
          isProcessing: false, // 清除處理中標記
        };
        
        // 替換正在處理的行
        const updated = [...prev];
        updated[processingIndex] = newLine;
        return updated;
      }
      
      // 如果沒有找到正在處理的行，檢查是否已經有相同的 expense line
      const existingLine = prev.find(line => 
        line.id === `line-${uniqueId}` || 
        (ocrData.ocrFileId && line.ocrData?.ocrFileId === ocrData.ocrFileId)
      );
      
      if (existingLine) {
        // 已經存在，不新增
        return prev;
      }
      
      // 如果沒有找到正在處理的行，使用 nextRefNo 創建新行
      // 這種情況不應該發生，但為了安全起見還是處理
      setNextRefNo(prevRefNo => {
        const newLine: ExpenseReportLine = {
          id: `line-${uniqueId}`,
          refNo: prevRefNo,
          date: formData.expenseDate,
          category: matchedCategoryId, // 自動填入 OCR 辨識的費用類別
          foreignAmount: '',
          currency: formData.receiptCurrency || 'TWD',
          exchangeRate: '1.00',
          amount: ocrOutput['總計金額'] || formData.receiptAmount || '',
          taxCode: matchedTaxCode, // 如果有稅額，自動填入「5%營業稅」
          taxRate: matchedTaxRate, // 如果有稅額，自動填入稅率
          taxAmt: taxAmount, // OCR 辨識的稅額
          grossAmt: ocrOutput['總計金額'] || formData.receiptAmount || '',
          memo: formData.description || '',
          department: '', // 部門在表身每一行中選擇
          class: '', // 類別在表身每一行中選擇
          location: '', // 地點在表身每一行中選擇
          ocrDetail: ocrOutput['發票號碼'] || ocrData.ocrFileName || '',
          ocrData: ocrDataWithAttachment,
          customer: '',
          projectTask: '',
          billable: false,
          attachFile: '',
          receipt: '',
          isEditing: true,
          isProcessing: false,
        };
        
        setExpenseLines(prevLines => [...prevLines, newLine]);
        return prevRefNo + 1;
      });
      
      return prev;
    });
    
    // 注意：不再在這裡移除附件，改為在 handleMultiFileOCR 完成後統一移除
    // 這樣可以避免 fileIndex 改變導致的問題
  };

  // 輪詢檢查 OCR 結果（單一附件）
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

  // 注意：pollMultiOCRResult 函數已移除，現在統一使用 processSingleAttachmentOCR 中的輪詢邏輯

  // 處理單一附件的 OCR（填入 formData）
  const handleSingleFileOCR = async (file: File, imageDataUrl: string) => {
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_OCR;
    if (!webhookUrl) {
      alert('Webhook URL 未設定，請檢查環境變數設定');
      return;
    }

    const jobId = `ocr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setOcrJobId(jobId);
    currentJobIdRef.current = jobId;
    setOcrProcessing(true);

    try {
      let blob: Blob;
      if (imageDataUrl.startsWith('data:')) {
        const response = await fetch(imageDataUrl);
        blob = await response.blob();
      } else {
        const response = await fetch(imageDataUrl);
        blob = await response.blob();
      }

      const callbackUrl = `${window.location.origin}/api/ocr-callback`;
      
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
        if (response.ok) {
          try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const result = await response.json();
              if (Array.isArray(result) && result.length > 0 && result[0].output) {
                console.log('收到 N8N 同步響應，直接處理結果');
                
                if (pollingIntervalRef.current) {
                  clearInterval(pollingIntervalRef.current);
                  pollingIntervalRef.current = null;
                }
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                  timeoutRef.current = null;
                }
                
                try {
                  await fetch(callbackUrl, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'X-Job-Id': jobId,
                    },
                    body: JSON.stringify(result),
                  });
                  processOCRResult(result[0]);
                  setOcrProcessing(false);
                  setOcrJobId(null);
                  currentJobIdRef.current = null;
                } catch (e) {
                  processOCRResult(result[0]);
                  setOcrProcessing(false);
                  setOcrJobId(null);
                  currentJobIdRef.current = null;
                }
              }
            }
          } catch (e) {
            console.log('N8N 響應不是 JSON 格式，繼續輪詢');
          }
        }
      })
      .catch((error) => {
        console.error('發送 OCR 請求錯誤:', error);
      });

      pollingIntervalRef.current = setInterval(() => {
        pollOCRResult(jobId);
      }, 2000);

      timeoutRef.current = setTimeout(() => {
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

  // 處理單一附件的 OCR（等待完成後返回結果）
  const processSingleAttachmentOCR = async (
    file: File,
    fileIndex: number,
    attachmentNumber: number
  ): Promise<{ success: boolean; result?: any; error?: string }> => {
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_OCR;
    if (!webhookUrl) {
      return { success: false, error: 'Webhook URL 未設定' };
    }

    // 將檔案轉換為 base64
    const imageDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });

    // 生成唯一的 job ID（使用更精確的時間戳和隨機數）
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const jobId = `ocr_multi_${timestamp}_${fileIndex}_${random}`;
    
    console.log(`[processSingleAttachmentOCR] 附件 ${attachmentNumber} - fileIndex: ${fileIndex}, jobId: ${jobId}`);
    
    // 更新任務狀態為處理中
    setMultiOcrTasks(prev => {
      const newMap = new Map(prev);
      newMap.set(fileIndex, {
        jobId,
        status: 'processing',
        fileIndex,
        fileName: file.name,
      });
      return newMap;
    });

    try {
      // 將 base64 圖片轉換為 Blob
      let blob: Blob;
      if (imageDataUrl.startsWith('data:')) {
        const response = await fetch(imageDataUrl);
        blob = await response.blob();
      } else {
        const response = await fetch(imageDataUrl);
        blob = await response.blob();
      }

      const callbackUrl = `${window.location.origin}/api/ocr-callback`;
      
      // 建立 Promise 來等待 OCR 結果
      return new Promise((resolve) => {
        let isResolved = false;
        let pollingInterval: NodeJS.Timeout | null = null;
        let timeout: NodeJS.Timeout | null = null;
        let shouldStartPolling = true; // 標記是否應該啟動輪詢

        // 清理函數
        const cleanup = () => {
          if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
          }
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
        };

        // 處理 OCR 結果
        const handleOCRResult = (ocrResult: any) => {
          console.log(`[handleOCRResult] 被呼叫 - 附件 ${attachmentNumber}, fileIndex: ${fileIndex}, isResolved: ${isResolved}`);
          
          // 第一層防護：檢查是否已經解析過
          if (isResolved) {
            console.warn(`[handleOCRResult] 附件 ${attachmentNumber} OCR 結果已處理過，跳過重複處理！`);
            return;
          }
          
          // 第二層防護：檢查 fileIndex 是否已建立 expense line
          if (createdExpenseLineFileIndexesRef.current.has(fileIndex)) {
            console.warn(`[handleOCRResult] 附件 ${attachmentNumber} (fileIndex: ${fileIndex}) 已經建立過 expense line，跳過重複處理！`);
            isResolved = true;
            shouldStartPolling = false;
            cleanup();
            resolve({ success: true, result: ocrResult });
            return;
          }
          
          // 第三層防護：檢查 jobId 是否已處理過（雙重檢查）
          if (processedJobIdsRef.current.has(jobId)) {
            console.warn(`[handleOCRResult] 附件 ${attachmentNumber} (jobId: ${jobId}) 已經處理過，跳過重複處理！`);
            isResolved = true;
            shouldStartPolling = false;
            cleanup();
            resolve({ success: true, result: ocrResult });
            return;
          }
          
          // 立即設置標記，防止競態條件
          isResolved = true;
          shouldStartPolling = false; // 停止輪詢
          processedJobIdsRef.current.add(jobId); // 標記 jobId 為已處理
          cleanup();
          
          console.log(`[handleOCRResult] 附件 ${attachmentNumber} (fileIndex: ${fileIndex}) 開始建立 expense line`);
          
          // 建立 expense line（只建立一次）
          createExpenseLineFromOCR(ocrResult, fileIndex);
          
          // 更新任務狀態為完成，並檢查是否所有任務都完成
          setMultiOcrTasks(prev => {
            const newMap = new Map(prev);
            const task = newMap.get(fileIndex);
            if (task) {
              newMap.set(fileIndex, {
                ...task,
                status: 'completed',
              });
            }
            
            // 檢查是否所有任務都已完成或失敗
            const allTasks = Array.from(newMap.values());
            const allTasksDone = allTasks.length > 0 && allTasks.every(
              t => t.status === 'completed' || t.status === 'error'
            );
            
            // 如果所有任務完成，延遲清空狀態（讓 UI 有時間顯示完成狀態）
            if (allTasksDone) {
              console.log('所有任務已完成，準備清空任務狀態');
              setTimeout(() => {
                setMultiOcrTasks(new Map());
              }, 1000); // 1 秒後清空，讓用戶看到完成狀態
            }
            
            return newMap;
          });
          
          console.log(`附件 ${attachmentNumber} expense line 建立完成`);
          resolve({ success: true, result: ocrResult });
        };

        // 處理錯誤
        const handleError = (error: string) => {
          if (isResolved) return;
          isResolved = true;
          shouldStartPolling = false; // 停止輪詢
          cleanup();
          
          // 更新任務狀態為錯誤
          setMultiOcrTasks(prev => {
            const newMap = new Map(prev);
            const task = newMap.get(fileIndex);
            if (task) {
              newMap.set(fileIndex, {
                ...task,
                status: 'error',
              });
            }
            return newMap;
          });
          
          resolve({ success: false, error });
        };

        // 發送請求到 N8N
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
          // 如果 N8N 同步返回結果，直接處理
          if (response.ok) {
            try {
              const contentType = response.headers.get('content-type');
              if (contentType && contentType.includes('application/json')) {
                const result = await response.json();
                if (Array.isArray(result) && result.length > 0 && result[0].output) {
                  console.log(`[processSingleAttachmentOCR] 附件 ${attachmentNumber} (fileIndex: ${fileIndex}, jobId: ${jobId}) 收到 N8N 同步響應`);
                  
                  // 立即設置防護標記，防止重複處理
                  isResolved = true;
                  shouldStartPolling = false;
                  processedJobIdsRef.current.add(jobId);
                  cleanup();
                  
                  // 檢查 fileIndex 是否已經建立過 expense line
                  if (createdExpenseLineFileIndexesRef.current.has(fileIndex)) {
                    resolve({ success: true, result: result[0] });
                    return;
                  }
                  
                  // 立即建立 expense line（不等待 API 保存）
                  createExpenseLineFromOCR(result[0], fileIndex);
                  
                  // 更新任務狀態為完成
                  setMultiOcrTasks(prev => {
                    const newMap = new Map(prev);
                    const task = newMap.get(fileIndex);
                    if (task) {
                      newMap.set(fileIndex, { ...task, status: 'completed' });
                    }
                    return newMap;
                  });
                  
                  // 異步保存到 API（不阻塞，背景處理）
                  fetch(callbackUrl, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'X-Job-Id': jobId,
                    },
                    body: JSON.stringify(result),
                  }).catch(() => {}); // 靜默處理錯誤，不影響主流程
                  
                  resolve({ success: true, result: result[0] });
                  return; // 直接返回，不啟動輪詢
                }
              }
            } catch (e) {
              console.log(`附件 ${attachmentNumber} N8N 響應不是 JSON 格式，繼續輪詢`);
            }
          }
          
          // 如果沒有同步返回結果，且應該啟動輪詢，才開始輪詢
          // 重要：再次檢查 isResolved 和 processedJobIdsRef，防止在同步響應處理過程中已經設置了
          if (shouldStartPolling && !isResolved && !processedJobIdsRef.current.has(jobId)) {
            console.log(`附件 ${attachmentNumber} 開始輪詢 OCR 結果`);
            
            // 輪詢檢查結果（每 2 秒檢查一次）
            pollingInterval = setInterval(async () => {
              // 如果已經處理過，停止輪詢
              if (isResolved || !shouldStartPolling) {
                cleanup();
                return;
              }
              try {
                // 再次檢查是否已經處理過（防止在輪詢過程中同步響應已經處理）
                if (processedJobIdsRef.current.has(jobId) || isResolved) {
                  cleanup();
                  return;
                }
                
                const pollResponse = await fetch(`/api/ocr-callback?jobId=${jobId}`);
                
                if (pollResponse.status === 404) {
                  // 結果尚未準備好，繼續輪詢
                  return;
                }

                if (!pollResponse.ok) {
                  throw new Error('查詢 OCR 結果失敗');
                }

                const pollResult = await pollResponse.json();

                if (pollResult.status === 'completed' && pollResult.data) {
                  // 再次檢查是否已經處理過（防止競態條件）
                  if (processedJobIdsRef.current.has(jobId) || isResolved) {
                    cleanup();
                    return;
                  }
                  
                  // 立即標記為已處理
                  processedJobIdsRef.current.add(jobId);
                  
                  // 處理結果
                  let ocrResult: any = null;
                  if (Array.isArray(pollResult.data) && pollResult.data.length > 0) {
                    ocrResult = pollResult.data[0];
                  } else if (pollResult.data && pollResult.data.output) {
                    ocrResult = pollResult.data;
                  } else if (typeof pollResult.data === 'object' && pollResult.data !== null) {
                    ocrResult = pollResult.data;
                  }

                  if (ocrResult) {
                    handleOCRResult(ocrResult);
                  }
                } else if (pollResult.status === 'error') {
                  // 標記為已處理（即使是錯誤）
                  processedJobIdsRef.current.add(jobId);
                  handleError(pollResult.error || '未知錯誤');
                }
              } catch (error) {
                console.error(`輪詢附件 ${attachmentNumber} OCR 結果錯誤:`, error);
                // 繼續輪詢，不中斷
              }
            }, 2000);

            // 設置超時（5 分鐘後停止輪詢）
            timeout = setTimeout(() => {
              if (!isResolved) {
                handleError('OCR 處理超時');
              }
            }, 5 * 60 * 1000);
          }
        })
        .catch((error) => {
          console.error(`附件 ${attachmentNumber} 發送 OCR 請求錯誤:`, error);
          handleError(error instanceof Error ? error.message : '發送 OCR 請求失敗');
        });
      });
    } catch (error) {
      console.error(`附件 ${attachmentNumber} OCR 處理錯誤:`, error);
      setMultiOcrTasks(prev => {
        const newMap = new Map(prev);
        const task = newMap.get(fileIndex);
        if (task) {
          newMap.set(fileIndex, {
            ...task,
            status: 'error',
          });
        }
        return newMap;
      });
      return { success: false, error: error instanceof Error ? error.message : '未知錯誤' };
    }
  };

  // 處理多個附件的 OCR（串行處理，一次處理一個）
  const handleMultiFileOCR = async () => {
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_OCR;
    if (!webhookUrl) {
      alert('Webhook URL 未設定，請檢查環境變數設定');
      return;
    }

    // 過濾出支援的檔案（圖片和 PDF）
    const supportedFiles = attachments.filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );
    if (supportedFiles.length === 0) {
      alert('請先上傳收據圖片或 PDF');
      return;
    }

    // 清空已處理的 jobId 記錄（為新的批次做準備）
    processedJobIdsRef.current.clear();
    // 清空已建立 expense line 的 fileIndex 記錄（為新的批次做準備）
    createdExpenseLineFileIndexesRef.current.clear();

    // 初始化所有任務狀態
    const newTasks = new Map<number, {
      jobId: string;
      status: 'processing' | 'completed' | 'error';
      fileIndex: number;
      fileName: string;
    }>();
    
    // 先初始化所有任務為 processing 狀態
    supportedFiles.forEach((file, i) => {
      const fileIndex = attachments.indexOf(file);
      newTasks.set(fileIndex, {
        jobId: '',
        status: 'processing',
        fileIndex,
        fileName: file.name,
      });
    });
    setMultiOcrTasks(newTasks);
    
    // 計算當前 expense lines 的最大參考編號，基於現有資料來決定新的參考編號
    setExpenseLines(prevLines => {
      // 找出現有 expense lines 的最大參考編號
      const maxRefNo = prevLines.length > 0 
        ? Math.max(...prevLines.map(line => line.refNo || 0))
        : 0;
      
      // 計算新的起始參考編號（從最大編號 + 1 開始）
      const startRefNo = maxRefNo + 1;
      
      // 創建「正在辨識中」的 expense lines（模糊效果）
      const processingLines: ExpenseReportLine[] = supportedFiles.map((file, i) => {
        const fileIndex = attachments.indexOf(file);
        return {
          id: `processing-${fileIndex}-${Date.now()}-${i}`,
          refNo: startRefNo + i, // 使用基於現有資料計算的起始編號
        date: formData.expenseDate,
        category: '',
        foreignAmount: '',
        currency: formData.receiptCurrency || 'TWD',
        exchangeRate: '1.00',
        amount: '',
        taxCode: '',
        taxRate: '',
        taxAmt: '',
        grossAmt: '',
        memo: '',
        department: '',
        class: '',
        location: '',
        ocrDetail: '',
        ocrData: {
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
        },
        customer: '',
        projectTask: '',
        billable: false,
        attachFile: '',
        receipt: '',
        isEditing: false,
        isProcessing: true, // 標記為正在處理中
      };
      });
      
      // 更新 nextRefNo 為下一個可用的參考編號
      setNextRefNo(startRefNo + supportedFiles.length);
      
      // 添加「正在辨識中」的行
      return [...prevLines, ...processingLines];
    });

    // 追蹤已處理的檔案（使用檔案名稱作為唯一標識，因為 fileIndex 會改變）
    const processedFiles = new Set<string>();
    
    // 串行處理每個附件：一次處理一個，完成後再處理下一個
    for (let i = 0; i < supportedFiles.length; i++) {
      const file = supportedFiles[i];
      // 使用檔案名稱作為標識，因為 fileIndex 會隨著附件被移除而改變
      const fileKey = `${file.name}_${file.size}_${file.lastModified}`;
      
      // 找到當前的 fileIndex（因為前面的檔案可能已經被移除）
      const currentFileIndex = attachments.findIndex(f => 
        f.name === file.name && f.size === file.size && f.lastModified === file.lastModified
      );
      
      if (currentFileIndex === -1) {
        // 檔案已經被移除，跳過
        continue;
      }
      
      // 等待當前附件 OCR 完成
      const result = await processSingleAttachmentOCR(file, currentFileIndex, i + 1);
      
      if (result.success) {
        processedFiles.add(fileKey);
      } else {
        alert(`附件 ${i + 1} OCR 處理失敗: ${result.error || '未知錯誤'}`);
      }
    }

    // 所有附件處理完成後，統一清空所有已處理的附件
    setAttachments(prev => {
      const updated = prev.filter(file => {
        const fileKey = `${file.name}_${file.size}_${file.lastModified}`;
        return !processedFiles.has(fileKey);
      });
      
      // 如果所有附件都被處理了，清空預覽
      if (updated.length === 0) {
        setPreviewImage(null);
        setPreviewImages([]);
        setPreviewImageIndex(0);
      } else {
        // 重新載入預覽圖片
        loadPreviewImages(updated);
      }
      
      return updated;
    });
    
    // 最後檢查：如果還有任務狀態，再次檢查並清空
    setMultiOcrTasks(prev => {
      const allTasks = Array.from(prev.values());
      const allTasksDone = allTasks.length > 0 && allTasks.every(
        task => task.status === 'completed' || task.status === 'error'
      );
      
      if (allTasksDone) {
        // 立即清空任務狀態
        return new Map();
      } else {
        return prev;
      }
    });
  };

  const handleAIOCR = async () => {
    // 統一使用多附件處理邏輯，這樣單一附件和多附件都會建立 expense line
    const supportedFiles = attachments.filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );
    
    if (supportedFiles.length === 0) {
      alert('請先上傳收據圖片或 PDF');
      return;
    }
    
    // 無論單一附件還是多附件，都使用 handleMultiFileOCR 來處理
    // 這樣每個附件都會建立一個 expense line
    await handleMultiFileOCR();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      // 支援多個附件：將新檔案添加到現有附件列表中
      const imageFiles = newFiles.filter(file => file.type.startsWith('image/') || file.type === 'application/pdf');
      if (imageFiles.length > 0) {
        // 將新檔案添加到現有附件列表
        setAttachments(prev => {
          const updated = [...prev, ...imageFiles];
          loadPreviewImages(updated);
          return updated;
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // 提交報告（將狀態改為 pending）
  const handleSubmitReport = async () => {
    // 先儲存為草稿，然後提交
    await handleSubmit('submit');
  };

  // 儲存為草稿或提交報告
  const handleSubmit = async (action: 'save' | 'submit' = 'save') => {
    // 驗證表頭必填欄位
    if (!formData.expenseDate || !formData.subsidiary || !formData.employee) {
      alert('請填寫所有必填欄位（報支日期、員工、公司別）');
      return;
    }

    // 驗證是否有 expense lines
    if (!expenseLines || expenseLines.length === 0) {
      alert('請至少新增一筆報支明細');
      return;
    }

    // 驗證每個 line 的必填欄位
    for (let i = 0; i < expenseLines.length; i++) {
      const line = expenseLines[i];
      if (!line.date || !line.category || !line.currency || !line.amount || !line.grossAmt) {
        alert(`第 ${i + 1} 筆明細缺少必填欄位（日期、類別、幣別、金額、總金額）`);
        return;
      }
      if (parseFloat(line.amount) <= 0 || parseFloat(line.grossAmt) <= 0) {
        alert(`第 ${i + 1} 筆明細的金額或總金額必須大於 0`);
        return;
      }
    }

    setLoading(true);

    try {
      const supabase = (await import('@/utils/supabase/client')).createClient();
      
      // 取得當前使用者 ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('無法取得使用者資訊，請重新登入');
      }

      // 處理每個 line 的附件上傳（優化：並行上傳，但有超時限制）
      const processedLines = await Promise.all(
        expenseLines.map(async (line, index) => {
          let attachmentUrl: string | null = null;
          let attachmentBase64: string | null = null;
          let documentFileName: string | null = null;
          let documentFilePath: string | null = null;

          // 處理附件：優先使用現有的 attachment_url（編輯模式），否則處理新的附件
          if (line.ocrData?.attachmentUrl) {
            // 編輯模式：如果已經有 attachment_url，直接使用
            attachmentUrl = line.ocrData.attachmentUrl;
            documentFileName = line.ocrData.ocrFileName || `line_${index + 1}_${Date.now()}`;
          } else if (line.ocrData?.attachmentImageData) {
            // 新建模式或新增的附件：處理上傳
            const imageData = line.ocrData.attachmentImageData;
            
            // 如果有 ocrFileName，使用它作為檔案名稱
            const fileName = line.ocrData.ocrFileName || `line_${index + 1}_${Date.now()}`;
            documentFileName = fileName;

            // 檢查 Base64 大小（如果超過 500KB，直接使用 Base64，不上傳）
            const base64Size = imageData.length * 0.75; // Base64 大約是原始大小的 1.33 倍
            const maxBase64Size = 500 * 1024; // 500KB

            // 嘗試從 attachments 陣列中找到對應的檔案
            const fileIndex = attachments.findIndex((file, idx) => {
              // 嘗試匹配檔案名稱或索引
              return file.name === fileName || 
                     (line.ocrData.ocrFileId && file.name.includes(line.ocrData.ocrFileId));
            });

            // 優化：優先嘗試上傳，只有在檔案存在且大小合理時才上傳
            if (fileIndex >= 0 && attachments[fileIndex]) {
              const file = attachments[fileIndex];
              
              // 檢查檔案大小（限制為 2MB，避免上傳過大檔案）
              const maxFileSize = 2 * 1024 * 1024; // 2MB
              if (file.size > maxFileSize) {
                console.warn(`Line ${index + 1} 檔案太大 (${(file.size / 1024 / 1024).toFixed(2)}MB)，跳過上傳`);
                // 檔案太大，不傳送 Base64（避免請求過大）
                documentFileName = fileName;
              } else {
                // 檔案大小合理，嘗試上傳
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const fileExt = file.name.split('.').pop() || (line.ocrData.attachmentFileType?.includes('pdf') ? 'pdf' : 'jpg');
                const storageFileName = `${user.id}/${timestamp}_${Date.now()}_${index + 1}.${fileExt}`;
                documentFilePath = storageFileName;

                try {
                  // 優化：減少超時時間到 5 秒，提升響應速度
                  // 上傳到 Supabase Storage（設定 5 秒超時）
                  const uploadPromise = supabase.storage
                    .from('expense-receipts')
                    .upload(storageFileName, file, {
                      cacheControl: '3600',
                      upsert: false,
                    });

                  const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('上傳超時')), 5000)
                  );

                  const { data: uploadData, error: uploadError } = await Promise.race([
                    uploadPromise,
                    timeoutPromise,
                  ]) as any;

                  if (uploadError) {
                    console.warn(`Line ${index + 1} Storage 上傳失敗，跳過附件保存:`, uploadError);
                    // 優化：上傳失敗時，不傳送 Base64（避免請求過大）
                    // 只保存檔案名稱，讓用戶稍後可以重新上傳
                    documentFileName = fileName;
                    // 不設置 attachmentBase64，減少請求大小
                  } else {
                    // 取得公開 URL
                    const { data: urlData } = supabase.storage
                      .from('expense-receipts')
                      .getPublicUrl(storageFileName);
                    
                    attachmentUrl = urlData.publicUrl;
                  }
                } catch (storageError: any) {
                  console.warn(`Line ${index + 1} Storage 上傳錯誤，跳過附件保存:`, storageError);
                  // 優化：上傳錯誤時，不傳送 Base64（避免請求過大）
                  // 只保存檔案名稱
                  documentFileName = fileName;
                  // 不設置 attachmentBase64，減少請求大小
                }
              }
            } else {
              // 優化：如果找不到對應的檔案，不傳送 Base64（避免請求過大）
              // 只保存檔案名稱
              documentFileName = fileName;
              // 不設置 attachmentBase64，減少請求大小
            }
          }

          // 將幣別符號轉換成 UUID（如果 line.currency 是符號）
          let currencyId = line.currency;
          if (line.currency && !line.currency.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            // 如果不是 UUID 格式，則視為符號，需要轉換
            const currencyOption = formOptions.currencies.find(
              (curr) => curr.symbol === line.currency || curr.name === line.currency
            );
            if (currencyOption) {
              currencyId = currencyOption.id;
            } else {
              // 如果找不到對應的幣別，使用預設的 TWD
              const defaultCurrency = formOptions.currencies.find((curr) => curr.symbol === 'TWD');
              if (defaultCurrency) {
                currencyId = defaultCurrency.id;
              } else {
                console.warn(`找不到幣別 ${line.currency}，使用第一個可用幣別`);
                currencyId = formOptions.currencies[0]?.id || '';
              }
            }
          }

          // 組裝 line 資料
          return {
            refNo: line.refNo || index + 1,
            date: line.date,
            category: line.category,
            currency: currencyId, // 使用轉換後的 UUID
            foreignAmount: line.foreignAmount || '',
            exchangeRate: line.exchangeRate || '1.00',
            amount: line.amount,
            taxCode: line.taxCode || '',
            taxRate: line.taxRate || '',
            taxAmt: line.taxAmt || '',
            grossAmt: line.grossAmt,
            memo: line.memo || '',
            department: line.department || '',
            class: line.class || '',
            location: line.location || '',
            customer: line.customer || '',
            projectTask: line.projectTask || '',
            billable: line.billable || false,
            ocrData: line.ocrData || {
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
            },
            attachment_url: attachmentUrl,
            attachment_base64: attachmentBase64,
            document_file_name: documentFileName,
            document_file_path: documentFilePath,
          };
        })
      );

      // 組裝請求資料
      const requestData = {
        expenseReviewId: isEditMode ? expenseReviewId : undefined, // 編輯模式時帶上 ID
        header: {
          expenseDate: formData.expenseDate,
          employee: formData.employee,
          subsidiary: formData.subsidiary,
          description: formData.description || '',
          useMultiCurrency: useMultiCurrency, // 使用多幣別
        },
        lines: processedLines,
        reviewStatus: action === 'submit' ? 'pending' : 'draft', // 提交時為 pending，儲存時為 draft
      };

      // 除錯：檢查請求資料格式
      console.log('發送請求資料:', {
        header: requestData.header,
        linesCount: requestData.lines.length,
        firstLine: requestData.lines[0] ? {
          refNo: requestData.lines[0].refNo,
          date: requestData.lines[0].date,
          category: requestData.lines[0].category,
          currency: requestData.lines[0].currency,
          amount: requestData.lines[0].amount,
          grossAmt: requestData.lines[0].grossAmt,
          hasOcrData: !!requestData.lines[0].ocrData,
        } : null,
      });

      // 發送請求到 API（編輯模式使用 PUT，新建模式使用 POST）
      const apiUrl = isEditMode && expenseReviewId
        ? `/api/expense-reports/${expenseReviewId}`
        : '/api/create-expense-report';
      const method = isEditMode && expenseReviewId ? 'PUT' : 'POST';

      const response = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        // 顯示更詳細的錯誤訊息
        const errorMessage = result.message || result.error || '提交失敗';
        const errorDetails = result.details ? `\n\n詳細資訊: ${result.details}` : '';
        console.error('API 錯誤回應:', result);
        throw new Error(`${errorMessage}${errorDetails}`);
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
        setExpenseLines([]);
        setAttachments([]);
        setPreviewImage(null);
        setNextRefNo(1);
        
        // 顯示成功訊息
        if (action === 'submit') {
          alert(`已提交費用報告，請到「我的報支」頁面檢視狀態。`);
        } else {
          alert(`已儲存費用報告，請到「我的報支」頁面檢視。若您要提交費用報告，也請到該確認頁面提交。`);
        }
        
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
          <h1 className="text-3xl font-bold">
            {loadingData ? '載入中...' : (isEditMode ? '編輯報支項目' : '建立報支項目')}
          </h1>
        </div>
        <p className="text-muted-foreground">
          {isEditMode 
            ? '編輯報支項目資訊，修改後點擊「儲存並關閉」以更新資料'
            : '填寫報支項目資訊，可選擇使用 OCR 技術自動識別收據（選填）'}
        </p>
      </div>

      {/* 載入中狀態 */}
      {loadingData && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span>載入報支資料中...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Form Card */}
      {!loadingData && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>報支項目資訊</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Form Fields */}
            <div className="space-y-1">
              {/* Expense Date */}
              <div className="space-y-1">
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

              {/* Employee */}
              <div className="space-y-1">
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
              <div className="space-y-1">
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

              {/* Receipt Amount */}
              <div className="space-y-1">
                <Label htmlFor="receiptAmount" className="text-sm font-semibold">
                  費用報告總金額 <span className="text-red-500">*</span>
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
                    type="text"
                    value={formatAmountDisplay(formData.receiptAmount, formData.receiptCurrency || 'TWD')}
                    placeholder="0"
                    className="flex-1 bg-gray-100 dark:bg-gray-800 cursor-not-allowed text-right font-bold"
                    required
                    readOnly={true}
                    title="費用報告總金額會自動加總所有行的總金額"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label htmlFor="description" className="text-sm font-semibold">
                  描述
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={2}
                  placeholder="輸入報支項目描述..."
                  className="min-h-[40px]"
                />
              </div>
            </div>

            {/* Right Column - Preview */}
            <div className="space-y-4 flex flex-col">
              {/* Attachments - 已移至檔案預覽區域左側 */}
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* OCR 識別結果已移至表身的 OCR明細欄位中，每個 expense line 都有自己的 OCR 資料 */}

      {/* File Upload and Preview - Side by Side Layout */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* 標題行 */}
            <div className="flex items-center gap-4">
              <div className="w-1/3">
                <Label className="text-sm font-semibold">附件（選填）</Label>
              </div>
              <div className="w-2/3">
                <Label className="text-sm font-semibold">檔案預覽</Label>
              </div>
            </div>
            
            {/* 內容區域 */}
            <div className="flex gap-4">
              {/* 左側：上傳區域 (1/3 寬度) */}
              <div className="w-1/3 space-y-2 flex flex-col">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-primary transition-colors cursor-pointer flex flex-col overflow-hidden"
                style={{ height: '310px' }}
              >
                  <input
                    type="file"
                    id="file-upload"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    multiple
                    className="hidden"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2 flex-shrink-0">
                    {/* Decorative Icon - Leaves with Paperclip */}
                    <div className="flex-shrink-0">
                      <svg
                        width="80"
                        height="80"
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
                            opacity="1.0"
                          />
                          <path
                            d="M24 18 Q20 22 20 28 Q20 38 26 44 Q32 50 38 46 Q42 42 42 36 Q42 30 38 26 Q34 22 30 20 Q28 18 24 18"
                            fill="none"
                            stroke="#0F5132"
                            className="dark:stroke-green-800"
                            strokeWidth="0.5"
                            opacity="0.6"
                          />
                          {/* Veins on green leaf */}
                          <path
                            d="M30 20 L30 40"
                            stroke="#0F5132"
                            className="dark:stroke-green-800"
                            strokeWidth="0.5"
                            opacity="0.5"
                          />
                          <path
                            d="M26 24 L34 32"
                            stroke="#0F5132"
                            className="dark:stroke-green-800"
                            strokeWidth="0.5"
                            opacity="0.5"
                          />
                          <path
                            d="M34 24 L26 32"
                            stroke="#0F5132"
                            className="dark:stroke-green-800"
                            strokeWidth="0.5"
                            opacity="0.5"
                          />
                        </g>
                        
                        {/* Foreground Yellow/Orange Leaf (rotated -30 degrees to the left) */}
                        <g transform="translate(32, 16) rotate(-30)">
                          <path
                            d="M0 0 Q-4 4 -4 10 Q-4 20 2 26 Q8 32 14 28 Q18 24 18 18 Q18 12 14 8 Q10 4 6 2 Q4 0 0 0 Z"
                            fill="#F59E0B"
                            className="dark:fill-amber-500"
                            opacity="1.0"
                          />
                          <path
                            d="M0 0 Q-4 4 -4 10 Q-4 20 2 26 Q8 32 14 28 Q18 24 18 18 Q18 12 14 8 Q10 4 6 2 Q4 0 0 0"
                            fill="none"
                            stroke="#D97706"
                            className="dark:stroke-amber-600"
                            strokeWidth="0.5"
                            opacity="0.7"
                          />
                          {/* Veins on yellow leaf */}
                          <path
                            d="M6 2 L6 22"
                            stroke="#D97706"
                            className="dark:stroke-amber-600"
                            strokeWidth="0.5"
                            opacity="0.6"
                          />
                          <path
                            d="M2 6 L10 14"
                            stroke="#D97706"
                            className="dark:stroke-amber-600"
                            strokeWidth="0.5"
                            opacity="0.6"
                          />
                          <path
                            d="M10 6 L2 14"
                            stroke="#D97706"
                            className="dark:stroke-amber-600"
                            strokeWidth="0.5"
                            opacity="0.6"
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
                    <div className="flex-1 text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">
                        將發票圖片拖曳到此處或點擊上傳
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        支援PDF或圖片格式上傳，可上傳多個附件。
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        單據請以單張掃描，勿上傳多張收據在一個圖片中，以免影響辨識效果。
                      </p>
                    </div>
                  </label>
                  {attachments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex-1 overflow-y-auto min-h-0">
                      <div className={`flex flex-wrap gap-2 justify-start ${attachments.length > 6 ? 'gap-1.5' : 'gap-2'}`}>
                        {attachments.map((file, index) => {
                          const isSelected = isAttachmentSelected(index);
                          const isImage = file.type.startsWith('image/');
                          const isPdf = file.type === 'application/pdf';
                          const isSupported = isImage || isPdf;
                          // 當附件超過 6 個時，縮小圖標
                          const isCompact = attachments.length > 6;
                          return (
                            <div
                              key={index}
                              onClick={() => isSupported && handleAttachmentClick(index)}
                              className={`flex items-center gap-2 border rounded-full text-sm transition-colors ${
                                isCompact 
                                  ? 'px-2 py-1' 
                                  : 'px-3 py-1.5'
                              } ${
                                isSelected
                                  ? 'bg-purple-600 dark:bg-purple-700 border-purple-600 dark:border-purple-700 cursor-pointer'
                                  : isSupported
                                  ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-800/50'
                                  : 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700'
                              }`}
                            >
                              <span
                                className={`text-sm truncate ${
                                  isCompact 
                                    ? 'max-w-[80px]' 
                                    : 'max-w-[120px]'
                                } ${
                                  isSelected
                                    ? 'text-white'
                                    : 'text-purple-700 dark:text-purple-300'
                                }`}
                              >
                                {file.name}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFile(index);
                                }}
                                className={`${isCompact ? 'h-4 w-4' : 'h-5 w-5'} p-0 rounded-full ${
                                  isSelected
                                    ? 'hover:bg-purple-700 dark:hover:bg-purple-800'
                                    : 'hover:bg-purple-200 dark:hover:bg-purple-800'
                                }`}
                              >
                                <X
                                  className={`${isCompact ? 'h-2.5 w-2.5' : 'h-3 w-3'} ${
                                    isSelected
                                      ? 'text-white'
                                      : 'text-purple-600 dark:text-purple-400'
                                  }`}
                                />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            
            {/* 右側：檔案預覽區域 (2/3 寬度) */}
            <div className="w-2/3 space-y-4">
              {/* File Preview */}
              <div className="space-y-2">
              <div
                ref={previewRef}
                className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 overflow-hidden relative"
                style={{ minHeight: '368px', height: '368px' }}
              >
                {previewImage ? (
                  <div className="relative w-full h-full" style={{ minHeight: '450px', height: '450px' }}>
                    {/* 檢查當前檔案類型 */}
                    {(() => {
                      const currentFileType = previewFileTypes[previewImageIndex] || '';
                      const isPdf = currentFileType === 'application/pdf';
                      const isImage = currentFileType.startsWith('image/');
                      
                      return (
                        <>
                          {/* Zoom Controls - 僅圖片顯示 */}
                          {isImage && (
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
                          )}

                          {/* Navigation Arrows */}
                          {previewImages.length > 1 && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handlePreviousImage}
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
                              >
                                <ChevronLeft className="h-5 w-5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleNextImage}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
                              >
                                <ChevronRight className="h-5 w-5" />
                              </Button>
                            </>
                          )}

                          {/* File Container */}
                          {isPdf ? (
                            <div className="w-full h-full flex items-center justify-center overflow-hidden">
                              <iframe
                                src={previewImage}
                                className="w-full h-full border-0"
                                style={{ minHeight: '450px', height: '450px' }}
                                title="PDF 預覽"
                              />
                            </div>
                          ) : isImage ? (
                            <div
                              className="w-full h-full flex items-center justify-center overflow-hidden cursor-move"
                              onMouseDown={handleMouseDown}
                              onMouseMove={handleMouseMove}
                              onMouseUp={handleMouseUp}
                              onMouseLeave={handleMouseUp}
                              style={{
                                minHeight: '300px',
                                height: '300px',
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
                          ) : null}

                          {/* File Counter */}
                          {previewImages.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
                              {previewImageIndex + 1} / {previewImages.length}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3" style={{ minHeight: '368px', height: '450px' }}>
                    <Image className="h-16 w-16 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                    <p className="text-gray-400 dark:text-gray-500 text-center text-sm">檔案預覽</p>
                  </div>
                )}
              </div>
              </div>
              
              {/* AI OCR Button */}
              <Button
              onClick={handleAIOCR}
              disabled={!previewImage || ocrProcessing || multiOcrTasks.size > 0}
              className="w-full text-white"
              style={{ backgroundColor: '#1a5490' }}
              onMouseEnter={(e) => {
                if (!ocrProcessing && multiOcrTasks.size === 0 && previewImage) {
                  e.currentTarget.style.backgroundColor = '#174880';
                }
              }}
              onMouseLeave={(e) => {
                if (!ocrProcessing && multiOcrTasks.size === 0 && previewImage) {
                  e.currentTarget.style.backgroundColor = '#1a5490';
                }
              }}
            >
              {ocrProcessing || multiOcrTasks.size > 0 ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {multiOcrTasks.size > 0 
                    ? `處理中 (${Array.from(multiOcrTasks.values()).filter(t => t.status === 'completed').length}/${multiOcrTasks.size})`
                    : '等待 OCR 辨識結果...'}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI OCR 識別
                </>
              )}
            </Button>
            
              {/* OCR 處理中的載入提示 */}
              {(ocrProcessing || multiOcrTasks.size > 0) && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>
                      {multiOcrTasks.size > 0
                        ? `正在處理 ${multiOcrTasks.size} 個附件的 OCR 辨識，請稍候...`
                        : '正在處理 OCR 辨識，請稍候...'}
                    </span>
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
                  {multiOcrTasks.size > 0
                    ? '辨識結果將自動建立對應的費用明細行'
                    : '辨識結果將自動填入表單'}
                </p>
                {/* 多附件處理狀態列表 */}
                {multiOcrTasks.size > 0 && (
                  <div className="mt-3 space-y-1">
                    {Array.from(multiOcrTasks.entries()).map(([fileIndex, task]) => {
                      const file = attachments[fileIndex];
                      return (
                        <div
                          key={fileIndex}
                          className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400"
                        >
                          {task.status === 'processing' && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                          {task.status === 'completed' && (
                            <Check className="h-3 w-3 text-green-600" />
                          )}
                          {task.status === 'error' && (
                            <X className="h-3 w-3 text-red-600" />
                          )}
                          <span className="truncate flex-1">
                            {file?.name || task.fileName}
                          </span>
                          <span className="text-blue-500">
                            {task.status === 'processing' && '處理中...'}
                            {task.status === 'completed' && '已完成'}
                            {task.status === 'error' && '失敗'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Report Lines (表身) - 參考 NetSuite 標準 */}
      {!loadingData && (
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
                    <TableHead className="w-24 text-center text-sm bg-gray-100 dark:bg-gray-800 px-1">操作</TableHead>
                    <TableHead className="w-14 text-center text-sm bg-gray-100 dark:bg-gray-800 px-1">單據明細</TableHead>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseLines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={useMultiCurrency ? 17 : 15} className="text-left text-gray-500 py-8 text-sm px-1 align-middle">
                        尚無費用明細，請點擊「+ 新增行」新增
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenseLines.map((line, index) => (
                      <TableRow 
                        key={line.id}
                        className={`
                          ${line.isProcessing ? "opacity-60 animate-pulse bg-blue-50/30 dark:bg-blue-900/10" : ""}
                          ${draggedIndex === index ? "opacity-50" : ""}
                          ${dragOverIndex === index ? "border-t-2 border-blue-500 dark:border-blue-400" : ""}
                          cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50
                        `}
                        onClick={(e) => {
                          // 如果點擊的是按鈕或輸入框，不觸發行的點擊事件
                          const target = e.target as HTMLElement;
                          if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('textarea') || target.closest('[role="dialog"]')) {
                            return;
                          }
                          // 如果有 OCR 附件（圖片或 PDF），顯示在預覽區域
                          updatePreviewForLine(line);
                        }}
                        onKeyDown={(e) => {
                          // 當按下 Enter 鍵時，只在金額和備註欄位跳到下一行的同一個欄位位置
                          const target = e.target as HTMLElement;
                          if (target.tagName === 'INPUT' && e.key === 'Enter' && !e.shiftKey) {
                            const fieldType = target.getAttribute('data-field');
                            // 只處理金額和備註欄位
                            if (fieldType === 'amount' || fieldType === 'memo') {
                              e.preventDefault();
                              
                              // 計算下一行的索引（如果是最後一行，則回到第一行）
                              const nextIndex = index + 1 >= expenseLines.length ? 0 : index + 1;
                              
                              // 延遲一下，確保 DOM 已更新
                              setTimeout(() => {
                                // 找到下一行的同一個欄位
                                const nextRowField = document.querySelector(
                                  `tr[data-row-index="${nextIndex}"] [data-field="${fieldType}"]`
                                ) as HTMLInputElement;
                                  
                                if (nextRowField) {
                                  nextRowField.focus();
                                  // 選取所有文字以便快速替換
                                  nextRowField.select();
                                }
                              }, 10);
                            }
                          }
                        }}
                        data-row-index={index}
                        onDragOver={(e) => handleRowDragOver(e, index)}
                        onDragLeave={handleRowDragLeave}
                        onDrop={(e) => handleRowDrop(e, index)}
                        onDragEnd={handleRowDragEnd}
                      >
                        <TableCell className="text-center text-sm px-1">
                          {line.isProcessing ? (
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                              <span className="text-gray-400">{line.refNo}</span>
                            </div>
                          ) : (
                            line.refNo
                          )}
                        </TableCell>
                        <TableCell className="px-1">
                          <div className="flex gap-1 items-center">
                            <div
                              draggable
                              onDragStart={(e) => {
                                handleRowDragStart(index);
                                e.dataTransfer.effectAllowed = 'move';
                                e.dataTransfer.setData('text/html', '');
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              className="cursor-move p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors touch-none"
                              title="拖拽移動"
                            >
                              <GripVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // 刪除指定的行
                                const newLines = expenseLines.filter((_, i) => i !== index);
                                
                                // 重新編號所有剩餘的行，從 1 開始
                                const renumberedLines = newLines.map((line, i) => ({
                                  ...line,
                                  refNo: i + 1,
                                }));
                                
                                setExpenseLines(renumberedLines);
                                
                                // 更新 nextRefNo 為下一個可用的編號（基於重新編號後的最大編號）
                                const maxRefNo = renumberedLines.length > 0
                                  ? Math.max(...renumberedLines.map(line => line.refNo || 0))
                                  : 0;
                                setNextRefNo(maxRefNo + 1);
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
                                // 建立一個空白的 Expense Line
                                const newLine: ExpenseReportLine = {
                                  id: `line-${Date.now()}-${Math.random()}`,
                                  refNo: 0, // 暫時設為 0，稍後會重新編號
                                  date: formData.expenseDate || '',
                                  category: '',
                                  foreignAmount: '',
                                  currency: formData.receiptCurrency || 'TWD',
                                  exchangeRate: '1.00',
                                  amount: '', // 空白，不複製上一行的金額
                                  taxCode: '',
                                  taxRate: '',
                                  taxAmt: '', // 空白，不複製上一行的稅額
                                  grossAmt: '', // 空白，不複製上一行的總金額
                                  memo: '',
                                  department: '',
                                  class: '',
                                  location: '',
                                  ocrDetail: '',
                                  ocrData: {
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
                                  },
                                  customer: '',
                                  projectTask: '',
                                  billable: false,
                                  attachFile: '',
                                  receipt: '',
                                  isEditing: true,
                                };
                                
                                // 插入新行到指定位置
                                const newLines = [...expenseLines];
                                newLines.splice(index + 1, 0, newLine);
                                
                                // 重新編號所有行，從 1 開始依序遞增
                                const renumberedLines = newLines.map((line, i) => ({
                                  ...line,
                                  refNo: i + 1,
                                }));
                                
                                setExpenseLines(renumberedLines);
                                
                                // 更新 nextRefNo 為下一個可用的編號（基於重新編號後的最大編號）
                                const maxRefNo = renumberedLines.length > 0
                                  ? Math.max(...renumberedLines.map(line => line.refNo || 0))
                                  : 0;
                                setNextRefNo(maxRefNo + 1);
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
                                // 複製當前行
                                const newLine: ExpenseReportLine = {
                                  ...line,
                                  id: `line-${Date.now()}-${Math.random()}`,
                                  refNo: 0, // 暫時設為 0，稍後會重新編號
                                  isEditing: true,
                                };
                                
                                // 插入複製的行到當前行下方
                                const newLines = [...expenseLines];
                                newLines.splice(index + 1, 0, newLine);
                                
                                // 重新編號所有行，從 1 開始依序遞增
                                const renumberedLines = newLines.map((line, i) => ({
                                  ...line,
                                  refNo: i + 1,
                                }));
                                
                                setExpenseLines(renumberedLines);
                                
                                // 更新 nextRefNo 為下一個可用的編號（基於重新編號後的最大編號）
                                const maxRefNo = renumberedLines.length > 0
                                  ? Math.max(...renumberedLines.map(line => line.refNo || 0))
                                  : 0;
                                setNextRefNo(maxRefNo + 1);
                              }}
                              className="h-7 w-7 p-0"
                              title="複製"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm px-1">
                          {line.isProcessing ? (
                            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>正在辨識中...</span>
                            </div>
                          ) : (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={`h-7 text-sm px-3 w-full ${
                                    // 如果有 OCR 資料，根據 ocrSuccess 判斷成功或失敗
                                    (line.ocrData.ocrFileName || line.ocrData.invoiceNumber)
                                      ? (line.ocrData.ocrSuccess === false
                                          // OCR 失敗（success: false），顯示桃紅色
                                          ? 'rounded-full bg-pink-500 hover:bg-pink-600 border-pink-500 text-white dark:bg-pink-500 dark:hover:bg-pink-600 dark:border-pink-500 dark:text-white'
                                          // OCR 成功（success: true），顯示橘色
                                          : 'rounded-full bg-orange-500 hover:bg-orange-600 border-orange-500 text-white dark:bg-orange-500 dark:hover:bg-orange-600 dark:border-orange-500 dark:text-white')
                                      // 沒有 OCR 資料，顯示灰色
                                      : 'rounded-full bg-white hover:bg-gray-50 border-gray-300 text-gray-900 dark:bg-transparent dark:hover:bg-gray-800/50 dark:border-white dark:text-white'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  {(() => {
                                    // 如果有 OCR 資料，根據 ocrSuccess 判斷成功或失敗
                                    if (line.ocrData.ocrFileName || line.ocrData.invoiceNumber) {
                                      // OCR 失敗（success: false），顯示「OCR 失敗」
                                      if (line.ocrData.ocrSuccess === false) {
                                        return (
                                          <div className="flex items-center gap-1.5">
                                            <Eye className="h-3 w-3 text-white" />
                                            <span className="text-white font-medium">OCR 失敗</span>
                                          </div>
                                        );
                                      }
                                      // OCR 成功（success: true），顯示「查看 OCR」
                                      return (
                                        <div className="flex items-center gap-1.5">
                                          <Eye className="h-3 w-3 text-white" />
                                          <span className="text-white font-medium">查看 OCR</span>
                                        </div>
                                      );
                                    }
                                    // 沒有 OCR 資料，顯示眼睛圖標和「明細」
                                    return (
                                      <div className="flex items-center gap-1.5">
                                        <Eye className="h-3 w-3 text-gray-900 dark:text-white" />
                                        <span className="text-gray-900 dark:text-white font-medium">明細</span>
                                      </div>
                                    );
                                  })()}
                                </Button>
                              </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>OCR 識別結果 - 明細 #{line.refNo}</DialogTitle>
                                <DialogDescription>
                                  {line.ocrData.invoiceNumber ? `發票號碼: ${line.ocrData.invoiceNumber}` : '尚未進行 OCR 辨識'}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                {/* 第一部分：OCR 發票資訊（最上面） */}
                                <div>
                                  <h3 className="text-sm font-semibold mb-4">發票資訊</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label className="text-sm font-semibold">發票標題</Label>
                                        <Input
                                          value={line.ocrData.invoiceTitle || ''}
                                          onChange={(e) => handleOcrDataChange(index, 'invoiceTitle', e.target.value)}
                                          className="text-sm"
                                          placeholder="N/A"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-sm font-semibold">發票期間</Label>
                                        <Input
                                          value={line.ocrData.invoicePeriod || ''}
                                          onChange={(e) => handleOcrDataChange(index, 'invoicePeriod', e.target.value)}
                                          className="text-sm"
                                          placeholder="N/A"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-sm font-semibold">發票號碼</Label>
                                        <Input
                                          value={line.ocrData.invoiceNumber || ''}
                                          onChange={(e) => handleOcrDataChange(index, 'invoiceNumber', e.target.value)}
                                          className="text-sm"
                                          placeholder="N/A"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-sm font-semibold">發票日期</Label>
                                        <Input
                                          type="date"
                                          value={line.ocrData.invoiceDate || ''}
                                          onChange={(e) => handleOcrDataChange(index, 'invoiceDate', e.target.value)}
                                          className="text-sm"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-sm font-semibold">隨機碼</Label>
                                        <Input
                                          value={line.ocrData.randomCode || ''}
                                          onChange={(e) => handleOcrDataChange(index, 'randomCode', e.target.value)}
                                          className="text-sm"
                                          placeholder="N/A"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-sm font-semibold">格式代碼</Label>
                                        <Input
                                          value={line.ocrData.formatCode || ''}
                                          onChange={(e) => handleOcrDataChange(index, 'formatCode', e.target.value)}
                                          className="text-sm"
                                          placeholder="N/A"
                                        />
                                      </div>
                                    </div>
                                    <div className="border-t pt-4 mt-4">
                                      <h3 className="text-sm font-semibold mb-2">賣方資訊</h3>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label className="text-sm font-semibold">賣方名稱</Label>
                                          <Input
                                            value={line.ocrData.sellerName || ''}
                                            onChange={(e) => handleOcrDataChange(index, 'sellerName', e.target.value)}
                                            className="text-sm"
                                            placeholder="N/A"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-sm font-semibold">賣方統編</Label>
                                          <Input
                                            value={line.ocrData.sellerTaxId || ''}
                                            onChange={(e) => handleOcrDataChange(index, 'sellerTaxId', e.target.value)}
                                            className="text-sm"
                                            placeholder="N/A"
                                          />
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                          <Label className="text-sm font-semibold">賣方地址</Label>
                                          <Textarea
                                            value={line.ocrData.sellerAddress || ''}
                                            onChange={(e) => handleOcrDataChange(index, 'sellerAddress', e.target.value)}
                                            className="text-sm min-h-[60px]"
                                            placeholder="N/A"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    <div className="border-t pt-4">
                                      <h3 className="text-sm font-semibold mb-2">買方資訊</h3>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label className="text-sm font-semibold">買方名稱</Label>
                                          <Input
                                            value={line.ocrData.buyerName || ''}
                                            onChange={(e) => handleOcrDataChange(index, 'buyerName', e.target.value)}
                                            className="text-sm"
                                            placeholder="N/A"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-sm font-semibold">買方統編</Label>
                                          <Input
                                            value={line.ocrData.buyerTaxId || ''}
                                            onChange={(e) => handleOcrDataChange(index, 'buyerTaxId', e.target.value)}
                                            className="text-sm"
                                            placeholder="N/A"
                                          />
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                          <Label className="text-sm font-semibold">買方地址</Label>
                                          <Textarea
                                            value={line.ocrData.buyerAddress || ''}
                                            onChange={(e) => handleOcrDataChange(index, 'buyerAddress', e.target.value)}
                                            className="text-sm min-h-[60px]"
                                            placeholder="N/A"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    <div className="border-t pt-4">
                                      <h3 className="text-sm font-semibold mb-2">金額資訊</h3>
                                      <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                          <Label className="text-sm font-semibold">未稅金額</Label>
                                          <Input
                                            type="text"
                                            value={line.ocrData.untaxedAmount || ''}
                                            onChange={(e) => handleOcrDataChange(index, 'untaxedAmount', e.target.value)}
                                            className="text-sm"
                                            placeholder="N/A"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-sm font-semibold">稅額</Label>
                                          <Input
                                            type="text"
                                            value={line.ocrData.taxAmount || ''}
                                            onChange={(e) => handleOcrDataChange(index, 'taxAmount', e.target.value)}
                                            className="text-sm"
                                            placeholder="N/A"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-sm font-semibold">總金額</Label>
                                          <Input
                                            type="text"
                                            value={line.ocrData.totalAmount || ''}
                                            onChange={(e) => handleOcrDataChange(index, 'totalAmount', e.target.value)}
                                            className="text-sm font-bold"
                                            placeholder="N/A"
                                          />
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
                                  
                                  {/* 第二部分：附件檔案（中間）- 支援圖片和 PDF */}
                                  {line.ocrData.attachmentImageData && (
                                    <div className="border-t pt-4">
                                      <h3 className="text-sm font-semibold mb-4">
                                        {line.ocrData.attachmentFileType === 'application/pdf' ? '附件 PDF' : '附件圖片'}
                                      </h3>
                                      <div className="flex justify-center">
                                        {line.ocrData.attachmentFileType === 'application/pdf' ? (
                                          <iframe
                                            src={line.ocrData.attachmentImageData}
                                            className="w-full h-[600px] rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                                            title="PDF 預覽"
                                          />
                                        ) : (
                                          <img
                                            src={line.ocrData.attachmentImageData}
                                            alt="收據附件"
                                            className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                                          />
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* 第三部分：AI 辨識結果（最下面） */}
                                  <div className="border-t pt-4">
                                    <h3 className="text-sm font-semibold mb-4">AI 辨識結果</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label className="text-sm font-semibold">辨識狀態</Label>
                                        <p className="text-sm">
                                          {(() => {
                                            // 判斷是否有 OCR 資料（檢查是否有執行過 OCR）
                                            const hasOcrData = line.ocrData.ocrFileName || 
                                                              line.ocrData.ocrFileId || 
                                                              line.ocrData.ocrProcessedAt ||
                                                              line.ocrData.invoiceNumber;
                                            
                                            if (!hasOcrData) {
                                              // 沒有 OCR 資料，顯示「無資料」
                                              return <span className="text-gray-600 dark:text-gray-400">無資料</span>;
                                            } else if (line.ocrData.ocrSuccess) {
                                              // OCR 成功
                                              return <span className="text-green-600 dark:text-green-400">✓ 成功</span>;
                                            } else {
                                              // OCR 失敗（有執行過但失敗）
                                              return <span className="text-red-600 dark:text-red-400">✗ 失敗</span>;
                                            }
                                          })()}
                                        </p>
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-sm font-semibold">辨識信心度</Label>
                                        <p className="text-sm">
                                          {line.ocrData.ocrConfidence > 0 ? (() => {
                                            // 如果 confidence > 1，表示已經是百分比格式，直接顯示
                                            // 如果 confidence <= 1，表示是小數格式，乘以 100
                                            const confidence = line.ocrData.ocrConfidence;
                                            const percentage = confidence > 1 ? confidence : confidence * 100;
                                            return `${percentage.toFixed(1)}%`;
                                          })() : 'N/A'}
                                        </p>
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-sm font-semibold">文件類型</Label>
                                        <p className="text-sm">{line.ocrData.ocrDocumentType || 'N/A'}</p>
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-sm font-semibold">品質等級</Label>
                                        <p className="text-sm">{line.ocrData.ocrQualityGrade || 'N/A'}</p>
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-sm font-semibold">錯誤數量</Label>
                                        <p className="text-sm">
                                          {line.ocrData.ocrErrorCount > 0 ? (
                                            <span className="text-red-600 dark:text-red-400">{line.ocrData.ocrErrorCount}</span>
                                          ) : (
                                            <span className="text-green-600 dark:text-green-400">0</span>
                                          )}
                                        </p>
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-sm font-semibold">警告數量</Label>
                                        <p className="text-sm">
                                          {line.ocrData.ocrWarningCount > 0 ? (
                                            <span className="text-yellow-600 dark:text-yellow-400">{line.ocrData.ocrWarningCount}</span>
                                          ) : (
                                            <span className="text-green-600 dark:text-green-400">0</span>
                                          )}
                                        </p>
                                      </div>
                                      <div className="space-y-2 col-span-2">
                                        <Label className="text-sm font-semibold">檔案名稱</Label>
                                        <p className="text-sm">{line.ocrData.ocrFileName || 'N/A'}</p>
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-sm font-semibold">處理時間</Label>
                                        <p className="text-sm">{line.ocrData.ocrProcessedAt || 'N/A'}</p>
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-sm font-semibold">檔案 ID</Label>
                                        <p className="text-sm font-mono text-xs">{line.ocrData.ocrFileId || 'N/A'}</p>
                                      </div>
                                      {line.ocrData.ocrErrors && (
                                        <div className="space-y-2 col-span-2">
                                          <Label className="text-sm font-semibold text-red-600 dark:text-red-400">錯誤訊息</Label>
                                          <p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                            {line.ocrData.ocrErrors}
                                          </p>
                                        </div>
                                      )}
                                      {line.ocrData.ocrWarnings && (
                                        <div className="space-y-2 col-span-2">
                                          <Label className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">警告訊息</Label>
                                          <p className="text-sm text-yellow-600 dark:text-yellow-400 whitespace-pre-wrap bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                                            {line.ocrData.ocrWarnings}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                            </DialogContent>
                          </Dialog>
                          )}
                        </TableCell>
                        <TableCell className="text-sm px-1">
                          {line.isProcessing ? (
                            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          ) : (
                            <div className="relative">
                            <Input
                              type="date"
                              value={line.date || formData.expenseDate}
                              onChange={(e) => {
                                const newLines = [...expenseLines];
                                newLines[index].date = e.target.value;
                                setExpenseLines(newLines);
                              }}
                              onFocus={() => updatePreviewForLine(line)}
                              className="h-7 text-sm px-1.5 pr-8 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-moz-calendar-picker-indicator]:opacity-0 [&::-moz-calendar-picker-indicator]:absolute [&::-moz-calendar-picker-indicator]:right-0 [&::-moz-calendar-picker-indicator]:w-full [&::-moz-calendar-picker-indicator]:h-full [&::-moz-calendar-picker-indicator]:cursor-pointer"
                            />
                            <Calendar 
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none z-10" 
                            />
                          </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm px-1">
                          {line.isProcessing ? (
                            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          ) : (
                            <Select
                            value={line.category}
                            onValueChange={(value) => {
                              const newLines = [...expenseLines];
                              newLines[index].category = value;
                              setExpenseLines(newLines);
                            }}
                            onOpenChange={(open) => {
                              if (open) {
                                updatePreviewForLine(line);
                              }
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
                          )}
                        </TableCell>
                        {useMultiCurrency && (
                          <TableCell className="text-sm px-1">
                            {line.isProcessing ? (
                              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            ) : (
                              <Input
                                type="text"
                                value={(() => {
                                  const fieldKey = `foreignAmount-${index}`;
                                  const isEditing = editingAmountFields.has(fieldKey);
                                  if (isEditing || !line.foreignAmount || parseFloat(line.foreignAmount) === 0) {
                                    return line.foreignAmount || '';
                                  }
                                  // 外幣金額使用外幣幣別格式化
                                  const currency = line.currency || formData.receiptCurrency || 'TWD';
                                  const actualCurrency = formOptions.currencies.find(c => c.symbol === currency || c.name === currency)?.symbol || currency;
                                  return formatAmountDisplay(line.foreignAmount, actualCurrency);
                                })()}
                                onChange={(e) => {
                                  // 只允許輸入數字和小數點
                                  const inputValue = e.target.value.replace(/[^\d.]/g, '');
                                  const parts = inputValue.split('.');
                                  const cleanedValue = parts.length > 2 
                                    ? parts[0] + '.' + parts.slice(1).join('')
                                    : inputValue;
                                  
                                  const newLines = [...expenseLines];
                                  newLines[index].foreignAmount = cleanedValue;
                                  
                                  // 如果使用多幣別，自動計算金額和總金額
                                  if (useMultiCurrency) {
                                    const foreignAmount = parseFloat(cleanedValue) || 0;
                                    const exchangeRate = parseFloat(newLines[index].exchangeRate || '1.00') || 1.0;
                                    const calculatedAmount = foreignAmount * exchangeRate;
                                    const taxAmt = parseFloat(newLines[index].taxAmt) || 0;
                                    
                                    // 更新金額（外幣金額 × 匯率）
                                    newLines[index].amount = calculatedAmount.toFixed(2);
                                    // 更新總金額（金額 + 稅額）
                                    newLines[index].grossAmt = (calculatedAmount + taxAmt).toFixed(2);
                                  }
                                  
                                  setExpenseLines(newLines);
                                }}
                                onFocus={(e) => {
                                  updatePreviewForLine(line);
                                  const fieldKey = `foreignAmount-${index}`;
                                  setEditingAmountFields(prev => new Set(prev).add(fieldKey));
                                  e.target.value = line.foreignAmount || '';
                                }}
                                onBlur={(e) => {
                                  const fieldKey = `foreignAmount-${index}`;
                                  setEditingAmountFields(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(fieldKey);
                                    return newSet;
                                  });
                                  const cleanedValue = parseAmountValue(e.target.value);
                                  if (cleanedValue !== line.foreignAmount) {
                                    const newLines = [...expenseLines];
                                    newLines[index].foreignAmount = cleanedValue;
                                    if (useMultiCurrency) {
                                      const foreignAmount = parseFloat(cleanedValue) || 0;
                                      const exchangeRate = parseFloat(newLines[index].exchangeRate || '1.00') || 1.0;
                                      const calculatedAmount = foreignAmount * exchangeRate;
                                      const taxAmt = parseFloat(newLines[index].taxAmt) || 0;
                                      newLines[index].amount = calculatedAmount.toFixed(2);
                                      newLines[index].grossAmt = (calculatedAmount + taxAmt).toFixed(2);
                                    }
                                    setExpenseLines(newLines);
                                  }
                                }}
                                className="h-7 text-sm text-right"
                                placeholder="0"
                              />
                            )}
                          </TableCell>
                        )}
                        <TableCell className="text-sm px-1">
                          {line.isProcessing ? (
                            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          ) : (
                            <Select
                              value={line.currency || formData.receiptCurrency}
                            onValueChange={(value) => {
                              const newLines = [...expenseLines];
                              newLines[index].currency = value;
                              setExpenseLines(newLines);
                            }}
                            onOpenChange={(open) => {
                              if (open) {
                                updatePreviewForLine(line);
                              }
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
                          )}
                        </TableCell>
                        {useMultiCurrency && (
                          <TableCell className="text-sm px-1">
                            {line.isProcessing ? (
                              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            ) : (
                              <Input
                                type="number"
                                step="0.0001"
                                value={line.exchangeRate || '1.00'}
                                onChange={(e) => {
                                  const newLines = [...expenseLines];
                                  newLines[index].exchangeRate = e.target.value;
                                  
                                  // 如果使用多幣別，自動計算金額和總金額
                                  if (useMultiCurrency) {
                                    const foreignAmount = parseFloat(newLines[index].foreignAmount || '0') || 0;
                                    const exchangeRate = parseFloat(e.target.value) || 1.0;
                                    const calculatedAmount = foreignAmount * exchangeRate;
                                    const taxAmt = parseFloat(newLines[index].taxAmt) || 0;
                                    
                                    // 更新金額（外幣金額 × 匯率）
                                    newLines[index].amount = calculatedAmount.toFixed(2);
                                    // 更新總金額（金額 + 稅額）
                                    newLines[index].grossAmt = (calculatedAmount + taxAmt).toFixed(2);
                                  }
                                  
                                  setExpenseLines(newLines);
                                }}
                                className="h-7 text-sm text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="1.00"
                              />
                            )}
                          </TableCell>
                        )}
                        <TableCell className="text-sm px-1">
                          {line.isProcessing ? (
                            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          ) : (
                            <Input
                              type="text"
                              data-field="amount"
                              value={(() => {
                                const fieldKey = `amount-${index}`;
                                const isEditing = editingAmountFields.has(fieldKey);
                                if (isEditing || !line.amount || parseFloat(line.amount) === 0) {
                                  return line.amount || '';
                                }
                                // 取得幣別（從 line.currency 或 formData.receiptCurrency）
                                const currency = line.currency || formData.receiptCurrency || 'TWD';
                                // 如果是符號（如 'TWD'），需要轉換為實際幣別
                                const actualCurrency = formOptions.currencies.find(c => c.symbol === currency || c.name === currency)?.symbol || currency;
                                return formatAmountDisplay(line.amount, actualCurrency);
                              })()}
                              readOnly={useMultiCurrency} // 使用多幣別時，金額欄位為唯讀（由外幣金額 × 匯率自動計算）
                              onChange={(e) => {
                                // 如果使用多幣別，不允許手動編輯金額
                                if (useMultiCurrency) {
                                  return;
                                }
                                
                                // 只允許輸入數字和小數點
                                const inputValue = e.target.value.replace(/[^\d.]/g, '');
                                // 確保只有一個小數點
                                const parts = inputValue.split('.');
                                const cleanedValue = parts.length > 2 
                                  ? parts[0] + '.' + parts.slice(1).join('')
                                  : inputValue;
                                
                                const newLines = [...expenseLines];
                                newLines[index].amount = cleanedValue;
                                // 自動計算 Gross Amt
                                const amount = parseFloat(cleanedValue) || 0;
                                const taxAmt = parseFloat(newLines[index].taxAmt) || 0;
                                newLines[index].grossAmt = (amount + taxAmt).toFixed(2);
                                setExpenseLines(newLines);
                              }}
                              onFocus={(e) => {
                                updatePreviewForLine(line);
                                const fieldKey = `amount-${index}`;
                                setEditingAmountFields(prev => new Set(prev).add(fieldKey));
                                // 顯示純數字以便編輯
                                const rawValue = line.amount || '';
                                e.target.value = rawValue;
                              }}
                              onBlur={(e) => {
                                const fieldKey = `amount-${index}`;
                                setEditingAmountFields(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(fieldKey);
                                  return newSet;
                                });
                                // 確保值正確保存（移除千分位符號）
                                const cleanedValue = parseAmountValue(e.target.value);
                                if (cleanedValue !== line.amount) {
                                  const newLines = [...expenseLines];
                                  newLines[index].amount = cleanedValue;
                                  const amount = parseFloat(cleanedValue) || 0;
                                  const taxAmt = parseFloat(newLines[index].taxAmt) || 0;
                                  newLines[index].grossAmt = (amount + taxAmt).toFixed(2);
                                  setExpenseLines(newLines);
                                }
                              }}
                              className={`h-7 text-sm text-right ${useMultiCurrency ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}`}
                              placeholder="0"
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-sm px-1">
                          {line.isProcessing ? (
                            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          ) : (
                            <Select
                              value={line.taxCode || '__empty__'}
                              onValueChange={(value) => {
                                const newLines = [...expenseLines];
                                
                                // 如果選擇空白選項（__empty__），清除稅碼、稅率和稅額
                                if (value === '__empty__') {
                                  newLines[index].taxCode = '';
                                  newLines[index].taxRate = '';
                                  newLines[index].taxAmt = '';
                                  // 重新計算 Gross Amt（只使用金額，不含稅）
                                  const amount = parseFloat(newLines[index].amount) || 0;
                                  newLines[index].grossAmt = amount.toFixed(2);
                                } else {
                                  // value 是 taxCode.name，直接使用
                                  newLines[index].taxCode = value;
                                  
                                  // 找到對應的稅碼物件，用於取得 rate
                                  const selectedTaxCode = filteredTaxCodes.find(tc => tc.name === value);
                                  
                                  // 如果稅碼有 rate，自動填入稅率
                                  if (selectedTaxCode?.rate !== null && selectedTaxCode?.rate !== undefined) {
                                    newLines[index].taxRate = (selectedTaxCode.rate * 100).toFixed(2);
                                    // 自動計算稅額
                                    // 如果使用多幣別，需要先確保金額是從外幣金額 × 匯率計算出來的
                                    let amount = parseFloat(newLines[index].amount) || 0;
                                    if (useMultiCurrency) {
                                      // 重新計算金額（確保是最新的）
                                      const foreignAmount = parseFloat(newLines[index].foreignAmount || '0') || 0;
                                      const exchangeRate = parseFloat(newLines[index].exchangeRate || '1.00') || 1.0;
                                      amount = foreignAmount * exchangeRate;
                                      newLines[index].amount = amount.toFixed(2);
                                    }
                                    const rate = selectedTaxCode.rate;
                                    newLines[index].taxAmt = (amount * rate).toFixed(2);
                                    // 重新計算 Gross Amt
                                    const taxAmt = parseFloat(newLines[index].taxAmt) || 0;
                                    newLines[index].grossAmt = (amount + taxAmt).toFixed(2);
                                  }
                                }
                                setExpenseLines(newLines);
                              }}
                            >
                              <SelectTrigger className="h-7 text-sm px-1.5">
                                <SelectValue placeholder="選擇稅碼（選填）" />
                              </SelectTrigger>
                              <SelectContent>
                                {/* 空白選項 */}
                                <SelectItem value="__empty__">
                                  <span className="text-gray-500 italic">無稅碼（選填）</span>
                                </SelectItem>
                                {/* 稅碼選項 */}
                                {filteredTaxCodes.length > 0 ? (
                                  filteredTaxCodes.map((taxCode) => (
                                    <SelectItem key={taxCode.id} value={taxCode.name}>
                                      {taxCode.name}
                                    </SelectItem>
                                  ))
                                ) : (
                                  formData.subsidiary && (
                                    <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                                      無可用稅碼
                                    </div>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell className="text-sm px-1">
                          {line.isProcessing ? (
                            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          ) : (
                            <div className="relative">
                              <Input
                                type="number"
                                step="0.01"
                                value={line.taxRate}
                                readOnly
                                className="h-7 text-sm pr-6 text-right bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="0.0"
                                title="稅率由稅碼自動設定，無法手動修改"
                              />
                              {line.taxRate && (
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400 pointer-events-none">
                                  %
                                </span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm px-1">
                          {line.isProcessing ? (
                            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          ) : (
                            <Input
                              type="text"
                              value={(() => {
                                const fieldKey = `taxAmt-${index}`;
                                const isEditing = editingAmountFields.has(fieldKey);
                                if (isEditing || !line.taxAmt || parseFloat(line.taxAmt) === 0) {
                                  return line.taxAmt || '';
                                }
                                const currency = line.currency || formData.receiptCurrency || 'TWD';
                                const actualCurrency = formOptions.currencies.find(c => c.symbol === currency || c.name === currency)?.symbol || currency;
                                return formatAmountDisplay(line.taxAmt, actualCurrency);
                              })()}
                              onChange={(e) => {
                                // 只允許輸入數字和小數點
                                const inputValue = e.target.value.replace(/[^\d.]/g, '');
                                const parts = inputValue.split('.');
                                const cleanedValue = parts.length > 2 
                                  ? parts[0] + '.' + parts.slice(1).join('')
                                  : inputValue;
                                
                                const newLines = [...expenseLines];
                                newLines[index].taxAmt = cleanedValue;
                                // 重新計算 Gross Amt
                                let amount = parseFloat(newLines[index].amount) || 0;
                                if (useMultiCurrency) {
                                  const foreignAmount = parseFloat(newLines[index].foreignAmount || '0') || 0;
                                  const exchangeRate = parseFloat(newLines[index].exchangeRate || '1.00') || 1.0;
                                  amount = foreignAmount * exchangeRate;
                                  newLines[index].amount = amount.toFixed(2);
                                }
                                const taxAmt = parseFloat(cleanedValue) || 0;
                                newLines[index].grossAmt = (amount + taxAmt).toFixed(2);
                                setExpenseLines(newLines);
                              }}
                              onFocus={(e) => {
                                updatePreviewForLine(line);
                                const fieldKey = `taxAmt-${index}`;
                                setEditingAmountFields(prev => new Set(prev).add(fieldKey));
                                e.target.value = line.taxAmt || '';
                              }}
                              onBlur={(e) => {
                                const fieldKey = `taxAmt-${index}`;
                                setEditingAmountFields(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(fieldKey);
                                  return newSet;
                                });
                                const cleanedValue = parseAmountValue(e.target.value);
                                if (cleanedValue !== line.taxAmt) {
                                  const newLines = [...expenseLines];
                                  newLines[index].taxAmt = cleanedValue;
                                  let amount = parseFloat(newLines[index].amount) || 0;
                                  if (useMultiCurrency) {
                                    const foreignAmount = parseFloat(newLines[index].foreignAmount || '0') || 0;
                                    const exchangeRate = parseFloat(newLines[index].exchangeRate || '1.00') || 1.0;
                                    amount = foreignAmount * exchangeRate;
                                    newLines[index].amount = amount.toFixed(2);
                                  }
                                  const taxAmt = parseFloat(cleanedValue) || 0;
                                  newLines[index].grossAmt = (amount + taxAmt).toFixed(2);
                                  setExpenseLines(newLines);
                                }
                              }}
                              className="h-7 text-sm text-right"
                              placeholder="0"
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-sm px-1">
                          {line.isProcessing ? (
                            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          ) : (
                            <Input
                              type="text"
                              value={(() => {
                                if (!line.grossAmt || parseFloat(line.grossAmt) === 0) return '';
                                const currency = line.currency || formData.receiptCurrency || 'TWD';
                                const actualCurrency = formOptions.currencies.find(c => c.symbol === currency || c.name === currency)?.symbol || currency;
                                return formatAmountDisplay(line.grossAmt, actualCurrency);
                              })()}
                              readOnly
                              className="h-7 text-sm text-right bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                              placeholder="0"
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-sm px-1">
                          {line.isProcessing ? (
                            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          ) : (
                            <Input
                              data-field="memo"
                              value={line.memo}
                            onChange={(e) => {
                              const newLines = [...expenseLines];
                              newLines[index].memo = e.target.value;
                              setExpenseLines(newLines);
                            }}
                            onFocus={() => updatePreviewForLine(line)}
                            className="h-7 text-sm px-1.5 w-full"
                            placeholder="備註"
                          />
                          )}
                        </TableCell>
                        <TableCell className="text-sm px-1">
                          {line.isProcessing ? (
                            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          ) : (
                            <Select
                              value={line.department}
                            onValueChange={(value) => {
                              const newLines = [...expenseLines];
                              newLines[index].department = value;
                              setExpenseLines(newLines);
                            }}
                            onOpenChange={(open) => {
                              if (open) {
                                updatePreviewForLine(line);
                              }
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
                          )}
                        </TableCell>
                        <TableCell className="text-sm px-1">
                          {line.isProcessing ? (
                            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          ) : (
                            <Select
                              value={line.class}
                              onValueChange={(value) => {
                                const newLines = [...expenseLines];
                                newLines[index].class = value;
                                setExpenseLines(newLines);
                              }}
                              onOpenChange={(open) => {
                                if (open) {
                                  updatePreviewForLine(line);
                                }
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
                          )}
                        </TableCell>
                        <TableCell className="text-sm px-1">
                          {line.isProcessing ? (
                            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          ) : (
                            <Select
                              value={line.location}
                              onValueChange={(value) => {
                                const newLines = [...expenseLines];
                                newLines[index].location = value;
                                setExpenseLines(newLines);
                              }}
                              onOpenChange={(open) => {
                                if (open) {
                                  updatePreviewForLine(line);
                                }
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
                          )}
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
                    category: '', // 費用類別在表身每一行中選擇
                    foreignAmount: '',
                    currency: formData.receiptCurrency || 'TWD',
                    exchangeRate: '1.00',
                    amount: '', // 空白，不複製收據金額
                    taxCode: '',
                    taxRate: '',
                    taxAmt: '', // 空白，不複製稅額
                    grossAmt: '', // 空白，不複製總金額
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
      )}

      {/* Action Buttons - Aligned with description textarea */}
      {!loadingData && (
        <div className="flex justify-end gap-2" style={{ paddingLeft: '24px' }}>
          <Button variant="outline" onClick={() => window.history.back()}>
            <X className="h-4 w-4 mr-2" />
            取消
          </Button>
          <Button
            onClick={() => handleSubmit('save')}
            disabled={loading}
            variant="outline"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? '儲存中...' : '儲存費用報告'}
          </Button>
          <Button
            onClick={handleSubmitReport}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            {loading ? '提交中...' : '提交報告'}
          </Button>
        </div>
      )}
    </div>
  );
}


