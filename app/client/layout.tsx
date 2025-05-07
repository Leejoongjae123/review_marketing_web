'use client'
import React from "react";
import LayoutShell from "@/components/layout/layout-shell";
import { clientMenuItems } from "@/config/menu-config";

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LayoutShell role="client" menuItems={clientMenuItems}>
      {children}
    </LayoutShell>
  );
} 