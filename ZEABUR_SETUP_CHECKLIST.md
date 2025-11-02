# Zeabur 部署檢查清單

## 必須檢查的設定

### 1. Zeabur 環境變數

確認以下環境變數已正確設置：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**重要：**
- ✅ 環境變數名稱必須完全正確（包括 `NEXT_PUBLIC_` 前綴）
- ✅ URL 必須以 `https://` 開頭
- ✅ 值中不能有多餘的空格或引號

### 2. Supabase 設定

#### A. Site URL（網站 URL）

在 Supabase Dashboard → Authentication → URL Configuration：

**Site URL** 應設置為：
```
https://netsuite-mid-platform-v02.zeabur.app
```

#### B. Redirect URLs（重定向 URL）

在 Supabase Dashboard → Authentication → URL Configuration → Redirect URLs：

必須包含以下 URL：
```
https://netsuite-mid-platform-v02.zeabur.app/dashboard
https://netsuite-mid-platform-v02.zeabur.app/**
```

或者使用萬用字元：
```
https://netsuite-mid-platform-v02.zeabur.app/**
```

**說明：**
- 這些 URL 告訴 Supabase 哪些來源是允許的
- 如果不設置，認證重定向會失敗

#### C. Email Templates（郵件模板）

如果需要郵件驗證，確認：
- Email Confirmation 模板中的重定向 URL 包含你的 Zeabur 域名
- 例如：`{{ .ConfirmationURL }}` 應該指向 `https://netsuite-mid-platform-v02.zeabur.app`

### 3. 測試步驟

1. **檢查環境變數**
   - 在 Zeabur 後台查看環境變數是否正確設置
   - 確認沒有多餘的空格或特殊字元

2. **檢查瀏覽器控制台**
   - 打開 Zeabur 網站
   - 按 F12 打開開發者工具
   - 查看 Console 標籤是否有錯誤訊息
   - 特別注意是否有 "Supabase 環境變數未設置" 的錯誤

3. **測試登入**
   - 嘗試註冊新帳號
   - 檢查是否收到驗證郵件（如果啟用郵件驗證）
   - 嘗試登入

4. **檢查 Network 請求**
   - 在開發者工具的 Network 標籤中
   - 查看對 Supabase API 的請求是否成功
   - 檢查請求的 URL 是否正確

### 4. 常見問題

#### 問題 1: "Supabase 環境變數未設置"

**原因：**
- 環境變數名稱錯誤
- 環境變數值為空
- 環境變數未正確保存

**解決方法：**
1. 確認環境變數名稱是 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. 確認值不為空
3. 重新部署服務

#### 問題 2: "Invalid API key" 或 "Unauthorized"

**原因：**
- Supabase URL 或 Anon Key 錯誤
- 使用了錯誤的 Key（例如用了 Service Role Key 而不是 Anon Key）

**解決方法：**
1. 在 Supabase Dashboard → Settings → API 中確認正確的 URL 和 Anon Key
2. 確保使用的是 "anon" "public" key，不是 "service_role" key

#### 問題 3: 登入後立即被登出

**原因：**
- Redirect URL 未在 Supabase 允許列表中
- Cookie 設定問題（SameSite、Secure 等）

**解決方法：**
1. 在 Supabase Dashboard → Authentication → URL Configuration 中添加 Redirect URL
2. 確保 Site URL 設定正確

#### 問題 4: 註冊後收不到驗證郵件

**原因：**
- Supabase 郵件服務未配置
- 郵件被歸類為垃圾郵件
- 郵件驗證被禁用

**解決方法：**
1. 在 Supabase Dashboard → Authentication → Settings 中檢查 "Enable email confirmations"
2. 檢查垃圾郵件資料夾
3. 如果需要，可以在 Supabase Dashboard → Authentication → Users 中手動確認用戶

### 5. 快速驗證命令

如果你想驗證 Zeabur 環境變數是否正確：

```bash
# 在 Zeabur 的運行時日誌中應該能看到環境變數的狀態
# 或者通過瀏覽器控制台查看（如果環境變數設置正確，不會有錯誤訊息）
```

## 設定完成後的確認

- [ ] Zeabur 環境變數已設置
- [ ] Supabase Site URL 已設置為 Zeabur 域名
- [ ] Supabase Redirect URLs 包含 Zeabur 域名
- [ ] 瀏覽器控制台沒有 Supabase 相關錯誤
- [ ] 可以成功註冊新帳號
- [ ] 可以成功登入
- [ ] 登入後可以正常訪問 dashboard

