'use client'

import { useState } from 'react'

interface ModelSetting {
  id: string
  name: string
  isActive: boolean
  parameters: Record<string, any>
}

// 模擬數據
const initialModels: ModelSetting[] = [
  {
    id: '1',
    name: 'ARIMA',
    isActive: true,
    parameters: { p: 2, d: 1, q: 2 }
  },
  {
    id: '2',
    name: 'Prophet',
    isActive: true,
    parameters: { seasonality_mode: 'multiplicative', yearly_seasonality: true }
  },
  {
    id: '3',
    name: 'BestFit Algorithm',
    isActive: false,
    parameters: { threshold: 0.1 }
  },
  {
    id: '4',
    name: 'Growth AFA',
    isActive: false,
    parameters: { growth_rate: 0.05 }
  }
]

export function AlgorithmSettings() {
  const [models, setModels] = useState<ModelSetting[]>(initialModels)
  const [editingModel, setEditingModel] = useState<string | null>(null)

  const toggleModel = (id: string) => {
    setModels(models.map(m => 
      m.id === id ? { ...m, isActive: !m.isActive } : m
    ))
  }

  const updateParameters = (id: string, parameters: Record<string, any>) => {
    setModels(models.map(m => 
      m.id === id ? { ...m, parameters } : m
    ))
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#2A2A2A] rounded-lg border border-[#3A3A3A] p-6">
        <h2 className="text-lg font-semibold text-[#E0E0E0] mb-4">算法設定</h2>
        
        <div className="space-y-4">
          {models.map((model) => (
            <div
              key={model.id}
              className="p-4 bg-[#333333] rounded border border-[#3A3A3A]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-medium text-[#E0E0E0]">{model.name}</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={model.isActive}
                      onChange={() => toggleModel(model.id)}
                      className="w-4 h-4 text-[#3B82F6] bg-[#333333] border-[#3A3A3A] rounded focus:ring-[#3B82F6]"
                    />
                    <span className="text-sm text-[#B0B0B0]">
                      {model.isActive ? '啟用' : '停用'}
                    </span>
                  </label>
                </div>
                <button
                  onClick={() => setEditingModel(editingModel === model.id ? null : model.id)}
                  className="text-sm text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
                >
                  {editingModel === model.id ? '收起' : '編輯參數'}
                </button>
              </div>

              {editingModel === model.id && (
                <div className="mt-3 pt-3 border-t border-[#3A3A3A] space-y-2">
                  {Object.entries(model.parameters).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-3">
                      <label className="text-sm text-[#B0B0B0] w-32">{key}:</label>
                      <input
                        type={typeof value === 'number' ? 'number' : 'text'}
                        value={value}
                        onChange={(e) => {
                          const newValue = typeof value === 'number' 
                            ? parseFloat(e.target.value) || 0
                            : e.target.value
                          updateParameters(model.id, {
                            ...model.parameters,
                            [key]: newValue
                          })
                        }}
                        className="flex-1 px-3 py-1.5 bg-[#2A2A2A] border border-[#3A3A3A] rounded text-[#E0E0E0] text-sm focus:outline-none focus:border-[#3B82F6]"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

