'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Upload, FileText, Loader2, Copy, Check, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';

// OCR 回傳的 JSON 格式（根據實際回傳調整）
interface Financials {
  total_amount_usd?: number;
  amount_a_twd?: number;
  amount_a_total_twd?: number; // 新格式
  split_80_percent_usd?: number;
  amount_b_twd?: number;
  amount_b_80_percent_twd?: number; // 新格式
  split_20_percent_tax_usd?: number;
  amount_c_twd?: number;
  amount_c_20_percent_twd?: number; // 新格式
}

interface OCRResult {
  // 驗證資訊（新格式）
  success?: boolean;
  quality_grade?: string;
  validation_errors?: string[];
  validation_warnings?: string[];
  // 基本資訊
  invoice_number?: string;
  invoiceNumber?: string; // 標準化後的欄位
  due_date?: string;
  dueDate?: string; // 標準化後的欄位
  is_overdue?: boolean;
  overdue_warning_msg?: string;
  overdue_msg?: string;
  // Email 主旨
  email_subject?: string;
  // 匯率資訊
  exchange_rate_source?: string;
  rate_source?: string;
  exchange_rate?: number;
  exchangeRate?: number; // 標準化後的欄位
  currency?: string;
  // 金額資訊（新格式的簡化欄位名稱）
  total_usd?: number;
  total_amount_usd?: number;
  amount_a_twd?: number;
  amount_a_total_twd?: number;
  split_80_usd?: number;
  split_80_percent_usd?: number;
  amount_b_twd?: number;
  amount_b_80_percent_twd?: number;
  split_20_usd?: number;
  split_20_percent_tax_usd?: number;
  amount_c_twd?: number;
  amount_c_20_percent_twd?: number;
  // 巢狀格式（financials 物件）
  financials?: Financials;
  // 向後相容的欄位
  invoiceNumber_legacy?: string;
  amountDue?: number;
  [key: string]: any; // 允許其他欄位
}

export default function NetSuiteCollectionEmailPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [emailContent, setEmailContent] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tableImageUrl, setTableImageUrl] = useState<string>('');
  const tableRef = useRef<HTMLDivElement>(null);

  // API URL（使用 Next.js API route 作為代理，避免 CORS 問題）
  const OCR_API_URL = '/api/netsuite-collection-email/ocr';
  
  // 預設匯率
  const DEFAULT_EXCHANGE_RATE = 31.125;

  // 處理檔案選擇
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('請上傳 PDF 檔案');
        return;
      }
      setPdfFile(file);
      setError(null);
      setOcrResult(null);
      setEmailContent('');
      setEmailSubject('');
    }
  };

  // 上傳 PDF 並進行 OCR
  const handleUpload = async () => {
    if (!pdfFile) {
      setError('請選擇 PDF 檔案');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      // 統一使用 'data' 作為欄位名稱（與 webhook 一致）
      formData.append('data', pdfFile);

      const response = await fetch(OCR_API_URL, {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        // 處理錯誤回應
        const errorMessage = responseData.error || `上傳失敗: ${response.statusText}`;
        const errorDetails = responseData.details ? `\n詳細資訊: ${JSON.stringify(responseData.details, null, 2)}` : '';
        throw new Error(errorMessage + errorDetails);
      }

      // 檢查是否有錯誤欄位
      if (responseData.error) {
        throw new Error(responseData.error);
      }

      // API route 已經處理了 content.parts[0].text 的提取，這裡直接使用
      const result: OCRResult = responseData;
      
      console.log('前端接收到的資料:', result);
      
      // 標準化欄位名稱（支援新格式、扁平化和巢狀格式）
      const normalizedResult: OCRResult = {
        ...result,
        // Invoice 編號
        invoiceNumber: result.invoice_number || result.invoiceNumber || result.invoiceNo || result.invoice || '',
        // 付款截止日（已經是 YYYY/MM/DD 格式）
        dueDate: result.due_date || result.dueDate || result.dueDateFormatted || result.due_date_formatted || '',
        // 匯率
        exchangeRate: result.exchange_rate || result.exchangeRate || result.rate || DEFAULT_EXCHANGE_RATE,
        // 匯率來源
        exchange_rate_source: result.rate_source || result.exchange_rate_source || '',
        // 總金額（優先使用新格式，然後是扁平化格式，最後是 financials 物件）
        amountDue: result.total_usd || result.total_amount_usd || result.financials?.total_amount_usd || result.amountDue || result.amount_due || result.amount || result.totalAmount || result.total_amount || 0,
        // 標準化金額欄位（新格式使用簡化名稱）
        total_amount_usd: result.total_usd || result.total_amount_usd,
        amount_a_total_twd: result.amount_a_twd || result.amount_a_total_twd,
        split_80_percent_usd: result.split_80_usd || result.split_80_percent_usd,
        amount_b_80_percent_twd: result.amount_b_twd || result.amount_b_80_percent_twd,
        split_20_percent_tax_usd: result.split_20_usd || result.split_20_percent_tax_usd,
        amount_c_20_percent_twd: result.amount_c_twd || result.amount_c_20_percent_twd,
      };
      
      console.log('解析後的結果:', normalizedResult);
      
      setOcrResult(normalizedResult);
      
      // 設定 Email 主旨
      if (normalizedResult.email_subject) {
        setEmailSubject(normalizedResult.email_subject);
      }
      
      // 等待一下讓表格渲染完成，然後生成 Email 內容
      setTimeout(async () => {
        await generateEmailContent(normalizedResult);
      }, 500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '上傳或 OCR 處理失敗';
      setError(errorMessage);
      console.error('OCR 處理錯誤:', err);
      
      // 如果是網路錯誤，提供更詳細的提示
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        setError('網路連線失敗，請檢查：\n1. 網路連線是否正常\n2. Webhook 是否已啟動（n8n 測試模式需要先點擊 Execute workflow）');
      }
    } finally {
      setIsUploading(false);
    }
  };

  // 格式化日期為 YYYY/MM/DD
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // 嘗試其他格式
        return dateString;
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    } catch {
      return dateString;
    }
  };

  // 格式化數字（加上千分號）
  const formatNumber = (num: number, decimals: number = 2): string => {
    return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // 格式化整數（加上千分號）
  const formatInteger = (num: number): string => {
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // 生成表格圖片
  const generateTableImage = async (result: OCRResult) => {
    if (!tableRef.current) return '';

    try {
      const canvas = await html2canvas(tableRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // 提高解析度
        logging: false,
        useCORS: true,
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      return dataUrl;
    } catch (error) {
      console.error('生成表格圖片失敗:', error);
      return '';
    }
  };

  // 生成 Email 內容
  const generateEmailContent = async (result: OCRResult) => {
    const invoiceNumber = result.invoiceNumber || result.invoice_number || 'xxxxxxx';
    
    // 優先使用新格式的金額，然後是扁平化格式，最後才計算
    const totalAmountUSD = result.total_usd || result.total_amount_usd || result.financials?.total_amount_usd || result.amountDue || 0;
    const paymentAmountUSD = result.split_80_usd || result.split_80_percent_usd || result.financials?.split_80_percent_usd || (totalAmountUSD * 0.8);
    const taxAmountUSD = result.split_20_usd || result.split_20_percent_tax_usd || result.financials?.split_20_percent_tax_usd || (totalAmountUSD * 0.2);
    const exchangeRate = result.exchangeRate || result.exchange_rate || DEFAULT_EXCHANGE_RATE;
    
    // 台幣金額
    const totalAmountNTD = result.amount_a_twd || result.amount_a_total_twd || result.financials?.amount_a_twd || result.financials?.amount_a_total_twd || (totalAmountUSD * exchangeRate);
    const paymentAmountNTD = result.amount_b_twd || result.amount_b_80_percent_twd || result.financials?.amount_b_twd || result.financials?.amount_b_80_percent_twd || (paymentAmountUSD * exchangeRate);
    const taxAmountNTD = result.amount_c_twd || result.amount_c_20_percent_twd || result.financials?.amount_c_twd || result.financials?.amount_c_20_percent_twd || (taxAmountUSD * exchangeRate);
    
    // 付款截止日（已經是 YYYY/MM/DD 格式，不需要再格式化）
    const dueDate = result.dueDate || result.due_date || '';

    // 取得當前網站的 URL（用於圖片連結）
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const imageUrl = `${baseUrl}/tax_certification_sample.png`;

    // 生成表格 HTML（根據圖片範例）
    const tableHTML = `
<table style="border-collapse: collapse; width: 100%; border: 1px solid #000; font-family: Arial, sans-serif; font-size: 14px;">
  <tr>
    <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; text-align: center; font-weight: 600;">參考匯率</th>
    <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; text-align: center; font-weight: 600;">${formatNumber(exchangeRate, 2)}</th>
    <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; text-align: center; font-weight: 600;">帳單金額</th>
    <th style="border: 1px solid #000; padding: 8px; background-color: #e3f2fd; text-align: center; font-weight: 600;">申報金額</th>
  </tr>
  <tr>
    <td style="border: 1px solid #000; padding: 8px; background-color: #e8f5e9; font-weight: 500; text-align: center;">總金額</td>
    <td style="border: 1px solid #000; padding: 8px; background-color: #ffffff; text-align: right;">USD ${formatNumber(totalAmountUSD, 2)}</td>
    <td style="border: 1px solid #000; padding: 8px; background-color: #ffffff; text-align: center;">A金額</td>
    <td style="border: 1px solid #000; padding: 8px; background-color: #ffffff; font-weight: 500; text-align: right;">NTD ${formatInteger(totalAmountNTD)}</td>
  </tr>
  <tr>
    <td style="border: 1px solid #000; padding: 8px; background-color: #e8f5e9; font-weight: 500; text-align: center;">80%美金貨款</td>
    <td colspan="1" rowspan="1" style="border: 1px solid #000; padding: 8px; background-color: #ffffff; color: #d32f2f; font-weight: 700; text-align: right;"><strong>USD ${formatNumber(paymentAmountUSD, 2)}</strong></td>
    <td style="border: 1px solid #000; padding: 8px; background-color: #ffffff; text-align: center;">B金額</td>
    <td style="border: 1px solid #000; padding: 8px; background-color: #ffffff; font-weight: 500; text-align: right;">NTD ${formatInteger(paymentAmountNTD)}</td>
  </tr>
  <tr>
    <td style="border: 1px solid #000; padding: 8px; background-color: #e8f5e9; font-weight: 500; text-align: center;">20%外人稅</td>
    <td style="border: 1px solid #000; padding: 8px; background-color: #ffffff; text-align: right;">USD ${formatNumber(taxAmountUSD, 2)}</td>
    <td style="border: 1px solid #000; padding: 8px; background-color: #ffffff; text-align: center;">C金額</td>
    <td colspan="1" rowspan="1" style="border: 1px solid #000; padding: 8px; background-color: #ffffff; color: #d32f2f; font-weight: 700; text-align: right;"><strong>NTD ${formatInteger(taxAmountNTD)}</strong></td>
  </tr>
</table>`;

    // 生成表格圖片（用於 Email）
    const tableImage = await generateTableImage(result);
    const tableImageTag = tableImage ? `<img src="${tableImage}" alt="金額明細表" style="max-width: 100%; height: auto; display: block; margin: 20px 0;" />` : '';

    // 生成 Email 內容（根據用戶提供的樣板格式）
    const email = `<div style="font-family: 'Microsoft YaHei', '微軟雅黑', 'PingFang TC', 'Helvetica Neue', Arial, sans-serif; line-height: 1.8; color: #333333; max-width: 800px; margin: 0 auto; padding: 20px;">
  <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.8;">
    請參考附件為這次 NetSuite 訂閱費用的發票 <strong style="font-weight: bold;">Invoice#${invoiceNumber}</strong>，總金額為 <strong style="font-weight: bold;">USD${formatNumber(totalAmountUSD, 2)}</strong>，付款截止日為${dueDate}。此金額包含20%的非居民扣繳稅款（外人稅）。因 NetSuite 交易皆由 Oracle 新加坡分公司負責，為方便作業，懇請協助將此筆款項分兩筆支付：
  </p>
  
  <ol style="margin: 0 0 20px 0; padding-left: 20px; font-size: 16px; line-height: 1.8;">
    <li style="margin-bottom: 10px;">
      80%的貨款金額（USD${formatNumber(paymentAmountUSD, 2)}）：請透過電匯方式支付至 Oracle 新加坡銀行帳戶。匯款資訊已詳列於發票底部。
    </li>
    <li style="margin-bottom: 10px;">
      20%的非居民扣繳稅款（USD${formatNumber(taxAmountUSD, 2)}，約合台幣${formatInteger(taxAmountNTD)}）：請逕行繳納至當地的稅務機關。
    </li>
  </ol>
  
  <div style="margin: 20px 0;">
    ${tableHTML}
  </div>

  <p style="margin: 20px 0; font-size: 16px; line-height: 1.8;">
    完成付款後，還請您提供匯款水單與完稅證明給我們。這些文件對我們財務部門進行帳款沖銷至關重要。
  </p>

  <div style="margin: 20px 0;">
    <p style="margin: 0 0 10px 0; font-size: 16px; line-height: 1.8;">
      <strong>完稅證明範例：</strong>
    </p>
    <p style="margin: 0;">
      <img src="${imageUrl}" alt="完稅證明範例" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px;" />
    </p>
  </div>

  <p style="margin: 20px 0 0 0; font-size: 16px; line-height: 1.8;">
    若有任何問題或需要協助，隨時歡迎與我聯繫。感謝您的配合與協助。
  </p>
</div>`;

    setEmailContent(email);
    if (tableImage) {
      setTableImageUrl(tableImage);
    }
  };

  // 複製 Email 主旨
  const handleCopySubject = async () => {
    if (!emailSubject) return;

    try {
      await navigator.clipboard.writeText(emailSubject);
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    } catch (err) {
      setError('複製主旨失敗，請手動複製');
    }
  };

  // 複製 Email 內容（支援 HTML 格式）
  const handleCopy = async () => {
    if (!emailContent) return;

    try {
      // 複製 HTML 格式到剪貼簿（支援富文本）
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([emailContent], { type: 'text/html' }),
        'text/plain': new Blob([emailContent.replace(/<[^>]*>/g, '')], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([clipboardItem]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // 如果 ClipboardItem 不支援，回退到純文字複製
      try {
        await navigator.clipboard.writeText(emailContent.replace(/<[^>]*>/g, ''));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        setError('複製失敗，請手動複製');
      }
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="dark:bg-[#1a2332] dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Mail className="h-5 w-5" />
            NetSuite催款Email
          </CardTitle>
          <CardDescription>
            上傳 NetSuite Invoice PDF，自動解析並生成催款郵件
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 檔案上傳區域 */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                  disabled={isUploading}
                />
              </div>
              <Button
                onClick={handleUpload}
                disabled={!pdfFile || isUploading}
                className="min-w-[120px]"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    處理中...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    上傳並解析
                  </>
                )}
              </Button>
            </div>

            {pdfFile && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <FileText className="h-4 w-4" />
                <span>{pdfFile.name}</span>
                <span className="text-gray-400">
                  ({(pdfFile.size / 1024).toFixed(2)} KB)
                </span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>

          {/* 隱藏的表格（用於生成圖片） */}
          {ocrResult && ((ocrResult.total_usd || ocrResult.total_amount_usd || ocrResult.financials?.total_amount_usd) || ocrResult.amountDue) && (
            <div 
              ref={tableRef} 
              className="absolute left-[-9999px] w-[800px]"
              style={{ position: 'absolute', left: '-9999px', width: '800px' }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff', border: '1px solid #000', fontSize: '14px', fontFamily: 'Arial, sans-serif' }}>
                <tbody>
                  <tr>
                    <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', fontWeight: '600', fontSize: '14px', backgroundColor: '#f0f0f0' }}>參考匯率</th>
                    <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', fontWeight: '600', fontSize: '14px', backgroundColor: '#f0f0f0' }}>{formatNumber(ocrResult.exchangeRate || ocrResult.exchange_rate || DEFAULT_EXCHANGE_RATE, 2)}</th>
                    <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', fontWeight: '600', fontSize: '14px', backgroundColor: '#f0f0f0' }}>帳單金額</th>
                    <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', fontWeight: '600', fontSize: '14px', backgroundColor: '#e3f2fd' }}>申報金額</th>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#e8f5e9', fontSize: '14px', fontWeight: '500', textAlign: 'center' }}>總金額</td>
                    <td style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#ffffff', fontSize: '14px', textAlign: 'right' }}>USD {formatNumber(ocrResult.total_usd || ocrResult.total_amount_usd || ocrResult.financials?.total_amount_usd || ocrResult.amountDue || 0, 2)}</td>
                    <td style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#ffffff', fontSize: '14px', textAlign: 'center' }}>A金額</td>
                    <td style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#ffffff', fontSize: '14px', fontWeight: '500', textAlign: 'right' }}>NTD {formatInteger(ocrResult.amount_a_twd || ocrResult.amount_a_total_twd || ocrResult.financials?.amount_a_twd || ocrResult.financials?.amount_a_total_twd || (ocrResult.total_usd || ocrResult.total_amount_usd || ocrResult.financials?.total_amount_usd || ocrResult.amountDue || 0) * (ocrResult.exchangeRate || ocrResult.exchange_rate || DEFAULT_EXCHANGE_RATE))}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#e8f5e9', fontSize: '14px', fontWeight: '500', textAlign: 'center' }}>80%美金貨款</td>
                    <td colSpan={1} rowSpan={1} style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#ffffff', color: '#d32f2f', fontWeight: '700', fontSize: '14px', textAlign: 'right' }}><strong>USD {formatNumber(ocrResult.split_80_usd || ocrResult.split_80_percent_usd || ocrResult.financials?.split_80_percent_usd || (ocrResult.total_usd || ocrResult.total_amount_usd || ocrResult.financials?.total_amount_usd || ocrResult.amountDue || 0) * 0.8, 2)}</strong></td>
                    <td style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#ffffff', fontSize: '14px', textAlign: 'center' }}>B金額</td>
                    <td style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#ffffff', fontSize: '14px', fontWeight: '500', textAlign: 'right' }}>NTD {formatInteger(ocrResult.amount_b_twd || ocrResult.amount_b_80_percent_twd || ocrResult.financials?.amount_b_twd || ocrResult.financials?.amount_b_80_percent_twd || (ocrResult.split_80_usd || ocrResult.split_80_percent_usd || ocrResult.financials?.split_80_percent_usd || (ocrResult.total_usd || ocrResult.total_amount_usd || ocrResult.financials?.total_amount_usd || ocrResult.amountDue || 0) * 0.8) * (ocrResult.exchangeRate || ocrResult.exchange_rate || DEFAULT_EXCHANGE_RATE))}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#e8f5e9', fontSize: '14px', fontWeight: '500', textAlign: 'center' }}>20%外人稅</td>
                    <td style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#ffffff', fontSize: '14px', textAlign: 'right' }}>USD {formatNumber(ocrResult.split_20_usd || ocrResult.split_20_percent_tax_usd || ocrResult.financials?.split_20_percent_tax_usd || (ocrResult.total_usd || ocrResult.total_amount_usd || ocrResult.financials?.total_amount_usd || ocrResult.amountDue || 0) * 0.2, 2)}</td>
                    <td style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#ffffff', fontSize: '14px', textAlign: 'center' }}>C金額</td>
                    <td colSpan={1} rowSpan={1} style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#ffffff', color: '#d32f2f', fontWeight: '700', fontSize: '14px', textAlign: 'right' }}><strong>NTD {formatInteger(ocrResult.amount_c_twd || ocrResult.amount_c_20_percent_twd || ocrResult.financials?.amount_c_twd || ocrResult.financials?.amount_c_20_percent_twd || (ocrResult.split_20_usd || ocrResult.split_20_percent_tax_usd || ocrResult.financials?.split_20_percent_tax_usd || (ocrResult.total_usd || ocrResult.total_amount_usd || ocrResult.financials?.total_amount_usd || ocrResult.amountDue || 0) * 0.2) * (ocrResult.exchangeRate || ocrResult.exchange_rate || DEFAULT_EXCHANGE_RATE))}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Email 主旨區域 */}
          {emailSubject && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg dark:text-white">Email 主旨</CardTitle>
                  <Button
                    onClick={handleCopySubject}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {copiedSubject ? (
                      <>
                        <Check className="h-4 w-4" />
                        已複製
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        複製主旨
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
                  <p className="text-base font-medium dark:text-white">{emailSubject}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Email 內容區域 */}
          {emailContent && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg dark:text-white">生成的 Email 內容預覽</CardTitle>
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        已複製
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        複製 HTML
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden bg-white">
                  <iframe
                    srcDoc={emailContent}
                    className="w-full min-h-[600px] border-0"
                    title="Email 預覽"
                    sandbox="allow-same-origin"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
