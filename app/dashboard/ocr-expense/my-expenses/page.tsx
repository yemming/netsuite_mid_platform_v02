'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, CheckCircle2, XCircle, Clock, Eye, Calendar, User, Building2, MapPin, DollarSign, AlertCircle, Loader2, Trash2, Send, Plus, Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

// 列表顯示用的簡化介面（只包含表頭基本欄位）
interface ExpenseReviewListItem {
  id: string;
  expense_date: string;
  employee_name: string | null;
  subsidiary_name: string | null;
  description: string | null;
  review_status: string;
  expense_report_number: string | null; // 費用報告編號
  netsuite_tran_id: string | null; // NetSuite 報告編號
  netsuite_url: string | null; // NetSuite 網址
  created_at: string;
  receipt_amount: number;
  receipt_currency: string;
}

// 詳細資料介面（包含完整的 expense_lines）
interface ExpenseLine {
  id: string;
  line_number: number;
  date: string;
  category_name: string | null;
  currency: string;
  amount: number;
  gross_amt: number;
  memo: string | null;
  department_name: string | null;
  class_name: string | null;
  location_name: string | null;
  invoice_title: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  seller_name: string | null;
  buyer_name: string | null;
  total_amount: number | null;
  ocr_success: boolean;
  ocr_confidence: number | null;
  ocr_quality_grade: string | null;
  attachment_url: string | null;
  attachment_base64: string | null;
  document_file_path: string | null;
  document_file_name: string | null;
}

interface ExpenseReviewDetail {
  id: string;
  expense_date: string;
  employee_name: string | null;
  subsidiary_name: string | null;
  description: string | null;
  review_status: string;
  created_at: string;
  review_notes: string | null;
  rejection_reason: string | null;
  netsuite_sync_status: string | null;
  netsuite_internal_id: number | null;
  netsuite_tran_id: string | null;
  netsuite_sync_error: string | null;
  lines: ExpenseLine[];
}

type ReviewStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';

// 判斷檔案類型是否為 PDF
const isPDF = (url: string | null, base64: string | null): boolean => {
  if (url) {
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('.pdf') || lowerUrl.includes('application/pdf');
  }
  if (base64) {
    // PDF 的 Base64 開頭通常是 "JVBERi0" (PDF 檔案的 magic number)
    return base64.startsWith('JVBERi0') || base64.startsWith('data:application/pdf');
  }
  return false;
};

// 附件預覽組件（支援圖片和 PDF）
function AttachmentPreview({ 
  attachmentUrl, 
  signedUrl, 
  base64Fallback,
  onGetSignedUrl 
}: { 
  attachmentUrl: string;
  signedUrl?: string;
  base64Fallback: string | null;
  onGetSignedUrl: (url: string) => Promise<string | null>;
}) {
  const [fileSrc, setFileSrc] = useState<string | null>(signedUrl || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 判斷是否為 PDF
  const isPdfFile = isPDF(attachmentUrl, base64Fallback);

  useEffect(() => {
    const loadFile = async () => {
      if (signedUrl) {
        setFileSrc(signedUrl);
        setLoading(false);
        return;
      }

      // 如果沒有 Signed URL，嘗試取得
      try {
        const url = await onGetSignedUrl(attachmentUrl);
        if (url) {
          setFileSrc(url);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('載入附件錯誤:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadFile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachmentUrl, signedUrl]); // 移除 onGetSignedUrl 避免無限循環

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 border border-gray-200 dark:border-gray-700 rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">載入附件中...</span>
      </div>
    );
  }

  if (error && base64Fallback) {
    // 如果 Signed URL 失敗，使用 Base64 備用
    if (isPdfFile) {
      // PDF Base64
      const pdfData = base64Fallback.startsWith('data:') 
        ? base64Fallback 
        : `data:application/pdf;base64,${base64Fallback}`;
      return (
        <iframe
          src={pdfData}
          className="w-full h-[600px] rounded-lg border border-gray-200 dark:border-gray-700"
          title="PDF 附件"
        />
      );
    } else {
      // 圖片 Base64
      return (
        <img
          src={`data:image/jpeg;base64,${base64Fallback}`}
          alt="收據附件"
          className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
        />
      );
    }
  }

  if (!fileSrc) {
    return (
      <div className="flex items-center justify-center p-8 border border-gray-200 dark:border-gray-700 rounded-lg">
        <AlertCircle className="h-6 w-6 text-red-500" />
        <span className="ml-2 text-red-600 dark:text-red-400">無法載入附件</span>
      </div>
    );
  }

  // 如果是 PDF，使用 iframe 顯示
  if (isPdfFile) {
    return (
      <iframe
        src={fileSrc}
        className="w-full h-[600px] rounded-lg border border-gray-200 dark:border-gray-700"
        title="PDF 附件"
        onError={() => {
          // 如果 Signed URL 載入失敗，嘗試使用 Base64 備用
          if (base64Fallback) {
            const pdfData = base64Fallback.startsWith('data:') 
              ? base64Fallback 
              : `data:application/pdf;base64,${base64Fallback}`;
            setFileSrc(pdfData);
          } else {
            setError(true);
          }
        }}
      />
    );
  }

  // 如果是圖片，使用 img 標籤顯示
  return (
    <img
      src={fileSrc}
      alt="收據附件"
      className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
      onError={() => {
        if (base64Fallback) {
          setFileSrc(`data:image/jpeg;base64,${base64Fallback}`);
        } else {
          setError(true);
        }
      }}
    />
  );
}

export default function MyExpensesPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<ExpenseReviewListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<ExpenseReviewDetail | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false); // 是否處於編輯模式
  const [editingData, setEditingData] = useState<any>(null); // 編輯中的資料
  const [saving, setSaving] = useState(false); // 是否正在保存
  const [formOptions, setFormOptions] = useState<{
    employees: Array<{ id: string; name: string }>;
    expenseCategories: Array<{ id: string; name: string }>;
    subsidiaries: Array<{ id: string; name: string }>;
    locations: Array<{ id: string; name: string }>;
    departments: Array<{ id: string; name: string }>;
    classes: Array<{ id: string; name: string }>;
    currencies: Array<{ id: string; name: string; symbol: string }>;
  }>({
    employees: [],
    expenseCategories: [],
    subsidiaries: [],
    locations: [],
    departments: [],
    classes: [],
    currencies: [],
  });

  const supabase = createClient();

  // 載入我的報支列表（只載入表頭，不載入 lines 和圖檔）
  const loadReviews = async (retryCount = 0) => {
    setLoading(true);
    try {
      // 優化：直接取得 user（更直接，減少一次 API 呼叫）
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        // 如果第一次失敗，嘗試刷新 session（最多重試一次）
        if (retryCount === 0) {
          try {
            await supabase.auth.refreshSession();
            const { data: { user: refreshedUser }, error: refreshedError } = await supabase.auth.getUser();
            if (!refreshedError && refreshedUser) {
              return loadReviews(1);
            }
          } catch (refreshError) {
            console.warn('Session 刷新失敗:', refreshError);
          }
        }
        
        // 認證失敗，導向登入頁面
        console.error('認證失敗:', userError);
        router.push('/');
        return;
      }

      // 查詢表頭資料（優化：只查詢必要欄位）
      let query = supabase
        .from('expense_reviews')
        .select(`
          id,
          expense_date,
          employee_name,
          subsidiary_name,
          description,
          review_status,
          expense_report_number,
          netsuite_tran_id,
          netsuite_url,
          created_at
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      // 根據狀態篩選
      if (statusFilter !== 'all') {
        query = query.eq('review_status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('查詢報支列表錯誤:', error);
        throw error;
      }
      
      const reviewIds = (data || []).map((r: any) => r.id);
      
      if (reviewIds.length === 0) {
        setReviews([]);
        setLoading(false);
        return;
      }
      
      // 優化：並行查詢 expense_lines（使用 Promise.all 加速）
      const { data: aggregatedData, error: aggError } = await supabase
        .from('expense_lines')
        .select('expense_review_id, gross_amt, currency')
        .in('expense_review_id', reviewIds);
      
      if (aggError) {
        console.error('查詢 expense_lines 錯誤:', aggError);
      }
      
      // 優化：使用 reduce 一次計算所有總金額（比 forEach + Map 更高效）
      const amountMap = (aggregatedData || []).reduce((acc: Map<string, { amount: number; currency: string }>, line: any) => {
        const reviewId = line.expense_review_id;
        const current = acc.get(reviewId) || { amount: 0, currency: 'TWD' };
        acc.set(reviewId, {
          amount: current.amount + (Number(line.gross_amt) || 0),
          currency: line.currency || current.currency || 'TWD',
        });
        return acc;
      }, new Map<string, { amount: number; currency: string }>());
      
      // 組裝最終資料（優化：使用 map 一次完成）
      const processedData = (data || []).map((review: any) => {
        const amountInfo = amountMap.get(review.id) || { amount: 0, currency: 'TWD' };
        return {
          id: review.id,
          expense_date: review.expense_date,
          employee_name: review.employee_name,
          subsidiary_name: review.subsidiary_name,
          description: review.description,
          review_status: review.review_status,
          expense_report_number: review.expense_report_number || null,
          netsuite_tran_id: review.netsuite_tran_id || null,
          netsuite_url: review.netsuite_url || null,
          created_at: review.created_at,
          receipt_amount: amountInfo.amount,
          receipt_currency: amountInfo.currency,
        };
      });
      
      setReviews(processedData);
    } catch (error: any) {
      console.error('載入報支列表錯誤:', error);
      // 改善錯誤處理：不顯示 alert，而是設置空列表並記錄錯誤
      setReviews([]);
      // 如果是認證錯誤，導向登入頁面
      if (error.message?.includes('認證') || error.message?.includes('登入') || error.status === 401 || error.message?.includes('session')) {
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // 載入表單選項（用於編輯）
  useEffect(() => {
    const loadFormOptions = async () => {
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
        }
      } catch (error) {
        console.error('載入表單選項錯誤:', error);
      }
    };

    loadFormOptions();
  }, []);

  // 從 attachment_url 提取檔案路徑
  const extractFilePath = useCallback((url: string): string | null => {
    try {
      // 處理完整 URL（可能包含查詢參數，例如 Signed URL 的 token）
      const match = url.match(/\/expense-receipts\/(.+?)(?:\?|$)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // 取得 Signed URL（用於 Private bucket）
  const getSignedUrl = useCallback(async (urlOrPath: string): Promise<string | null> => {
    // 如果已經是快取的 Signed URL，直接返回
    if (signedUrls[urlOrPath]) {
      return signedUrls[urlOrPath];
    }

    // 判斷是完整 URL 還是路徑
    let filePath: string | null = null;
    
    // 如果是完整 URL（包含 http:// 或 https://），提取路徑
    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
      filePath = extractFilePath(urlOrPath);
    } else {
      // 如果已經是路徑格式（例如：user_id/timestamp_filename.ext），直接使用
      filePath = urlOrPath;
    }

    if (!filePath) {
      console.warn('無法從 URL 或路徑提取檔案路徑:', urlOrPath);
      return null;
    }

    try {
      const { data, error } = await supabase.storage
        .from('expense-receipts')
        .createSignedUrl(filePath, 3600);

      if (error) {
        console.error('取得 Signed URL 錯誤:', error);
        return null;
      }

      if (data?.signedUrl) {
        setSignedUrls(prev => ({ ...prev, [urlOrPath]: data.signedUrl }));
        return data.signedUrl;
      }

      return null;
    } catch (error) {
      console.error('取得 Signed URL 錯誤:', error);
      return null;
    }
  }, [signedUrls, supabase, extractFilePath]);

  // 刪除報支項目
  const handleDelete = async (review: ExpenseReviewListItem) => {
    if (!confirm(`確定要刪除此報支項目嗎？此操作無法復原。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/expense-reports/${review.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '刪除失敗');
      }

      alert('報支項目已成功刪除');
      // 重新載入列表
      loadReviews();
    } catch (error: any) {
      console.error('刪除報支項目錯誤:', error);
      alert(`刪除失敗: ${error.message}`);
    }
  };

  // 提交報支項目（將草稿或已拒絕狀態改為 pending）
  const handleSubmit = async (review: ExpenseReviewListItem) => {
    const confirmMessage = review.review_status === 'rejected' 
      ? '確定要重新提交此報支項目嗎？提交後將進入審核流程。'
      : '確定要提交此報支項目嗎？提交後將進入審核流程。';
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`/api/expense-reports/${review.id}`, {
        method: 'PATCH',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '提交失敗');
      }

      alert('報支項目已成功提交');
      // 重新載入列表
      loadReviews();
    } catch (error: any) {
      console.error('提交報支項目錯誤:', error);
      alert(`提交失敗: ${error.message}`);
    }
  };

  // 開啟詳細資訊對話框（點擊查看時才載入完整資料）
  const handleViewDetails = async (review: ExpenseReviewListItem) => {
    setIsDetailDialogOpen(true);
    setDetailLoading(true);
    setSelectedReview(null);

    try {
      // 呼叫 API 取得完整的報支資料（包含 expense_lines 和圖檔）
      const response = await fetch(`/api/expense-reports/${review.id}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '取得報支詳細資料失敗');
      }

      const { header, lines } = result.data;

      // 確保金額欄位是數字類型（處理資料庫可能返回字串的情況）
      // 如果表頭的 receipt_amount 為 0 或空，從明細加總計算
      let receiptAmount = typeof header.receipt_amount === 'string' 
        ? parseFloat(header.receipt_amount) || 0 
        : (header.receipt_amount || 0);
      
      // 如果表頭金額為 0，從明細加總
      if (receiptAmount === 0 && lines && lines.length > 0) {
        receiptAmount = lines.reduce((sum: number, line: any) => {
          return sum + (parseFloat(line.gross_amt) || 0);
        }, 0);
      }

      // 組裝詳細資料（使用與 reviews 頁面相同的結構）
      const detail: any = {
        id: header.id,
        expense_date: header.expense_date,
        employee_name: header.employee_name,
        subsidiary_name: header.subsidiary_name,
        description: header.description,
        review_status: header.review_status,
        created_at: header.created_at,
        review_notes: header.review_notes,
        rejection_reason: header.rejection_reason,
        netsuite_sync_status: header.netsuite_sync_status,
        netsuite_internal_id: header.netsuite_internal_id,
        netsuite_tran_id: header.netsuite_tran_id,
        netsuite_sync_error: header.netsuite_sync_error,
        netsuite_url: header.netsuite_url || null,
        receipt_amount: receiptAmount,
        receipt_currency: lines && lines.length > 0 ? (lines[0].currency || 'TWD') : 'TWD',
        receipt_missing: header.receipt_missing || false,
        // 將 lines 資料附加到 review 物件中（用於顯示明細）
        expense_lines: (lines || []).map((line: any) => ({
          id: line.id || `line-${Date.now()}-${Math.random()}`,
          line_number: line.line_number || 0,
          date: line.date || '',
          category_name: line.category_name || null,
          currency: line.currency || 'TWD',
          amount: line.amount ? (typeof line.amount === 'number' ? line.amount : parseFloat(String(line.amount)) || 0) : 0,
          gross_amt: line.gross_amt ? (typeof line.gross_amt === 'number' ? line.gross_amt : parseFloat(String(line.gross_amt)) || 0) : 0,
          memo: line.memo || null,
          department_name: line.department_name || null,
          class_name: line.class_name || null,
          location_name: line.location_name || null,
          invoice_title: line.invoice_title || null,
          invoice_number: line.invoice_number || null,
          invoice_date: line.invoice_date || null,
          seller_name: line.seller_name || null,
          buyer_name: line.buyer_name || null,
          total_amount: line.total_amount ? (typeof line.total_amount === 'number' ? line.total_amount : parseFloat(String(line.total_amount)) || null) : null,
          ocr_success: line.ocr_success || false,
          ocr_confidence: line.ocr_confidence || null,
          ocr_quality_grade: line.ocr_quality_grade || null,
          attachment_url: line.attachment_url || null,
          attachment_base64: line.attachment_base64 || null,
          document_file_path: line.document_file_path || null,
          document_file_name: line.document_file_name || null,
        })),
      };

      setSelectedReview(detail);
      setEditingData(detail); // 初始化編輯資料
      setIsEditing(false); // 重置編輯狀態

      // 為所有有附件的 lines 取得 Signed URL
      for (const line of (detail as any).expense_lines || []) {
        // 優先使用 document_file_path（檔案路徑），如果沒有則使用 attachment_url（可能是舊資料的 URL）
        const filePath = line.document_file_path || line.attachment_url;
        if (filePath) {
          console.log(`[MyExpenses] 為明細 #${line.line_number} 取得 Signed URL:`, filePath);
          const signedUrl = await getSignedUrl(filePath);
          if (signedUrl) {
            console.log(`[MyExpenses] 成功取得 Signed URL 用於:`, filePath);
            setSignedUrls(prev => ({ ...prev, [filePath]: signedUrl }));
          } else {
            console.warn(`[MyExpenses] 無法取得 Signed URL 用於:`, filePath);
          }
        } else {
          console.log(`[MyExpenses] 明細 #${line.line_number} 沒有附件路徑`, {
            attachment_url: line.attachment_url,
            document_file_path: line.document_file_path,
            attachment_base64: line.attachment_base64 ? '有' : '無'
          });
        }
      }
    } catch (error: any) {
      console.error('載入報支詳細資料錯誤:', error);
      alert(`載入詳細資料失敗: ${error.message}`);
      setIsDetailDialogOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch (error) {
      console.error('日期格式化錯誤:', error, dateString);
      return '-';
    }
  };

  // 格式化金額
  const formatAmount = (amount: number | null | undefined, currency: string = 'TWD') => {
    if (amount === null || amount === undefined || isNaN(amount)) return '-';
    try {
      return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: currency || 'TWD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      console.error('金額格式化錯誤:', error, amount, currency);
      return `${amount} ${currency}`;
    }
  };

  // 檢查是否可以編輯（報支人：draft 和 rejected 狀態可以編輯）
  const canEdit = (review: any) => {
    return review.review_status === 'draft' || review.review_status === 'rejected';
  };

  // 保存編輯的資料
  const handleSaveEdit = async () => {
    if (!selectedReview || !editingData) {
      return;
    }

    setSaving(true);
    try {
      // 先重新載入完整的原始資料（包含所有 ID 欄位）
      const { data: originalFullData } = await supabase
        .from('expense_reviews')
        .select('*')
        .eq('id', selectedReview.id)
        .single();

      if (!originalFullData) {
        throw new Error('找不到原始報支資料');
      }

      // 準備更新資料（只包含有變更的欄位）
      const updateData: any = {};

      // 基本欄位
      if (editingData.expense_date !== originalFullData.expense_date) {
        updateData.expense_date = editingData.expense_date;
      }
      if (editingData.receipt_amount !== originalFullData.receipt_amount) {
        updateData.receipt_amount = parseFloat(editingData.receipt_amount?.toString() || '0');
      }
      if ((editingData.description || '') !== (originalFullData.description || '')) {
        updateData.description = editingData.description || null;
      }
      if (editingData.receipt_missing !== originalFullData.receipt_missing) {
        updateData.receipt_missing = editingData.receipt_missing || false;
      }

      // ID 欄位
      const currentData = editingData as any;
      const originalData = originalFullData as any;

      if (currentData.employee_id && currentData.employee_id !== originalData.employee_id) {
        updateData.employee_id = currentData.employee_id;
      }
      if (currentData.expense_category_id && currentData.expense_category_id !== originalData.expense_category_id) {
        updateData.expense_category_id = currentData.expense_category_id;
      }
      if (currentData.subsidiary_id && currentData.subsidiary_id !== originalData.subsidiary_id) {
        updateData.subsidiary_id = currentData.subsidiary_id;
      }
      if (currentData.currency_id && currentData.currency_id !== originalData.currency_id) {
        updateData.currency_id = currentData.currency_id;
      }
      // 處理可選欄位（null 值比較）
      const currentDeptId = currentData.department_id || null;
      const originalDeptId = originalData.department_id || null;
      if (currentDeptId !== originalDeptId) {
        updateData.department_id = currentDeptId;
      }
      
      const currentLocId = currentData.location_id || null;
      const originalLocId = originalData.location_id || null;
      if (currentLocId !== originalLocId) {
        updateData.location_id = currentLocId;
      }
      
      const currentClassId = currentData.class_id || null;
      const originalClassId = originalData.class_id || null;
      if (currentClassId !== originalClassId) {
        updateData.class_id = currentClassId;
      }

      // 如果沒有變更，直接返回
      if (Object.keys(updateData).length === 0) {
        setIsEditing(false);
        setSaving(false);
        return;
      }

      // 呼叫更新 API
      const response = await fetch('/api/update-expense-review', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          review_id: selectedReview.id,
          ...updateData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || '更新失敗');
      }

      if (result.success) {
        // 更新當前選中的報支資料
        const updatedReview = result.data as any;
        const updatedDetail = {
          ...selectedReview,
          ...updatedReview,
        };
        
        setSelectedReview(updatedDetail);
        setEditingData(updatedDetail);
        
        // 更新列表中的對應項目
        setReviews(prevReviews => 
          prevReviews.map(review => 
            review.id === selectedReview.id ? {
              ...review,
              expense_date: updatedReview.expense_date,
              employee_name: updatedReview.employee_name,
              subsidiary_name: updatedReview.subsidiary_name,
              description: updatedReview.description,
              receipt_amount: updatedReview.receipt_amount,
              receipt_currency: updatedReview.receipt_currency || review.receipt_currency,
            } : review
          )
        );
        
        setIsEditing(false);
        alert('報支資料已更新');
        // 重新載入列表以確保資料同步
        loadReviews();
      } else {
        throw new Error(result.error || '更新失敗');
      }
    } catch (error: any) {
      console.error('保存報支資料錯誤:', error);
      alert(`更新失敗: ${error.message || '未知錯誤'}`);
    } finally {
      setSaving(false);
    }
  };

  // 取得狀態 Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-amber-600 text-white">草稿</Badge>;
      case 'pending':
        return <Badge className="bg-purple-500 text-white">審核中</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">審核通過</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">已拒絕</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500">已取消</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">我的費用報告</h1>
        </div>
        <p className="text-muted-foreground">
          查看您提交的所有報支項目
        </p>
      </div>

      {/* 狀態篩選 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-2 items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStatusFilter('all')}
                className={statusFilter === 'all' ? 'border-blue-500 border-2 text-blue-600 dark:text-blue-400' : ''}
              >
                全部
              </Button>
              <Button
                variant="outline"
                onClick={() => setStatusFilter('draft')}
                className={statusFilter === 'draft' ? 'border-blue-500 border-2 text-blue-600 dark:text-blue-400' : ''}
              >
                草稿
              </Button>
              <Button
                variant="outline"
                onClick={() => setStatusFilter('pending')}
                className={statusFilter === 'pending' ? 'border-blue-500 border-2 text-blue-600 dark:text-blue-400' : ''}
              >
                審核中
              </Button>
              <Button
                variant="outline"
                onClick={() => setStatusFilter('approved')}
                className={statusFilter === 'approved' ? 'border-blue-500 border-2 text-blue-600 dark:text-blue-400' : ''}
              >
                審核通過
              </Button>
              <Button
                variant="outline"
                onClick={() => setStatusFilter('rejected')}
                className={statusFilter === 'rejected' ? 'border-blue-500 border-2 text-blue-600 dark:text-blue-400' : ''}
              >
                已拒絕
              </Button>
              <Button
                variant="outline"
                onClick={() => setStatusFilter('cancelled')}
                className={statusFilter === 'cancelled' ? 'border-blue-500 border-2 text-blue-600 dark:text-blue-400' : ''}
              >
                已取消
              </Button>
            </div>
            <Button
              variant="default"
              onClick={() => router.push('/dashboard/ocr-expense')}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              新增費用報告
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 報支列表 */}
      <Card>
        <CardHeader>
          <CardTitle>報支列表</CardTitle>
          <CardDescription>
            共 {reviews.length} 筆報支項目
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span>載入中...</span>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              尚無報支項目
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center font-bold bg-gray-100 dark:bg-gray-800">報告狀態</TableHead>
                  <TableHead className="text-center font-bold bg-gray-100 dark:bg-gray-800">費用報告編號</TableHead>
                  <TableHead className="text-center font-bold bg-gray-100 dark:bg-gray-800">Netsuite#</TableHead>
                  <TableHead className="text-center font-bold bg-gray-100 dark:bg-gray-800">報告日期</TableHead>
                  <TableHead className="text-center font-bold bg-gray-100 dark:bg-gray-800">員工</TableHead>
                  <TableHead className="text-center font-bold bg-gray-100 dark:bg-gray-800">總金額</TableHead>
                  <TableHead className="text-center font-bold bg-gray-100 dark:bg-gray-800">查看</TableHead>
                  <TableHead className="text-center font-bold bg-gray-100 dark:bg-gray-800">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>{getStatusBadge(review.review_status)}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {review.expense_report_number || '-'}
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {review.netsuite_tran_id && review.netsuite_url ? (
                        <a
                          href={review.netsuite_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          title="點擊開啟 NetSuite 頁面（需要登入）"
                        >
                          {review.netsuite_tran_id}
                        </a>
                      ) : (
                        review.netsuite_tran_id || '-'
                      )}
                    </TableCell>
                    <TableCell>{formatDate(review.expense_date)}</TableCell>
                    <TableCell>{review.employee_name || '-'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatAmount(review.receipt_amount || 0, review.receipt_currency || 'TWD')}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(review)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        查看
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        {/* draft 和 rejected 狀態可以編輯和提交 */}
                        {(review.review_status === 'draft' || review.review_status === 'rejected') && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => router.push(`/dashboard/ocr-expense?id=${review.id}`)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              編輯
                            </Button>
                            {review.review_status === 'draft' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(review)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                刪除
                              </Button>
                            )}
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleSubmit(review)}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              {review.review_status === 'rejected' ? '重新提交' : '提交'}
                            </Button>
                          </>
                        )}
                        {/* pending、approved、cancelled 狀態只能查看，不能編輯或刪除 */}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 詳細資訊對話框 */}
      <Dialog 
        open={isDetailDialogOpen} 
        onOpenChange={(open) => {
          setIsDetailDialogOpen(open);
          // 關閉對話框時，如果不在編輯模式，不需要做任何事
          // 如果在編輯模式，重置編輯狀態
          if (!open && isEditing) {
            setIsEditing(false);
            setEditingData(selectedReview as any); // 重置為原始資料
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>報支詳細資訊</DialogTitle>
            <DialogDescription>
              報支編號：{selectedReview?.id}
              {selectedReview && (selectedReview.review_status === 'draft' || selectedReview.review_status === 'rejected') && (
                <span className="block mt-2 text-sm text-blue-600 dark:text-blue-400">
                  {selectedReview.review_status === 'rejected' ? '此報告已被拒絕，您可以修改後重新提交。' : '您可以編輯此報告。'}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span>載入詳細資料中...</span>
            </div>
          ) : selectedReview && editingData ? (
            <div className="space-y-6">
              {/* 基本資訊 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">報支日期</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editingData.expense_date || ''}
                      onChange={(e) => setEditingData({ ...editingData, expense_date: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1">{formatDate(selectedReview.expense_date)}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">員工 *</Label>
                  {isEditing ? (
                    <Select
                      value={editingData.employee_id || ''}
                      onValueChange={(value) => {
                        const employee = formOptions.employees.find(e => e.id === value);
                        setEditingData({
                          ...editingData,
                          employee_id: value,
                          employee_name: employee?.name || null,
                        });
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="請選擇員工" />
                      </SelectTrigger>
                      <SelectContent>
                        {formOptions.employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1">{selectedReview.employee_name || '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">公司別 *</Label>
                  {isEditing ? (
                    <Select
                      value={editingData.subsidiary_id || ''}
                      onValueChange={(value) => {
                        const subsidiary = formOptions.subsidiaries.find(s => s.id === value);
                        setEditingData({
                          ...editingData,
                          subsidiary_id: value,
                          subsidiary_name: subsidiary?.name || null,
                        });
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="請選擇公司別" />
                      </SelectTrigger>
                      <SelectContent>
                        {formOptions.subsidiaries.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1">{selectedReview.subsidiary_name || '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">金額 *</Label>
                  {isEditing ? (
                    <div className="mt-1 flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={editingData.receipt_amount || ''}
                        onChange={(e) => setEditingData({ ...editingData, receipt_amount: parseFloat(e.target.value) || 0 })}
                        className="flex-1"
                      />
                      <Select
                        value={(() => {
                          const currentCurrencyId = editingData.currency_id;
                          const currentSymbol = editingData.receipt_currency || (selectedReview as any).receipt_currency;
                          if (currentCurrencyId) {
                            const currency = formOptions.currencies.find(c => c.id === currentCurrencyId);
                            return currency?.symbol || currentSymbol;
                          }
                          return currentSymbol;
                        })()}
                        onValueChange={(symbol) => {
                          const currency = formOptions.currencies.find(c => c.symbol === symbol);
                          setEditingData({
                            ...editingData,
                            currency_id: currency?.id || null,
                            receipt_currency: symbol,
                          });
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {formOptions.currencies.map((curr) => (
                            <SelectItem key={curr.id} value={curr.symbol}>
                              {curr.symbol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <p className="mt-1 font-medium">{formatAmount((selectedReview as any).receipt_amount, (selectedReview as any).receipt_currency)}</p>
                  )}
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">描述</Label>
                  {isEditing ? (
                    <Textarea
                      value={editingData.description || ''}
                      onChange={(e) => setEditingData({ ...editingData, description: e.target.value })}
                      className="mt-1"
                      rows={3}
                      placeholder="請輸入描述..."
                    />
                  ) : (
                    <p className="mt-1">{selectedReview.description || '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">收據遺失</Label>
                  {isEditing ? (
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingData.receipt_missing || false}
                        onChange={(e) => setEditingData({ ...editingData, receipt_missing: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">是</span>
                    </div>
                  ) : (
                    <p className="mt-1">{(selectedReview as any).receipt_missing ? '是' : '否'}</p>
                  )}
                </div>
              </div>

              {/* OCR 資訊 */}
              {(selectedReview as any).invoice_number && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">發票資訊</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">發票號碼</Label>
                      <p className="mt-1">{(selectedReview as any).invoice_number}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">發票日期</Label>
                      <p className="mt-1">{formatDate((selectedReview as any).invoice_date)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">賣方名稱</Label>
                      <p className="mt-1">{(selectedReview as any).seller_name || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">買方名稱</Label>
                      <p className="mt-1">{(selectedReview as any).buyer_name || '-'}</p>
                    </div>
                    {(selectedReview as any).total_amount && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">總計金額</Label>
                        <p className="mt-1 font-medium">{formatAmount((selectedReview as any).total_amount, (selectedReview as any).receipt_currency)}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">OCR 狀態</Label>
                      <p className="mt-1">
                        {(() => {
                          // 檢查是否有 OCR 資料（從 expense_lines 判斷）
                          const hasOcrData = (selectedReview as any).expense_lines && 
                            (selectedReview as any).expense_lines.some((line: any) => 
                              line.ocr_success !== undefined || 
                              line.ocr_confidence !== null || 
                              line.ocr_quality_grade !== null
                            );
                          
                          if (!hasOcrData) {
                            return <span className="text-gray-600 dark:text-gray-400">無 OCR</span>;
                          }
                          
                          // 檢查是否有成功的 OCR（至少有一個 line 的 ocr_success 為 true）
                          const hasSuccessfulOcr = (selectedReview as any).expense_lines && 
                            (selectedReview as any).expense_lines.some((line: any) => line.ocr_success === true);
                          
                          if (hasSuccessfulOcr) {
                            return <span className="text-green-700 dark:text-green-400 font-medium">OCR 成功</span>;
                          } else {
                            return <span className="text-red-600 dark:text-red-400 font-medium">OCR 失敗</span>;
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 報支明細（Expense Lines） */}
              {(selectedReview as any).expense_lines && (selectedReview as any).expense_lines.length > 0 ? (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">報支明細</h3>
                  <div className="space-y-6">
                    {(selectedReview as any).expense_lines.map((line: any, index: number) => (
                      <div key={line.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">明細 #{line.line_number}</h4>
                          <span className="text-sm font-medium text-primary">
                            {formatAmount(line.gross_amt, line.currency)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">日期</Label>
                            <p className="mt-1">{formatDate(line.date)}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">費用類別</Label>
                            <p className="mt-1">{line.category_name || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">金額</Label>
                            <p className="mt-1">{formatAmount(line.amount, line.currency)}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">總金額</Label>
                            <p className="mt-1 font-medium">{formatAmount(line.gross_amt, line.currency)}</p>
                          </div>
                          {line.department_name && (
                            <div>
                              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">部門</Label>
                              <p className="mt-1">{line.department_name}</p>
                            </div>
                          )}
                          {line.class_name && (
                            <div>
                              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">類別</Label>
                              <p className="mt-1">{line.class_name}</p>
                            </div>
                          )}
                          {line.location_name && (
                            <div>
                              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">地點</Label>
                              <p className="mt-1">{line.location_name}</p>
                            </div>
                          )}
                          {line.memo && (
                            <div className="col-span-2">
                              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">備註</Label>
                              <p className="mt-1">{line.memo}</p>
                            </div>
                          )}
                        </div>

                        {/* OCR 發票資訊 */}
                        {(line.invoice_number || line.invoice_title) && (
                          <div className="border-t pt-4 mt-4">
                            <h5 className="text-sm font-semibold mb-3">發票資訊</h5>
                            <div className="grid grid-cols-2 gap-4">
                              {line.invoice_number && (
                                <div>
                                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">發票號碼</Label>
                                  <p className="mt-1">{line.invoice_number}</p>
                                </div>
                              )}
                              {line.invoice_date && (
                                <div>
                                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">發票日期</Label>
                                  <p className="mt-1">{formatDate(line.invoice_date)}</p>
                                </div>
                              )}
                              {line.seller_name && (
                                <div>
                                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">賣方名稱</Label>
                                  <p className="mt-1">{line.seller_name}</p>
                                </div>
                              )}
                              {line.buyer_name && (
                                <div>
                                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">買方名稱</Label>
                                  <p className="mt-1">{line.buyer_name}</p>
                                </div>
                              )}
                              {line.total_amount && (
                                <div>
                                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">總計金額</Label>
                                  <p className="mt-1 font-medium">{formatAmount(line.total_amount, line.currency)}</p>
                                </div>
                              )}
                              {(line.ocr_confidence !== null && line.ocr_confidence !== undefined) || line.ocr_quality_grade ? (
                                <div>
                                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">OCR 信心度 / 等級</Label>
                                  <p className="mt-1">
                                    {line.ocr_confidence !== null && line.ocr_confidence !== undefined
                                      ? (() => {
                                          const confidence = parseFloat(String(line.ocr_confidence));
                                          // 如果值 <= 1，表示是小數格式（0.01 = 1%），需要乘以 100
                                          // 如果值 > 1，表示已經是百分比格式（90 = 90%），直接顯示
                                          const percentage = confidence <= 1 ? confidence * 100 : confidence;
                                          return `${percentage.toFixed(0)}%`;
                                        })()
                                      : '-'
                                    }
                                    {line.ocr_quality_grade && (
                                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                                        (等級: {line.ocr_quality_grade})
                                      </span>
                                    )}
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        )}

                        {/* 附件預覽 */}
                        {(line.document_file_path || line.attachment_url || line.attachment_base64) && (
                          <div className="border-t pt-4 mt-4">
                            <h5 className="text-sm font-semibold mb-3">附件</h5>
                            <div className="flex justify-center">
                              {(line.document_file_path || line.attachment_url) ? (
                                <AttachmentPreview
                                  attachmentUrl={line.document_file_path || line.attachment_url || ''}
                                  signedUrl={signedUrls[line.document_file_path || line.attachment_url || '']}
                                  base64Fallback={line.attachment_base64}
                                  onGetSignedUrl={getSignedUrl}
                                />
                              ) : line.attachment_base64 ? (
                                isPDF(null, line.attachment_base64) ? (
                                  <iframe
                                    src={line.attachment_base64.startsWith('data:') 
                                      ? line.attachment_base64 
                                      : `data:application/pdf;base64,${line.attachment_base64}`}
                                    className="w-full h-[600px] rounded-lg border border-gray-200 dark:border-gray-700"
                                    title={`PDF 附件 - 明細 #${line.line_number}`}
                                  />
                                ) : (
                                  <img
                                    src={`data:image/jpeg;base64,${line.attachment_base64}`}
                                    alt={`收據附件 - 明細 #${line.line_number}`}
                                    className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                                  />
                                )
                              ) : null}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* 審核資訊 */}
              {selectedReview.review_status !== 'pending' && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">審核資訊</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedReview.review_notes && (
                      <div className="col-span-2">
                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">審核備註</Label>
                        <p className="mt-1">{selectedReview.review_notes}</p>
                      </div>
                    )}
                    {selectedReview.rejection_reason && (
                      <div className="col-span-2">
                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">拒絕原因</Label>
                        <p className="mt-1 text-red-600 dark:text-red-400">{selectedReview.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 附件預覽（表頭層級的附件，如果沒有明細層級的附件） */}
              {(!(selectedReview as any).expense_lines || (selectedReview as any).expense_lines.length === 0) && 
               ((selectedReview as any).attachment_url || (selectedReview as any).attachment_base64) && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">附件</h3>
                  <div className="flex justify-center">
                    {(selectedReview as any).attachment_url ? (
                      <AttachmentPreview
                        attachmentUrl={(selectedReview as any).attachment_url}
                        signedUrl={signedUrls[(selectedReview as any).attachment_url]}
                        base64Fallback={(selectedReview as any).attachment_base64}
                        onGetSignedUrl={getSignedUrl}
                      />
                    ) : (selectedReview as any).attachment_base64 ? (
                      isPDF(null, (selectedReview as any).attachment_base64) ? (
                        <iframe
                          src={(selectedReview as any).attachment_base64.startsWith('data:') 
                            ? (selectedReview as any).attachment_base64 
                            : `data:application/pdf;base64,${(selectedReview as any).attachment_base64}`}
                          className="w-full h-[600px] rounded-lg border border-gray-200 dark:border-gray-700"
                          title="PDF 附件"
                        />
                      ) : (
                        <img
                          src={`data:image/jpeg;base64,${(selectedReview as any).attachment_base64}`}
                          alt="收據附件"
                          className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                        />
                      )
                    ) : null}
                  </div>
                </div>
              )}

              {/* 審核資訊 */}
              {selectedReview.review_status !== 'pending' && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">審核資訊</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">審核狀態</Label>
                      <div className="mt-1">{getStatusBadge(selectedReview.review_status)}</div>
                    </div>
                    {selectedReview.review_notes && (
                      <div className="col-span-2">
                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">審核備註</Label>
                        <p className="mt-1">{selectedReview.review_notes}</p>
                      </div>
                    )}
                    {selectedReview.rejection_reason && (
                      <div className="col-span-2">
                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">拒絕原因</Label>
                        <p className="mt-1 text-red-600 dark:text-red-400">{selectedReview.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* NetSuite 同步狀態 */}
              {selectedReview.review_status === 'approved' && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">NetSuite 同步狀態</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">同步狀態</Label>
                      <div className="mt-1">
                        {selectedReview.netsuite_sync_status === 'success' ? (
                          <Badge className="bg-green-500 text-white">✅ 已同步</Badge>
                        ) : selectedReview.netsuite_sync_status === 'syncing' ? (
                          <Badge className="bg-yellow-500 text-white">🔄 與 NetSuite 同步中</Badge>
                        ) : selectedReview.netsuite_sync_status === 'failed' ? (
                          <Badge className="bg-red-500 text-white">❌ 同步失敗</Badge>
                        ) : (
                          <Badge className="bg-gray-400 text-white">⏳ 待同步</Badge>
                        )}
                      </div>
                    </div>
                    {(selectedReview as any).netsuite_url && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">NetSuite 連結</Label>
                        <p className="mt-1">
                          <a
                            href={(selectedReview as any).netsuite_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                          >
                            {(selectedReview as any).netsuite_url}
                          </a>
                        </p>
                      </div>
                    )}
                    {!(selectedReview as any).netsuite_url && selectedReview.netsuite_internal_id && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">NetSuite ID</Label>
                        <p className="mt-1 font-mono text-sm">{selectedReview.netsuite_internal_id}</p>
                      </div>
                    )}
                    {selectedReview.netsuite_tran_id && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">交易編號</Label>
                        <p className="mt-1 font-mono text-sm">{selectedReview.netsuite_tran_id}</p>
                      </div>
                    )}
                    {selectedReview.netsuite_sync_error && (
                      <div className="col-span-2">
                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">錯誤訊息</Label>
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{selectedReview.netsuite_sync_error}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <div className="flex gap-2 justify-end w-full">
              {/* 只有 draft 和 rejected 狀態可以編輯和提交 */}
              {selectedReview && (selectedReview.review_status === 'draft' || selectedReview.review_status === 'rejected') && (
                <>
                  {!isEditing ? (
                    <Button
                      variant="default"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      編輯
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setEditingData(selectedReview as any); // 重置為原始資料
                        }}
                        disabled={saving}
                      >
                        取消
                      </Button>
                      <Button
                        variant="default"
                        onClick={handleSaveEdit}
                        disabled={saving}
                      >
                        {saving ? (
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
                    </>
                  )}
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      if (selectedReview) {
                        handleSubmit(selectedReview as any);
                        setIsDetailDialogOpen(false);
                      }
                    }}
                    disabled={isEditing || saving}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {selectedReview?.review_status === 'rejected' ? '重新提交' : '提交'}
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                關閉
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

