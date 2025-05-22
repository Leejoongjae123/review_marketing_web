'use client';

import { useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useSearchParams } from 'next/navigation';


export function MessageHandler() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const message = searchParams?.get('message');
  

  useEffect(() => {
    if (message === 'inactive_account') {
      toast({
        title: "계정 오류",
        description: "비활성화된 계정입니다.",
        variant: "destructive",
      });
    }
  }, [message, toast]);

  return null;
} 