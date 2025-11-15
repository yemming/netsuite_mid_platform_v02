const fs = require('fs');
const path = require('path');

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

// 轉義 SQL 字串
function escapeSQL(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

// 生成 INSERT 語句
function generateInsertSQL(row) {
  const invoiceId = escapeSQL(row[0]);
  const branch = escapeSQL(row[1]);
  const city = escapeSQL(row[2]);
  const customerType = escapeSQL(row[3]);
  const gender = escapeSQL(row[4]);
  const productLine = escapeSQL(row[5]);
  const unitPrice = parseFloat(row[6]) || 0;
  const quantity = parseInt(row[7], 10) || 0;
  const tax5Percent = parseFloat(row[8]) || 0;
  const total = parseFloat(row[9]) || 0;
  const saleDate = escapeSQL(convertDate(row[10]));
  const saleTime = escapeSQL(convertTime(row[11]));
  const paymentMethod = escapeSQL(row[12]);
  const cogs = parseFloat(row[13]) || 0;
  const grossMarginPercentage = parseFloat(row[14]) || 0;
  const grossIncome = parseFloat(row[15]) || 0;
  const rating = parseFloat(row[16]) || 0;

  return `(${invoiceId}, ${branch}, ${city}, ${customerType}, ${gender}, ${productLine}, ${unitPrice}, ${quantity}, ${tax5Percent}, ${total}, ${saleDate}::date, ${saleTime}::time, ${paymentMethod}, ${cogs}, ${grossMarginPercentage}, ${grossIncome}, ${rating})`;
}

function generateSQL() {
  const csvPath = path.join(process.cwd(), 'sales_sample.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  // 跳過標題行
  const dataLines = lines.slice(1);
  
  console.log(`處理 ${dataLines.length} 筆資料...`);
  
  // 分批生成 SQL（每批 100 筆）
  const batchSize = 100;
  const batches = [];
  
  for (let i = 0; i < dataLines.length; i += batchSize) {
    const batch = dataLines.slice(i, i + batchSize);
    const values = batch
      .map(line => {
        try {
          const row = parseCSVLine(line);
          if (row.length >= 17) {
            return generateInsertSQL(row);
          }
          return null;
        } catch (error) {
          console.error(`解析錯誤 (行 ${i + batch.indexOf(line) + 2}):`, error);
          return null;
        }
      })
      .filter(v => v !== null);
    
    if (values.length > 0) {
      const sql = `INSERT INTO pos_sales (invoice_id, branch, city, customer_type, gender, product_line, unit_price, quantity, tax_5_percent, total, sale_date, sale_time, payment_method, cogs, gross_margin_percentage, gross_income, rating) VALUES\n${values.join(',\n')};\n`;
      batches.push(sql);
    }
  }
  
  // 寫入檔案
  const outputPath = path.join(process.cwd(), 'scripts', 'pos-sales-insert.sql');
  fs.writeFileSync(outputPath, batches.join('\n'), 'utf-8');
  
  console.log(`已生成 ${batches.length} 個批次 SQL 檔案: ${outputPath}`);
  console.log(`總共 ${dataLines.length} 筆資料`);
}

generateSQL();







