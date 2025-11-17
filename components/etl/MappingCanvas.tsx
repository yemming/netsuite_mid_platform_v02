'use client';

import { useState } from 'react';
import { ArrowLeftRight, X, Settings } from 'lucide-react';
import { TransformModal, TransformConfig } from './TransformModal';
import './netsuite-style.css';

export interface MappingRule {
  id: string;
  sourceField: string;
  targetField: string;
  sourceType?: string;
  targetType: string;
  transform: TransformConfig;
}

interface MappingCanvasProps {
  mappings: MappingRule[];
  onAddMapping: (sourceField: string, targetField: string) => void;
  onRemoveMapping: (id: string) => void;
  onUpdateTransform: (id: string, transform: TransformConfig) => void;
}

/**
 * NetSuite 風格的映射畫布（中欄）
 * 
 * 顯示已建立的映射關係，每一行包含：
 * - 來源欄位
 * - 智慧箭頭（可點擊設定轉換規則）
 * - 目標欄位
 * - 刪除按鈕
 */
export function MappingCanvas({
  mappings,
  onAddMapping,
  onRemoveMapping,
  onUpdateTransform,
}: MappingCanvasProps) {
  const [selectedMapping, setSelectedMapping] = useState<MappingRule | null>(null);
  const [transformModalOpen, setTransformModalOpen] = useState(false);

  const handleArrowClick = (mapping: MappingRule) => {
    setSelectedMapping(mapping);
    setTransformModalOpen(true);
  };

  const handleSaveTransform = (transform: TransformConfig) => {
    if (selectedMapping) {
      onUpdateTransform(selectedMapping.id, transform);
    }
    setTransformModalOpen(false);
    setSelectedMapping(null);
  };

  return (
    <div className="ns-column">
      <div className="ns-panel">
        <div className="ns-header">Field Mapping ({mappings.length})</div>

        <div className="ns-column-body">
          {mappings.length === 0 ? (
            <div className="ns-empty-state">
              <div className="ns-empty-state-icon">
                <ArrowLeftRight size={64} strokeWidth={1} />
              </div>
              <div className="ns-empty-state-title">尚無映射關係</div>
              <div className="ns-empty-state-description">
                從左側拖曳 CSV 欄位，並從右側拖曳目標欄位到此處建立映射
              </div>
            </div>
          ) : (
            mappings.map((mapping) => (
              <div key={mapping.id} className="ns-mapping-row">
                {/* 來源欄位 */}
                <div className="ns-mapping-cell">
                  <span className="ns-icon field">📄</span>
                  <div className="flex flex-col gap-1">
                    <code className="text-xs">{mapping.sourceField}</code>
                    {mapping.sourceType && (
                      <span className={`ns-type-badge ${mapping.sourceType}`}>
                        {mapping.sourceType}
                      </span>
                    )}
                  </div>
                </div>

                {/* 智慧箭頭 */}
                <div className="flex justify-center">
                  <button
                    className={`ns-arrow-button ${
                      mapping.transform.type !== 'direct' ? 'has-transform' : ''
                    }`}
                    onClick={() => handleArrowClick(mapping)}
                    title="點擊設定轉換規則"
                  >
                    <ArrowLeftRight className="ns-arrow-icon" size={18} />
                  </button>
                </div>

                {/* 目標欄位 */}
                <div className="ns-mapping-cell">
                  <span className="ns-icon field">🎯</span>
                  <div className="flex flex-col gap-1">
                    <code className="text-xs">{mapping.targetField}</code>
                    <span className={`ns-type-badge ${mapping.targetType}`}>
                      {mapping.targetType}
                    </span>
                  </div>
                </div>

                {/* 刪除按鈕 */}
                <div className="flex justify-center">
                  <button
                    className="ns-delete-button"
                    onClick={() => onRemoveMapping(mapping.id)}
                    title="刪除映射"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 統計資訊 */}
        {mappings.length > 0 && (
          <div className="ns-stats">
            <div className="ns-stat">
              <span>總映射數：</span>
              <span className="ns-stat-value">{mappings.length}</span>
            </div>
            <div className="ns-stat">
              <span>有轉換規則：</span>
              <span className="ns-stat-value">
                {mappings.filter((m) => m.transform.type !== 'direct').length}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 轉換規則 Modal */}
      {selectedMapping && (
        <TransformModal
          open={transformModalOpen}
          onClose={() => {
            setTransformModalOpen(false);
            setSelectedMapping(null);
          }}
          sourceField={selectedMapping.sourceField}
          targetField={selectedMapping.targetField}
          currentTransform={selectedMapping.transform}
          onSave={handleSaveTransform}
        />
      )}
    </div>
  );
}

