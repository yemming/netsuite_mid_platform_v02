import { NextRequest, NextResponse } from 'next/server';

/**
 * CSV 上傳和解析 API
 * 
 * 接收 CSV 檔案，解析欄位和範例資料，回傳給前端用於映射
 */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '請上傳 CSV 檔案' },
        { status: 400 }
      );
    }

    // 讀取檔案內容
    const text = await file.text();
    const lines = text.split('\n').filter((line) => line.trim() !== '');

    if (lines.length === 0) {
      return NextResponse.json(
        { success: false, error: 'CSV 檔案為空' },
        { status: 400 }
      );
    }

    // 解析 Header
    const headers = parseCSVLine(lines[0]);

    // 解析範例資料（最多取 5 筆）
    const sampleData: Record<string, any>[] = [];
    for (let i = 1; i < Math.min(lines.length, 6); i++) {
      const values = parseCSVLine(lines[i]);
      const row: Record<string, any> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || null;
      });
      sampleData.push(row);
    }

    // 推斷資料型別
    const fields = headers.map((header) => {
      const inferredType = inferDataType(header, sampleData);
      return {
        name: header,
        displayName: header,
        inferredType,
        sampleValues: sampleData.slice(0, 3).map((row) => row[header]),
        isMapped: false,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        fileName: file.name,
        totalRows: lines.length - 1,
        fields,
        sampleData: sampleData.slice(0, 3),
      },
    });
  } catch (error: any) {
    console.error('CSV 上傳錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '解析 CSV 失敗',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * 解析 CSV 行（處理引號包覆的欄位）
 */
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

/**
 * 推斷資料型別
 */
function inferDataType(fieldName: string, sampleData: Record<string, any>[]): string {
  const values = sampleData.map((row) => row[fieldName]).filter((v) => v !== null && v !== '');

  if (values.length === 0) return 'text';

  // 檢查是否為數字
  const isNumber = values.every((v) => !isNaN(parseFloat(v)) && isFinite(v));
  if (isNumber) {
    const hasDecimal = values.some((v) => String(v).includes('.'));
    return hasDecimal ? 'numeric' : 'integer';
  }

  // 檢查是否為日期
  const isDate = values.every((v) => {
    const date = new Date(v);
    return !isNaN(date.getTime());
  });
  if (isDate) return 'date';

  // 檢查是否為 Boolean
  const isBool = values.every((v) =>
    ['true', 'false', 'T', 'F', '1', '0', 'yes', 'no'].includes(String(v).toLowerCase())
  );
  if (isBool) return 'boolean';

  return 'text';
}

