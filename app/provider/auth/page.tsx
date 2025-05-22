import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { redirect } from "next/navigation";
import React from "react";
import RegisterForm from "./RegisterForm";
import LoginForm from "./LoginForm";

async function registerAction(formData: FormData) {
  "use server";
  const companyName = formData.get("companyName") as string;
  const staffName = formData.get("staffName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return { error: "비밀번호가 일치하지 않습니다." };
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/provider/auth/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyName, staffName, email, password }),
    cache: "no-store"
  });
  const data = await res.json();
  if (res.ok) {
    return { success: "회원가입 성공! 이메일 인증 후 로그인하세요." };
  } else {
    return { error: data.error || "오류가 발생했습니다." };
  }
}

// 서버 컴포넌트
export default async function ProviderAuthPage({ searchParams }: { searchParams?: Promise<{ tab?: string }> }) {
  const params = await searchParams || {};
  const tab = params.tab || 'login';
  return (
    <div className="space-y-4 w-full h-full">
      <h1 className="text-2xl font-bold tracking-tight">로그인 / 회원가입</h1>
      <p className="text-muted-foreground">광고주 계정에 접근하세요.</p>
      <div className="flex w-full h-full justify-center items-center">
        <Tabs defaultValue={tab} className="w-full max-w-md h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">로그인</TabsTrigger>
            {/* <TabsTrigger value="register">회원가입</TabsTrigger> */}
          </TabsList>
          <TabsContent value="login">
            <LoginForm />
          </TabsContent>
          <TabsContent value="register">
            <RegisterForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 