'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FileText, CheckCircle2, XCircle, Clock, Eye, Image as ImageIcon, Calendar, User, Building2, MapPin, DollarSign, AlertCircle, Loader2, Save } from 'lucide-react';
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

interface ExpenseReview {
  id: string;
  expense_date: string;
  expense_category_name: string | null;
  employee_name: string | null;
  subsidiary_name: string | null;
  location_name: string | null;
  department_name: string | null;
  class_name: string | null;
  receipt_amount: number;
  receipt_currency: string;
  description: string | null;
  receipt_missing: boolean;
  invoice_title: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  seller_name: string | null;
  buyer_name: string | null;
  total_amount: number | null;
  ocr_success: boolean;
  ocr_confidence: number | null;
  ocr_quality_grade: string | null;
  ocr_file_name: string | null; // OCR 檔案名稱
  ocr_file_id: string | null; // OCR 檔案 ID
  ocr_processed_at: string | null; // OCR 處理時間
  attachment_url: string | null; // Supabase Storage URL（優先使用）
  attachment_base64: string | null; // Base64 備用
  review_status: string;
  netsuite_sync_status: string | null; // NetSuite 同步狀態
  netsuite_internal_id: number | null; // NetSuite Internal ID
  netsuite_tran_id: string | null; // NetSuite 交易編號
  netsuite_sync_error: string | null; // 同步錯誤訊息
  netsuite_url: string | null; // NetSuite 網址（用於直接連結）
  created_by_name: string | null;
  created_at: string;
  review_notes: string | null;
  rejection_reason: string | null;
}

type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

// 附件圖片組件（處理 Signed URL）
function AttachmentImage({ 
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
  const [imageSrc, setImageSrc] = useState<string | null>(signedUrl || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      if (signedUrl) {
        setImageSrc(signedUrl);
        setLoading(false);
        return;
      }

      // 如果沒有 Signed URL，嘗試取得
      try {
        const url = await onGetSignedUrl(attachmentUrl);
        if (url) {
          setImageSrc(url);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('載入圖片錯誤:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachmentUrl, signedUrl]); // 移除 onGetSignedUrl 避免無限循環

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 border border-gray-200 dark:border-gray-700 rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">載入圖片中...</span>
      </div>
    );
  }

  if (error && base64Fallback) {
    // 如果 Signed URL 失敗，使用 Base64 備用
    return (
      <img
        src={`data:image/jpeg;base64,${base64Fallback}`}
        alt="收據附件"
        className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
      />
    );
  }

  if (!imageSrc) {
    return (
      <div className="flex items-center justify-center p-8 border border-gray-200 dark:border-gray-700 rounded-lg">
        <AlertCircle className="h-6 w-6 text-red-500" />
        <span className="ml-2 text-red-600 dark:text-red-400">無法載入圖片</span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt="收據附件"
      className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
      onError={() => {
        // 如果 Signed URL 載入失敗，嘗試使用 Base64 備用
        if (base64Fallback) {
          setImageSrc(`data:image/jpeg;base64,${base64Fallback}`);
        } else {
          setError(true);
        }
      }}
    />
  );
}

export default function ExpenseReviewsPage() {
  const [reviews, setReviews] = useState<ExpenseReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<ExpenseReview | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
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
      // 排除大型欄位（attachment_base64, description 等）和不需要的 OCR 詳細資訊
      let query = supabase
        .from('expense_reviews')
        .select(`
          id,
          expense_date,
          expense_category_name,
          employee_name,
          subsidiary_name,
          location_name,
          department_name,
          class_name,
          receipt_amount,
          receipt_currency,
          invoice_number,
          ocr_success,
          ocr_file_name,
          ocr_processed_at,
          review_status,
          netsuite_sync_status,
          netsuite_internal_id,
          netsuite_tran_id,
          netsuite_sync_error,
          netsuite_url,
          created_by_name,
          created_at
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
      
      setReviews((data || []) as ExpenseReview[]);
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
        throw new Error(result.error || result.message || '同步失敗');
      }

      if (result.success) {
        // 背景同步成功，不顯示通知，只更新列表狀態
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
      } else {
        throw new Error(result.error || '同步失敗');
      }
    } catch (error: any) {
      console.error('同步到 NetSuite 錯誤:', error);
      alert(`同步失敗: ${error.message || '未知錯誤'}\n\n請稍後再試，或檢查報支詳細資訊中的錯誤訊息。`);
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
      // 或：https://xxx.supabase.co/storage/v1/object/sign/expense-receipts/{path}
      const match = url.match(/\/expense-receipts\/(.+)$/);
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
  const getSignedUrl = useCallback(async (url: string): Promise<string | null> => {
    const filePath = extractFilePath(url);
    if (!filePath) {
      console.warn('無法從 URL 提取檔案路徑:', url);
      return null;
    }

    // 如果已經有快取的 Signed URL，直接返回
    if (signedUrls[url]) {
      return signedUrls[url];
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
        setSignedUrls(prev => ({ ...prev, [url]: data.signedUrl }));
        return data.signedUrl;
      }

      return null;
    } catch (error) {
      console.error('取得 Signed URL 錯誤:', error);
      return null;
    }
  }, [signedUrls, supabase, extractFilePath]);

  // 開啟詳細資訊對話框（優化：先顯示對話框，再在背景載入完整資料）
  const handleViewDetails = async (review: ExpenseReview) => {
    // 先顯示對話框，然後在背景載入完整資料（提升使用者體驗）
    setIsDetailDialogOpen(true);
    setIsEditing(false); // 重置編輯狀態
    
    // 先用列表資料初始化（快速顯示）
    setSelectedReview(review);
    setEditingData(review as any);

    // 如果有 attachment_url，在背景取得 Signed URL（不阻塞 UI）
    if (review.attachment_url) {
      getSignedUrl(review.attachment_url).then(signedUrl => {
        if (signedUrl) {
          setSignedUrls(prev => ({ ...prev, [review.attachment_url!]: signedUrl }));
        }
      }).catch(err => {
        console.error('取得 Signed URL 錯誤:', err);
      });
    }

    // 如果列表資料中沒有 attachment_base64 或 ID 欄位，在背景載入完整資料
    // 因為列表查詢時已經排除了這個大型欄位
    if ((!review.attachment_base64 || !(review as any).employee_id) && review.id) {
      // 在背景載入，不阻塞 UI
      Promise.resolve(
        supabase
          .from('expense_reviews')
          .select('*')
          .eq('id', review.id)
          .single()
      )
        .then(({ data: fullReview, error }) => {
          if (!error && fullReview) {
            setSelectedReview(fullReview as ExpenseReview);
            // 初始化編輯資料（包含所有 ID 欄位）
            setEditingData({
              ...fullReview,
              expense_date: fullReview.expense_date,
              receipt_amount: fullReview.receipt_amount,
              description: fullReview.description || '',
              receipt_missing: fullReview.receipt_missing || false,
            } as any);
          }
        })
        .catch(err => {
          console.error('載入完整報支資料錯誤:', err);
          // 如果載入失敗，繼續使用列表資料
        });
    }
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
        alert('報支資料已更新');
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
                // 如果審核通過，初始化 NetSuite 同步狀態
                netsuite_sync_status: reviewAction === 'approve' ? 'pending' : review.netsuite_sync_status,
              }
            : review
        );
        
        // 如果當前有狀態篩選，且該項目不再符合篩選條件，從列表中移除
        if (statusFilter !== 'all' && statusFilter !== newStatus) {
          return updatedReviews.filter(review => review.id !== selectedReview.id);
        }
        
        return updatedReviews;
      });

      // 如果審核通過，自動同步到 NetSuite（背景執行，不顯示通知）
      if (reviewAction === 'approve') {
        // 背景同步到 NetSuite（不阻塞 UI，不顯示通知）
        syncToNetSuite(selectedReview.id).catch((syncError) => {
          console.error('自動同步失敗:', syncError);
          // 同步失敗時也不顯示錯誤訊息，讓使用者可以手動重試
          // 使用者可以從列表中的 NetSuite 同步狀態看到失敗狀態
        });
        // 只顯示審批通過的訊息，不提及同步（同步在背景執行）
        alert('報支已審核通過');
      } else {
        alert(`報支已${reviewAction === 'reject' ? '拒絕' : '取消'}`);
      }

      setIsReviewDialogOpen(false);
      setSelectedReview(null);
      setReviewAction(null);
      
      // 優化：如果當前有狀態篩選，且該項目不再符合篩選條件，已經從列表中移除了
      // 但如果用戶切換到對應的狀態標籤（例如從「待審核」切換到「已通過」），
      // 需要重新載入列表以確保顯示所有該狀態的項目（包括剛剛審批的）
      // 這裡不立即載入，讓用戶切換標籤時自動觸發 loadReviews（因為 statusFilter 改變）
    } catch (error: any) {
      console.error('提交審核錯誤:', error);
      alert(`審核失敗: ${error.message}`);
    } finally {
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
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // 取得狀態標籤
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">待審核</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">已通過</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">已拒絕</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800">已取消</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getNetSuiteSyncBadge = (syncStatus: string | null, reviewStatus: string) => {
    // 只有已審核通過的報支才顯示 NetSuite 同步狀態
    if (reviewStatus !== 'approved') {
      return <span className="text-gray-400 dark:text-gray-500">-</span>;
    }

    if (!syncStatus || syncStatus === 'pending') {
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800">⏳ 待同步</Badge>;
    }

    switch (syncStatus) {
      case 'success':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">✅ 已同步</Badge>;
      case 'syncing':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">🔄 同步中</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">❌ 同步失敗</Badge>;
      default:
        return <Badge variant="outline">{syncStatus}</Badge>;
    }
  };

  return (
    <div className="p-8">
      {/* 頁面標題 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">報支審核</h1>
        </div>
        <p className="text-gray-600 dark:text-muted-foreground">
          檢視和審核待審核的報支項目
        </p>
      </div>

      {/* 狀態篩選 */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('all')}
        >
          全部
        </Button>
        <Button
          variant={statusFilter === 'pending' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('pending')}
        >
          待審核
        </Button>
        <Button
          variant={statusFilter === 'approved' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('approved')}
        >
          已通過
        </Button>
        <Button
          variant={statusFilter === 'rejected' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('rejected')}
        >
          已拒絕
        </Button>
        <Button
          variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('cancelled')}
        >
          已取消
        </Button>
      </div>

      {/* 報支列表 */}
      <Card>
        <CardHeader>
          <CardTitle>報支列表</CardTitle>
          <CardDescription>
            {statusFilter === 'all' ? '所有報支項目' : `狀態：${statusFilter === 'pending' ? '待審核' : statusFilter === 'approved' ? '已通過' : statusFilter === 'rejected' ? '已拒絕' : '已取消'}`}
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
                  <TableHead className="text-center bg-gray-100 dark:bg-gray-800">報支日期</TableHead>
                  <TableHead className="text-center bg-gray-100 dark:bg-gray-800">員工</TableHead>
                  <TableHead className="text-center bg-gray-100 dark:bg-gray-800">費用類別</TableHead>
                  <TableHead className="text-center bg-gray-100 dark:bg-gray-800">金額</TableHead>
                  <TableHead className="text-center bg-gray-100 dark:bg-gray-800">發票號碼</TableHead>
                  <TableHead className="text-center bg-gray-100 dark:bg-gray-800">OCR 狀態</TableHead>
                  <TableHead className="text-center bg-gray-100 dark:bg-gray-800">審核狀態</TableHead>
                  <TableHead className="text-center bg-gray-100 dark:bg-gray-800">建立時間</TableHead>
                  <TableHead className="text-center bg-gray-100 dark:bg-gray-800">NetSuite 同步</TableHead>
                  <TableHead className="text-center bg-gray-100 dark:bg-gray-800">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="text-center">{formatDate(review.expense_date)}</TableCell>
                    <TableCell className="text-center">{review.employee_name || '-'}</TableCell>
                    <TableCell className="text-center">{review.expense_category_name || '-'}</TableCell>
                    <TableCell className="text-center font-medium">
                      {formatAmount(review.receipt_amount, review.receipt_currency)}
                    </TableCell>
                    <TableCell className="text-center">{review.invoice_number || '-'}</TableCell>
                    <TableCell className="text-center">
                      {(() => {
                        // 判斷是否有執行過 OCR（檢查是否有 OCR 相關資料）
                        const hasOcrData = review.ocr_file_name || review.ocr_file_id || review.ocr_processed_at;
                        
                        if (!hasOcrData) {
                          // 沒有 OCR 資料，顯示「無OCR」
                          return (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800">
                              無OCR
                            </Badge>
                          );
                        } else if (review.ocr_success) {
                          // OCR 成功
                          return (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                              {review.ocr_confidence ? `${review.ocr_confidence}%` : '成功'}
                            </Badge>
                          );
                        } else {
                          // OCR 失敗
                          return (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                              失敗
                            </Badge>
                          );
                        }
                      })()}
                    </TableCell>
                    <TableCell className="text-center">{getStatusBadge(review.review_status)}</TableCell>
                    <TableCell className="text-center">{formatDate(review.created_at)}</TableCell>
                    <TableCell className="text-center">
                      {getNetSuiteSyncBadge(review.netsuite_sync_status, review.review_status)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(review)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          查看
                        </Button>
                        {review.review_status === 'pending' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleReview(review, 'approve')}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              通過
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleReview(review, 'reject')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              拒絕
                            </Button>
                          </>
                        )}
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
            </DialogDescription>
          </DialogHeader>
          {selectedReview && editingData && (
            <div className="space-y-6">
              {/* 編輯模式切換按鈕 */}
              <div className="flex justify-end gap-2">
                {!isEditing ? (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    disabled={selectedReview.review_status === 'approved' && selectedReview.netsuite_sync_status === 'success'}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    編輯
                  </Button>
                ) : (
                  <div className="flex gap-2">
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
                  </div>
                )}
              </div>

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
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">費用類別 *</Label>
                  {isEditing ? (
                    <Select
                      value={(editingData as any).expense_category_id || ''}
                      onValueChange={(value) => {
                        const category = formOptions.expenseCategories.find(c => c.id === value);
                        setEditingData({
                          ...editingData,
                          expense_category_id: value,
                          expense_category_name: category?.name || null,
                        } as any);
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
                    <p className="mt-1">{selectedReview.expense_category_name || '-'}</p>
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
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">部門</Label>
                  {isEditing ? (
                    <Select
                      value={(editingData as any).department_id || undefined}
                      onValueChange={(value) => {
                        const department = formOptions.departments.find(d => d.id === value);
                        setEditingData({
                          ...editingData,
                          department_id: value || null,
                          department_name: department?.name || null,
                        } as any);
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="請選擇部門（選填）" />
                      </SelectTrigger>
                      <SelectContent>
                        {formOptions.departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1">{selectedReview.department_name || '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">地點</Label>
                  {isEditing ? (
                    <Select
                      value={(editingData as any).location_id || undefined}
                      onValueChange={(value) => {
                        const location = formOptions.locations.find(l => l.id === value);
                        setEditingData({
                          ...editingData,
                          location_id: value || null,
                          location_name: location?.name || null,
                        } as any);
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="請選擇地點（選填）" />
                      </SelectTrigger>
                      <SelectContent>
                        {formOptions.locations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1">{selectedReview.location_name || '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">類別</Label>
                  {isEditing ? (
                    <Select
                      value={(editingData as any).class_id || undefined}
                      onValueChange={(value) => {
                        const classItem = formOptions.classes.find(c => c.id === value);
                        setEditingData({
                          ...editingData,
                          class_id: value || null,
                          class_name: classItem?.name || null,
                        } as any);
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="請選擇類別（選填）" />
                      </SelectTrigger>
                      <SelectContent>
                        {formOptions.classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1">{selectedReview.class_name || '-'}</p>
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
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">OCR 信心度</Label>
                      <p className="mt-1">{selectedReview.ocr_confidence ? `${selectedReview.ocr_confidence}%` : '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 附件圖片 */}
              {(selectedReview.attachment_url || selectedReview.attachment_base64) && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">附件</h3>
                  <div className="flex justify-center">
                    {selectedReview.attachment_url ? (
                      // 優先使用 Signed URL（Private bucket 需要）
                      <AttachmentImage
                        attachmentUrl={selectedReview.attachment_url}
                        signedUrl={signedUrls[selectedReview.attachment_url]}
                        base64Fallback={selectedReview.attachment_base64}
                        onGetSignedUrl={getSignedUrl}
                      />
                    ) : selectedReview.attachment_base64 ? (
                      // 備用 Base64
                      <img
                        src={`data:image/jpeg;base64,${selectedReview.attachment_base64}`}
                        alt="收據附件"
                        className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                      />
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
                      <p className="mt-1">{getStatusBadge(selectedReview.review_status)}</p>
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
                      <p className="mt-1">
                        {selectedReview.netsuite_sync_status === 'success' ? (
                          <Badge className="bg-green-500">✅ 已同步</Badge>
                        ) : selectedReview.netsuite_sync_status === 'syncing' ? (
                          <Badge className="bg-yellow-500">🔄 同步中</Badge>
                        ) : selectedReview.netsuite_sync_status === 'failed' ? (
                          <Badge className="bg-red-500">❌ 同步失敗</Badge>
                        ) : (
                          <Badge className="bg-gray-500">⏳ 待同步</Badge>
                        )}
                      </p>
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
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              關閉
            </Button>
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
              className={reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : reviewAction === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
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

