'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2,
  Search,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { User } from '@/lib/field-operations-types';

export default function PersonnelPage() {
  const [personnel, setPersonnel] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'technician' as 'dispatcher' | 'technician' | 'admin',
    skills: [] as string[],
    status: 'offline' as 'online' | 'offline',
  });

  // 模擬資料
  useEffect(() => {
    const mockPersonnel: User[] = [
      {
        id: 'USER-001',
        name: '魯夫',
        email: 'luffy@example.com',
        role: 'technician',
        skills: ['空調維修', '電氣系統'],
        status: 'online',
      },
      {
        id: 'USER-002',
        name: '索隆',
        email: 'zoro@example.com',
        role: 'technician',
        skills: ['網路設備', '監控系統'],
        status: 'online',
      },
      {
        id: 'USER-003',
        name: '香吉士',
        email: 'sanji@example.com',
        role: 'technician',
        skills: ['智慧家電', '門禁系統'],
        status: 'offline',
      },
      {
        id: 'USER-004',
        name: '娜美',
        email: 'nami@example.com',
        role: 'dispatcher',
        skills: [],
        status: 'online',
      },
      {
        id: 'USER-005',
        name: '羅賓',
        email: 'robin@example.com',
        role: 'admin',
        skills: [],
        status: 'online',
      },
    ];
    setPersonnel(mockPersonnel);
  }, []);

  const filteredPersonnel = personnel.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setFormData({
      name: '',
      email: '',
      role: 'technician',
      skills: [],
      status: 'offline',
    });
    setIsAddModalOpen(true);
  };

  const handleEdit = (person: User) => {
    setSelectedPerson(person);
    setFormData({
      name: person.name,
      email: person.email,
      role: person.role,
      skills: person.skills || [],
      status: person.status,
    });
    setIsEditModalOpen(true);
  };

  const handleSave = () => {
    if (isAddModalOpen) {
      // 新增人員
      const newPerson: User = {
        id: `USER-${String(personnel.length + 1).padStart(3, '0')}`,
        ...formData,
      };
      setPersonnel([...personnel, newPerson]);
      setIsAddModalOpen(false);
    } else if (isEditModalOpen && selectedPerson) {
      // 編輯人員
      setPersonnel(personnel.map(p => 
        p.id === selectedPerson.id ? { ...p, ...formData } : p
      ));
      setIsEditModalOpen(false);
      setSelectedPerson(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('確定要刪除此人員嗎？')) {
      setPersonnel(personnel.filter(p => p.id !== id));
    }
  };

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      dispatcher: { label: '調度員', variant: 'default' },
      technician: { label: '技術人員', variant: 'secondary' },
      admin: { label: '管理員', variant: 'outline' },
    };
    const roleInfo = roleMap[role] || { label: role, variant: 'outline' as const };
    return <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            人員管理
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            管理系統中的所有人員，包括技術人員、調度員和管理員
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          新增人員
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>人員列表</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜尋人員..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>電子郵件</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>技能</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPersonnel.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    沒有找到符合條件的人員
                  </TableCell>
                </TableRow>
              ) : (
                filteredPersonnel.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell className="font-medium">{person.name}</TableCell>
                    <TableCell>{person.email}</TableCell>
                    <TableCell>{getRoleBadge(person.role)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {person.skills && person.skills.length > 0 ? (
                          person.skills.map((skill, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">無</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          person.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        <span className="text-sm">
                          {person.status === 'online' ? '在線' : '離線'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(person)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(person.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新增/編輯對話框 */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedPerson(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isAddModalOpen ? '新增人員' : '編輯人員'}</DialogTitle>
            <DialogDescription>
              {isAddModalOpen ? '填寫以下資訊以新增人員' : '修改人員資訊'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="輸入姓名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">電子郵件</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="example@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">角色</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'dispatcher' | 'technician' | 'admin') =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technician">技術人員</SelectItem>
                  <SelectItem value="dispatcher">調度員</SelectItem>
                  <SelectItem value="admin">管理員</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">狀態</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'online' | 'offline') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">在線</SelectItem>
                  <SelectItem value="offline">離線</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.role === 'technician' && (
              <div className="space-y-2">
                <Label>技能（多選）</Label>
                <div className="grid grid-cols-3 gap-2">
                  {['空調維修', '電氣系統', '網路設備', '監控系統', '智慧家電', '門禁系統', '太陽能', '電梯維修'].map((skill) => (
                    <Button
                      key={skill}
                      type="button"
                      variant={formData.skills.includes(skill) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const newSkills = formData.skills.includes(skill)
                          ? formData.skills.filter(s => s !== skill)
                          : [...formData.skills, skill];
                        setFormData({ ...formData, skills: newSkills });
                      }}
                    >
                      {skill}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
              setSelectedPerson(null);
            }}>
              取消
            </Button>
            <Button onClick={handleSave}>
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

