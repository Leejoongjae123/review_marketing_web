import React, { Suspense } from "react";
import PaymentManagement from "./components/PaymentManagement";

function LoadingFallback() {
  return (
    <div className="space-y-4 w-full h-full">
      <h1 className="text-2xl font-bold tracking-tight">정산관리</h1>
      <p className="text-muted-foreground">정산 데이터를 불러오는 중...</p>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentManagement />
    </Suspense>
  );
} 