'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { RiKakaoTalkFill } from 'react-icons/ri'

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        console.log("user", user)
        
        if (user) {
          // 사용자의 raw 메타데이터에서 추가 정보 추출
          const rawUserMetadata = user.user_metadata
          setUserData(rawUserMetadata)
        }
      } catch (error) {
        console.error('사용자 정보를 가져오는 데 실패했습니다:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 w-full h-full flex flex-col items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-4 w-full h-full flex flex-col items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>로그인이 필요합니다</CardTitle>
            <CardDescription>
              프로필을 보려면 로그인해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <a href="/client/auth" className="inline-flex items-center justify-center bg-[#FEE500] hover:bg-[#FEE500]/90 text-black font-medium px-4 py-2 rounded-md">
              <RiKakaoTalkFill className="w-5 h-5 mr-2" />
              로그인 페이지로 이동
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 w-full h-full flex flex-col items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={userData?.avatar_url} alt={userData?.name || '사용자'} />
              <AvatarFallback>{(userData?.name || '사용자').charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-2xl">{userData?.name || '카카오 사용자'}</CardTitle>
          <CardDescription className="flex items-center justify-center gap-1">
            <RiKakaoTalkFill className="text-[#FEE500]" /> 카카오 계정으로 로그인됨
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">이메일</span>
              <span className="font-medium">{userData?.email || user.email || '정보 없음'}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">핸드폰 번호</span>
              <span className="font-medium">{userData?.phone_number || '정보 없음'}</span>
            </div>
          </div>
          
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = '/'
            }}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-md transition"
          >
            로그아웃
          </button>
        </CardContent>
      </Card>
    </div>
  )
} 