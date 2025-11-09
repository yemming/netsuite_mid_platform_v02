'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, CheckCircle2, XCircle, Clock, Eye, Calendar, User, Building2, MapPin, DollarSign, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

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
  attachment_url: string | null;
  attachment_base64: string | null;
  review_status: string;
  netsuite_sync_status: string | null;
  netsuite_internal_id: number | null;
  netsuite_tran_id: string | null;
  netsuite_sync_error: string | null;
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
  const [reviews, setReviews] = useState<ExpenseReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<ExpenseReview | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const supabase = createClient();

  // 載入我的報支列表
  const loadReviews = async () => {
    setLoading(true);
    try {
      // 取得當前使用者
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('無法取得使用者資訊，請重新登入');
      }

      let query = supabase
        .from('expense_reviews')
        .select('*')
        .eq('created_by', user.id) // 只顯示當前使用者的報支
        .order('created_at', { ascending: false });

      // 根據狀態篩選
      if (statusFilter !== 'all') {
        query = query.eq('review_status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReviews(data || []);
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

  // 開啟詳細資訊對話框
  const handleViewDetails = async (review: ExpenseReview) => {
    setSelectedReview(review);
    setIsDetailDialogOpen(true);

    if (review.attachment_url) {
      const signedUrl = await getSignedUrl(review.attachment_url);
      if (signedUrl) {
        setSignedUrls(prev => ({ ...prev, [review.attachment_url!]: signedUrl }));
      }
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

  // 取得狀態 Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">待審核</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">已通過</Badge>;
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
          <div className="flex gap-2">
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
                  <TableHead className="bg-gray-100 dark:bg-gray-800">報支日期</TableHead>
                  <TableHead className="bg-gray-100 dark:bg-gray-800">費用用途</TableHead>
                  <TableHead className="bg-gray-100 dark:bg-gray-800">金額</TableHead>
                  <TableHead className="bg-gray-100 dark:bg-gray-800">審核狀態</TableHead>
                  <TableHead className="bg-gray-100 dark:bg-gray-800">建立時間</TableHead>
                  <TableHead className="text-center bg-gray-100 dark:bg-gray-800">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>{formatDate(review.expense_date)}</TableCell>
                    <TableCell>{review.expense_category_name || '-'}</TableCell>
                    <TableCell className="font-medium">
                      {formatAmount(review.receipt_amount, review.receipt_currency)}
                    </TableCell>
                    <TableCell>{getStatusBadge(review.review_status)}</TableCell>
                    <TableCell>{formatDate(review.created_at)}</TableCell>
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
          {selectedReview && (
            <div className="space-y-6">
              {/* 基本資訊 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">基本資訊</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">報支日期</Label>
                    <p className="mt-1">{formatDate(selectedReview.expense_date)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">費用用途</Label>
                    <p className="mt-1">{selectedReview.expense_category_name || '-'}</p>
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
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">部門</Label>
                    <p className="mt-1">{selectedReview.department_name || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">地點</Label>
                    <p className="mt-1">{selectedReview.location_name || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">類別</Label>
                    <p className="mt-1">{selectedReview.class_name || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">金額</Label>
                    <p className="mt-1 font-medium">{formatAmount(selectedReview.receipt_amount, selectedReview.receipt_currency)}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">描述</Label>
                    <p className="mt-1">{selectedReview.description || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">收據遺失</Label>
                    <p className="mt-1">{selectedReview.receipt_missing ? '是' : '否'}</p>
                  </div>
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
                      <AttachmentImage
                        attachmentUrl={selectedReview.attachment_url}
                        signedUrl={signedUrls[selectedReview.attachment_url]}
                        base64Fallback={selectedReview.attachment_base64}
                        onGetSignedUrl={getSignedUrl}
                      />
                    ) : selectedReview.attachment_base64 ? (
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

            </div>
          )}
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

