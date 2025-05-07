'use client'
import React from "react";
import LayoutShell from "@/components/layout/layout-shell";
import { adminMenuItems } from "@/config/menu-config";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LayoutShell role="admin" menuItems={adminMenuItems}>
      {children}
    </LayoutShell>
  );
} 