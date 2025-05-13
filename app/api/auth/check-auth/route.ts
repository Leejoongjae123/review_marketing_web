import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return NextResponse.json({ 
    authenticated: !!user,
    user: user ? {
      id: user.id,
      email: user.email
    } : null
  });
} 