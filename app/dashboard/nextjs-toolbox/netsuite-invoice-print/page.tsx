'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  FileText, 
  Printer, 
  Loader2, 
  Search, 
  CheckSquare, 
  Square,
  Eye,
  Download,
  Plus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// NetSuite Invoice 資料結構
interface NetSuiteInvoice {
  id: string;
  tranid: string; // Invoice Number
  entity: string; // Customer Name
  trandate: string; // Transaction Date
  duedate: string; // Due Date
  amount: number; // Total Amount
  currency: string; // Currency
  status: string; // Status
  memo?: string; // Memo
  location?: string; // Location
  subsidiary?: string; // Subsidiary
}

// PDF 樣式類型
type PDFTemplate = 'standard' | 'modern' | 'minimal' | 'detailed';

// 模擬資料（後續會從 API 取得）
const mockInvoices: NetSuiteInvoice[] = [
  {
    id: '1',
    tranid: 'INV-2024-001',
    entity: 'ABC 科技有限公司',
    trandate: '2024-01-15',
    duedate: '2024-02-14',
    amount: 50000,
    currency: 'TWD',
    status: 'Pending',
    memo: 'Q1 訂閱費用',
    location: '台北總部',
    subsidiary: '台灣分公司',
  },
  {
    id: '2',
    tranid: 'INV-2024-002',
    entity: 'XYZ 企業股份有限公司',
    trandate: '2024-01-20',
    duedate: '2024-02-19',
    amount: 75000,
    currency: 'TWD',
    status: 'Pending',
    memo: '系統整合服務',
    location: '新竹辦公室',
    subsidiary: '台灣分公司',
  },
  {
    id: '3',
    tranid: 'INV-2024-003',
    entity: 'DEF 製造業有限公司',
    trandate: '2024-01-25',
    duedate: '2024-02-24',
    amount: 120000,
    currency: 'TWD',
    status: 'Paid',
    memo: '年度維護合約',
    location: '台中工廠',
    subsidiary: '台灣分公司',
  },
  {
    id: '4',
    tranid: 'INV-2024-004',
    entity: 'GHI 貿易股份有限公司',
    trandate: '2024-02-01',
    duedate: '2024-03-03',
    amount: 35000,
    currency: 'USD',
    status: 'Pending',
    memo: '雲端服務費用',
    location: '高雄分公司',
    subsidiary: '台灣分公司',
  },
  {
    id: '5',
    tranid: 'INV-2024-005',
    entity: 'JKL 科技股份有限公司',
    trandate: '2024-02-05',
    duedate: '2024-03-07',
    amount: 95000,
    currency: 'TWD',
    status: 'Pending',
    memo: '客製化開發',
    location: '台北總部',
    subsidiary: '台灣分公司',
  },
];

export default function NetSuiteInvoicePrintPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<NetSuiteInvoice[]>(mockInvoices);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [pdfTemplate, setPdfTemplate] = useState<PDFTemplate>('standard');
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<NetSuiteInvoice | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // 過濾發票
  const filteredInvoices = invoices.filter((invoice) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      invoice.tranid.toLowerCase().includes(searchLower) ||
      invoice.entity.toLowerCase().includes(searchLower) ||
      invoice.memo?.toLowerCase().includes(searchLower) ||
      invoice.status.toLowerCase().includes(searchLower)
    );
  });

  // 切換選擇
  const toggleSelect = (invoiceId: string) => {
    const newSelected = new Set(selectedInvoices);
    if (newSelected.has(invoiceId)) {
      newSelected.delete(invoiceId);
    } else {
      newSelected.add(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  // 全選/取消全選
  const toggleSelectAll = () => {
    if (selectedInvoices.size === filteredInvoices.length) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(filteredInvoices.map((inv) => inv.id)));
    }
  };

  // 預覽發票
  const handlePreview = (invoice: NetSuiteInvoice) => {
    setPreviewInvoice(invoice);
  };

  // 格式化金額
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // HTML 轉 PDF 列印
  const handlePrint = async (invoiceIds?: string[]) => {
    setIsPrinting(true);
    try {
      const invoicesToPrint = invoiceIds
        ? invoices.filter((inv) => invoiceIds.includes(inv.id))
        : selectedInvoices.size > 0
        ? invoices.filter((inv) => selectedInvoices.has(inv.id))
        : [previewInvoice!];

      if (invoicesToPrint.length === 0) {
        alert('請選擇要列印的發票');
        setIsPrinting(false);
        return;
      }

      // 為每張發票生成 PDF
      for (const invoice of invoicesToPrint) {
        // 創建臨時的預覽元素
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = generateInvoiceHTML(invoice);
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '210mm'; // A4 寬度
        document.body.appendChild(tempDiv);

        try {
          // 使用 html2canvas 轉換為圖片
          const canvas = await html2canvas(tempDiv, {
            scale: 2,
            useCORS: true,
            logging: false,
          });

          // 創建 PDF
          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 210; // A4 寬度 (mm)
          const pageHeight = 297; // A4 高度 (mm)
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

          // 下載 PDF
          pdf.save(`Invoice_${invoice.tranid}_${Date.now()}.pdf`);
        } finally {
          document.body.removeChild(tempDiv);
        }
      }

      alert(`成功生成 ${invoicesToPrint.length} 張發票 PDF`);
    } catch (error) {
      console.error('列印錯誤:', error);
      alert('列印時發生錯誤，請稍後再試');
    } finally {
      setIsPrinting(false);
    }
  };

  // 生成發票 HTML（根據樣式模板）
  const generateInvoiceHTML = (invoice: NetSuiteInvoice, template: PDFTemplate = pdfTemplate): string => {
    switch (template) {
      case 'modern':
        return generateModernTemplate(invoice);
      case 'minimal':
        return generateMinimalTemplate(invoice);
      case 'detailed':
        return generateDetailedTemplate(invoice);
      case 'standard':
      default:
        return generateStandardTemplate(invoice);
    }
  };

  // 標準樣式
  const generateStandardTemplate = (invoice: NetSuiteInvoice): string => {
    return `
      <div style="font-family: 'Microsoft YaHei', '微軟雅黑', 'PingFang TC', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: white;">
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #333; padding-bottom: 20px;">
          <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #333;">發票 Invoice</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; color: #666;">Invoice Number: ${invoice.tranid}</p>
        </div>
        <div style="margin-bottom: 30px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; width: 150px; font-weight: bold; color: #333;">客戶名稱</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${invoice.entity}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; color: #333;">交易日期</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${formatDate(invoice.trandate)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; color: #333;">到期日</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${formatDate(invoice.duedate)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; color: #333;">狀態</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                <span style="padding: 4px 12px; border-radius: 4px; background: ${invoice.status === 'Paid' ? '#10b981' : '#f59e0b'}; color: white; font-size: 14px;">
                  ${invoice.status}
                </span>
              </td>
            </tr>
            ${invoice.location ? `<tr><td style="padding: 10px; font-weight: bold; color: #333;">地點</td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${invoice.location}</td></tr>` : ''}
            ${invoice.subsidiary ? `<tr><td style="padding: 10px; font-weight: bold; color: #333;">子公司</td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${invoice.subsidiary}</td></tr>` : ''}
            ${invoice.memo ? `<tr><td style="padding: 10px; font-weight: bold; color: #333;">備註</td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${invoice.memo}</td></tr>` : ''}
          </table>
        </div>
        <div style="margin-top: 40px; padding: 20px; background: #f9fafb; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 20px; font-weight: bold; color: #333;">總金額</span>
            <span style="font-size: 28px; font-weight: bold; color: #1f2937;">${formatAmount(invoice.amount, invoice.currency)}</span>
          </div>
        </div>
        <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
          <p>此發票由 NetSuite 系統自動生成</p>
          <p>生成時間: ${new Date().toLocaleString('zh-TW')}</p>
        </div>
      </div>
    `;
  };

  // 現代樣式
  const generateModernTemplate = (invoice: NetSuiteInvoice): string => {
    return `
      <div style="font-family: 'Microsoft YaHei', '微軟雅黑', 'PingFang TC', Arial, sans-serif; padding: 50px; max-width: 800px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
        <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
          <div style="text-align: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 2px solid #e5e7eb;">
            <h1 style="margin: 0; font-size: 36px; font-weight: 700; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">INVOICE</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; color: #6b7280; font-weight: 500;">${invoice.tranid}</p>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px;">
            <div style="background: #f9fafb; padding: 20px; border-radius: 12px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">客戶名稱</p>
              <p style="margin: 0; font-size: 18px; font-weight: 600; color: #111827;">${invoice.entity}</p>
            </div>
            <div style="background: #f9fafb; padding: 20px; border-radius: 12px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">狀態</p>
              <span style="padding: 6px 16px; border-radius: 20px; background: ${invoice.status === 'Paid' ? '#10b981' : '#f59e0b'}; color: white; font-size: 14px; font-weight: 500;">${invoice.status}</span>
            </div>
          </div>
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; margin-top: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 18px; font-weight: 600; color: white;">總金額</span>
              <span style="font-size: 36px; font-weight: 700; color: white;">${formatAmount(invoice.amount, invoice.currency)}</span>
            </div>
          </div>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">此發票由 NetSuite 系統自動生成 • ${new Date().toLocaleString('zh-TW')}</p>
          </div>
        </div>
      </div>
    `;
  };

  // 簡約樣式
  const generateMinimalTemplate = (invoice: NetSuiteInvoice): string => {
    return `
      <div style="font-family: 'Microsoft YaHei', '微軟雅黑', 'PingFang TC', Arial, sans-serif; padding: 60px 40px; max-width: 700px; margin: 0 auto; background: white;">
        <div style="text-align: center; margin-bottom: 60px;">
          <h1 style="margin: 0; font-size: 48px; font-weight: 300; color: #000; letter-spacing: 4px;">INVOICE</h1>
          <p style="margin: 15px 0 0 0; font-size: 14px; color: #999; letter-spacing: 2px;">${invoice.tranid}</p>
        </div>
        <div style="border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 30px 0; margin-bottom: 40px;">
          <p style="margin: 0 0 15px 0; font-size: 16px; color: #000; line-height: 1.8;">
            <strong>客戶：</strong>${invoice.entity}
          </p>
          <p style="margin: 0; font-size: 16px; color: #000; line-height: 1.8;">
            <strong>日期：</strong>${formatDate(invoice.trandate)} • <strong>到期：</strong>${formatDate(invoice.duedate)}
          </p>
        </div>
        <div style="text-align: right; margin-top: 60px; padding-top: 30px; border-top: 1px solid #ddd;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">總金額</p>
          <p style="margin: 0; font-size: 42px; font-weight: 300; color: #000;">${formatAmount(invoice.amount, invoice.currency)}</p>
        </div>
      </div>
    `;
  };

  // 詳細樣式
  const generateDetailedTemplate = (invoice: NetSuiteInvoice): string => {
    return `
      <div style="font-family: 'Microsoft YaHei', '微軟雅黑', 'PingFang TC', Arial, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; background: white; border: 2px solid #e5e7eb;">
        <div style="background: #1f2937; color: white; padding: 30px; margin: -40px -40px 40px -40px;">
          <h1 style="margin: 0; font-size: 32px; font-weight: bold;">發票 Invoice</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">編號: ${invoice.tranid}</p>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
          <div>
            <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #1f2937; border-bottom: 2px solid #1f2937; padding-bottom: 10px;">客戶資訊</h3>
            <p style="margin: 0 0 10px 0; font-size: 16px; color: #374151;"><strong>名稱：</strong>${invoice.entity}</p>
            ${invoice.location ? `<p style="margin: 0 0 10px 0; font-size: 16px; color: #374151;"><strong>地點：</strong>${invoice.location}</p>` : ''}
            ${invoice.subsidiary ? `<p style="margin: 0; font-size: 16px; color: #374151;"><strong>子公司：</strong>${invoice.subsidiary}</p>` : ''}
          </div>
          <div>
            <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #1f2937; border-bottom: 2px solid #1f2937; padding-bottom: 10px;">交易資訊</h3>
            <p style="margin: 0 0 10px 0; font-size: 16px; color: #374151;"><strong>交易日期：</strong>${formatDate(invoice.trandate)}</p>
            <p style="margin: 0 0 10px 0; font-size: 16px; color: #374151;"><strong>到期日期：</strong>${formatDate(invoice.duedate)}</p>
            <p style="margin: 0; font-size: 16px; color: #374151;"><strong>狀態：</strong><span style="padding: 4px 12px; border-radius: 4px; background: ${invoice.status === 'Paid' ? '#10b981' : '#f59e0b'}; color: white; font-size: 14px;">${invoice.status}</span></p>
          </div>
        </div>
        ${invoice.memo ? `
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #1f2937;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #1f2937;">備註</h3>
          <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">${invoice.memo}</p>
        </div>
        ` : ''}
        <div style="background: #1f2937; color: white; padding: 30px; border-radius: 8px; margin-top: 40px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 24px; font-weight: 600;">總金額</span>
            <span style="font-size: 40px; font-weight: bold;">${formatAmount(invoice.amount, invoice.currency)}</span>
          </div>
        </div>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
          <p style="margin: 0 0 5px 0;">此發票由 NetSuite 系統自動生成</p>
          <p style="margin: 0;">生成時間: ${new Date().toLocaleString('zh-TW')}</p>
        </div>
      </div>
    `;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="dark:bg-[#1a2332] dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <FileText className="h-5 w-5" />
            NetSuite Invoice 列印
          </CardTitle>
          <CardDescription>
            選擇 NetSuite Invoice 並列印成自訂樣式的 PDF
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 搜尋和操作列 */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜尋發票編號、客戶名稱、備註..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={toggleSelectAll}
                variant="outline"
                className="min-w-[100px]"
              >
                {selectedInvoices.size === filteredInvoices.length ? (
                  <>
                    <Square className="mr-2 h-4 w-4" />
                    取消全選
                  </>
                ) : (
                  <>
                    <CheckSquare className="mr-2 h-4 w-4" />
                    全選
                  </>
                )}
              </Button>
              <Button
                onClick={() => handlePrint()}
                disabled={selectedInvoices.size === 0 || isPrinting}
                className="min-w-[120px]"
              >
                {isPrinting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    列印中...
                  </>
                ) : (
                  <>
                    <Printer className="mr-2 h-4 w-4" />
                    列印選取 ({selectedInvoices.size})
                  </>
                )}
              </Button>
            </div>
            {/* PDF 樣式選擇 */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-foreground whitespace-nowrap">
                PDF 樣式：
              </label>
              <Select value={pdfTemplate} onValueChange={(value) => setPdfTemplate(value as PDFTemplate)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="選擇 PDF 樣式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">標準樣式</SelectItem>
                  <SelectItem value="modern">現代樣式</SelectItem>
                  <SelectItem value="minimal">簡約樣式</SelectItem>
                  <SelectItem value="detailed">詳細樣式</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/nextjs-toolbox/pdf-template-editor')}
                className="h-10"
                title="新增 PDF 樣式"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 發票列表 */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>發票編號</TableHead>
                  <TableHead>客戶名稱</TableHead>
                  <TableHead>交易日期</TableHead>
                  <TableHead>到期日</TableHead>
                  <TableHead>金額</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      沒有找到符合條件的發票
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedInvoices.has(invoice.id)}
                          onCheckedChange={() => toggleSelect(invoice.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{invoice.tranid}</TableCell>
                      <TableCell>{invoice.entity}</TableCell>
                      <TableCell>{formatDate(invoice.trandate)}</TableCell>
                      <TableCell>{formatDate(invoice.duedate)}</TableCell>
                      <TableCell>{formatAmount(invoice.amount, invoice.currency)}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            invoice.status === 'Paid'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreview(invoice)}
                            className="h-8"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            預覽
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrint([invoice.id])}
                            disabled={isPrinting}
                            className="h-8"
                          >
                            <Printer className="h-4 w-4 mr-1" />
                            列印
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 預覽區域 */}
          {previewInvoice && (
            <Card className="dark:bg-[#1a2332] dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="dark:text-white">發票預覽</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrint([previewInvoice.id])}
                      disabled={isPrinting}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      下載 PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewInvoice(null)}
                    >
                      關閉
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  ref={invoiceRef}
                  dangerouslySetInnerHTML={{
                    __html: generateInvoiceHTML(previewInvoice),
                  }}
                  className="bg-white p-4 rounded-lg border"
                />
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

