'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Settings, GripVertical, ArrowUp, ArrowDown, Save } from 'lucide-react';

export default function WorkOrderSequencePage() {
  const [selectedMachine, setSelectedMachine] = useState('F24-01');

  const [machines] = useState([
    { code: 'F24-01', name: 'F24-01 機台' },
    { code: 'F24-02', name: 'F24-02 機台' },
    { code: 'DS-01', name: 'DS-01 機台' },
    { code: 'F10-01', name: 'F10-01 機台' }
  ]);

  const [workOrderQueue, setWorkOrderQueue] = useState([
    { id: 'WO001', workOrderNumber: 'WO-2025-001', itemName: '產品A', quantity: 1000, priority: 1, startDate: '2025-02-10', endDate: '2025-02-15' },
    { id: 'WO002', workOrderNumber: 'WO-2025-002', itemName: '產品B', quantity: 500, priority: 2, startDate: '2025-02-12', endDate: '2025-02-18' },
    { id: 'WO003', workOrderNumber: 'WO-2025-003', itemName: '產品C', quantity: 800, priority: 3, startDate: '2025-02-15', endDate: '2025-02-20' }
  ]);

  const handlePriorityChange = (id: string, direction: 'up' | 'down') => {
    setWorkOrderQueue(prev => {
      const index = prev.findIndex(wo => wo.id === id);
      if (index === -1) return prev;
      
      const newQueue = [...prev];
      if (direction === 'up' && index > 0) {
        [newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]];
      } else if (direction === 'down' && index < newQueue.length - 1) {
        [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]];
      }
      
      return newQueue.map((wo, i) => ({ ...wo, priority: i + 1 }));
    });
  };

  const selectedMachineQueue = workOrderQueue.filter(wo => 
    wo.workOrderNumber.includes(selectedMachine) || true // 簡化版本
  );

  return (
    <div className="space-y-6 p-6">
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">工單機台生產順序設定</h1>
        </div>
        <p className="text-muted-foreground">
          調整工單在機台上的生產優先順序
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左側：機台清單 */}
        <Card>
          <CardHeader>
            <CardTitle>機台清單</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {machines.map((machine) => (
                <button
                  key={machine.code}
                  onClick={() => setSelectedMachine(machine.code)}
                  className={`w-full text-left p-3 rounded-md transition-colors ${
                    selectedMachine === machine.code
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-accent'
                  }`}
                >
                  <div className="font-medium">{machine.code}</div>
                  <div className="text-xs opacity-80">{machine.name}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 右側：工單隊列 */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedMachine} 工單隊列</CardTitle>
              <Button>
                <Save className="h-4 w-4 mr-2" />
                儲存順序
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">操作</TableHead>
                    <TableHead>優先順序</TableHead>
                    <TableHead>工令單號</TableHead>
                    <TableHead>料品名稱</TableHead>
                    <TableHead>數量</TableHead>
                    <TableHead>開始日期</TableHead>
                    <TableHead>結束日期</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedMachineQueue.map((wo) => (
                    <TableRow key={wo.id} className="hover:bg-accent/50">
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePriorityChange(wo.id, 'up')}
                            disabled={wo.priority === 1}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePriorityChange(wo.id, 'down')}
                            disabled={wo.priority === selectedMachineQueue.length}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={wo.priority}
                          onChange={(e) => {
                            const newPriority = parseInt(e.target.value);
                            setWorkOrderQueue(prev => prev.map(item => 
                              item.id === wo.id ? { ...item, priority: newPriority } : item
                            ));
                          }}
                          className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input w-20"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{wo.workOrderNumber}</TableCell>
                      <TableCell>{wo.itemName}</TableCell>
                      <TableCell>{wo.quantity.toLocaleString()}</TableCell>
                      <TableCell>{wo.startDate}</TableCell>
                      <TableCell>{wo.endDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

