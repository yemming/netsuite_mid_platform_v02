'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, CheckCircle2, XCircle, Clock, Eye, Calendar, User, Building2, MapPin, DollarSign, AlertCircle, Loader2, Trash2, Send, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
  attachment_url: string | null;
  attachment_base64: string | null;
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
  }, [attachmentUrl, signedUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 border border-gray-200 dark:border-gray-700 rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">載入圖片中...</span>
      </div>
    );
  }

  if (error && base64Fallback) {
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
        if (base64Fallback) {
          setImageSrc(`data:image/jpeg;base64,${base64Fallback}`);
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

  const supabase = createClient();

  // 載入我的報支列表（只載入表頭，不載入 lines 和圖檔）
  const loadReviews = async () => {
    setLoading(true);
    try {
      // 取得當前使用者
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('無法取得使用者資訊，請重新登入');
      }

      // 只查詢表頭必要欄位，並只查詢 expense_lines 的總金額和幣別（不查其他欄位和圖檔）
      let query = supabase
        .from('expense_reviews')
        .select(`
          id,
          expense_date,
          employee_name,
          subsidiary_name,
          description,
          review_status,
          created_at,
          expense_lines (
            gross_amt,
            currency
          )
        `)
        .eq('created_by', user.id) // 只顯示當前使用者的報支
        .order('created_at', { ascending: false });

      // 根據狀態篩選
      if (statusFilter !== 'all') {
        query = query.eq('review_status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // 處理資料：計算總金額並格式化
      const processedData = (data || []).map((review: any) => {
        // 從 expense_lines 計算總金額
        const totalAmount = review.expense_lines?.reduce((sum: number, line: any) => {
          return sum + (parseFloat(line.gross_amt) || 0);
        }, 0) || 0;
        
        // 取得第一個 line 的幣別（如果有的話）
        const firstLine = review.expense_lines?.[0];
        const currency = firstLine?.currency || 'TWD';
        
        return {
          id: review.id,
          expense_date: review.expense_date,
          employee_name: review.employee_name,
          subsidiary_name: review.subsidiary_name,
          description: review.description,
          review_status: review.review_status,
          created_at: review.created_at,
          receipt_amount: totalAmount,
          receipt_currency: currency,
        };
      });
      
      setReviews(processedData);
    } catch (error: any) {
      console.error('載入報支列表錯誤:', error);
      alert(`載入失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [statusFilter]);

  // 從 attachment_url 提取檔案路徑
  const extractFilePath = useCallback((url: string): string | null => {
    try {
      const match = url.match(/\/expense-receipts\/(.+)$/);
      if (match && match[1]) {
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

    if (signedUrls[url]) {
      return signedUrls[url];
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
        setSignedUrls(prev => ({ ...prev, [url]: data.signedUrl }));
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

  // 提交報支項目（將草稿改為 pending）
  const handleSubmit = async (review: ExpenseReviewListItem) => {
    if (!confirm(`確定要提交此報支項目嗎？提交後將進入審核流程。`)) {
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

      // 組裝詳細資料
      const detail: ExpenseReviewDetail = {
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
        lines: (lines || []).map((line: any) => ({
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
          attachment_url: line.attachment_url || null,
          attachment_base64: line.attachment_base64 || null,
        })),
      };

      setSelectedReview(detail);

      // 為所有有附件的 lines 取得 Signed URL
      for (const line of detail.lines) {
        if (line.attachment_url) {
          const signedUrl = await getSignedUrl(line.attachment_url);
          if (signedUrl) {
            setSignedUrls(prev => ({ ...prev, [line.attachment_url!]: signedUrl }));
          }
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

  // 取得狀態 Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-400">草稿</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">審核中</Badge>;
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
          <h1 className="text-3xl font-bold">我的報支</h1>
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
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
              >
                全部
              </Button>
              <Button
                variant={statusFilter === 'draft' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('draft')}
              >
                草稿
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('pending')}
              >
                審核中
              </Button>
              <Button
                variant={statusFilter === 'approved' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('approved')}
              >
                審核通過
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
                  <TableHead className="text-center bg-gray-100 dark:bg-gray-800">查看</TableHead>
                  <TableHead className="bg-gray-100 dark:bg-gray-800">報支日期</TableHead>
                  <TableHead className="bg-gray-100 dark:bg-gray-800">員工</TableHead>
                  <TableHead className="bg-gray-100 dark:bg-gray-800">總金額</TableHead>
                  <TableHead className="bg-gray-100 dark:bg-gray-800">報告狀態</TableHead>
                  <TableHead className="bg-gray-100 dark:bg-gray-800">建立時間</TableHead>
                  <TableHead className="text-center bg-gray-100 dark:bg-gray-800">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
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
                    <TableCell>{formatDate(review.expense_date)}</TableCell>
                    <TableCell>{review.employee_name || '-'}</TableCell>
                    <TableCell className="font-medium">
                      {formatAmount(review.receipt_amount || 0, review.receipt_currency || 'TWD')}
                    </TableCell>
                    <TableCell>{getStatusBadge(review.review_status)}</TableCell>
                    <TableCell>{formatDate(review.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {(review.review_status === 'draft' || review.review_status === 'pending') && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => router.push(`/dashboard/ocr-expense?id=${review.id}`)}
                          >
                            編輯
                          </Button>
                        )}
                        {(review.review_status === 'draft' || review.review_status === 'pending') && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(review)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            刪除
                          </Button>
                        )}
                        {review.review_status === 'draft' && (
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleSubmit(review)}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            提交
                          </Button>
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
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>報支詳細資訊</DialogTitle>
            <DialogDescription>
              報支編號: {selectedReview?.id}
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span>載入詳細資料中...</span>
            </div>
          ) : selectedReview ? (
            <div className="space-y-6">
              {/* 表頭基本資訊 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">基本資訊</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">報支日期</Label>
                    <p className="mt-1">{formatDate(selectedReview.expense_date)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">員工</Label>
                    <p className="mt-1">{selectedReview.employee_name || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">公司別</Label>
                    <p className="mt-1">{selectedReview.subsidiary_name || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">報告狀態</Label>
                    <p className="mt-1">{getStatusBadge(selectedReview.review_status)}</p>
                  </div>
                  {selectedReview.description && (
                    <div className="col-span-2">
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">描述</Label>
                      <p className="mt-1">{selectedReview.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 報支明細（Expense Lines） */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">報支明細</h3>
                {selectedReview.lines.length === 0 ? (
                  <p className="text-muted-foreground">尚無明細資料</p>
                ) : (
                  <div className="space-y-6">
                    {selectedReview.lines.map((line, index) => (
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
                              {line.ocr_confidence && (
                                <div>
                                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">OCR 信心度</Label>
                                  <p className="mt-1">{line.ocr_confidence}%</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 附件圖片 */}
                        {(line.attachment_url || line.attachment_base64) && (
                          <div className="border-t pt-4 mt-4">
                            <h5 className="text-sm font-semibold mb-3">附件</h5>
                            <div className="flex justify-center">
                              {line.attachment_url ? (
                                <AttachmentImage
                                  attachmentUrl={line.attachment_url}
                                  signedUrl={signedUrls[line.attachment_url]}
                                  base64Fallback={line.attachment_base64}
                                  onGetSignedUrl={getSignedUrl}
                                />
                              ) : line.attachment_base64 ? (
                                <img
                                  src={`data:image/jpeg;base64,${line.attachment_base64}`}
                                  alt={`收據附件 - 明細 #${line.line_number}`}
                                  className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                                />
                              ) : null}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

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

              {/* NetSuite 同步狀態 */}
              {selectedReview.netsuite_sync_status && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">NetSuite 同步狀態</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">同步狀態</Label>
                      <p className="mt-1">{selectedReview.netsuite_sync_status}</p>
                    </div>
                    {selectedReview.netsuite_internal_id && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">NetSuite Internal ID</Label>
                        <p className="mt-1">{selectedReview.netsuite_internal_id}</p>
                      </div>
                    )}
                    {selectedReview.netsuite_tran_id && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">NetSuite 交易編號</Label>
                        <p className="mt-1">{selectedReview.netsuite_tran_id}</p>
                      </div>
                    )}
                    {selectedReview.netsuite_sync_error && (
                      <div className="col-span-2">
                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">同步錯誤</Label>
                        <p className="mt-1 text-red-600 dark:text-red-400">{selectedReview.netsuite_sync_error}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              關閉
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

