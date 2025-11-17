'use client';

import { FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import './netsuite-style.css';

export interface SourceField {
  name: string;
  displayName: string;
  inferredType: string;
  sampleValues?: any[];
  isMapped: boolean;
}

interface SourceFieldListProps {
  fields: SourceField[];
  onFieldSelect: (fieldName: string) => void;
}

/**
 * NetSuite 風格的來源欄位列表（左欄）
 * 
 * 顯示 CSV 檔案的欄位，已映射的欄位會變灰且不可選
 */
export function SourceFieldList({ fields, onFieldSelect }: SourceFieldListProps) {
  return (
    <div className="ns-column">
      <div className="ns-panel">
        <div className="ns-header">Your Fields</div>

        <div className="ns-column-body">
          {fields.length === 0 ? (
            <div className="ns-empty-state">
              <div className="ns-empty-state-icon">
                <FileSpreadsheet size={48} strokeWidth={1} />
              </div>
              <div className="ns-empty-state-description">
                請先上傳 CSV 檔案
              </div>
            </div>
          ) : (
            fields.map((field) => (
              <div
                key={field.name}
                className={`ns-field-item ${field.isMapped ? 'disabled' : ''}`}
                onClick={() => !field.isMapped && onFieldSelect(field.name)}
                draggable={!field.isMapped}
                onDragStart={(e) => {
                  if (!field.isMapped) {
                    e.dataTransfer.setData('sourceField', field.name);
                    e.dataTransfer.setData('sourceType', field.inferredType);
                  }
                }}
              >
                {field.isMapped ? (
                  <CheckCircle2 className="ns-icon mapped" size={16} />
                ) : (
                  <span className="ns-icon field">📄</span>
                )}

                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{field.displayName}</span>
                    <span className={`ns-type-badge ${field.inferredType}`}>
                      {field.inferredType}
                    </span>
                  </div>

                  {field.sampleValues && field.sampleValues.length > 0 && (
                    <div className="text-xs text-gray-500 truncate">
                      範例：{field.sampleValues[0]}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 統計資訊 */}
        {fields.length > 0 && (
          <div className="ns-stats">
            <div className="ns-stat">
              <span>總欄位：</span>
              <span className="ns-stat-value">{fields.length}</span>
            </div>
            <div className="ns-stat">
              <span>已映射：</span>
              <span className="ns-stat-value">
                {fields.filter((f) => f.isMapped).length}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

