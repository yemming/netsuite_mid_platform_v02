'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  X,
  Eye,
  ArrowLeft,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// PDF 樣式模板介面
interface PDFTemplate {
  id: string;
  name: string;
  key: string; // 用於識別的 key（如 'standard', 'modern' 等）
  description?: string;
  htmlTemplate: string; // HTML 模板內容
  createdAt: string;
  updatedAt: string;
}

// 模擬資料（後續會從資料庫或 API 取得）
const mockTemplates: PDFTemplate[] = [
  {
    id: '1',
    name: '標準樣式',
    key: 'standard',
    description: '傳統表格佈局，適合正式場合',
    htmlTemplate: `<div style="font-family: 'Microsoft YaHei', '微軟雅黑', 'PingFang TC', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: white;">
  <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #333; padding-bottom: 20px;">
    <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #333;">發票 Invoice</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; color: #666;">Invoice Number: {{tranid}}</p>
  </div>
  <div style="margin-bottom: 30px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 10px; width: 150px; font-weight: bold; color: #333;">客戶名稱</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{entity}}</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; color: #333;">交易日期</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{trandate}}</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; color: #333;">到期日</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{duedate}}</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; color: #333;">狀態</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">
          <span style="padding: 4px 12px; border-radius: 4px; background: {{statusColor}}; color: white; font-size: 14px;">
            {{status}}
          </span>
        </td>
      </tr>
    </table>
  </div>
  <div style="margin-top: 40px; padding: 20px; background: #f9fafb; border-radius: 8px;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 20px; font-weight: bold; color: #333;">總金額</span>
      <span style="font-size: 28px; font-weight: bold; color: #1f2937;">{{amount}}</span>
    </div>
  </div>
  <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
    <p>此發票由 NetSuite 系統自動生成</p>
    <p>生成時間: {{generatedAt}}</p>
  </div>
</div>`,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: '現代樣式',
    key: 'modern',
    description: '漸層背景、圓角卡片設計',
    htmlTemplate: `<div style="font-family: 'Microsoft YaHei', '微軟雅黑', 'PingFang TC', Arial, sans-serif; padding: 50px; max-width: 800px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
  <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
    <div style="text-align: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 2px solid #e5e7eb;">
      <h1 style="margin: 0; font-size: 36px; font-weight: 700; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">INVOICE</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px; color: #6b7280; font-weight: 500;">{{tranid}}</p>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px;">
      <div style="background: #f9fafb; padding: 20px; border-radius: 12px;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">客戶名稱</p>
        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #111827;">{{entity}}</p>
      </div>
      <div style="background: #f9fafb; padding: 20px; border-radius: 12px;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">狀態</p>
        <span style="padding: 6px 16px; border-radius: 20px; background: {{statusColor}}; color: white; font-size: 14px; font-weight: 500;">{{status}}</span>
      </div>
    </div>
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; margin-top: 30px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 18px; font-weight: 600; color: white;">總金額</span>
        <span style="font-size: 36px; font-weight: 700; color: white;">{{amount}}</span>
      </div>
    </div>
  </div>
</div>`,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

export default function PDFTemplateEditorPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<PDFTemplate[]>(mockTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<PDFTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);


  // 開啟新增頁面
  const handleAdd = () => {
    router.push('/dashboard/nextjs-toolbox/pdf-template-editor/design/new');
  };

  // 開啟編輯頁面
  const handleEdit = (template: PDFTemplate) => {
    router.push(`/dashboard/nextjs-toolbox/pdf-template-editor/design/${template.id}`);
  };

  // 刪除樣式
  const handleDelete = (id: string) => {
    if (confirm('確定要刪除此樣式嗎？')) {
      setTemplates(templates.filter((t) => t.id !== id));
    }
  };

  // 預覽樣式
  const handlePreview = (template: PDFTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  // 生成預覽 HTML（使用範例資料）
  const generatePreviewHTML = (template: PDFTemplate): string => {
    const sampleData = {
      tranid: 'INV-2024-001',
      entity: 'ABC 科技有限公司',
      trandate: '2024-01-15',
      duedate: '2024-02-14',
      status: 'Pending',
      statusColor: '#f59e0b',
      amount: 'NT$ 50,000.00',
      generatedAt: new Date().toLocaleString('zh-TW'),
    };

    let html = template.htmlTemplate;
    Object.entries(sampleData).forEach(([key, value]) => {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    });
    return html;
  };

  // 測試列印
  const handleTestPrint = async (template: PDFTemplate) => {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = generatePreviewHTML(template);
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm';
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Template_${template.key}_${Date.now()}.pdf`);
      document.body.removeChild(tempDiv);
    } catch (error) {
      console.error('列印錯誤:', error);
      alert('列印時發生錯誤');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="dark:bg-[#1a2332] dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <FileText className="h-5 w-5" />
                PDF 樣式編輯
              </CardTitle>
              <CardDescription>
                管理 NetSuite Invoice PDF 列印樣式模板
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                新增樣式
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 樣式列表 */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>樣式名稱</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>建立時間</TableHead>
                  <TableHead>更新時間</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      還沒有任何樣式模板，點擊「新增樣式」開始建立
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                          {template.key}
                        </code>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        {template.description || '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(template.createdAt).toLocaleString('zh-TW')}
                      </TableCell>
                      <TableCell>
                        {new Date(template.updatedAt).toLocaleString('zh-TW')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreview(template)}
                            className="h-8"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            預覽
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTestPrint(template)}
                            className="h-8"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            測試列印
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(template)}
                            className="h-8"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            編輯
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(template.id)}
                            className="h-8 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>


      {/* 預覽對話框 */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>樣式預覽</DialogTitle>
            <DialogDescription>
              預覽樣式模板的實際效果
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedTemplate && (
              <div
                ref={previewRef}
                dangerouslySetInnerHTML={{
                  __html: generatePreviewHTML(selectedTemplate),
                }}
                className="bg-white p-4 rounded-lg border"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              關閉
            </Button>
            {selectedTemplate && (
              <Button onClick={() => handleTestPrint(selectedTemplate)}>
                <FileText className="h-4 w-4 mr-2" />
                測試列印
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

