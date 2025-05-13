'use client'
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Menu, X, FileText, Users, LogIn, History, BarChart, Presentation, LogOut, UserPlus } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { usePathname, useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 메뉴 타입 정의
export type MenuItem = {
  title: string;
  href: string;
  icon?: string;
};

// 메뉴 그룹 타입 정의
export type SidebarProps = {
  role: "admin" | "provider" | "client";
  menuItems: MenuItem[];
};

export default function Sidebar({ role, menuItems }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  // 현재 선택된 역할 상태
  const [selectedRole, setSelectedRole] = useState<string>(role);
  // 인증 상태
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  // 인증 확인 로딩 상태
  const [loading, setLoading] = useState<boolean>(true);
  
  // 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check-auth');
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
      } catch (error) {
        console.error('인증 상태 확인 실패:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // 역할 변경 시 해당 역할의 auth 페이지로 이동
  const handleRoleChange = (value: string) => {
    setSelectedRole(value);
    router.push(`/${value}/auth`);
  };

  // 로그아웃 핸들러
  const handleLogout = async () => {
    const response = await fetch("/api/auth/signout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    
    if (response.ok) {
      setIsAuthenticated(false);
      router.push(`/${role}/auth`);
    }
  };

  // 로그인 페이지로 이동
  const handleLogin = () => {
    router.push(`/${role}/auth`);
  };

  // 회원가입 페이지로 이동
  const handleSignUp = () => {
    router.push(`/sign-up`);
  };

  // 아이콘 매핑 함수
  const getIcon = (iconName: string | undefined) => {
    if (!iconName) return null;
    
    switch (iconName) {
      case "file-text":
        return <FileText className="h-4 w-4" />;
      case "users":
        return <Users className="h-4 w-4" />;
      case "log-in":
        return <LogIn className="h-4 w-4" />;
      case "history":
        return <History className="h-4 w-4" />;
      case "bar-chart":
        return <BarChart className="h-4 w-4" />;
      case "presentation":
        return <Presentation className="h-4 w-4" />;
      default:
        return null;
    }
  };
  
  // 컴포넌트 마운트 시 현재 역할 설정
  useEffect(() => {
    setSelectedRole(role);
  }, [role]);
  
  // 역할 표시 함수
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin": return "관리자";
      case "provider": return "광고주";
      case "client": return "리뷰어";
      default: return "";
    }
  };
  
  // 인증 관련 버튼 렌더링
  const renderAuthButtons = () => {
    if (loading) return null;
    
    if (isAuthenticated) {
      return (
        <Button 
          variant="destructive"
          className="w-full flex items-center justify-center gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </Button>
      );
    } else {
      return (
        <div className="flex flex-col gap-2">
          <Button 
            variant="default"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleLogin}
          >
            <LogIn className="h-4 w-4" />
            로그인
          </Button>
          
        </div>
      );
    }
  };
  
  return (
    <>
      {/* 모바일 환경에서는 버튼과 Sheet를 렌더링 */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full shadow-md"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">메뉴 열기</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] sm:w-[300px] h-screen overflow-y-auto">
            <div className="flex flex-col gap-4 h-full">
              <div className="flex justify-between items-center py-4">
                <div>
                  <h2 className="px-2 text-lg font-semibold tracking-tight">
                    {getRoleDisplayName(role)}
                  </h2>
                  <h3 className="px-2 text-md tracking-tight mb-2">Review WEB</h3>
                </div>

              </div>
              
              {/* 역할 선택 셀렉트 박스 */}
              <div className="px-2">
                <Select
                  value={selectedRole}
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="역할 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">관리자</SelectItem>
                    <SelectItem value="provider">광고주</SelectItem>
                    <SelectItem value="client">리뷰어</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <nav className="flex flex-col gap-2 flex-1">
                {menuItems.map((item, index) => (
                  <Link 
                    key={index} 
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted/50",
                      pathname === item.href && "bg-muted"
                    )}
                  >
                    {item.icon && getIcon(item.icon)}
                    {item.title}
                  </Link>
                ))}
              </nav>
              
              {/* 인증 버튼 */}
              <div className="mt-auto px-2 mb-4">
                {renderAuthButtons()}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* 데스크톱 환경에서는 일반 사이드바 렌더링 */}
      <div className="hidden md:block border-r bg-background w-full lg:w-[240px] h-screen overflow-y-auto">
        <div className="flex h-full flex-col gap-4">
          <div className="py-4">
            <h2 className="px-7 text-lg font-semibold tracking-tight">
              {getRoleDisplayName(role)}
            </h2>
            <h3 className="px-7 text-md tracking-tight mb-2">Review WEB</h3>
            
            {/* 역할 선택 셀렉트 박스 */}
            <div className="px-7">
              <Select
                value={selectedRole}
                onValueChange={handleRoleChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="역할 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">관리자</SelectItem>
                  <SelectItem value="provider">광고주</SelectItem>
                  <SelectItem value="client">리뷰어</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <nav className="flex flex-col gap-2 px-4 flex-1">
            {menuItems.map((item, index) => (
              <Link 
                key={index} 
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted/50",
                  pathname === item.href && "bg-muted"
                )}
              >
                {item.icon && getIcon(item.icon)}
                {item.title}
              </Link>
            ))}
          </nav>
          
          {/* 인증 버튼 */}
          <div className="mt-auto px-4 mb-6">
            {renderAuthButtons()}
          </div>
        </div>
      </div>
    </>
  );
} 