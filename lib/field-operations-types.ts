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

// 使用者位置資訊
export interface UserLocation {
  latitude: number;
  longitude: number;
  lastUpdated?: string; // ISO 8601 格式的時間戳記
  address?: string; // 可選的地址字串（可透過反向地理編碼取得）
}

// 使用者
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  skills: string[];
  status: UserStatus;
  avatar?: string;
  location?: UserLocation; // GPS 位置資訊（僅在登入且授權時記錄）
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

// 資源狀態
export type ResourceStatus = 'available' | 'in_use' | 'maintenance' | 'disabled';

// 資源類型
export type ResourceType = 'vehicle' | 'crane' | 'excavator' | 'compressor' | 'generator' | 'tool' | 'other';

// 資源（工具/機械）
export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  serialNumber?: string;
  description?: string;
  status: ResourceStatus;
  location?: string; // 位置/倉庫
  assignedTo?: string; // 分配給的技術人員 ID 或工單 ID
  purchaseDate?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  notes?: string;
}

// 客戶需求狀態
export type CustomerRequirementStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

// 客戶需求
export interface CustomerRequirement {
  id: string;
  customerId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: CustomerRequirementStatus;
  requestedDate: string;
  expectedDate?: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
}

// 客戶回櫃狀態
export type CallbackStatus = 'pending' | 'scheduled' | 'completed' | 'cancelled';

// 客戶回櫃
export interface CustomerCallback {
  id: string;
  customerId: string;
  workOrderId?: string;
  reason: string;
  notes?: string;
  status: CallbackStatus;
  scheduledDate?: string;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
}

// 完工報告狀態
export type CompletionReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

// 完工報告
export interface CompletionReport {
  id: string;
  workOrderId: string;
  customerId: string;
  title: string;
  summary: string;
  workPerformed: string;
  materialsUsed?: string;
  customerFeedback?: string;
  customerSignature?: string; // Base64 或圖片 URL
  photos?: string[]; // 圖片 URL 陣列
  status: CompletionReportStatus;
  submittedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  workOrder?: WorkOrder;
}

