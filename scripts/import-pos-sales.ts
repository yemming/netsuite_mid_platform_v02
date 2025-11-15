import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// 讀取環境變數
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('請設定 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 解析 CSV 行
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

// 轉換日期格式從 "1/5/2019" 到 "2019-01-05"
function convertDate(dateStr: string): string {
  const [month, day, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// 轉換時間格式從 "13:08" 到 "13:08:00"
function convertTime(timeStr: string): string {
  return timeStr.includes(':') && timeStr.split(':').length === 2 
    ? `${timeStr}:00` 
    : timeStr;
}

// 轉換 CSV 資料為資料庫格式
function convertRowToDB(row: string[]): any {
  return {
    invoice_id: row[0],
    branch: row[1],
    city: row[2],
    customer_type: row[3],
    gender: row[4],
    product_line: row[5],
    unit_price: parseFloat(row[6]),
    quantity: parseInt(row[7], 10),
    tax_5_percent: parseFloat(row[8]),
    total: parseFloat(row[9]),
    sale_date: convertDate(row[10]),
    sale_time: convertTime(row[11]),
    payment_method: row[12],
    cogs: parseFloat(row[13]),
    gross_margin_percentage: parseFloat(row[14]),
    gross_income: parseFloat(row[15]),
    rating: parseFloat(row[16]),
  };
}

async function importSalesData() {
  const csvPath = path.join(process.cwd(), 'sales_sample.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  // 跳過標題行
  const dataLines = lines.slice(1);
  
  console.log(`準備匯入 ${dataLines.length} 筆資料...`);
  
  // 分批插入（每批 100 筆）
  const batchSize = 100;
  let imported = 0;
  let errors = 0;
  
  for (let i = 0; i < dataLines.length; i += batchSize) {
    const batch = dataLines.slice(i, i + batchSize);
    const records = batch
      .map(line => {
        try {
          const row = parseCSVLine(line);
          if (row.length >= 17) {
            return convertRowToDB(row);
          }
          return null;
        } catch (error) {
          console.error(`解析錯誤 (行 ${i + batch.indexOf(line) + 2}):`, error);
          return null;
        }
      })
      .filter(record => record !== null);
    
    if (records.length > 0) {
      try {
        const { data, error } = await supabase
          .from('pos_sales')
          .insert(records)
          .select();
        
        if (error) {
          console.error(`批次 ${Math.floor(i / batchSize) + 1} 插入錯誤:`, error);
          errors += records.length;
        } else {
          imported += records.length;
          console.log(`已匯入 ${imported} / ${dataLines.length} 筆資料...`);
        }
      } catch (error) {
        console.error(`批次 ${Math.floor(i / batchSize) + 1} 執行錯誤:`, error);
        errors += records.length;
      }
    }
  }
  
  console.log('\n匯入完成！');
  console.log(`成功: ${imported} 筆`);
  console.log(`失敗: ${errors} 筆`);
}

// 執行匯入
importSalesData().catch(console.error);







