import React from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "./components/login-form";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminAuthPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  


  return (
    <div className="space-y-4 w-full h-full">
      <h1 className="text-2xl font-bold tracking-tight">로그인 / 회원가입</h1>
      <p className="text-muted-foreground">관리자 계정에 접근하세요.</p>
      
      <div className="flex w-full h-full justify-center items-center">
        <Tabs defaultValue="login" className="w-full max-w-md h-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="login">로그인</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>로그인</CardTitle>
                <CardDescription>관리자 계정으로 로그인하세요.</CardDescription>
              </CardHeader>
              <LoginForm />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 