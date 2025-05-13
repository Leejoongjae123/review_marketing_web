'use client'

import { useEffect, useState } from "react"
import { createClient } from '@/utils/supabase/client'
import { Button } from "@/components/ui/button"
import { UserCircle } from "lucide-react"
import Link from "next/link"

export default function UserAuthStatus() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', {
      method: 'POST',
    })
  }

  if (loading) {
    return <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
  }

  if (!user) {
    return (
      <Link href="/client/auth">
        <Button variant="outline" size="sm" className="gap-2">
          <UserCircle className="h-4 w-4" />
          로그인
        </Button>
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm">
        {user.user_metadata?.full_name || user.email || '사용자'}
      </div>
      <Button variant="outline" size="sm" onClick={handleSignOut}>
        로그아웃
      </Button>
    </div>
  )
} 