"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export default function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [staffName, setStaffName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/;
  const isEmailValid = emailRegex.test(email);

  const passwordsMatch = password === confirmPassword;
  const canSubmit =
    !loading &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    passwordsMatch &&
    email.length > 0 &&
    isEmailValid &&
    staffName.length > 0 &&
    phone.length > 0;

  // 번호를 +82 10-9070-3001 형태로 변환하는 함수
  function formatPhoneToInternational(input: string): string {
    const numbers = input.replace(/\D/g, "");
    if (numbers.length < 10) return input; // 10자리 미만이면 변환 안함
    let local = numbers;
    if (local.startsWith("0")) local = local.slice(1); // 0 제거
    const first = local.slice(0, 2); // 10
    const middle = local.slice(2, 6); // 9070
    const last = local.slice(6, 10); // 3001
    return `+82 ${first}-${middle}-${last}`;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const staffName = formData.get("staffName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    if (!passwordsMatch) {
      setError("비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName, staffName, email, password, fullName: staffName, phone: formatPhoneToInternational(phone) }),
    });
    const data = await res.json();
    if (res.ok) {
      toast({
        title: "회원가입 성공!",
        description: "관리자 승인 후에 로그인 해주세요.",
      });
      setPassword("");
      setConfirmPassword("");
      setStaffName("");
      setPhone("");
      setEmail("");
      setCompanyName("");
      setTimeout(() => {
        router.push("/provider/auth");
        router.refresh();
        if (onSuccess) onSuccess();
      }, 2000);
    } else {
      setError(data.error || "오류가 발생했습니다.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>회원가입</CardTitle>
          <CardDescription>광고주 계정을 생성하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">회사명</Label>
            <Input id="companyName" name="companyName" placeholder="회사명 입력" required value={companyName} onChange={e => setCompanyName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staffName">담당자 이름</Label>
            <Input id="staffName" name="staffName" placeholder="담당자 이름 입력" required value={staffName} onChange={e => setStaffName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">연락처</Label>
            <Input id="phone" name="phone" placeholder="연락처 입력" required value={phone} onChange={e => setPhone(formatPhoneToInternational(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="이메일 주소 입력"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
            {!isEmailValid && email.length > 0 && (
              <div className="text-red-500 text-sm mt-1">이메일 형태로 입력해 주세요.</div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="비밀번호 입력"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="비밀번호 재입력"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
            {!passwordsMatch && confirmPassword.length > 0 && (
              <div className="text-red-500 text-sm mt-1">비밀번호가 일치하지 않습니다.</div>
            )}
          </div>
          {error && !(error === "비밀번호가 일치하지 않습니다.") && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          {message && <div className="text-green-600 text-sm">{message}</div>}
        </CardContent>
        <CardFooter>
          <Button className="w-full" type="submit" disabled={!canSubmit}>{loading ? "가입 중..." : "계정 생성"}</Button>
        </CardFooter>
      </Card>
    </form>
  );
} 