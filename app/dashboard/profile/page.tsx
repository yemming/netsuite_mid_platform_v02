'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Save } from 'lucide-react'

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
        
        // 取得使用者目前的員工 mapping
        const { data: userProfile, error: userProfileError } = await supabase
          .from('user_profiles')
          .select('netsuite_employee_id')
          .eq('id', user.id)
          .maybeSingle()
        
        if (!userProfileError && userProfile?.netsuite_employee_id) {
          setSelectedEmployeeId(userProfile.netsuite_employee_id)
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

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>個人資料</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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

