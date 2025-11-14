'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Mail,
  Clock,
  CheckCircle2,
  FileEdit,
  Building2,
  User,
  Eye,
} from 'lucide-react';
import type { EmailDraft } from '@/lib/types/crm';

// 模擬資料（後續會從 API 取得）
const mockDrafts: EmailDraft[] = [
  {
    draft_id: 'draft-001',
    lead_id: 'lead-001',
    status: 'pending_review',
    current_version: 1,
    versions: [
      {
        version: 1,
        subject: '關於您的 ERP 系統整合需求',
        body: '親愛的張總經理，\n\n感謝您對我們 NetSuite 整合方案的關注...',
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
  {
    draft_id: 'draft-002',
    lead_id: 'lead-002',
    status: 'pending_review',
    current_version: 2,
    versions: [
      {
        version: 1,
        subject: '關於您的 CRM 系統需求',
        body: '初版草稿...',
        created_at: '2025-01-14T14:00:00Z',
      },
      {
        version: 2,
        subject: '關於您的 CRM 系統需求 - 精簡版',
        body: '根據您的回饋，我們已精簡內容...',
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
  {
    draft_id: 'draft-003',
    lead_id: 'lead-003',
    status: 'approved',
    current_version: 1,
    versions: [
      {
        version: 1,
        subject: '關於您的 HCM 系統需求',
        body: '親愛的王總監...',
        created_at: '2025-01-13T11:00:00Z',
      },
    ],
    lead: {
      lead_id: 'lead-003',
      customer_name: '王五',
      customer_email: 'wang@example.com',
      company_name: '人力資源管理公司',
      requirements_text: '需要人力資源管理系統，包含考勤、薪資、招募等功能',
      submitted_at: '2025-01-13T10:00:00Z',
    },
    company_research: {
      lead_id: 'lead-003',
      core_business: '人力資源外包與顧問服務',
      products_services: 'HR 外包、人才招募、培訓課程',
      value_proposition: '為企業提供專業的人力資源解決方案',
      ideal_customer_profile: '100-500 人的服務業',
    },
  },
];

export default function CRMDashboardPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<EmailDraft[]>([]);
  const [filteredDrafts, setFilteredDrafts] = useState<EmailDraft[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_review' | 'approved'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 模擬 API 載入
    const loadDrafts = async () => {
      setIsLoading(true);
      // TODO: 實際 API 呼叫
      // const response = await fetch('/api/crm/drafts');
      // const data = await response.json();
      
      // 模擬延遲
      await new Promise((resolve) => setTimeout(resolve, 500));
      setDrafts(mockDrafts);
      setFilteredDrafts(mockDrafts);
      setIsLoading(false);
    };

    loadDrafts();
  }, []);

  useEffect(() => {
    // 搜尋與篩選邏輯
    let filtered = drafts;

    // 狀態篩選
    if (statusFilter !== 'all') {
      filtered = filtered.filter((draft) => draft.status === statusFilter);
    }

    // 搜尋
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (draft) =>
          draft.lead?.customer_name.toLowerCase().includes(query) ||
          draft.lead?.company_name.toLowerCase().includes(query) ||
          draft.lead?.customer_email.toLowerCase().includes(query) ||
          draft.versions[draft.current_version - 1]?.subject.toLowerCase().includes(query)
      );
    }

    setFilteredDrafts(filtered);
  }, [drafts, searchQuery, statusFilter]);

  const getStatusBadge = (status: EmailDraft['status']) => {
    switch (status) {
      case 'pending_review':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">待審核</Badge>;
      case 'approved':
        return <Badge variant="success">已批准</Badge>;
      case 'modifying':
        return <Badge variant="outline">修訂中</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  const handleViewDraft = (draftId: string) => {
    router.push(`/dashboard/crm/drafts/${draftId}`);
  };

  const pendingCount = drafts.filter((d) => d.status === 'pending_review').length;
  const approvedCount = drafts.filter((d) => d.status === 'approved').length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">CRM 業務協同系統</h1>
        <p className="text-muted-foreground">
          審核 AI 生成的業務回覆草稿，確保每封郵件都符合您的標準
        </p>
      </div>

      {/* 統計卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待審核草稿</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">需要您審核的草稿</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已批准</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">已發送的郵件</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總草稿數</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drafts.length}</div>
            <p className="text-xs text-muted-foreground">所有草稿</p>
          </CardContent>
        </Card>
      </div>

      {/* 搜尋與篩選 */}
      <Card>
        <CardHeader>
          <CardTitle>草稿清單</CardTitle>
          <CardDescription>管理所有業務回覆草稿</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* 搜尋框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋客戶姓名、公司名稱或郵件主旨..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 狀態篩選 */}
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                全部
              </Button>
              <Button
                variant={statusFilter === 'pending_review' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending_review')}
              >
                待審核
              </Button>
              <Button
                variant={statusFilter === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('approved')}
              >
                已批准
              </Button>
            </div>
          </div>

          {/* 草稿表格 */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="inline-block h-8 w-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin mb-2" />
              <p>載入中...</p>
            </div>
          ) : filteredDrafts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>沒有找到符合條件的草稿</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>客戶資訊</TableHead>
                    <TableHead>郵件主旨</TableHead>
                    <TableHead>版本</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead>建立時間</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrafts.map((draft) => {
                    const currentVersion = draft.versions[draft.current_version - 1];
                    return (
                      <TableRow key={draft.draft_id} className="cursor-pointer hover:bg-accent/50">
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{draft.lead?.customer_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              <span>{draft.lead?.company_name}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {draft.lead?.customer_email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            <p className="font-medium truncate">{currentVersion?.subject}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {currentVersion?.body.substring(0, 100)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">v{draft.current_version}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(draft.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {currentVersion ? formatDate(currentVersion.created_at) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDraft(draft.draft_id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            查看
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

