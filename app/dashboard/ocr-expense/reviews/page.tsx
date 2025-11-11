'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FileText, CheckCircle2, XCircle, Clock, Eye, Image as ImageIcon, Calendar, User, Building2, MapPin, DollarSign, AlertCircle, Loader2, Save, Edit, X, Trash2, Receipt, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface ExpenseReview {
  id: string;
  expense_date: string;
  employee_name: string | null;
  subsidiary_name: string | null;
  description: string | null;
  review_status: string;
  expense_report_number: string | null; // 費用報告編號
  netsuite_sync_status: string | null; // NetSuite 同步狀態
  netsuite_internal_id: number | null; // NetSuite Internal ID
  netsuite_tran_id: string | null; // NetSuite 交易編號（NetSuite 報告編號）
  netsuite_sync_error: string | null; // 同步錯誤訊息
  netsuite_url: string | null; // NetSuite 網址（用於直接連結）
  created_by_name: string | null;
  created_at: string;
  review_notes: string | null;
  rejection_reason: string | null;
  // 從 expense_lines 取得的資料（聚合）
  receipt_amount: number; // 從 expense_lines 加總的 gross_amt
  receipt_currency: string; // 從第一個 expense_line 取得的 currency
  expense_category_name: string | null; // 從第一個 expense_line 取得的 category_name
  location_name: string | null; // 從第一個 expense_line 取得的 location_name
  department_name: string | null; // 從第一個 expense_line 取得的 department_name
  class_name: string | null; // 從第一個 expense_line 取得的 class_name
  invoice_number: string | null; // 從第一個 expense_line 取得的 invoice_number
  ocr_success: boolean; // 從第一個 expense_line 取得的 ocr_success
  ocr_file_name: string | null; // 從第一個 expense_line 取得的 ocr_file_name
  ocr_processed_at: string | null; // 從第一個 expense_line 取得的 ocr_processed_at
  // 以下欄位保留以維持向後相容（但可能為 null）
  receipt_missing: boolean;
  invoice_title: string | null;
  invoice_date: string | null;
  seller_name: string | null;
  buyer_name: string | null;
  total_amount: number | null;
  ocr_confidence: number | null;
  ocr_quality_grade: string | null;
  ocr_file_id: string | null;
  attachment_url: string | null;
  attachment_base64: string | null;
}

type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

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
        // 如果 Signed URL 載入失敗，嘗試使用 Base64 備用
        if (base64Fallback) {
          setFileSrc(`data:image/jpeg;base64,${base64Fallback}`);
        } else {
          setError(true);
        }
      }}
    />
  );
}

export default function ExpenseReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<ExpenseReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<ExpenseReview | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'cancel' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('pending');
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({}); // 儲存 Signed URL
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set()); // 正在同步的 ID
  const isLoadingReviewsRef = useRef(false); // 防止重複載入的標記（使用 ref 避免觸發重新渲染）
  const [isEditing, setIsEditing] = useState(false); // 是否處於編輯模式
  const [editingData, setEditingData] = useState<Partial<ExpenseReview> | null>(null); // 編輯中的資料
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

  // 使用 useMemo 快取 supabase client，避免每次渲染都重新建立
  const supabase = useMemo(() => createClient(), []);

  // 載入報支審核列表（優化：不載入大型欄位如 attachment_base64）
  const loadReviews = useCallback(async () => {
    // 如果正在載入，避免重複請求
    if (isLoadingReviewsRef.current) {
      // 只在開發環境記錄
      if (process.env.NODE_ENV === 'development') {
        console.log('[loadReviews] 正在載入中，跳過重複請求');
      }
      return;
    }
    
    isLoadingReviewsRef.current = true;
    setLoading(true);
    
    const startTime = Date.now();
    // 只在開發環境記錄詳細日誌
    if (process.env.NODE_ENV === 'development') {
      console.log('[loadReviews] 開始載入，狀態篩選:', statusFilter);
    }
    
    try {
      // ⚠️ 效能優化：列表查詢時只選擇列表顯示需要的欄位
      // 注意：expense_reviews 已簡化為表頭，明細資料在 expense_lines 表中
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
          netsuite_sync_status,
          netsuite_internal_id,
          netsuite_tran_id,
          netsuite_sync_error,
          netsuite_url,
          created_by_name,
          created_at,
          expense_lines (
            category_name,
            location_name,
            department_name,
            class_name,
            currency,
            gross_amt,
            invoice_number,
            ocr_success,
            ocr_confidence,
            ocr_quality_grade,
            ocr_file_name,
            ocr_processed_at
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100); // 限制最多 100 筆，避免載入過多資料

      // 根據狀態篩選
      if (statusFilter !== 'all') {
        query = query.eq('review_status', statusFilter);
      }

      // 執行查詢（不使用 Promise.race，因為 Supabase 查詢本身已經有超時機制）
      const { data, error } = await query;

      const duration = Date.now() - startTime;
      // 只在開發環境或查詢時間過長時記錄
      if (process.env.NODE_ENV === 'development' || duration > 1000) {
        console.log(`[loadReviews] 查詢完成，耗時: ${duration}ms，資料筆數: ${data?.length || 0}`);
      }

      if (error) {
        console.error('[loadReviews] 查詢錯誤:', error);
        throw error;
      }
      
      // 處理查詢結果：將 expense_lines 資料扁平化
      const processedData = (data || []).map((review: any) => {
        const lines = review.expense_lines || [];
        const firstLine = lines[0] || null;
        
        // 計算總金額（加總所有 lines 的 gross_amt）
        const receiptAmount = lines.reduce((sum: number, line: any) => {
          return sum + (parseFloat(line.gross_amt) || 0);
        }, 0);
        
        // 從第一個 line 取得其他資訊
        // 確保 currency 有有效值（不能是空字串或 null）
        const currency = firstLine?.currency && firstLine.currency.trim() !== '' 
          ? firstLine.currency.trim() 
          : 'TWD';
        
        return {
          ...review,
          receipt_amount: receiptAmount,
          receipt_currency: currency,
          expense_category_name: firstLine?.category_name || null,
          location_name: firstLine?.location_name || null,
          department_name: firstLine?.department_name || null,
          class_name: firstLine?.class_name || null,
          invoice_number: firstLine?.invoice_number || null,
          ocr_success: firstLine?.ocr_success || false,
          ocr_file_name: firstLine?.ocr_file_name || null,
          ocr_processed_at: firstLine?.ocr_processed_at || null,
          // 向後相容欄位
          receipt_missing: false,
          invoice_title: null,
          invoice_date: null,
          seller_name: null,
          buyer_name: null,
          total_amount: receiptAmount,
          ocr_confidence: firstLine?.ocr_confidence || null,
          ocr_quality_grade: firstLine?.ocr_quality_grade || null,
          ocr_file_id: null,
          attachment_url: null,
          attachment_base64: null,
        };
      });
      
      setReviews(processedData as ExpenseReview[]);
    } catch (error: any) {
      console.error('[loadReviews] 載入報支審核列表錯誤:', error);
      console.error('[loadReviews] 錯誤詳情:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      alert(`載入失敗: ${error.message || '未知錯誤'}`);
      setReviews([]); // 發生錯誤時清空列表
    } finally {
      const totalDuration = Date.now() - startTime;
      // 只在開發環境或載入時間過長時記錄
      if (process.env.NODE_ENV === 'development' || totalDuration > 1000) {
        console.log(`[loadReviews] 載入流程完成，總耗時: ${totalDuration}ms`);
      }
      setLoading(false);
      isLoadingReviewsRef.current = false;
    }
  }, [statusFilter, supabase]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

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

  // 同步到 NetSuite
  const syncToNetSuite = async (reviewId: string) => {
    if (syncingIds.has(reviewId)) {
      return; // 正在同步中，避免重複請求
    }

    setSyncingIds(prev => new Set(prev).add(reviewId));

    try {
      const response = await fetch('/api/sync-expense-to-netsuite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ review_id: reviewId }),
      });

      const result = await response.json();

      if (!response.ok) {
        // 如果是「正在同步中」的錯誤，這是正常的（可能是重複調用），不當作錯誤處理
        if (result.error && result.error.includes('正在同步中')) {
          console.log('報支已在同步中，跳過重複同步');
          // 更新 UI 狀態為同步中（如果還沒更新的話）
          setReviews(prevReviews => 
            prevReviews.map(review => 
              review.id === reviewId && review.netsuite_sync_status !== 'syncing'
                ? { ...review, netsuite_sync_status: 'syncing' }
                : review
            )
          );
          // 如果當前選中的報支是這個，也更新它
          if (selectedReview && selectedReview.id === reviewId) {
            setSelectedReview(prev => prev && prev.netsuite_sync_status !== 'syncing' ? {
              ...prev,
              netsuite_sync_status: 'syncing',
            } : prev);
          }
          return; // 正常返回，不拋出錯誤
        }
        
        const error = new Error(result.error || result.message || '同步失敗');
        (error as any).details = result.details;
        throw error;
      }

      if (result.success) {
        // 背景同步成功，靜默更新列表狀態（不顯示通知）
        // 優化：只更新列表中的該項目，而不是重新載入整個列表
        setReviews(prevReviews => 
          prevReviews.map(review => 
            review.id === reviewId 
              ? {
                  ...review,
                  netsuite_sync_status: 'success',
                  netsuite_internal_id: result.netsuite_internal_id || null,
                  netsuite_tran_id: result.netsuite_tran_id || null,
                  netsuite_sync_error: null,
                  netsuite_url: result.netsuite_url || null,
                  netsuite_synced_at: new Date().toISOString(),
                }
              : review
          )
        );
        
        // 如果當前選中的報支是這個，也更新它
        if (selectedReview && selectedReview.id === reviewId) {
          setSelectedReview(prev => prev ? {
            ...prev,
            netsuite_sync_status: 'success',
            netsuite_internal_id: result.netsuite_internal_id || null,
            netsuite_tran_id: result.netsuite_tran_id || null,
            netsuite_sync_error: null,
            netsuite_url: result.netsuite_url || null,
            netsuite_synced_at: new Date().toISOString(),
          } : null);
        }
        
        // 背景更新資料庫（API 已經更新了，這裡是確保前端狀態一致）
        // 注意：API 端點已經更新了資料庫，這裡主要是為了確保前端狀態同步
      } else {
        throw new Error(result.error || '同步失敗');
      }
    } catch (error: any) {
      console.error('同步到 NetSuite 錯誤:', error);
      const errorMessage = error.message || '未知錯誤';
      
      // 靜默更新失敗狀態（不顯示 alert，讓使用者從列表中看到狀態）
      setReviews(prevReviews => 
        prevReviews.map(review => 
          review.id === reviewId 
            ? {
                ...review,
                netsuite_sync_status: 'failed',
                netsuite_sync_error: errorMessage,
              }
            : review
        )
      );
      
      // 如果當前選中的報支是這個，也更新它
      if (selectedReview && selectedReview.id === reviewId) {
        setSelectedReview(prev => prev ? {
          ...prev,
          netsuite_sync_status: 'failed',
          netsuite_sync_error: errorMessage,
        } : null);
      }
      
      // 背景更新資料庫中的失敗狀態
      try {
        await supabase
          .from('expense_reviews')
          .update({
            netsuite_sync_status: 'failed',
            netsuite_sync_error: errorMessage,
          })
          .eq('id', reviewId);
      } catch (dbError) {
        console.error('更新資料庫同步狀態失敗:', dbError);
      }
    } finally {
      setSyncingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(reviewId);
        return newSet;
      });
    }
  };

  // 從 attachment_url 提取檔案路徑
  const extractFilePath = useCallback((url: string): string | null => {
    try {
      // URL 格式：https://xxx.supabase.co/storage/v1/object/public/expense-receipts/{path}
      // 或：https://xxx.supabase.co/storage/v1/object/sign/expense-receipts/{path}?token=...
      // 處理完整 URL（可能包含查詢參數，例如 Signed URL 的 token）
      const match = url.match(/\/expense-receipts\/(.+?)(?:\?|$)/);
      if (match && match[1]) {
        // 解碼 URL（處理特殊字元）
        return decodeURIComponent(match[1]);
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // 取得 Signed URL（用於 Private bucket）
  const getSignedUrl = useCallback(async (urlOrPath: string): Promise<string | null> => {
    // 如果已經有快取的 Signed URL，直接返回
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
        .createSignedUrl(filePath, 3600); // 有效期 1 小時

      if (error) {
        console.error('取得 Signed URL 錯誤:', error);
        return null;
      }

      if (data?.signedUrl) {
        // 快取 Signed URL
        setSignedUrls(prev => ({ ...prev, [urlOrPath]: data.signedUrl }));
        return data.signedUrl;
      }

      return null;
    } catch (error) {
      console.error('取得 Signed URL 錯誤:', error);
      return null;
    }
  }, [signedUrls, supabase, extractFilePath]);

  // 開啟詳細資訊對話框（使用與「我的報支」相同的 API，確保能顯示明細）
  const handleViewDetails = async (review: ExpenseReview, autoEdit: boolean = false) => {
    setIsDetailDialogOpen(true);
    setIsEditing(false); // 先重置編輯狀態
    setDetailLoading(true);
    setSelectedReview(null);

    try {
      // 使用與「我的報支」相同的 API，確保能取得完整的 expense_lines 資料
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

      const processedHeader = {
        ...header,
        receipt_amount: receiptAmount,
        total_amount: header.total_amount 
          ? (typeof header.total_amount === 'string' 
            ? parseFloat(header.total_amount) || null 
            : header.total_amount)
          : null,
      };

      // 組裝詳細資料（包含 expense_lines）
      const detail: ExpenseReview = {
        ...processedHeader,
        // 將 lines 資料附加到 review 物件中（用於顯示明細）
        expense_lines: (lines || []).map((line: any) => ({
          id: line.id || `line-${Date.now()}-${Math.random()}`,
          line_number: line.line_number || 0,
          // 可編輯欄位
          date: line.date || '',
          category_id: line.category_id || null,
          category_name: line.category_name || null,
          currency_id: line.currency_id || null,
          currency: line.currency || 'TWD',
          foreign_amount: line.foreign_amount || null,
          exchange_rate: line.exchange_rate || 1.0,
          amount: line.amount ? (typeof line.amount === 'number' ? line.amount : parseFloat(String(line.amount)) || 0) : 0,
          tax_code: line.tax_code || null,
          tax_rate: line.tax_rate || null,
          tax_amt: line.tax_amt || null,
          gross_amt: line.gross_amt ? (typeof line.gross_amt === 'number' ? line.gross_amt : parseFloat(String(line.gross_amt)) || 0) : 0,
          memo: line.memo || null,
          department_id: line.department_id || null,
          department_name: line.department_name || null,
          class_id: line.class_id || null,
          class_name: line.class_name || null,
          location_id: line.location_id || null,
          location_name: line.location_name || null,
          customer_id: line.customer_id || null,
          customer_name: line.customer_name || null,
          project_task_id: line.project_task_id || null,
          project_task_name: line.project_task_name || null,
          billable: line.billable || false,
          // OCR 資料（只顯示，不編輯）
          invoice_title: line.invoice_title || null,
          invoice_number: line.invoice_number || null,
          invoice_date: line.invoice_date || null,
          format_code: line.format_code || null,
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
      } as any;

      setSelectedReview(detail);
      setEditingData(detail as any);

      // 為所有有附件的 lines 取得 Signed URL
      for (const line of (detail as any).expense_lines || []) {
        // 優先使用 document_file_path（檔案路徑），如果沒有則使用 attachment_url（可能是舊資料的 URL）
        const filePath = line.document_file_path || line.attachment_url;
        if (filePath) {
          console.log(`[Reviews] 為明細 #${line.line_number} 取得 Signed URL:`, filePath);
          const signedUrl = await getSignedUrl(filePath);
          if (signedUrl) {
            console.log(`[Reviews] 成功取得 Signed URL 用於:`, filePath);
            setSignedUrls(prev => ({ ...prev, [filePath]: signedUrl }));
          } else {
            console.warn(`[Reviews] 無法取得 Signed URL 用於:`, filePath);
          }
        }
      }

      // 如果指定自動進入編輯模式，則設置編輯狀態
      if (autoEdit) {
        setIsEditing(true);
      }
    } catch (error: any) {
      console.error('載入報支詳細資料錯誤:', error);
      alert(`載入詳細資料失敗: ${error.message}`);
      setIsDetailDialogOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // 刪除報支項目
  const handleDelete = async (review: ExpenseReview) => {
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

  // 編輯報支項目（跳轉到 OCR to NetSuite 頁面進行編輯）
  const handleEdit = (review: ExpenseReview) => {
    router.push(`/dashboard/ocr-expense?id=${review.id}`);
  };

  // 檢查是否可以編輯（審核人：approved 且未進 ERP 前可以編輯）
  const canEdit = (review: ExpenseReview) => {
    // 審核人：approved 狀態且未同步到 NetSuite（進 ERP 前）可以編輯
    return review.review_status === 'approved' && review.netsuite_sync_status !== 'success';
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

      const currentData = editingData as any;
      const originalData = originalFullData as any;

      // 準備表頭更新資料
      const headerUpdateData: any = {};

      // 基本欄位
      if (editingData.expense_date !== originalFullData.expense_date) {
        headerUpdateData.expense_date = editingData.expense_date;
      }
      if (editingData.receipt_amount !== originalFullData.receipt_amount) {
        headerUpdateData.receipt_amount = parseFloat(editingData.receipt_amount?.toString() || '0');
      }
      if ((editingData as any).receipt_currency && (editingData as any).receipt_currency !== originalFullData.receipt_currency) {
        headerUpdateData.receipt_currency = (editingData as any).receipt_currency;
      }
      if ((editingData.description || '') !== (originalFullData.description || '')) {
        headerUpdateData.description = editingData.description || null;
      }
      if (editingData.receipt_missing !== originalFullData.receipt_missing) {
        headerUpdateData.receipt_missing = editingData.receipt_missing || false;
      }

      // ID 欄位
      if (currentData.employee_id && currentData.employee_id !== originalData.employee_id) {
        headerUpdateData.employee_id = currentData.employee_id;
      }
      if (currentData.subsidiary_id && currentData.subsidiary_id !== originalData.subsidiary_id) {
        headerUpdateData.subsidiary_id = currentData.subsidiary_id;
      }

      // 檢查是否有 lines 變更
      const hasLinesChanges = currentData.expense_lines && currentData.expense_lines.length > 0;
      
      // 如果有 lines 變更，使用 PUT /api/expense-reports/[id] API（會更新表頭和所有 lines）
      if (hasLinesChanges) {
        // 準備 lines 資料（轉換成 API 需要的格式）
        const lines = currentData.expense_lines.map((line: any, index: number) => ({
          refNo: line.line_number || index + 1,
          date: line.date || editingData.expense_date || originalFullData.expense_date,
          category: line.category_id || '',
          currency: line.currency_id || line.currency || 'TWD',
          foreignAmount: line.foreign_amount?.toString() || '',
          exchangeRate: line.exchange_rate?.toString() || '1.0',
          amount: line.amount?.toString() || '0',
          taxCode: line.tax_code || '',
          taxRate: line.tax_rate?.toString() || '',
          taxAmt: line.tax_amt?.toString() || '',
          grossAmt: line.gross_amt?.toString() || '0',
          memo: line.memo || '',
          department: line.department_id || '',
          class: line.class_id || '',
          location: line.location_id || '',
          customer: line.customer_id || '',
          projectTask: line.project_task_id || '',
          billable: line.billable || false,
          // 保留 OCR 資料和附件（不變更）
          ocrData: {
            invoiceTitle: line.invoice_title || '',
            invoicePeriod: line.invoice_period || '',
            invoiceNumber: line.invoice_number || '',
            invoiceDate: line.invoice_date || '',
            randomCode: line.random_code || '',
            formatCode: line.format_code || '',
            sellerName: line.seller_name || '',
            sellerTaxId: line.seller_tax_id || '',
            sellerAddress: line.seller_address || '',
            buyerName: line.buyer_name || '',
            buyerTaxId: line.buyer_tax_id || '',
            buyerAddress: line.buyer_address || '',
            untaxedAmount: line.untaxed_amount?.toString() || '',
            taxAmount: line.tax_amount?.toString() || '',
            totalAmount: line.total_amount?.toString() || '',
            ocrSuccess: line.ocr_success || false,
            ocrConfidence: line.ocr_confidence || 0,
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
          },
          attachment_url: line.attachment_url || null,
          attachment_base64: line.attachment_base64 || null,
          document_file_name: line.document_file_name || null,
          document_file_path: line.document_file_path || null,
        }));

        // 準備表頭資料
        const header = {
          expenseDate: editingData.expense_date || originalFullData.expense_date,
          employee: currentData.employee_id || originalData.employee_id,
          subsidiary: currentData.subsidiary_id || originalData.subsidiary_id,
          description: editingData.description || originalFullData.description || null,
          useMultiCurrency: currentData.use_multi_currency || originalData.use_multi_currency || false,
        };

        // 使用 PUT API 更新（會更新表頭和所有 lines）
        const response = await fetch(`/api/expense-reports/${selectedReview.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            header,
            lines,
            reviewStatus: selectedReview.review_status, // 保持原有狀態
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || result.message || '更新失敗');
        }

        if (result.success) {
          // 重新載入完整資料
          const reloadResponse = await fetch(`/api/expense-reports/${selectedReview.id}`);
          const reloadResult = await reloadResponse.json();

          if (reloadResult.success) {
            const { header: reloadedHeader, lines: reloadedLines } = reloadResult.data;
            
            // 重新組裝資料
            const reloadedDetail: ExpenseReview = {
              ...reloadedHeader,
              expense_lines: reloadedLines.map((line: any) => ({
                id: line.id,
                line_number: line.line_number || 0,
                date: line.date || '',
                category_id: line.category_id || null,
                category_name: line.category_name || null,
                currency_id: line.currency_id || null,
                currency: line.currency || 'TWD',
                foreign_amount: line.foreign_amount || null,
                exchange_rate: line.exchange_rate || 1.0,
                amount: line.amount || 0,
                tax_code: line.tax_code || null,
                tax_rate: line.tax_rate || null,
                tax_amt: line.tax_amt || null,
                gross_amt: line.gross_amt || 0,
                memo: line.memo || null,
                department_id: line.department_id || null,
                department_name: line.department_name || null,
                class_id: line.class_id || null,
                class_name: line.class_name || null,
                location_id: line.location_id || null,
                location_name: line.location_name || null,
                customer_id: line.customer_id || null,
                customer_name: line.customer_name || null,
                project_task_id: line.project_task_id || null,
                project_task_name: line.project_task_name || null,
                billable: line.billable || false,
                invoice_title: line.invoice_title || null,
                invoice_number: line.invoice_number || null,
                invoice_date: line.invoice_date || null,
                format_code: line.format_code || null,
                seller_name: line.seller_name || null,
                buyer_name: line.buyer_name || null,
                total_amount: line.total_amount || null,
                ocr_success: line.ocr_success || false,
                ocr_confidence: line.ocr_confidence || null,
                ocr_quality_grade: line.ocr_quality_grade || null,
                attachment_url: line.attachment_url || null,
                attachment_base64: line.attachment_base64 || null,
                document_file_path: line.document_file_path || null,
                document_file_name: line.document_file_name || null,
              })),
            } as any;

            setSelectedReview(reloadedDetail);
            setEditingData(reloadedDetail as any);
          }

          // 更新列表
          await loadReviews();
          
          setIsEditing(false);
          setIsDetailDialogOpen(false);
          alert('報支資料已更新');
        } else {
          throw new Error(result.error || '更新失敗');
        }
      } else {
        // 如果只有表頭變更，使用原來的 API
        const updateData: any = { ...headerUpdateData };

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
          // 優化：直接使用 API 返回的更新資料，避免再次查詢
          const updatedReview = result.data as ExpenseReview;
          
          // 更新當前選中的報支資料
          setSelectedReview(updatedReview);
          setEditingData(updatedReview as any);
          
          // 優化：只更新列表中的對應項目，而不是重新載入整個列表
          setReviews(prevReviews => 
            prevReviews.map(review => 
              review.id === selectedReview.id ? {
                ...review,
                // 只更新列表顯示需要的欄位
                expense_date: updatedReview.expense_date,
                expense_category_name: updatedReview.expense_category_name,
                employee_name: updatedReview.employee_name,
                subsidiary_name: updatedReview.subsidiary_name,
                location_name: updatedReview.location_name,
                department_name: updatedReview.department_name,
                class_name: updatedReview.class_name,
                receipt_amount: updatedReview.receipt_amount,
                receipt_currency: updatedReview.receipt_currency,
                description: updatedReview.description,
                receipt_missing: updatedReview.receipt_missing,
                // 如果修改了關鍵欄位，同步狀態可能被重置
                netsuite_sync_status: updatedReview.netsuite_sync_status,
                netsuite_internal_id: updatedReview.netsuite_internal_id,
                netsuite_tran_id: updatedReview.netsuite_tran_id,
                netsuite_sync_error: updatedReview.netsuite_sync_error,
                netsuite_url: updatedReview.netsuite_url,
              } : review
            )
          );
          
          setIsEditing(false);
          setIsDetailDialogOpen(false);
          alert('報支資料已更新');
        } else {
          throw new Error(result.error || '更新失敗');
        }
      }
    } catch (error: any) {
      console.error('保存報支資料錯誤:', error);
      alert(`更新失敗: ${error.message || '未知錯誤'}`);
    } finally {
      setSaving(false);
    }
  };

  // 開啟審核對話框
  const handleReview = (review: ExpenseReview, action: 'approve' | 'reject' | 'cancel') => {
    setSelectedReview(review);
    setReviewAction(action);
    setReviewNotes('');
    setRejectionReason('');
    setIsReviewDialogOpen(true);
  };

  // 提交審核
  const handleSubmitReview = async () => {
    if (!selectedReview || !reviewAction) return;

    // 驗證：拒絕時必須填寫原因
    if (reviewAction === 'reject' && !rejectionReason.trim()) {
      alert('請填寫拒絕原因');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('無法取得使用者資訊，請重新登入');
      }

      const reviewedByName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || '未知使用者';

      const updateData: any = {
        review_status: reviewAction === 'approve' ? 'approved' : reviewAction === 'reject' ? 'rejected' : 'cancelled',
        reviewed_by: user.id,
        reviewed_by_name: reviewedByName,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes || null,
      };

      if (reviewAction === 'reject') {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('expense_reviews')
        .update(updateData)
        .eq('id', selectedReview.id);

      if (error) throw error;

      // 優化：立即更新列表中的該項目狀態，而不是重新載入整個列表
      const newStatus = reviewAction === 'approve' ? 'approved' : reviewAction === 'reject' ? 'rejected' : 'cancelled';
      
      // 如果審核通過，立即更新狀態為「與 NetSuite 同步中」
      const netsuiteSyncStatus = reviewAction === 'approve' ? 'syncing' : selectedReview.netsuite_sync_status;
      
      // 更新列表中的該項目
      setReviews(prevReviews => {
        const updatedReviews = prevReviews.map(review => 
          review.id === selectedReview.id 
            ? {
                ...review,
                review_status: newStatus,
                reviewed_by_name: reviewedByName,
                reviewed_at: new Date().toISOString(),
                review_notes: reviewNotes || null,
                rejection_reason: reviewAction === 'reject' ? rejectionReason : null,
                // 如果審核通過，立即顯示「與 NetSuite 同步中」
                netsuite_sync_status: netsuiteSyncStatus,
              }
            : review
        );
        
        // 如果當前有狀態篩選，且該項目不再符合篩選條件，從列表中移除
        if (statusFilter !== 'all' && statusFilter !== newStatus) {
          return updatedReviews.filter(review => review.id !== selectedReview.id);
        }
        
        return updatedReviews;
      });

      // 保存 reviewAction 和 reviewId 到變數（因為我們會在關閉對話框後使用）
      const currentReviewAction = reviewAction;
      const currentReviewId = selectedReview.id;
      
      // 立即關閉對話框並顯示成功訊息（不等待 NetSuite 同步）
      setIsReviewDialogOpen(false);
      setSelectedReview(null);
      setReviewAction(null);
      
      if (currentReviewAction === 'approve') {
        alert('單據已審核通過');
      } else {
        alert(`報支已${currentReviewAction === 'reject' ? '拒絕' : '取消'}`);
      }

      // 如果審核通過，背景異步同步到 NetSuite（不阻塞 UI）
      if (currentReviewAction === 'approve') {
        // 使用 setTimeout 確保在下一事件循環中執行，不阻塞 UI
        setTimeout(() => {
          // 直接調用 syncToNetSuite，讓 API 端點自己處理狀態更新
          // API 端點會檢查並更新狀態為 'syncing'，避免重複同步
          syncToNetSuite(currentReviewId).catch((syncError) => {
            console.error('自動同步失敗:', syncError);
            // 同步失敗時靜默處理，使用者可以從列表中的 NetSuite 同步狀態看到失敗狀態
          });
        }, 0);
      }
      
      // 優化：如果當前有狀態篩選，且該項目不再符合篩選條件，已經從列表中移除了
      // 但如果用戶切換到對應的狀態標籤（例如從「待審核」切換到「已通過」），
      // 需要重新載入列表以確保顯示所有該狀態的項目（包括剛剛審批的）
      // 這裡不立即載入，讓用戶切換標籤時自動觸發 loadReviews（因為 statusFilter 改變）
    } catch (error: any) {
      console.error('提交審核錯誤:', error);
      alert(`審核失敗: ${error.message}`);
      // 錯誤時不關閉對話框，讓使用者可以重試
    } finally {
      // 確保 submitting 狀態被重置（即使背景同步還在進行）
      setSubmitting(false);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 格式化金額
  const formatAmount = (amount: number | null | undefined | string, currency: string | null | undefined) => {
    // 處理 null、undefined 或空值
    if (amount === null || amount === undefined || amount === '') {
      return '-';
    }
    
    // 轉換為數字（處理字串類型的數字）
    let numericAmount: number;
    if (typeof amount === 'string') {
      numericAmount = parseFloat(amount);
      if (isNaN(numericAmount)) {
        console.warn(`無法解析金額: ${amount}`);
        return '-';
      }
    } else {
      numericAmount = amount;
    }
    
    // 檢查是否為有效數字
    if (isNaN(numericAmount) || !isFinite(numericAmount)) {
      console.warn(`無效的金額值: ${amount}`);
      return '-';
    }
    
    // 確保 currency 有有效值，如果沒有則使用預設值 'TWD'
    const validCurrency = (currency && currency.trim() !== '') ? currency.trim() : 'TWD';
    
    // 如果 currency 不是有效的 ISO 4217 代碼，使用數字格式
    try {
      return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: validCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(numericAmount);
    } catch (error) {
      // 如果 currency 代碼無效，使用數字格式
      console.warn(`無效的幣別代碼: ${validCurrency}，使用數字格式`);
      try {
        return new Intl.NumberFormat('zh-TW', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(numericAmount) + ` ${validCurrency}`;
      } catch (formatError) {
        console.error('格式化金額失敗:', formatError, { amount, numericAmount, currency });
        return `${numericAmount} ${validCurrency}`;
      }
    }
  };

  // 取得狀態 Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-amber-600 text-white">草稿</Badge>;
      case 'pending':
        return <Badge className="bg-purple-500 text-white">待審核</Badge>;
      case 'approved':
        return <Badge className="bg-green-500 text-white">已核准</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 text-white">已拒絕</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500 text-white">已取消</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getNetSuiteSyncBadge = (syncStatus: string | null, reviewStatus: string) => {
    // 只有已審核通過的報支才顯示 NetSuite 同步狀態
    if (reviewStatus !== 'approved') {
      return <span className="text-gray-400 dark:text-gray-500">-</span>;
    }

    if (!syncStatus || syncStatus === 'pending') {
      return <Badge className="bg-gray-400 text-white">⏳ 待同步</Badge>;
    }

    switch (syncStatus) {
      case 'success':
        return <Badge className="bg-green-500 text-white">✅ 已同步</Badge>;
      case 'syncing':
        return <Badge className="bg-yellow-500 text-white">🔄 與 NetSuite 同步中</Badge>;
      case 'failed':
        return <Badge className="bg-red-500 text-white">❌ 同步失敗</Badge>;
      default:
        return <Badge>{syncStatus}</Badge>;
    }
  };

  return (
    <div className="p-8">
      {/* 頁面標題 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <CheckSquare className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">費用報告核准</h1>
        </div>
        <p className="text-gray-600 dark:text-muted-foreground">
          檢視和審核待審核的報支項目
        </p>
      </div>

      {/* 狀態篩選 */}
      <div className="mb-6 flex gap-2">
        <Button
          variant="outline"
          onClick={() => setStatusFilter('all')}
          className={statusFilter === 'all' ? 'border-blue-500 border-2 text-blue-600 dark:text-blue-400' : ''}
        >
          全部
        </Button>
        <Button
          variant="outline"
          onClick={() => setStatusFilter('pending')}
          className={statusFilter === 'pending' ? 'border-blue-500 border-2 text-blue-600 dark:text-blue-400' : ''}
        >
          待審核
        </Button>
        <Button
          variant="outline"
          onClick={() => setStatusFilter('approved')}
          className={statusFilter === 'approved' ? 'border-blue-500 border-2 text-blue-600 dark:text-blue-400' : ''}
        >
          已核准
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

      {/* 報支列表 */}
      <Card>
        <CardHeader>
          <CardTitle>報支列表</CardTitle>
          <CardDescription>
            {statusFilter === 'all' ? '所有報支項目' : `狀態：${statusFilter === 'pending' ? '待審核' : statusFilter === 'approved' ? '已核准' : statusFilter === 'rejected' ? '已拒絕' : '已取消'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">載入中...</span>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              目前沒有報支項目
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center bg-gray-100 dark:bg-gray-800">報告狀態</TableHead>
                  <TableHead className="text-center bg-gray-100 dark:bg-gray-800">費用報告編號</TableHead>
                  <TableHead className="text-center bg-gray-100 dark:bg-gray-800">NetSuite#</TableHead>
                  <TableHead className="text-center bg-gray-100 dark:bg-gray-800">報告日期</TableHead>
                  <TableHead className="text-center bg-gray-100 dark:bg-gray-800">建立日期</TableHead>
                  <TableHead className="text-center bg-gray-100 dark:bg-gray-800">員工</TableHead>
                  <TableHead className="text-right bg-gray-100 dark:bg-gray-800">總金額</TableHead>
                  <TableHead className="text-center bg-gray-100 dark:bg-gray-800">NetSuite 同步</TableHead>
                  <TableHead className="text-center bg-gray-100 dark:bg-gray-800">明細</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="text-center">{getStatusBadge(review.review_status)}</TableCell>
                    <TableCell className="text-center font-mono text-sm">
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
                    <TableCell className="text-center">{formatDate(review.expense_date)}</TableCell>
                    <TableCell className="text-center">{formatDate(review.created_at)}</TableCell>
                    <TableCell className="text-center">{review.employee_name || '-'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatAmount(review.receipt_amount, review.receipt_currency)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getNetSuiteSyncBadge(review.netsuite_sync_status, review.review_status)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(review)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        明細
                      </Button>
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
                      value={(editingData as any).employee_id || ''}
                      onValueChange={(value) => {
                        const employee = formOptions.employees.find(e => e.id === value);
                        setEditingData({
                          ...editingData,
                          employee_id: value,
                          employee_name: employee?.name || null,
                        } as any);
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
                      value={(editingData as any).subsidiary_id || ''}
                      onValueChange={(value) => {
                        const subsidiary = formOptions.subsidiaries.find(s => s.id === value);
                        setEditingData({
                          ...editingData,
                          subsidiary_id: value,
                          subsidiary_name: subsidiary?.name || null,
                        } as any);
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
                          // 優先使用 editingData 中的 currency_id 或 receipt_currency
                          const currentCurrencyId = (editingData as any).currency_id;
                          const currentSymbol = (editingData as any).receipt_currency || selectedReview.receipt_currency;
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
                          } as any);
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
                    <p className="mt-1 font-medium">{formatAmount(selectedReview.receipt_amount, selectedReview.receipt_currency)}</p>
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
                    <p className="mt-1">{selectedReview.receipt_missing ? '是' : '否'}</p>
                  )}
                </div>
              </div>

              {/* OCR 資訊 */}
              {selectedReview.invoice_number && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">發票資訊</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">發票號碼</Label>
                      <p className="mt-1">{selectedReview.invoice_number}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">發票日期</Label>
                      <p className="mt-1">{formatDate(selectedReview.invoice_date)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">賣方名稱</Label>
                      <p className="mt-1">{selectedReview.seller_name || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">買方名稱</Label>
                      <p className="mt-1">{selectedReview.buyer_name || '-'}</p>
                    </div>
                    {selectedReview.total_amount && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">總計金額</Label>
                        <p className="mt-1 font-medium">{formatAmount(selectedReview.total_amount, selectedReview.receipt_currency)}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">OCR 狀態</Label>
                      <div className="mt-1">
                        {(() => {
                          // 檢查是否有 OCR 資料（從 expense_lines 判斷）
                          const hasOcrData = (selectedReview as any).expense_lines && 
                            (selectedReview as any).expense_lines.some((line: any) => 
                              line.ocr_success !== undefined || 
                              line.ocr_confidence !== null || 
                              line.ocr_quality_grade !== null
                            );
                          
                          if (!hasOcrData) {
                            return <Badge className="bg-gray-400 text-white">無 OCR</Badge>;
                          }
                          
                          // 檢查是否有成功的 OCR（至少有一個 line 的 ocr_success 為 true）
                          const hasSuccessfulOcr = (selectedReview as any).expense_lines && 
                            (selectedReview as any).expense_lines.some((line: any) => line.ocr_success === true);
                          
                          if (hasSuccessfulOcr) {
                            return <Badge className="bg-green-500 text-white">OCR 成功</Badge>;
                          } else {
                            return <Badge className="bg-red-500 text-white">OCR 失敗</Badge>;
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 報支明細（Expense Lines） */}
              {(selectedReview as any).expense_lines && (selectedReview as any).expense_lines.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">報支明細</h3>
                  <div className="space-y-6">
                    {(selectedReview as any).expense_lines.map((line: any, index: number) => (
                      <div key={line.id || `line-${index}`} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">明細 #{line.line_number}</h4>
                          <span className="text-sm font-medium text-primary">
                            {formatAmount(line.gross_amt, line.currency)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          {/* 日期 */}
                          <div>
                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">日期 *</Label>
                            {isEditing ? (
                              <Input
                                type="date"
                                value={line.date || ''}
                                onChange={(e) => {
                                  const updatedLines = [...(editingData as any).expense_lines];
                                  updatedLines[index] = { ...updatedLines[index], date: e.target.value };
                                  setEditingData({ ...editingData, expense_lines: updatedLines } as any);
                                }}
                                className="mt-1"
                              />
                            ) : (
                              <p className="mt-1">{formatDate(line.date)}</p>
                            )}
                          </div>
                          
                          {/* 費用類別 */}
                          <div>
                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">費用類別 *</Label>
                            {isEditing ? (
                              <Select
                                value={line.category_id || ''}
                                onValueChange={(value) => {
                                  const category = formOptions.expenseCategories.find(c => c.id === value);
                                  const updatedLines = [...(editingData as any).expense_lines];
                                  updatedLines[index] = {
                                    ...updatedLines[index],
                                    category_id: value,
                                    category_name: category?.name || null,
                                  };
                                  setEditingData({ ...editingData, expense_lines: updatedLines } as any);
                                }}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="請選擇費用類別" />
                                </SelectTrigger>
                                <SelectContent>
                                  {formOptions.expenseCategories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                      {cat.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <p className="mt-1">{line.category_name || '-'}</p>
                            )}
                          </div>
                          
                          {/* 幣別 */}
                          <div>
                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">幣別 *</Label>
                            {isEditing ? (
                              <Select
                                value={line.currency_id || line.currency || ''}
                                onValueChange={(value) => {
                                  const currency = formOptions.currencies.find(c => c.id === value || c.symbol === value);
                                  const updatedLines = [...(editingData as any).expense_lines];
                                  updatedLines[index] = {
                                    ...updatedLines[index],
                                    currency_id: currency?.id || value,
                                    currency: currency?.symbol || value,
                                  };
                                  setEditingData({ ...editingData, expense_lines: updatedLines } as any);
                                }}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="請選擇幣別" />
                                </SelectTrigger>
                                <SelectContent>
                                  {formOptions.currencies.map((curr) => (
                                    <SelectItem key={curr.id} value={curr.id}>
                                      {curr.symbol} - {curr.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <p className="mt-1">{line.currency || 'TWD'}</p>
                            )}
                          </div>
                          
                          {/* 外幣金額 */}
                          {isEditing && (
                            <div>
                              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">外幣金額</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={line.foreign_amount || ''}
                                onChange={(e) => {
                                  const updatedLines = [...(editingData as any).expense_lines];
                                  updatedLines[index] = {
                                    ...updatedLines[index],
                                    foreign_amount: e.target.value ? parseFloat(e.target.value) : null,
                                  };
                                  setEditingData({ ...editingData, expense_lines: updatedLines } as any);
                                }}
                                className="mt-1"
                                placeholder="選填"
                              />
                            </div>
                          )}
                          
                          {/* 匯率 */}
                          {isEditing && (
                            <div>
                              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">匯率</Label>
                              <Input
                                type="number"
                                step="0.000001"
                                value={line.exchange_rate || 1.0}
                                onChange={(e) => {
                                  const updatedLines = [...(editingData as any).expense_lines];
                                  updatedLines[index] = {
                                    ...updatedLines[index],
                                    exchange_rate: e.target.value ? parseFloat(e.target.value) : 1.0,
                                  };
                                  setEditingData({ ...editingData, expense_lines: updatedLines } as any);
                                }}
                                className="mt-1"
                              />
                            </div>
                          )}
                          
                          {/* 金額 */}
                          <div>
                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">金額 *</Label>
                            {isEditing ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={line.amount || ''}
                                onChange={(e) => {
                                  const updatedLines = [...(editingData as any).expense_lines];
                                  updatedLines[index] = {
                                    ...updatedLines[index],
                                    amount: parseFloat(e.target.value) || 0,
                                  };
                                  setEditingData({ ...editingData, expense_lines: updatedLines } as any);
                                }}
                                className="mt-1"
                              />
                            ) : (
                              <p className="mt-1">{formatAmount(line.amount, line.currency)}</p>
                            )}
                          </div>
                          
                          {/* 稅碼 */}
                          {isEditing && (
                            <div>
                              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">稅碼</Label>
                              <Input
                                type="text"
                                value={line.tax_code || ''}
                                onChange={(e) => {
                                  const updatedLines = [...(editingData as any).expense_lines];
                                  updatedLines[index] = { ...updatedLines[index], tax_code: e.target.value || null };
                                  setEditingData({ ...editingData, expense_lines: updatedLines } as any);
                                }}
                                className="mt-1"
                                placeholder="選填"
                              />
                            </div>
                          )}
                          
                          {/* 稅率 */}
                          {isEditing && (
                            <div>
                              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">稅率 (%)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={line.tax_rate || ''}
                                onChange={(e) => {
                                  const updatedLines = [...(editingData as any).expense_lines];
                                  updatedLines[index] = {
                                    ...updatedLines[index],
                                    tax_rate: e.target.value ? parseFloat(e.target.value) : null,
                                  };
                                  setEditingData({ ...editingData, expense_lines: updatedLines } as any);
                                }}
                                className="mt-1"
                                placeholder="選填"
                              />
                            </div>
                          )}
                          
                          {/* 稅額 */}
                          {isEditing && (
                            <div>
                              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">稅額</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={line.tax_amt || ''}
                                onChange={(e) => {
                                  const updatedLines = [...(editingData as any).expense_lines];
                                  updatedLines[index] = {
                                    ...updatedLines[index],
                                    tax_amt: e.target.value ? parseFloat(e.target.value) : null,
                                  };
                                  setEditingData({ ...editingData, expense_lines: updatedLines } as any);
                                }}
                                className="mt-1"
                                placeholder="選填"
                              />
                            </div>
                          )}
                          
                          {/* 總金額 */}
                          <div>
                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">總金額 *</Label>
                            {isEditing ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={line.gross_amt || ''}
                                onChange={(e) => {
                                  const updatedLines = [...(editingData as any).expense_lines];
                                  updatedLines[index] = {
                                    ...updatedLines[index],
                                    gross_amt: parseFloat(e.target.value) || 0,
                                  };
                                  setEditingData({ ...editingData, expense_lines: updatedLines } as any);
                                }}
                                className="mt-1"
                              />
                            ) : (
                              <p className="mt-1 font-medium">{formatAmount(line.gross_amt, line.currency)}</p>
                            )}
                          </div>
                          
                          {/* 外幣金額（非編輯模式顯示） */}
                          {!isEditing && line.foreign_amount && (
                            <div>
                              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">外幣金額</Label>
                              <p className="mt-1">{formatAmount(line.foreign_amount, line.currency)}</p>
                            </div>
                          )}
                          
                          {/* 匯率（非編輯模式顯示） */}
                          {!isEditing && line.exchange_rate && line.exchange_rate !== 1.0 && (
                            <div>
                              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">匯率</Label>
                              <p className="mt-1">{line.exchange_rate}</p>
                            </div>
                          )}
                          
                          {/* 稅碼（非編輯模式顯示） */}
                          {!isEditing && line.tax_code && (
                            <div>
                              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">稅碼</Label>
                              <p className="mt-1">{line.tax_code}</p>
                            </div>
                          )}
                          
                          {/* 稅率（非編輯模式顯示） */}
                          {!isEditing && line.tax_rate && (
                            <div>
                              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">稅率 (%)</Label>
                              <p className="mt-1">{line.tax_rate}%</p>
                            </div>
                          )}
                          
                          {/* 稅額（非編輯模式顯示） */}
                          {!isEditing && line.tax_amt && (
                            <div>
                              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">稅額</Label>
                              <p className="mt-1">{formatAmount(line.tax_amt, line.currency)}</p>
                            </div>
                          )}
                          
                          {/* 部門 */}
                          <div>
                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">部門</Label>
                            {isEditing ? (
                              <Select
                                value={line.department_id || '__none__'}
                                onValueChange={(value) => {
                                  const department = formOptions.departments.find(d => d.id === value);
                                  const updatedLines = [...(editingData as any).expense_lines];
                                  updatedLines[index] = {
                                    ...updatedLines[index],
                                    department_id: value === '__none__' ? null : value,
                                    department_name: department?.name || null,
                                  };
                                  setEditingData({ ...editingData, expense_lines: updatedLines } as any);
                                }}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="請選擇部門（選填）" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">無</SelectItem>
                                  {formOptions.departments.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.id}>
                                      {dept.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <p className="mt-1">{line.department_name || '-'}</p>
                            )}
                          </div>
                          
                          {/* 類別 */}
                          <div>
                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">類別</Label>
                            {isEditing ? (
                              <Select
                                value={line.class_id || '__none__'}
                                onValueChange={(value) => {
                                  const classItem = formOptions.classes.find(c => c.id === value);
                                  const updatedLines = [...(editingData as any).expense_lines];
                                  updatedLines[index] = {
                                    ...updatedLines[index],
                                    class_id: value === '__none__' ? null : value,
                                    class_name: classItem?.name || null,
                                  };
                                  setEditingData({ ...editingData, expense_lines: updatedLines } as any);
                                }}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="請選擇類別（選填）" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">無</SelectItem>
                                  {formOptions.classes.map((cls) => (
                                    <SelectItem key={cls.id} value={cls.id}>
                                      {cls.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <p className="mt-1">{line.class_name || '-'}</p>
                            )}
                          </div>
                          
                          {/* 地點 */}
                          <div>
                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">地點</Label>
                            {isEditing ? (
                              <Select
                                value={line.location_id || '__none__'}
                                onValueChange={(value) => {
                                  const location = formOptions.locations.find(l => l.id === value);
                                  const updatedLines = [...(editingData as any).expense_lines];
                                  updatedLines[index] = {
                                    ...updatedLines[index],
                                    location_id: value === '__none__' ? null : value,
                                    location_name: location?.name || null,
                                  };
                                  setEditingData({ ...editingData, expense_lines: updatedLines } as any);
                                }}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="請選擇地點（選填）" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">無</SelectItem>
                                  {formOptions.locations.map((loc) => (
                                    <SelectItem key={loc.id} value={loc.id}>
                                      {loc.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <p className="mt-1">{line.location_name || '-'}</p>
                            )}
                          </div>
                          
                          {/* 客戶 */}
                          <div>
                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">客戶</Label>
                            {isEditing ? (
                              <Input
                                type="text"
                                value={line.customer_name || ''}
                                onChange={(e) => {
                                  const updatedLines = [...(editingData as any).expense_lines];
                                  updatedLines[index] = {
                                    ...updatedLines[index],
                                    customer_name: e.target.value || null,
                                  };
                                  setEditingData({ ...editingData, expense_lines: updatedLines } as any);
                                }}
                                className="mt-1"
                                placeholder="選填"
                              />
                            ) : (
                              <p className="mt-1">{line.customer_name || '-'}</p>
                            )}
                          </div>
                          
                          {/* 專案任務 */}
                          <div>
                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">專案任務</Label>
                            {isEditing ? (
                              <Input
                                type="text"
                                value={line.project_task_name || ''}
                                onChange={(e) => {
                                  const updatedLines = [...(editingData as any).expense_lines];
                                  updatedLines[index] = {
                                    ...updatedLines[index],
                                    project_task_name: e.target.value || null,
                                  };
                                  setEditingData({ ...editingData, expense_lines: updatedLines } as any);
                                }}
                                className="mt-1"
                                placeholder="選填"
                              />
                            ) : (
                              <p className="mt-1">{line.project_task_name || '-'}</p>
                            )}
                          </div>
                          
                          {/* 可計費 */}
                          <div>
                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">可計費</Label>
                            {isEditing ? (
                              <div className="mt-1 flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={line.billable || false}
                                  onChange={(e) => {
                                    const updatedLines = [...(editingData as any).expense_lines];
                                    updatedLines[index] = {
                                      ...updatedLines[index],
                                      billable: e.target.checked,
                                    };
                                    setEditingData({ ...editingData, expense_lines: updatedLines } as any);
                                  }}
                                  className="h-4 w-4"
                                />
                                <span className="text-sm">是</span>
                              </div>
                            ) : (
                              <p className="mt-1">{line.billable ? '是' : '否'}</p>
                            )}
                          </div>
                          
                          {/* 備註 */}
                          <div className="col-span-2">
                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">備註</Label>
                            {isEditing ? (
                              <Textarea
                                value={line.memo || ''}
                                onChange={(e) => {
                                  const updatedLines = [...(editingData as any).expense_lines];
                                  updatedLines[index] = { ...updatedLines[index], memo: e.target.value || null };
                                  setEditingData({ ...editingData, expense_lines: updatedLines } as any);
                                }}
                                className="mt-1"
                                rows={3}
                                placeholder="選填"
                              />
                            ) : (
                              <p className="mt-1">{line.memo || '-'}</p>
                            )}
                          </div>
                        </div>

                        {/* OCR 發票資訊 */}
                        {(line.invoice_number || line.invoice_title || isEditing) && (
                          <div className="border-t pt-4 mt-4">
                            <h5 className="text-sm font-semibold mb-3">發票資訊</h5>
                            <div className="grid grid-cols-2 gap-4">
                              {/* 發票號碼 */}
                              <div>
                                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">發票號碼</Label>
                                {isEditing ? (
                                  <Input
                                    type="text"
                                    value={line.invoice_number || ''}
                                    onChange={(e) => {
                                      const updatedLines = [...(editingData as any).expense_lines];
                                      updatedLines[index] = { ...updatedLines[index], invoice_number: e.target.value || null };
                                      setEditingData({ ...editingData, expense_lines: updatedLines } as any);
                                    }}
                                    className="mt-1"
                                    placeholder="選填"
                                  />
                                ) : (
                                  <p className="mt-1">{line.invoice_number || '-'}</p>
                                )}
                              </div>
                              
                              {/* 發票日期 */}
                              <div>
                                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">發票日期</Label>
                                {isEditing ? (
                                  <Input
                                    type="date"
                                    value={line.invoice_date || ''}
                                    onChange={(e) => {
                                      const updatedLines = [...(editingData as any).expense_lines];
                                      updatedLines[index] = { ...updatedLines[index], invoice_date: e.target.value || null };
                                      setEditingData({ ...editingData, expense_lines: updatedLines } as any);
                                    }}
                                    className="mt-1"
                                  />
                                ) : (
                                  <p className="mt-1">{line.invoice_date ? formatDate(line.invoice_date) : '-'}</p>
                                )}
                              </div>
                              
                              {/* 發票格式 */}
                              <div>
                                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">發票格式</Label>
                                {isEditing ? (
                                  <Input
                                    type="text"
                                    value={line.format_code || ''}
                                    onChange={(e) => {
                                      const updatedLines = [...(editingData as any).expense_lines];
                                      updatedLines[index] = { ...updatedLines[index], format_code: e.target.value || null };
                                      setEditingData({ ...editingData, expense_lines: updatedLines } as any);
                                    }}
                                    className="mt-1"
                                    placeholder="選填（例如：21、25）"
                                  />
                                ) : (
                                  <p className="mt-1">{line.format_code || '-'}</p>
                                )}
                              </div>
                              
                              {/* 賣方名稱 */}
                              <div>
                                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">賣方名稱</Label>
                                {isEditing ? (
                                  <Input
                                    type="text"
                                    value={line.seller_name || ''}
                                    onChange={(e) => {
                                      const updatedLines = [...(editingData as any).expense_lines];
                                      updatedLines[index] = { ...updatedLines[index], seller_name: e.target.value || null };
                                      setEditingData({ ...editingData, expense_lines: updatedLines } as any);
                                    }}
                                    className="mt-1"
                                    placeholder="選填"
                                  />
                                ) : (
                                  <p className="mt-1">{line.seller_name || '-'}</p>
                                )}
                              </div>
                              
                              {/* 買方名稱 */}
                              <div>
                                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">買方名稱</Label>
                                {isEditing ? (
                                  <Input
                                    type="text"
                                    value={line.buyer_name || ''}
                                    onChange={(e) => {
                                      const updatedLines = [...(editingData as any).expense_lines];
                                      updatedLines[index] = { ...updatedLines[index], buyer_name: e.target.value || null };
                                      setEditingData({ ...editingData, expense_lines: updatedLines } as any);
                                    }}
                                    className="mt-1"
                                    placeholder="選填"
                                  />
                                ) : (
                                  <p className="mt-1">{line.buyer_name || '-'}</p>
                                )}
                              </div>
                              
                              {/* 總計金額 */}
                              <div>
                                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">總計金額</Label>
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={line.total_amount || ''}
                                    onChange={(e) => {
                                      const updatedLines = [...(editingData as any).expense_lines];
                                      updatedLines[index] = {
                                        ...updatedLines[index],
                                        total_amount: e.target.value ? parseFloat(e.target.value) : null,
                                      };
                                      setEditingData({ ...editingData, expense_lines: updatedLines } as any);
                                    }}
                                    className="mt-1"
                                    placeholder="選填"
                                  />
                                ) : (
                                  <p className="mt-1 font-medium">
                                    {line.total_amount ? formatAmount(line.total_amount, line.currency) : '-'}
                                  </p>
                                )}
                              </div>
                              
                              {/* OCR 信心度 / 等級（只讀） */}
                              {((line.ocr_confidence !== null && line.ocr_confidence !== undefined) || line.ocr_quality_grade) && (
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
                              )}
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
              )}

              {/* 附件預覽（表頭層級的附件，如果沒有明細層級的附件） */}
              {(!(selectedReview as any).expense_lines || (selectedReview as any).expense_lines.length === 0) && 
               (selectedReview.attachment_url || selectedReview.attachment_base64) && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">附件</h3>
                  <div className="flex justify-center">
                    {selectedReview.attachment_url ? (
                      // 優先使用 Signed URL（Private bucket 需要）
                      <AttachmentPreview
                        attachmentUrl={selectedReview.attachment_url}
                        signedUrl={signedUrls[selectedReview.attachment_url]}
                        base64Fallback={selectedReview.attachment_base64}
                        onGetSignedUrl={getSignedUrl}
                      />
                    ) : selectedReview.attachment_base64 ? (
                      // 備用 Base64
                      isPDF(null, selectedReview.attachment_base64) ? (
                        <iframe
                          src={selectedReview.attachment_base64.startsWith('data:') 
                            ? selectedReview.attachment_base64 
                            : `data:application/pdf;base64,${selectedReview.attachment_base64}`}
                          className="w-full h-[600px] rounded-lg border border-gray-200 dark:border-gray-700"
                          title="PDF 附件"
                        />
                      ) : (
                        <img
                          src={`data:image/jpeg;base64,${selectedReview.attachment_base64}`}
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
                    {selectedReview.netsuite_url && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">NetSuite 連結</Label>
                        <p className="mt-1">
                          <a
                            href={selectedReview.netsuite_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                          >
                            {selectedReview.netsuite_url}
                          </a>
                        </p>
                      </div>
                    )}
                    {!selectedReview.netsuite_url && selectedReview.netsuite_internal_id && (
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
                    {selectedReview.netsuite_sync_status !== 'success' && (
                      <div className="col-span-2">
                        <Button
                          onClick={() => syncToNetSuite(selectedReview.id)}
                          disabled={syncingIds.has(selectedReview.id) || selectedReview.netsuite_sync_status === 'syncing'}
                          className="w-full"
                        >
                          {syncingIds.has(selectedReview.id) || selectedReview.netsuite_sync_status === 'syncing' ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              同步中...
                            </>
                          ) : (
                            <>
                              <FileText className="h-4 w-4 mr-2" />
                              同步到 NetSuite
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            {isEditing ? (
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
                  onClick={handleSaveEdit}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      保存
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDetailDialogOpen(false)}
                >
                  關閉
                </Button>
                <Button 
                  variant="default"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  編輯
                </Button>
                {selectedReview && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (selectedReview) {
                        handleDelete(selectedReview);
                        setIsDetailDialogOpen(false);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    刪除
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 審核對話框 */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? '審核通過' : reviewAction === 'reject' ? '拒絕報支' : '取消報支'}
            </DialogTitle>
            <DialogDescription>
              請確認是否要{reviewAction === 'approve' ? '通過' : reviewAction === 'reject' ? '拒絕' : '取消'}此報支項目
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {reviewAction === 'reject' && (
              <div>
                <Label htmlFor="rejection-reason">拒絕原因 *</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="請填寫拒絕原因..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            )}
            <div>
              <Label htmlFor="review-notes">審核備註（選填）</Label>
              <Textarea
                id="review-notes"
                placeholder="請填寫審核備註..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)} disabled={submitting}>
              取消
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={submitting}
              className={reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : reviewAction === 'reject' ? 'bg-orange-500 hover:bg-orange-600' : ''}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  處理中...
                </>
              ) : (
                '確認'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

