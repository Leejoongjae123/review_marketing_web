import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  // This `try/catch` block is only here for the interactive tutorial.
  // Feel free to remove once you have Supabase connected.
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // This will refresh session if expired
    const { data: { user } } = await supabase.auth.getUser();

    // 관리자 패스에 대한 권한 확인
    if (
      request.nextUrl.pathname.startsWith("/admin/") && 
      !request.nextUrl.pathname.startsWith("/admin/auth")
    ) {
      // 로그인한 사용자가 있는 경우에만 권한 확인
      if (user) {
        // 사용자의 프로필에서 role 값을 가져옴
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        // role이 master가 아니면 /admin/auth로 리디렉션
        if (!profileData || profileData.role !== 'master') {
          return NextResponse.redirect(new URL("/admin/auth", request.url));
        }
      } else {
        // 로그인하지 않은 사용자도 /admin/auth로 리디렉션
        return NextResponse.redirect(new URL("/admin/auth", request.url));
      }
    }

    // protected routes
    if (request.nextUrl.pathname.startsWith("/protected") && !user) {
      return NextResponse.redirect(new URL("/client/auth", request.url));
    }

    // 로그인된 사용자가 auth 페이지에 접근하면 client/notice로 리디렉션
    if (request.nextUrl.pathname === "/client/auth" && user) {
      return NextResponse.redirect(new URL("/client/notice", request.url));
    }

    // Redirect users who are not logged in from client/reviews or client/participation
    if ((request.nextUrl.pathname.startsWith("/client/reviews") || 
         request.nextUrl.pathname.startsWith("/client/participation")) && !user) {
      const authUrl = new URL("/client/auth", request.url);
      authUrl.searchParams.set("message", "login_required");
      return NextResponse.redirect(authUrl);
    }

    return response;
  } catch (e) {
    console.error("미들웨어 오류:", e);
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
