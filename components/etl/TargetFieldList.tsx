'use client';

import { useState } from 'react';
import { Database, Search, ChevronRight, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import './netsuite-style.css';

export interface TargetField {
  name: string;
  type: string;
  description?: string;
  isRequired?: boolean;
}

export interface TargetTable {
  name: string;
  displayName: string;
  fields: TargetField[];
}

interface TargetFieldListProps {
  tables: TargetTable[];
  onFieldSelect: (fieldName: string, fieldType: string) => void;
}

/**
 * NetSuite 風格的目標欄位列表（右欄）
 * 
 * 顯示目標資料庫的表和欄位（樹狀結構）
 */
export function TargetFieldList({ tables, onFieldSelect }: TargetFieldListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  const toggleTable = (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  // 過濾表和欄位
  const filteredTables = tables
    .map((table) => ({
      ...table,
      fields: table.fields.filter(
        (field) =>
          field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          field.description?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter(
      (table) =>
        table.fields.length > 0 ||
        table.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="ns-column">
      <div className="ns-panel">
        <div className="ns-header">NetSuite Fields</div>

        {/* 搜尋框 */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={14}
            />
            <Input
              placeholder="搜尋欄位..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-8"
            />
          </div>
        </div>

        <div className="ns-column-body">
          {filteredTables.length === 0 ? (
            <div className="ns-empty-state">
              <div className="ns-empty-state-description">
                {searchQuery ? '沒有找到符合的欄位' : '請選擇目標表'}
              </div>
            </div>
          ) : (
            filteredTables.map((table) => (
              <div key={table.name} className="border-b">
                {/* 表名稱（可展開） */}
                <div
                  className="ns-field-item cursor-pointer bg-gray-50 hover:bg-gray-100 font-semibold"
                  onClick={() => toggleTable(table.name)}
                >
                  {expandedTables.has(table.name) ? (
                    <ChevronDown size={16} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-500" />
                  )}
                  <Database size={16} className="text-blue-600" />
                  <span>{table.displayName}</span>
                  <span className="ml-auto text-xs text-gray-500">
                    {table.fields.length} 欄位
                  </span>
                </div>

                {/* 欄位列表 */}
                {expandedTables.has(table.name) && (
                  <div className="bg-gray-50">
                    {table.fields.map((field) => (
                      <div
                        key={field.name}
                        className="ns-field-item pl-10 cursor-pointer hover:bg-blue-50"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('targetField', field.name);
                          e.dataTransfer.setData('targetType', field.type);
                        }}
                        onClick={() => onFieldSelect(field.name, field.type)}
                      >
                        <span className="ns-icon field">🎯</span>

                        <div className="flex-1 flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-xs">
                              {field.name}
                              {field.isRequired && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </span>
                            <span className={`ns-type-badge ${field.type}`}>
                              {field.type}
                            </span>
                          </div>

                          {field.description && (
                            <div className="text-xs text-gray-500 truncate">
                              {field.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* 統計資訊 */}
        {filteredTables.length > 0 && (
          <div className="ns-stats">
            <div className="ns-stat">
              <span>可用表：</span>
              <span className="ns-stat-value">{filteredTables.length}</span>
            </div>
            <div className="ns-stat">
              <span>總欄位：</span>
              <span className="ns-stat-value">
                {filteredTables.reduce((sum, t) => sum + t.fields.length, 0)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

