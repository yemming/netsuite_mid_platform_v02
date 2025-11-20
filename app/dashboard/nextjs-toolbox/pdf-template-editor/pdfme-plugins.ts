/**
 * PDFME Designer 工具配置
 * 
 * 此文件用於管理 PDFME Designer 的所有可用工具（plugins）
 * 工具會按照此處的順序顯示在左側工具列中
 */

import {
  text,
  multiVariableText,
  image,
  svg,
  barcodes,
  line,
  table,
  rectangle,
  ellipse,
  dateTime,
  date,
  time,
  select,
  radioGroup,
  checkbox,
} from '@pdfme/schemas';
import type { PluginRegistry } from '@pdfme/common';

/**
 * 工具分類配置
 * 用於組織和管理不同類別的工具
 */
export const pluginCategories = {
  // 文字類工具
  text: {
    text: { plugin: text, label: '文字', description: '基本文字欄位' },
    multiVariableText: { plugin: multiVariableText, label: '多變數文字', description: '支援多個變數的文字欄位' },
  },
  
  // 圖形類工具
  graphics: {
    image: { plugin: image, label: '圖片', description: '插入圖片' },
    svg: { plugin: svg, label: 'SVG', description: 'SVG 向量圖形' },
  },
  
  // 形狀類工具
  shapes: {
    line: { plugin: line, label: '線條', description: '繪製線條' },
    rectangle: { plugin: rectangle, label: '矩形', description: '繪製矩形' },
    ellipse: { plugin: ellipse, label: '橢圓形', description: '繪製橢圓形' },
  },
  
  // 表格類工具
  tables: {
    table: { plugin: table, label: '表格', description: '建立表格' },
  },
  
  // 日期時間類工具
  datetime: {
    dateTime: { plugin: dateTime, label: '日期時間', description: '日期和時間欄位' },
    date: { plugin: date, label: '日期', description: '日期欄位' },
    time: { plugin: time, label: '時間', description: '時間欄位' },
  },
  
  // 表單元素類工具
  forms: {
    select: { plugin: select, label: '下拉選單', description: '下拉選單欄位' },
    radioGroup: { plugin: radioGroup, label: '單選按鈕組', description: '單選按鈕組' },
    checkbox: { plugin: checkbox, label: '核取方塊', description: '核取方塊欄位' },
  },
  
  // 條碼類工具（所有條碼類型）
  barcodes: {
    qrcode: { plugin: barcodes.qrcode, label: 'QR Code', description: 'QR 碼' },
    ean13: { plugin: barcodes.ean13, label: 'EAN-13', description: 'EAN-13 條碼' },
    ean8: { plugin: barcodes.ean8, label: 'EAN-8', description: 'EAN-8 條碼' },
    code39: { plugin: barcodes.code39, label: 'Code 39', description: 'Code 39 條碼' },
    code128: { plugin: barcodes.code128, label: 'Code 128', description: 'Code 128 條碼' },
    upca: { plugin: barcodes.upca, label: 'UPC-A', description: 'UPC-A 條碼' },
    upce: { plugin: barcodes.upce, label: 'UPC-E', description: 'UPC-E 條碼' },
    itf14: { plugin: barcodes.itf14, label: 'ITF-14', description: 'ITF-14 條碼' },
    nw7: { plugin: barcodes.nw7, label: 'NW-7', description: 'NW-7 條碼' },
    pdf417: { plugin: barcodes.pdf417, label: 'PDF417', description: 'PDF417 條碼' },
    gs1datamatrix: { plugin: barcodes.gs1datamatrix, label: 'GS1 DataMatrix', description: 'GS1 DataMatrix 條碼' },
    japanpost: { plugin: barcodes.japanpost, label: 'Japan Post', description: '日本郵政條碼' },
  },
} as const;

/**
 * 獲取所有 plugins 的扁平化物件
 * 用於傳遞給 PDFME Designer
 * 
 * @param options 配置選項
 * @param options.includeBarcodes 是否包含條碼工具（預設：true）
 * @param options.barcodeGroupName 條碼工具的分組名稱（預設：'barcodes'）
 * @returns PluginRegistry 物件
 */
export function getPDFMEPlugins(options: {
  includeBarcodes?: boolean;
  barcodeGroupName?: string;
} = {}): PluginRegistry {
  const { includeBarcodes = true, barcodeGroupName = 'barcodes' } = options;
  
  const plugins: Record<string, any> = {
    // 文字類
    text: pluginCategories.text.text.plugin,
    multiVariableText: pluginCategories.text.multiVariableText.plugin,
    
    // 圖形類
    image: pluginCategories.graphics.image.plugin,
    svg: pluginCategories.graphics.svg.plugin,
    
    // 形狀類
    line: pluginCategories.shapes.line.plugin,
    rectangle: pluginCategories.shapes.rectangle.plugin,
    ellipse: pluginCategories.shapes.ellipse.plugin,
    
    // 表格類
    table: pluginCategories.tables.table.plugin,
    
    // 日期時間類
    dateTime: pluginCategories.datetime.dateTime.plugin,
    date: pluginCategories.datetime.date.plugin,
    time: pluginCategories.datetime.time.plugin,
    
    // 表單元素類
    select: pluginCategories.forms.select.plugin,
    radioGroup: pluginCategories.forms.radioGroup.plugin,
    checkbox: pluginCategories.forms.checkbox.plugin,
  };
  
  // 條碼類（可選）
  if (includeBarcodes) {
    // 將所有條碼工具添加到 plugins 中
    // 使用統一的命名前綴，方便識別和管理
    Object.entries(pluginCategories.barcodes).forEach(([key, value]) => {
      plugins[`${barcodeGroupName}_${key}`] = value.plugin;
    });
  }
  
  return plugins as PluginRegistry;
}

/**
 * 獲取工具的分類資訊
 * 用於顯示工具的分類標籤或說明
 */
export function getPluginCategoryInfo() {
  return pluginCategories;
}
