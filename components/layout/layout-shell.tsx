'use client'
import React from "react";
import Sidebar, { MenuItem } from "./sidebar";

interface LayoutShellProps {
  children: React.ReactNode;
  role: "admin" | "provider" | "client";
  menuItems: MenuItem[];
}

export default function LayoutShell({ 
  children, 
  role, 
  menuItems 
}: LayoutShellProps) {
  return (
    <div className="flex min-h-screen">
      {/* 데스크톱용 사이드바만 고정 레이아웃에 포함 */}
      <div className="hidden md:block">
        <Sidebar role={role} menuItems={menuItems} />
      </div>
      
      {/* 모바일용 플로팅 메뉴 버튼 */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Sidebar role={role} menuItems={menuItems} />
      </div>
      
      {/* 메인 콘텐츠 영역 - 모바일에서는 전체 너비 사용 및 상단 여백 추가 */}
      <main className="flex-1 w-full max-h-screen overflow-y-auto ">
        <div className="flex flex-col gap-4  md:pt-12 pt-16 p-6 md:p-12 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
} 