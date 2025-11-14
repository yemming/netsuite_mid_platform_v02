'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  CheckCircle2,
  FileEdit,
  Mail,
  Building2,
  User,
  Calendar,
  Loader2,
  Send,
  AlertCircle,
  History,
  Search,
} from 'lucide-react';
import type { EmailDraft, RevisionFeedback } from '@/lib/types/crm';

// 模擬資料（後續會從 API 取得）
const mockDraftData: Record<string, EmailDraft> = {
  'draft-001': {
    draft_id: 'draft-001',
    lead_id: 'lead-001',
    status: 'pending_review',
    current_version: 1,
    versions: [
      {
        version: 1,
        subject: '關於您的 ERP 系統整合需求',
        body: `親愛的張總經理，

感謝您對我們 NetSuite 整合方案的關注。我們已經仔細研究了貴公司「科技創新股份有限公司」的業務模式，並為您準備了一份客製化的解決方案。

根據我們的研究，貴公司專注於軟體開發與系統整合，主要服務包括企業管理系統和雲端服務。我們相信 NetSuite ERP 系統能夠完美契合您的業務需求，特別是：

1. **財務管理模組**：自動化會計流程，即時財務報表
2. **庫存管理**：精準追蹤庫存，優化供應鏈
3. **訂單管理**：從報價到出貨的完整流程

我們曾協助類似規模的製造業客戶（50-200 人）成功導入 NetSuite，平均提升了 30% 的營運效率。

如果您方便的話，我建議我們安排一次 30 分鐘的線上會議，深入討論您的具體需求。請點擊以下連結選擇適合的時間：

[會議排程連結]

期待與您進一步交流！

此致
敬禮

業務團隊`,
        created_at: '2025-01-15T10:30:00Z',
      },
    ],
    lead: {
      lead_id: 'lead-001',
      customer_name: '張三',
      customer_email: 'zhang@example.com',
      company_name: '科技創新股份有限公司',
      requirements_text: '需要整合 NetSuite ERP 系統，包含財務、庫存、訂單管理等功能',
      submitted_at: '2025-01-15T09:00:00Z',
    },
    company_research: {
      lead_id: 'lead-001',
      core_business: '軟體開發與系統整合',
      products_services: '企業管理系統、雲端服務',
      value_proposition: '為中小企業提供一站式數位轉型解決方案',
      ideal_customer_profile: '50-200 人的製造業與服務業',
    },
  },
  'draft-002': {
    draft_id: 'draft-002',
    lead_id: 'lead-002',
    status: 'pending_review',
    current_version: 2,
    versions: [
      {
        version: 1,
        subject: '關於您的 CRM 系統需求',
        body: '初版草稿（較長版本）...',
        created_at: '2025-01-14T14:00:00Z',
      },
      {
        version: 2,
        subject: '關於您的 CRM 系統需求 - 精簡版',
        body: `親愛的李總監，

感謝您對我們 CRM 解決方案的興趣。

根據我們的研究，貴公司「行銷顧問有限公司」專注於數位行銷與品牌顧問。我們的 CRM 系統能夠協助您：

- 客戶關係管理
- 銷售流程自動化
- 行銷活動追蹤

我們曾協助類似的新創公司成功導入，提升了 40% 的銷售效率。

如需進一步討論，歡迎安排會議：
[會議排程連結]

期待與您合作！

業務團隊`,
        created_at: '2025-01-15T08:00:00Z',
        revision_feedback: '信件太長了，精簡一點',
      },
    ],
    lead: {
      lead_id: 'lead-002',
      customer_name: '李四',
      customer_email: 'li@example.com',
      company_name: '行銷顧問有限公司',
      requirements_text: '需要 CRM 系統來管理客戶關係和銷售流程',
      submitted_at: '2025-01-14T13:00:00Z',
    },
    company_research: {
      lead_id: 'lead-002',
      core_business: '數位行銷與品牌顧問',
      products_services: '品牌策略、數位廣告、內容行銷',
      value_proposition: '協助企業建立數位品牌形象',
      ideal_customer_profile: '新創公司與中小企業',
    },
  },
};

export default function DraftDetailPage() {
  const router = useRouter();
  const params = useParams();
  const draftId = params.id as string;

  const [draft, setDraft] = useState<EmailDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');

  useEffect(() => {
    const loadDraft = async () => {
      setIsLoading(true);
      // TODO: 實際 API 呼叫
      // const response = await fetch(`/api/crm/drafts/${draftId}`);
      // const data = await response.json();

      // 模擬延遲
      await new Promise((resolve) => setTimeout(resolve, 500));

      const draftData = mockDraftData[draftId];
      if (draftData) {
        setDraft(draftData);
        const currentVersion = draftData.versions[draftData.current_version - 1];
        setEditedSubject(currentVersion?.subject || '');
        setEditedBody(currentVersion?.body || '');
      }
      setIsLoading(false);
    };

    if (draftId) {
      loadDraft();
    }
  }, [draftId]);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      // TODO: 實際 API 呼叫
      // await fetch(`/api/crm/drafts/${draftId}/approve`, { method: 'POST' });

      // 模擬延遲
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 更新本地狀態
      if (draft) {
        setDraft({ ...draft, status: 'approved' });
      }
      setShowApproveDialog(false);

      // 顯示成功訊息後返回列表
      setTimeout(() => {
        router.push('/dashboard/crm');
      }, 1500);
    } catch (error) {
      console.error('批准失敗:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionFeedback.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: 實際 API 呼叫
      // await fetch(`/api/crm/drafts/${draftId}/revise`, {
      //   method: 'POST',
      //   body: JSON.stringify({ feedback: revisionFeedback }),
      // });

      // 模擬延遲
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setShowRevisionDialog(false);
      setRevisionFeedback('');

      // 更新狀態為修訂中
      if (draft) {
        setDraft({ ...draft, status: 'modifying' });
      }

      // 顯示成功訊息
      alert('修訂請求已提交，AI 將根據您的回饋重新生成草稿');
    } catch (error) {
      console.error('修訂請求失敗:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusBadge = (status: EmailDraft['status']) => {
    switch (status) {
      case 'pending_review':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            待審核
          </Badge>
        );
      case 'approved':
        return <Badge variant="success">已批准</Badge>;
      case 'modifying':
        return <Badge variant="outline">修訂中</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">載入中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">找不到指定的草稿</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/crm')}>
              返回列表
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentVersion = draft.versions[draft.current_version - 1];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 頁面標題與返回按鈕 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/crm')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">草稿詳情</h1>
          <p className="text-muted-foreground mt-1">
            審核並管理業務回覆草稿
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(draft.status)}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左側：主要內容 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 客戶資訊卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                客戶資訊
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm text-muted-foreground">客戶姓名</Label>
                  <p className="font-medium">{draft.lead?.customer_name}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">電子郵件</Label>
                  <p className="font-medium">{draft.lead?.customer_email}</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    公司名稱
                  </Label>
                  <p className="font-medium">{draft.lead?.company_name}</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm text-muted-foreground">需求說明</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{draft.lead?.requirements_text}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    提交時間
                  </Label>
                  <p className="text-sm">{draft.lead ? formatDate(draft.lead.submitted_at) : '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 公司背景研究 */}
          {draft.company_research && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  AI 背景研究
                </CardTitle>
                <CardDescription>由 AI Agent 1 自動分析的公司資訊</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">核心業務</Label>
                  <p className="text-sm mt-1">{draft.company_research.core_business}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">產品服務</Label>
                  <p className="text-sm mt-1">{draft.company_research.products_services}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">價值主張</Label>
                  <p className="text-sm mt-1">{draft.company_research.value_proposition}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">理想客戶輪廓</Label>
                  <p className="text-sm mt-1">{draft.company_research.ideal_customer_profile}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 郵件草稿 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    郵件草稿
                  </CardTitle>
                  <CardDescription>
                    版本 {draft.current_version} • {currentVersion ? formatDate(currentVersion.created_at) : ''}
                  </CardDescription>
                </div>
                <Badge variant="outline">v{draft.current_version}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email-subject">郵件主旨</Label>
                <Input
                  id="email-subject"
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  className="mt-1"
                  placeholder="郵件主旨"
                />
              </div>
              <div>
                <Label htmlFor="email-body">郵件內容</Label>
                <Textarea
                  id="email-body"
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  className="mt-1 min-h-[400px] font-mono text-sm"
                  placeholder="郵件內容"
                />
              </div>
            </CardContent>
          </Card>

          {/* 版本歷史 */}
          {draft.versions.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  版本歷史
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {draft.versions
                    .slice()
                    .reverse()
                    .map((version) => (
                      <div
                        key={version.version}
                        className={`p-4 rounded-lg border ${
                          version.version === draft.current_version
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">v{version.version}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(version.created_at)}
                            </span>
                          </div>
                          {version.version === draft.current_version && (
                            <Badge variant="secondary">目前版本</Badge>
                          )}
                        </div>
                        {version.revision_feedback && (
                          <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-950 rounded text-sm">
                            <p className="font-medium text-yellow-800 dark:text-yellow-200">
                              修訂回饋：
                            </p>
                            <p className="text-yellow-700 dark:text-yellow-300">
                              {version.revision_feedback}
                            </p>
                          </div>
                        )}
                        <div className="text-sm">
                          <p className="font-medium mb-1">{version.subject}</p>
                          <p className="text-muted-foreground line-clamp-3">{version.body}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右側：操作面板 */}
        <div className="space-y-6">
          {/* 操作按鈕 */}
          {draft.status === 'pending_review' && (
            <Card>
              <CardHeader>
                <CardTitle>操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => setShowApproveDialog(true)}
                  disabled={isSubmitting}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  批准並發送
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowRevisionDialog(true)}
                  disabled={isSubmitting}
                >
                  <FileEdit className="mr-2 h-4 w-4" />
                  請求修訂
                </Button>
              </CardContent>
            </Card>
          )}

          {/* 草稿資訊 */}
          <Card>
            <CardHeader>
              <CardTitle>草稿資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <Label className="text-muted-foreground">草稿 ID</Label>
                <p className="font-mono text-xs">{draft.draft_id}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">狀態</Label>
                <div className="mt-1">{getStatusBadge(draft.status)}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">目前版本</Label>
                <p>v{draft.current_version}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">總版本數</Label>
                <p>{draft.versions.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 批准對話框 */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認批准並發送</DialogTitle>
            <DialogDescription>
              您確定要批准此草稿並發送給客戶嗎？此操作無法撤銷。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <p className="text-sm">
                <strong>收件人：</strong>
                {draft.lead?.customer_email}
              </p>
              <p className="text-sm">
                <strong>主旨：</strong>
                {editedSubject}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              取消
            </Button>
            <Button onClick={handleApprove} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  處理中...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  確認發送
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 修訂對話框 */}
      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>請求修訂</DialogTitle>
            <DialogDescription>
              請提供您的修訂意見，AI 將根據您的回饋重新生成草稿。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="revision-feedback">修訂回饋</Label>
            <Textarea
              id="revision-feedback"
              value={revisionFeedback}
              onChange={(e) => setRevisionFeedback(e.target.value)}
              placeholder="例如：信件太長了，精簡一點；加上我們在嘉義警局的實際數字..."
              className="mt-2 min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevisionDialog(false)}>
              取消
            </Button>
            <Button
              onClick={handleRequestRevision}
              disabled={isSubmitting || !revisionFeedback.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <FileEdit className="mr-2 h-4 w-4" />
                  提交修訂請求
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

