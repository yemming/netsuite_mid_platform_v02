'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Calendar,
  User,
  Building2,
  Target,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit,
  Eye,
  LayoutDashboard,
  List,
} from 'lucide-react';
import { Opportunity, OpportunityStage, BANTAssessment } from '@/lib/types/crm';

// 商機階段配置（Salesforce 方法論）
const stageConfig: Record<OpportunityStage, { label: string; color: string; order: number }> = {
  'prospecting': { label: '潛在客戶', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', order: 1 },
  'qualification': { label: '資格確認', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', order: 2 },
  'needs-analysis': { label: '需求分析', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', order: 3 },
  'value-proposition': { label: '價值主張', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200', order: 4 },
  'id-decision-makers': { label: '識別決策者', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200', order: 5 },
  'perception-analysis': { label: '感知分析', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200', order: 6 },
  'proposal-price-quote': { label: '提案/報價', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', order: 7 },
  'negotiation-review': { label: '談判/審查', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', order: 8 },
  'closed-won': { label: '成交', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', order: 9 },
  'closed-lost': { label: '失單', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', order: 10 },
};

// 模擬資料
const mockOpportunities: Opportunity[] = [
  {
    id: '1',
    name: 'ABC 公司 ERP 系統導入',
    accountId: 'acc-1',
    accountName: 'ABC 科技股份有限公司',
    contactId: 'con-1',
    contactName: '張三',
    stage: 'needs-analysis',
    amount: 5000000,
    probability: 60,
    expectedCloseDate: '2024-03-31',
    type: 'new-business',
    leadSource: '官網表單',
    description: 'ABC 公司需要導入新的 ERP 系統以提升營運效率',
    ownerName: '業務經理 李四',
    nextStep: '安排需求訪談會議',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
    bant: {
      budget: { score: 4, amount: 5000000, confirmed: true, notes: '預算已確認' },
      authority: { score: 3, decisionMaker: '張三', role: '資訊長', confirmed: true },
      need: { score: 5, painPoints: ['系統老舊', '效率低下'], requirements: '需要現代化 ERP 系統', urgency: 'high' },
      timeline: { score: 4, expectedCloseDate: '2024-03-31', confirmed: true },
      overallScore: 16,
      assessmentDate: '2024-01-20',
      assessedBy: '業務經理 李四',
    },
  },
  {
    id: '2',
    name: 'XYZ 企業 CRM 升級專案',
    accountId: 'acc-2',
    accountName: 'XYZ 企業有限公司',
    contactId: 'con-2',
    contactName: '王五',
    stage: 'proposal-price-quote',
    amount: 3000000,
    probability: 75,
    expectedCloseDate: '2024-02-28',
    type: 'existing-business',
    leadSource: '客戶推薦',
    description: 'XYZ 企業需要升級現有 CRM 系統',
    ownerName: '業務專員 陳六',
    nextStep: '提交正式報價單',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-25',
    bant: {
      budget: { score: 5, amount: 3000000, confirmed: true },
      authority: { score: 5, decisionMaker: '王五', role: '總經理', confirmed: true },
      need: { score: 4, painPoints: ['功能不足'], requirements: '需要更強大的 CRM 功能', urgency: 'medium' },
      timeline: { score: 5, expectedCloseDate: '2024-02-28', confirmed: true },
      overallScore: 19,
      assessmentDate: '2024-01-25',
      assessedBy: '業務專員 陳六',
    },
  },
];

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(mockOpportunities);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isBANTDialogOpen, setIsBANTDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // 篩選商機
  const filteredOpportunities = opportunities.filter(opp => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      opp.name.toLowerCase().includes(query) ||
      opp.accountName?.toLowerCase().includes(query) ||
      opp.contactName?.toLowerCase().includes(query)
    );
  });

  // 按階段分組（看板視圖）
  const opportunitiesByStage = filteredOpportunities.reduce((acc, opp) => {
    if (!acc[opp.stage]) {
      acc[opp.stage] = [];
    }
    acc[opp.stage].push(opp);
    return acc;
  }, {} as Record<OpportunityStage, Opportunity[]>);

  // 計算階段總金額
  const getStageTotal = (stage: OpportunityStage) => {
    const opps = opportunitiesByStage[stage] || [];
    return opps.reduce((sum, opp) => sum + opp.amount, 0);
  };

  // 計算階段總數
  const getStageCount = (stage: OpportunityStage) => {
    return (opportunitiesByStage[stage] || []).length;
  };

  // 獲取 BANT 分數顏色
  const getBANTScoreColor = (score: number) => {
    if (score >= 16) return 'text-green-600 dark:text-green-400';
    if (score >= 12) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // 拖曳處理（簡化版，實際應該使用 dnd-kit）
  const handleStageChange = (oppId: string, newStage: OpportunityStage) => {
    setOpportunities(prev =>
      prev.map(opp =>
        opp.id === oppId ? { ...opp, stage: newStage, updatedAt: new Date().toISOString() } : opp
      )
    );
  };

  // 排序階段
  const sortedStages = (Object.keys(stageConfig) as OpportunityStage[]).sort(
    (a, b) => stageConfig[a].order - stageConfig[b].order
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">商機管理</h1>
          <p className="text-gray-500 mt-1">Salesforce 方法論 + IBM BANT 評估</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            看板
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 mr-2" />
            列表
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新增商機
          </Button>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>總商機數</CardDescription>
            <CardTitle className="text-2xl">{opportunities.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              總金額: ${opportunities.reduce((sum, opp) => sum + opp.amount, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>進行中</CardDescription>
            <CardTitle className="text-2xl">
              {opportunities.filter(opp => !opp.stage.startsWith('closed')).length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              成交機率: {Math.round(opportunities.filter(opp => !opp.stage.startsWith('closed')).reduce((sum, opp) => sum + opp.probability, 0) / opportunities.filter(opp => !opp.stage.startsWith('closed')).length || 0)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>已成交</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {opportunities.filter(opp => opp.stage === 'closed-won').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              金額: ${opportunities.filter(opp => opp.stage === 'closed-won').reduce((sum, opp) => sum + opp.amount, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>平均 BANT 分數</CardDescription>
            <CardTitle className="text-2xl">
              {Math.round(opportunities.filter(opp => opp.bant).reduce((sum, opp) => sum + (opp.bant?.overallScore || 0), 0) / opportunities.filter(opp => opp.bant).length || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">滿分 20 分</div>
          </CardContent>
        </Card>
      </div>

      {/* 搜尋和篩選 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜尋商機名稱、客戶名稱或聯絡人..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              篩選
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 看板視圖 */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 overflow-x-auto">
          {sortedStages.map((stage) => {
            const config = stageConfig[stage];
            const stageOpps = opportunitiesByStage[stage] || [];
            const stageTotal = getStageTotal(stage);
            const stageCount = getStageCount(stage);

            return (
              <div key={stage} className="flex flex-col min-w-[280px]">
                <Card className="flex-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
                      <Badge variant="secondary">{stageCount}</Badge>
                    </div>
                    <CardDescription className="text-xs">
                      ${stageTotal.toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                    {stageOpps.map((opp) => (
                      <Card
                        key={opp.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                          setSelectedOpportunity(opp);
                          setIsDialogOpen(true);
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-sm line-clamp-2">{opp.name}</h4>
                            </div>
                            <div className="text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {opp.accountName}
                              </div>
                              {opp.contactName && (
                                <div className="flex items-center gap-1 mt-1">
                                  <User className="h-3 w-3" />
                                  {opp.contactName}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t">
                              <div className="text-sm font-semibold text-blue-600">
                                ${opp.amount.toLocaleString()}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {opp.probability}%
                              </Badge>
                            </div>
                            {opp.bant && (
                              <div className="pt-2 border-t">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-500">BANT 分數</span>
                                  <span className={`font-semibold ${getBANTScoreColor(opp.bant.overallScore)}`}>
                                    {opp.bant.overallScore}/20
                                  </span>
                                </div>
                              </div>
                            )}
                            {opp.expectedCloseDate && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 pt-1">
                                <Calendar className="h-3 w-3" />
                                預期成交: {new Date(opp.expectedCloseDate).toLocaleDateString('zh-TW')}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {stageOpps.length === 0 && (
                      <div className="text-center text-sm text-gray-400 py-8">
                        無商機
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* 列表視圖 */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">商機名稱</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">客戶</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">階段</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">金額</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">機率</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">BANT</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredOpportunities.map((opp) => (
                    <tr key={opp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3">
                        <div className="font-medium">{opp.name}</div>
                        {opp.nextStep && (
                          <div className="text-xs text-gray-500 mt-1">下一步: {opp.nextStep}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">{opp.accountName}</div>
                        {opp.contactName && (
                          <div className="text-xs text-gray-500">{opp.contactName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={stageConfig[opp.stage].color}>
                          {stageConfig[opp.stage].label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold">${opp.amount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${opp.probability}%` }}
                            />
                          </div>
                          <span className="text-sm">{opp.probability}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {opp.bant ? (
                          <span className={`font-semibold ${getBANTScoreColor(opp.bant.overallScore)}`}>
                            {opp.bant.overallScore}/20
                          </span>
                        ) : (
                          <span className="text-gray-400">未評估</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOpportunity(opp);
                              setIsBANTDialogOpen(true);
                            }}
                          >
                            <Target className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOpportunity(opp);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 新增/編輯商機對話框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedOpportunity ? '編輯商機' : '新增商機'}</DialogTitle>
            <DialogDescription>
              {selectedOpportunity ? '修改商機資訊' : '建立新的商機記錄'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>商機名稱 *</Label>
                <Input placeholder="例如: ABC 公司 ERP 系統導入" />
              </div>
              <div>
                <Label>客戶 *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇客戶" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acc-1">ABC 科技股份有限公司</SelectItem>
                    <SelectItem value="acc-2">XYZ 企業有限公司</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>階段 *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇階段" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedStages.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stageConfig[stage].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>金額 *</Label>
                <Input type="number" placeholder="0" />
              </div>
              <div>
                <Label>成交機率 (%)</Label>
                <Input type="number" min="0" max="100" placeholder="0" />
              </div>
              <div>
                <Label>預期成交日期</Label>
                <Input type="date" />
              </div>
            </div>
            <div>
              <Label>描述</Label>
              <Textarea placeholder="輸入商機描述..." rows={3} />
            </div>
            <div>
              <Label>下一步行動</Label>
              <Input placeholder="例如: 安排需求訪談會議" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={() => setIsDialogOpen(false)}>儲存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BANT 評估對話框 */}
      <Dialog open={isBANTDialogOpen} onOpenChange={setIsBANTDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>BANT 評估 - {selectedOpportunity?.name}</DialogTitle>
            <DialogDescription>
              IBM 打單方法論：評估預算(Budget)、決策權(Authority)、需求(Need)、時間表(Timeline)
            </DialogDescription>
          </DialogHeader>
          {selectedOpportunity && (
            <div className="space-y-6 py-4">
              {/* Budget */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Budget (預算)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>分數 (0-5)</Label>
                    <Select defaultValue={selectedOpportunity.bant?.budget.score.toString() || '0'}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5].map((score) => (
                          <SelectItem key={score} value={score.toString()}>
                            {score}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>預算金額</Label>
                    <Input type="number" placeholder="0" defaultValue={selectedOpportunity.bant?.budget.amount} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked={selectedOpportunity.bant?.budget.confirmed} />
                    <Label>已確認有預算</Label>
                  </div>
                  <div>
                    <Label>備註</Label>
                    <Textarea placeholder="輸入備註..." rows={2} defaultValue={selectedOpportunity.bant?.budget.notes} />
                  </div>
                </CardContent>
              </Card>

              {/* Authority */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Authority (決策權)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>分數 (0-5)</Label>
                    <Select defaultValue={selectedOpportunity.bant?.authority.score.toString() || '0'}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5].map((score) => (
                          <SelectItem key={score} value={score.toString()}>
                            {score}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>決策者姓名</Label>
                      <Input defaultValue={selectedOpportunity.bant?.authority.decisionMaker} />
                    </div>
                    <div>
                      <Label>職位</Label>
                      <Input defaultValue={selectedOpportunity.bant?.authority.role} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked={selectedOpportunity.bant?.authority.confirmed} />
                    <Label>已確認有決策權</Label>
                  </div>
                  <div>
                    <Label>備註</Label>
                    <Textarea placeholder="輸入備註..." rows={2} defaultValue={selectedOpportunity.bant?.authority.notes} />
                  </div>
                </CardContent>
              </Card>

              {/* Need */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Need (需求)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>分數 (0-5)</Label>
                    <Select defaultValue={selectedOpportunity.bant?.need.score.toString() || '0'}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5].map((score) => (
                          <SelectItem key={score} value={score.toString()}>
                            {score}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>需求描述</Label>
                    <Textarea placeholder="輸入需求描述..." rows={3} defaultValue={selectedOpportunity.bant?.need.requirements} />
                  </div>
                  <div>
                    <Label>緊急程度</Label>
                    <Select defaultValue={selectedOpportunity.bant?.need.urgency || 'medium'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">低</SelectItem>
                        <SelectItem value="medium">中</SelectItem>
                        <SelectItem value="high">高</SelectItem>
                        <SelectItem value="critical">緊急</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>備註</Label>
                    <Textarea placeholder="輸入備註..." rows={2} defaultValue={selectedOpportunity.bant?.need.notes} />
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Timeline (時間表)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>分數 (0-5)</Label>
                    <Select defaultValue={selectedOpportunity.bant?.timeline.score.toString() || '0'}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5].map((score) => (
                          <SelectItem key={score} value={score.toString()}>
                            {score}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>預期成交日期</Label>
                      <Input type="date" defaultValue={selectedOpportunity.bant?.timeline.expectedCloseDate} />
                    </div>
                    <div>
                      <Label>專案開始日期</Label>
                      <Input type="date" defaultValue={selectedOpportunity.bant?.timeline.projectStartDate} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked={selectedOpportunity.bant?.timeline.confirmed} />
                    <Label>已確認時間表</Label>
                  </div>
                  <div>
                    <Label>備註</Label>
                    <Textarea placeholder="輸入備註..." rows={2} defaultValue={selectedOpportunity.bant?.timeline.notes} />
                  </div>
                </CardContent>
              </Card>

              {/* 總分顯示 */}
              {selectedOpportunity.bant && (
                <Card className="bg-blue-50 dark:bg-blue-900/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">總分</div>
                        <div className={`text-3xl font-bold ${getBANTScoreColor(selectedOpportunity.bant.overallScore)}`}>
                          {selectedOpportunity.bant.overallScore} / 20
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          評估日期: {new Date(selectedOpportunity.bant.assessmentDate).toLocaleDateString('zh-TW')}
                        </div>
                      </div>
                      <div className="text-right">
                        {selectedOpportunity.bant.overallScore >= 16 && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            高品質商機
                          </Badge>
                        )}
                        {selectedOpportunity.bant.overallScore >= 12 && selectedOpportunity.bant.overallScore < 16 && (
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            需加強
                          </Badge>
                        )}
                        {selectedOpportunity.bant.overallScore < 12 && (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            <XCircle className="h-3 w-3 mr-1" />
                            低品質商機
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBANTDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={() => setIsBANTDialogOpen(false)}>儲存評估</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

