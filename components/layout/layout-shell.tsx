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
      <Sidebar role={role} menuItems={menuItems} />
      
      <div className="w-full min-h-screen flex justify-center items-center">
        <div className="flex flex-col gap-4 p-4 md:p-8 w-full h-full justify-center items-center">
          {children}
        </div>
      </div>
    </div>
  );
} 