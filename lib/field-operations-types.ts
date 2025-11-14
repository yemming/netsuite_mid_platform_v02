/**
 * 現場維運管理系統 - 型別定義
 */

// 使用者角色
export type UserRole = 'dispatcher' | 'technician' | 'admin';

// 使用者狀態
export type UserStatus = 'online' | 'offline';

// 案件狀態
export type CaseStatus = 'open' | 'closed';

// 工單狀態
export type WorkOrderStatus = 'pending' | 'scheduled' | 'dispatched' | 'in_progress' | 'completed' | 'billed';

// 使用者
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  skills: string[];
  status: UserStatus;
  avatar?: string;
}

// 客戶
export interface Customer {
  id: string;
  name: string;
  address: string;
  contactInfo: {
    phone?: string;
    email?: string;
  };
}

// 資產
export interface Asset {
  id: string;
  name: string;
  serialNumber: string;
  customerId: string;
  installDate: string;
}

// 案件
export interface Case {
  id: string;
  title: string;
  description: string;
  customerId: string;
  assetId?: string;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
}

// 工單
export interface WorkOrder {
  id: string;
  caseId: string;
  status: WorkOrderStatus;
  technicianId?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  slaDeadline?: string;
  customer?: Customer;
  asset?: Asset;
  case?: Case;
}

// 服務報告
export interface ServiceReport {
  id: string;
  workOrderId: string;
  summaryNotes: string;
  partsUsed: PartUsed[];
  hoursLogged: number;
  customerSignature?: string; // Base64 或圖片 URL
  createdAt: string;
}

// 使用的零件
export interface PartUsed {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice?: number;
}

// 庫存項目
export interface InventoryItem {
  id: string;
  partNumber: string;
  name: string;
  description?: string;
  unitPrice?: number;
  stockQuantity?: number;
}

// 技術人員庫存
export interface TechnicianStock {
  id: string;
  technicianId: string;
  itemId: string;
  quantity: number;
  item?: InventoryItem;
}

// 排程建議
export interface SchedulingSuggestion {
  technicianId: string;
  technicianName: string;
  reasons: string[]; // 例如: ["最近", "有空", "技能相符"]
  score: number; // 適合度分數
}

