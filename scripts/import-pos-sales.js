const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 讀取環境變數（從 .env.local 或系統環境變數）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('請設定 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 解析 CSV 行
function parseCSVLine(line) {
  const result = [];
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
function convertDate(dateStr) {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  const [month, day, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// 轉換時間格式從 "13:08" 到 "13:08:00"
function convertTime(timeStr) {
  if (timeStr.includes(':') && timeStr.split(':').length === 2) {
    return `${timeStr}:00`;
  }
  return timeStr;
}

// 轉換 CSV 資料為資料庫格式
function convertRowToDB(row) {
  try {
    return {
      invoice_id: row[0] || '',
      branch: row[1] || '',
      city: row[2] || '',
      customer_type: row[3] || '',
      gender: row[4] || '',
      product_line: row[5] || '',
      unit_price: parseFloat(row[6]) || 0,
      quantity: parseInt(row[7], 10) || 0,
      tax_5_percent: parseFloat(row[8]) || 0,
      total: parseFloat(row[9]) || 0,
      sale_date: convertDate(row[10] || ''),
      sale_time: convertTime(row[11] || ''),
      payment_method: row[12] || '',
      cogs: parseFloat(row[13]) || 0,
      gross_margin_percentage: parseFloat(row[14]) || 0,
      gross_income: parseFloat(row[15]) || 0,
      rating: parseFloat(row[16]) || 0,
    };
  } catch (error) {
    console.error('轉換資料錯誤:', error, row);
    return null;
  }
}

async function importSalesData() {
  const csvPath = path.join(process.cwd(), 'sales_sample.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`找不到檔案: ${csvPath}`);
    process.exit(1);
  }
  
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
      .map((line, idx) => {
        try {
          const row = parseCSVLine(line);
          if (row.length >= 17) {
            return convertRowToDB(row);
          }
          console.warn(`行 ${i + idx + 2} 資料不完整，跳過`);
          return null;
        } catch (error) {
          console.error(`解析錯誤 (行 ${i + idx + 2}):`, error);
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
          console.error(`批次 ${Math.floor(i / batchSize) + 1} 插入錯誤:`, error.message);
          errors += records.length;
        } else {
          imported += records.length;
          console.log(`已匯入 ${imported} / ${dataLines.length} 筆資料...`);
        }
      } catch (error) {
        console.error(`批次 ${Math.floor(i / batchSize) + 1} 執行錯誤:`, error.message);
        errors += records.length;
      }
    }
  }
  
  console.log('\n匯入完成！');
  console.log(`成功: ${imported} 筆`);
  console.log(`失敗: ${errors} 筆`);
  
  // 驗證資料
  const { count } = await supabase
    .from('pos_sales')
    .select('*', { count: 'exact', head: true });
  
  console.log(`資料庫中共有 ${count} 筆記錄`);
}

// 執行匯入
importSalesData().catch(console.error);

