'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  MapPin, 
  Navigation,
  Calendar,
  CheckCircle2,
  XCircle,
  Shield,
  Wrench
} from 'lucide-react';
import { User as UserType } from '@/lib/field-operations-types';

/**
 * 人員詳細資料頁面（唯讀）
 * 顯示單一人員的完整資訊
 */
export default function PersonnelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const personnelId = params.id as string;

  const [person, setPerson] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 資料庫資料型別
  interface PersonnelDB {
    id: string;
    personnel_id: string;
    name: string;
    email: string;
    role: 'dispatcher' | 'technician' | 'admin';
    skills: string[];
    status: 'online' | 'offline';
    avatar?: string;
    location?: {
      latitude: number;
      longitude: number;
      lastUpdated?: string;
      address?: string;
    };
    created_at?: string;
    updated_at?: string;
  }

  // 將資料庫格式轉換為前端 User 格式
  function dbToUser(db: PersonnelDB): UserType {
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

  useEffect(() => {
    const loadPerson = async () => {
      if (!personnelId) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/field-operations/personnel/${personnelId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || '載入失敗');
        }

        if (result.data) {
          const user = dbToUser(result.data);
          setPerson(user);
        } else {
          setPerson(null);
        }
      } catch (err: any) {
        console.error('載入人員資料錯誤:', err);
        setError(err.message || '載入人員資料失敗');
        setPerson(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadPerson();
  }, [personnelId]);

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      dispatcher: { label: '調度員', variant: 'default' },
      technician: { label: '技術人員', variant: 'secondary' },
      admin: { label: '管理員', variant: 'outline' },
    };
    const roleInfo = roleMap[role] || { label: role, variant: 'outline' as const };
    return <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'technician':
        return <Wrench className="h-5 w-5" />;
      case 'dispatcher':
        return <Navigation className="h-5 w-5" />;
      case 'admin':
        return <Shield className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">載入中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="container mx-auto p-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {error || '找不到此人員'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <User className="h-8 w-8" />
              {person.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              人員詳細資訊
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：主要資訊 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本資訊 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                基本資訊
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 照片顯示 */}
              <div className="flex justify-center mb-4">
                {person.avatar ? (
                  <img
                    src={person.avatar}
                    alt={person.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700 shadow-lg"
                    onError={(e) => {
                      // 如果圖片載入失敗，顯示預設圖示
                      (e.target as HTMLImageElement).style.display = 'none';
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent) {
                        const fallback = document.createElement('div');
                        fallback.className = 'w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-800 border-4 border-gray-200 dark:border-gray-700 flex items-center justify-center';
                        fallback.innerHTML = '<svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-800 border-4 border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-lg">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">姓名</label>
                  <p className="text-lg font-semibold mt-1">{person.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">人員 ID</label>
                  <p className="text-lg font-mono mt-1">{person.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    電子郵件
                  </label>
                  <p className="text-lg mt-1">{person.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    {getRoleIcon(person.role)}
                    角色
                  </label>
                  <div className="mt-1">
                    {getRoleBadge(person.role)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    {person.status === 'online' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    狀態
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      person.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <span className="text-lg">
                      {person.status === 'online' ? '在線' : '離線'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 技能資訊 */}
          {person.role === 'technician' && person.skills && person.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  技能專長
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {person.skills.map((skill, idx) => (
                    <Badge key={idx} variant="outline" className="text-sm py-1 px-3">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* GPS 位置資訊 */}
          {person.location && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  GPS 位置資訊
                </CardTitle>
                <CardDescription>
                  人員登入系統時自動記錄的位置資訊
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <div className="space-y-3">
                    {person.location.address && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">地址</label>
                        <p className="text-base font-medium mt-1 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          {person.location.address}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">緯度</label>
                        <p className="text-base font-mono mt-1">{person.location.latitude.toFixed(6)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">經度</label>
                        <p className="text-base font-mono mt-1">{person.location.longitude.toFixed(6)}</p>
                      </div>
                    </div>
                    {person.location.lastUpdated && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          最後更新時間
                        </label>
                        <p className="text-base mt-1">
                          {new Date(person.location.lastUpdated).toLocaleString('zh-TW', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  * 位置資訊會在人員登入系統時自動透過 GPS 取得並記錄
                </p>
              </CardContent>
            </Card>
          )}

          {!person.location && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  GPS 位置資訊
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 py-4">
                  <Navigation className="h-5 w-5" />
                  <span>目前沒有位置記錄</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右側：摘要資訊 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>摘要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">狀態</span>
                <Badge variant={person.status === 'online' ? 'default' : 'secondary'}>
                  {person.status === 'online' ? '在線' : '離線'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">角色</span>
                {getRoleBadge(person.role)}
              </div>
              {person.role === 'technician' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">技能數量</span>
                  <span className="font-semibold">{person.skills?.length || 0} 項</span>
                </div>
              )}
              {person.location && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">位置記錄</span>
                  <Badge variant="outline">已記錄</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

