'use client'
import React from "react";
import LayoutShell from "@/components/layout/layout-shell";
import { providerMenuItems } from "@/config/menu-config";

export default function ProviderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LayoutShell role="provider" menuItems={providerMenuItems}>
      {children}
    </LayoutShell>
  );
} 