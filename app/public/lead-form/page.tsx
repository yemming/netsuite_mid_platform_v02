'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { CheckCircle2, Loader2, Mail, Building2, User, FileText } from 'lucide-react';
import type { LeadFormData } from '@/lib/types/crm';

export default function LeadFormPage() {
  const [formData, setFormData] = useState<LeadFormData>({
    customer_name: '',
    customer_email: '',
    company_name: '',
    requirements_text: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // TODO: 實際 API 呼叫會在後端實作
      // 目前先模擬提交成功
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 模擬 API 呼叫
      const response = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('提交失敗，請稍後再試');
      }

      setSubmitStatus('success');
      // 重置表單
      setFormData({
        customer_name: '',
        customer_email: '',
        company_name: '',
        requirements_text: '',
      });
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : '提交失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof LeadFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            業務諮詢表單
          </h1>
          <p className="text-muted-foreground">
            填寫以下資訊，我們將盡快與您聯繫
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>聯絡資訊</CardTitle>
            <CardDescription>
              請提供您的基本資訊和需求，我們的 AI 業務團隊將為您量身打造解決方案
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 姓名 */}
              <div className="space-y-2">
                <Label htmlFor="customer_name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  姓名 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="customer_name"
                  type="text"
                  placeholder="請輸入您的姓名"
                  value={formData.customer_name}
                  onChange={handleChange('customer_name')}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="customer_email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  電子郵件 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="customer_email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.customer_email}
                  onChange={handleChange('customer_email')}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* 公司名稱 */}
              <div className="space-y-2">
                <Label htmlFor="company_name" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  公司名稱 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="company_name"
                  type="text"
                  placeholder="請輸入公司名稱"
                  value={formData.company_name}
                  onChange={handleChange('company_name')}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* 需求說明 */}
              <div className="space-y-2">
                <Label htmlFor="requirements_text" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  專案需求 <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="requirements_text"
                  placeholder="請詳細描述您的專案需求、預算範圍、時程安排等資訊..."
                  value={formData.requirements_text}
                  onChange={handleChange('requirements_text')}
                  required
                  disabled={isSubmitting}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  請盡可能詳細描述您的需求，這將幫助我們為您提供更精準的解決方案
                </p>
              </div>

              {/* 錯誤訊息 */}
              {submitStatus === 'error' && (
                <Alert variant="destructive">
                  {errorMessage}
                </Alert>
              )}

              {/* 成功訊息 */}
              {submitStatus === 'success' && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      提交成功！
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      我們已收到您的需求，AI 業務團隊將在 24 小時內為您準備客製化回覆
                    </p>
                  </div>
                </Alert>
              )}

              {/* 提交按鈕 */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || submitStatus === 'success'}
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    提交中...
                  </>
                ) : submitStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    已提交
                  </>
                ) : (
                  '提交需求'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 流程說明 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">處理流程</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                  1
                </div>
                <div>
                  <p className="font-medium">AI 背景研究</p>
                  <p className="text-sm text-muted-foreground">
                    AI 自動分析您的公司背景與業務模式
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                  2
                </div>
                <div>
                  <p className="font-medium">客製化草稿生成</p>
                  <p className="text-sm text-muted-foreground">
                    AI 根據研究結果與成功案例，生成專屬回覆草稿
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                  3
                </div>
                <div>
                  <p className="font-medium">人工審核</p>
                  <p className="text-sm text-muted-foreground">
                    業務人員審核並優化回覆內容
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                  4
                </div>
                <div>
                  <p className="font-medium">發送回覆</p>
                  <p className="text-sm text-muted-foreground">
                    審核通過後，立即發送客製化回覆給您
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

