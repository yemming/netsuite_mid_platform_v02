'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  MapPin,
  Loader2,
  AlertCircle,
  User as UserIcon
} from 'lucide-react';
import { User, UserLocation } from '@/lib/field-operations-types';

// 資料庫資料型別（包含 personnel_id 和 user_id）
interface PersonnelDB {
  id: string;
  personnel_id: string;
  user_id?: string; // 關聯到 auth.users.id
  name: string; // 從 auth.users 取得（透過 RPC 函數）
  email: string; // 從 auth.users 取得（透過 RPC 函數）
  role: 'dispatcher' | 'technician' | 'admin';
  skills: string[];
  status: 'online' | 'offline';
  avatar?: string;
  location?: UserLocation;
  created_at?: string;
  updated_at?: string;
}

// 使用者選項（從 auth.users）
interface UserOption {
  id: string;
  email: string;
  name: string;
}

// 將資料庫格式轉換為前端 User 格式
function dbToUser(db: PersonnelDB): User {
  return {
    id: db.personnel_id, // 使用 personnel_id 作為前端 id
    name: db.name,
    email: db.email,
    role: db.role,
    skills: db.skills || [],
    status: db.status,
    avatar: db.avatar,
    location: db.location,
  };
}

export default function PersonnelPage() {
  const router = useRouter();
  const [personnel, setPersonnel] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    user_id: '', // 關聯到 auth.users.id
    name: '', // 只讀顯示（從 auth.users 取得）
    email: '', // 只讀顯示（從 auth.users 取得）
    role: 'technician' as 'dispatcher' | 'technician' | 'admin',
    skills: [] as string[],
    status: 'offline' as 'online' | 'offline',
  });
  
  // 使用者選項列表（從 auth.users）
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // 從 API 載入人員資料
  const loadPersonnel = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const url = searchTerm
        ? `/api/field-operations/personnel?search=${encodeURIComponent(searchTerm)}`
        : '/api/field-operations/personnel';

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '載入失敗');
      }

      // 轉換資料格式
      const users = (result.data || []).map((db: PersonnelDB) => dbToUser(db));
      setPersonnel(users);
    } catch (err: any) {
      console.error('載入人員資料錯誤:', err);
      setError(err.message || '載入人員資料失敗');
    } finally {
      setIsLoading(false);
    }
  };

  // 載入使用者列表（從 auth.users）
  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      setError(null);
      const response = await fetch('/api/field-operations/personnel/users');
      const result = await response.json();

      if (!response.ok) {
        console.error('載入使用者列表 API 錯誤:', result);
        throw new Error(result.error || '載入使用者列表失敗');
      }

      const users = result.data || [];
      console.log('載入的使用者列表:', users);
      setUserOptions(users);
      
      if (users.length === 0) {
        console.warn('沒有找到任何使用者');
      }
    } catch (err: any) {
      console.error('載入使用者列表錯誤:', err);
      setError(err.message || '載入使用者列表失敗，請檢查瀏覽器 Console');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // 初始載入
  useEffect(() => {
    loadPersonnel();
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 當搜尋條件改變時重新載入（防抖）
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPersonnel();
    }, 300); // 防抖

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleAdd = () => {
    setFormData({
      user_id: '',
      name: '',
      email: '',
      role: 'technician',
      skills: [],
      status: 'offline',
    });
    setError(null);
    setIsAddModalOpen(true);
  };
  
  // 當選擇 user_id 時，自動填入 name 和 email
  const handleUserSelect = (userId: string) => {
    const selectedUser = userOptions.find(u => u.id === userId);
    if (selectedUser) {
      setFormData(prev => ({
        ...prev,
        user_id: userId,
        name: selectedUser.name,
        email: selectedUser.email,
      }));
    }
  };

  const handleEdit = async (person: User) => {
    setSelectedPerson(person);
    setError(null);
    
    // 從 API 取得完整資料（包含 user_id）
    try {
      const response = await fetch(`/api/field-operations/personnel/${person.id}`);
      const result = await response.json();
      
      if (response.ok && result.data) {
        const dbData = result.data as PersonnelDB;
        setFormData({
          user_id: dbData.user_id || '',
          name: dbData.name,
          email: dbData.email,
          role: dbData.role,
          skills: dbData.skills || [],
          status: dbData.status,
        });
      } else {
        // 如果 API 失敗，使用現有資料
        setFormData({
          user_id: '',
          name: person.name,
          email: person.email,
          role: person.role,
          skills: person.skills || [],
          status: person.status,
        });
      }
    } catch (err) {
      console.error('取得人員詳細資料錯誤:', err);
      // 使用現有資料
      setFormData({
        user_id: '',
        name: person.name,
        email: person.email,
        role: person.role,
        skills: person.skills || [],
        status: person.status,
      });
    }
    
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      if (isAddModalOpen) {
        // 新增人員
        if (!formData.user_id) {
          setError('請選擇使用者');
          setIsSaving(false);
          return;
        }

        const response = await fetch('/api/field-operations/personnel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: formData.user_id,
            role: formData.role,
            skills: formData.skills,
            status: formData.status,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || '新增失敗');
        }

        // 重新載入列表
        await loadPersonnel();
        setIsAddModalOpen(false);
      } else if (isEditModalOpen && selectedPerson) {
        // 編輯人員
        const response = await fetch(`/api/field-operations/personnel/${selectedPerson.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: formData.user_id, // 允許更新 user_id
            role: formData.role,
            skills: formData.skills,
            status: formData.status,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || '更新失敗');
        }

        // 重新載入列表
        await loadPersonnel();
        setIsEditModalOpen(false);
        setSelectedPerson(null);
      }
    } catch (err: any) {
      console.error('儲存人員資料錯誤:', err);
      setError(err.message || '儲存失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此人員嗎？')) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/field-operations/personnel/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '刪除失敗');
      }

      // 重新載入列表
      await loadPersonnel();
    } catch (err: any) {
      console.error('刪除人員錯誤:', err);
      setError(err.message || '刪除失敗');
      alert(err.message || '刪除失敗');
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
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">載入中...</span>
            </div>
          ) : (
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
                {personnel.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      {searchTerm ? '沒有找到符合搜尋條件的人員' : '目前沒有人員資料'}
                    </TableCell>
                  </TableRow>
                ) : (
                  personnel.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {/* 照片 */}
                        {person.avatar ? (
                          <img
                            src={person.avatar}
                            alt={person.name}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                            onError={(e) => {
                              // 如果圖片載入失敗，隱藏圖片
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        {/* 姓名 */}
                        <button
                          onClick={() => router.push(`/dashboard/field-operations/admin/personnel/${person.id}`)}
                          className="font-medium text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer underline-offset-4 hover:underline"
                        >
                          {person.name}
                        </button>
                      </div>
                    </TableCell>
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
          )}
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
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="user_id">使用者帳號 *</Label>
              <Select
                value={formData.user_id}
                onValueChange={handleUserSelect}
                disabled={isLoadingUsers}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingUsers ? "載入中..." : "請選擇 Supabase 使用者"} />
                </SelectTrigger>
                <SelectContent>
                  {userOptions.length === 0 && !isLoadingUsers ? (
                    <div className="p-2 text-sm text-gray-500">沒有可用的使用者</div>
                  ) : (
                    userOptions.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || '未命名'} ({user.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                第一步：選擇系統中的 Supabase 使用者帳號（從 auth.users）
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">姓名（自動帶入）</Label>
              <Input
                id="name"
                value={formData.name}
                readOnly
                className="bg-gray-50 dark:bg-gray-900 cursor-not-allowed"
                placeholder="選擇使用者後自動帶入"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">電子郵件（自動帶入）</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                readOnly
                className="bg-gray-50 dark:bg-gray-900 cursor-not-allowed"
                placeholder="選擇使用者後自動帶入"
              />
            </div>
            <div className="space-y-2">
              <Label>人員照片</Label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-dashed">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  人員照片請至 <strong>個人資料設定</strong> 頁面進行上傳和管理
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  照片會自動從 user_profiles 表取得並顯示
                </p>
              </div>
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
            <div className="space-y-2">
              <Label>GPS 位置</Label>
              {selectedPerson && selectedPerson.location ? (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {selectedPerson.location.address || '位置座標'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        緯度: {selectedPerson.location.latitude.toFixed(6)}, 
                        經度: {selectedPerson.location.longitude.toFixed(6)}
                      </div>
                      {selectedPerson.location.lastUpdated && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          最後更新: {new Date(selectedPerson.location.lastUpdated).toLocaleString('zh-TW')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-dashed">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        尚未記錄 GPS 位置
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                * GPS 位置會在人員登入「行動現場服務」頁面時自動透過瀏覽器取得並更新
              </p>
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
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  儲存中...
                </>
              ) : (
                '儲存'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

