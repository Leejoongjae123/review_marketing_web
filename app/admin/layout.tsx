'use client'

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import LayoutShell from "@/components/layout/layout-shell";
import { toast } from "@/components/ui/use-toast";
import { adminMenuItems } from "@/config/menu-config";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 앱 초기화
  useEffect(() => {
    const initApp = async () => {
      try {
        const response = await fetch('/api/init');
        const data = await response.json();
        
        if (!data.success) {
          console.warn('앱 초기화 중 경고:', data.error || '알 수 없는 오류');
        }
      } catch (error) {
        console.error('앱 초기화 실패:', error);
      }
    };
    
    initApp();
  }, []);

  return (
    <LayoutShell role="admin" menuItems={adminMenuItems}>
      <div className="flex flex-col flex-1 h-full overflow-auto">
        
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </LayoutShell>
  );
} 