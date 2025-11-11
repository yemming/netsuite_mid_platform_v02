import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 檢查環境變數是否存在
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // 即使環境變數未設置，也允許請求通過，避免完全阻塞應用
    return response
  }

  // 優化：只對需要認證的路徑執行 auth 檢查
  const pathname = request.nextUrl.pathname
  const isPublicPath = pathname === '/' || pathname.startsWith('/api/auth') || pathname.startsWith('/_next')
  
  // 對於公開路徑，只設置 cookie 處理，不執行 auth 檢查
  if (isPublicPath) {
    try {
      const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set(name: string, value: string, options: CookieOptions) {
              const cookieOptions: CookieOptions = {
                ...options,
                secure: process.env.NODE_ENV === 'production' || request.url.startsWith('https://'),
                sameSite: 'lax' as const,
                httpOnly: options?.httpOnly ?? false,
              }
              
              request.cookies.set({ name, value, ...cookieOptions })
              response = NextResponse.next({
                request: { headers: request.headers },
              })
              response.cookies.set({ name, value, ...cookieOptions })
            },
            remove(name: string, options: CookieOptions) {
              request.cookies.set({ name, value: '', ...options })
              response = NextResponse.next({
                request: { headers: request.headers },
              })
              response.cookies.set({ name, value: '', ...options })
            },
          },
        }
      )
      // 對於公開路徑，不執行 getUser()，只設置 cookie 處理器
    } catch (error) {
      // 靜默處理錯誤
    }
    return response
  }

  // 對於需要認證的路徑，執行 auth 檢查（但使用更輕量的方式）
  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            const cookieOptions: CookieOptions = {
              ...options,
              secure: process.env.NODE_ENV === 'production' || request.url.startsWith('https://'),
              sameSite: 'lax' as const,
              httpOnly: options?.httpOnly ?? false,
            }
            
            request.cookies.set({ name, value, ...cookieOptions })
            response = NextResponse.next({
              request: { headers: request.headers },
            })
            response.cookies.set({ name, value, ...cookieOptions })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options })
            response = NextResponse.next({
              request: { headers: request.headers },
            })
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    // 優化：使用 getSession() 而不是 getUser()，因為它更輕量
    // 只在需要時才調用 getUser()（例如在 dashboard 路由中）
    await supabase.auth.getSession()
  } catch (error) {
    // 即使出錯，也允許請求通過，讓前端處理認證
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

