'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

type AuthStatus = {
  authenticated: boolean
  status: string | null
  role: string | null
  loading: boolean
}

const AuthContext = createContext<AuthStatus>({
  authenticated: false,
  status: null,
  role: null,
  loading: true
})

export const useAuth = () => useContext(AuthContext)

export function AuthStatusProvider({ children }: { children: ReactNode }) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    authenticated: false,
    status: null,
    role: null,
    loading: true
  })
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // 인증 페이지나 API 경로에서는 확인하지 않음
        if (
          pathname.startsWith('/client/auth') || 
          pathname.startsWith('/api/') ||
          pathname.startsWith('/admin/auth')
        ) {
          setAuthStatus(prev => ({ ...prev, loading: false }))
          return
        }

        const response = await fetch('/api/auth/check-status')
        const data = await response.json()

        setAuthStatus({
          authenticated: data.authenticated,
          status: data.status || null,
          role: data.role || null,
          loading: false
        })

        // 비활성화된 계정인 경우 로그인 페이지로 리디렉션
        if (data.authenticated && data.status === 'inactive') {
          router.push('/?message=inactive_account')
        }
      } catch (error) {
        setAuthStatus(prev => ({ ...prev, loading: false }))
      }
    }

    checkAuthStatus()
  }, [pathname, router, toast])

  return (
    <AuthContext.Provider value={authStatus}>
      {children}
    </AuthContext.Provider>
  )
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthStatusProvider>
      {children}
    </AuthStatusProvider>
  )
} 