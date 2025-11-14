'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Save, Upload, X, User as UserIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Employee {
  id: string
  netsuite_internal_id: number
  entity_id: string | null
  name: string
  email: string | null
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()
        
        // 取得使用者資料
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push('/')
          return
        }
        
        setUser(user)
        
        // 取得 NetSuite 員工列表
        const { data: employeesData, error: employeesError } = await supabase
          .from('ns_entities_employees')
          .select('id, netsuite_internal_id, entity_id, name, email')
          .eq('is_inactive', false)
          .order('name')
        
        if (employeesError) {
          console.error('取得員工列表錯誤:', employeesError)
        } else {
          setEmployees(employeesData || [])
        }
        
        // 取得使用者目前的員工 mapping 和頭像
        const { data: userProfile, error: userProfileError } = await supabase
          .from('user_profiles')
          .select('netsuite_employee_id, avatar_url')
          .eq('id', user.id)
          .maybeSingle()
        
        if (!userProfileError && userProfile) {
          if (userProfile.netsuite_employee_id) {
            setSelectedEmployeeId(userProfile.netsuite_employee_id)
          }
          if (userProfile.avatar_url) {
            setAvatarUrl(userProfile.avatar_url)
          }
        }
        
        setLoading(false)
      } catch (err) {
        console.error('取得資料錯誤:', err)
        router.push('/')
      }
    }
    
    fetchData()
  }, [router])

  const handleSave = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      const supabase = createClient()
      
      // 如果有選擇員工，查詢員工的 subsidiary_id
      let subsidiaryId: string | null = null
      if (selectedEmployeeId) {
        const { data: employeeData, error: employeeError } = await supabase
          .from('ns_entities_employees')
          .select('subsidiary_id')
          .eq('netsuite_internal_id', selectedEmployeeId)
          .eq('is_inactive', false)
          .maybeSingle()
        
        if (employeeError) {
          console.error('查詢員工資料錯誤:', employeeError)
        } else if (employeeData?.subsidiary_id) {
          // 查詢對應的 subsidiary UUID（ns_entities_employees.subsidiary_id 是 NetSuite internal ID）
          const { data: subsidiaryData, error: subsidiaryError } = await supabase
            .from('ns_subsidiaries')
            .select('id')
            .eq('netsuite_internal_id', employeeData.subsidiary_id)
            .eq('is_active', true)
            .maybeSingle()
          
          if (subsidiaryError) {
            console.error('查詢公司別資料錯誤:', subsidiaryError)
          } else if (subsidiaryData) {
            subsidiaryId = subsidiaryData.id
          }
        }
      }
      
      // 使用 upsert 來更新或插入 user_profiles
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          netsuite_employee_id: selectedEmployeeId,
          subsidiary_id: subsidiaryId,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })
      
      if (error) {
        console.error('儲存錯誤:', error)
        alert('儲存失敗，請稍後再試')
      } else {
        alert('儲存成功！')
      }
    } catch (err) {
      console.error('儲存錯誤:', err)
      alert('儲存失敗，請稍後再試')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  const selectedEmployee = employees.find(emp => emp.netsuite_internal_id === selectedEmployeeId)

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      alert('請選擇圖片檔案')
      return
    }

    // 檢查檔案大小（限制 2MB）
    if (file.size > 2 * 1024 * 1024) {
      alert('圖片大小不能超過 2MB')
      return
    }

    setUploadingAvatar(true)
    try {
      // 將圖片轉換為 base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result as string
        
        // 保存到 user_profiles 表
        const supabase = createClient()
        const { error } = await supabase
          .from('user_profiles')
          .upsert({
            id: user.id,
            avatar_url: base64String,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'id'
          })
        
        if (error) {
          console.error('上傳頭像錯誤:', error)
          alert('上傳頭像失敗，請稍後再試')
        } else {
          setAvatarUrl(base64String)
          // 觸發自定義事件，通知 layout 更新頭像
          window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { avatarUrl: base64String } }))
          alert('頭像上傳成功！')
        }
        setUploadingAvatar(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('上傳頭像錯誤:', err)
      alert('上傳頭像失敗，請稍後再試')
      setUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!confirm('確定要移除頭像嗎？')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          avatar_url: null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })
      
      if (error) {
        console.error('移除頭像錯誤:', error)
        alert('移除頭像失敗，請稍後再試')
      } else {
        setAvatarUrl(null)
        // 觸發自定義事件，通知 layout 更新頭像
        window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { avatarUrl: null } }))
        alert('頭像已移除')
      }
    } catch (err) {
      console.error('移除頭像錯誤:', err)
      alert('移除頭像失敗，請稍後再試')
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>個人資料</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 頭像上傳 */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">大頭照</Label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="頭像" 
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-[#354a56] flex items-center justify-center border-2 border-gray-200 dark:border-gray-700">
                      <UserIcon className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <Label
                      htmlFor="avatar-upload"
                      className="cursor-pointer inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingAvatar ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          上傳中...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          上傳照片
                        </>
                      )}
                    </Label>
                  </div>
                  {avatarUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <X className="h-4 w-4 mr-2" />
                      移除照片
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                支援 JPG、PNG 格式，檔案大小不超過 2MB
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">姓名</Label>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || '未設定'}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold">電子郵件</Label>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {user?.email || '未設定'}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold">NetSuite 員工帳號</Label>
              <Select
                value={selectedEmployeeId?.toString() || undefined}
                onValueChange={(value) => setSelectedEmployeeId(value ? parseInt(value) : null)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="請選擇 NetSuite 員工" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem 
                      key={employee.id} 
                      value={employee.netsuite_internal_id.toString()}
                    >
                      {employee.name} {employee.entity_id ? `(${employee.entity_id})` : ''}
                      {employee.email ? ` - ${employee.email}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedEmployee && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  已選擇：{selectedEmployee.name} (ID: {selectedEmployee.netsuite_internal_id})
                </div>
              )}
              {!selectedEmployee && selectedEmployeeId === null && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  尚未選擇 NetSuite 員工
                </div>
              )}
            </div>
            
            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    儲存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    存檔
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

