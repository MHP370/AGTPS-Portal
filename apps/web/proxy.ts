import { NextResponse, type NextRequest } from "next/server";

const ACCESS_TOKEN_KEY = "access_token";
const LOGIN_PATH = "/admin/login";
const PORTAL_LOGIN_PATH = "/login";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith(LOGIN_PATH) || pathname === PORTAL_LOGIN_PATH) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ACCESS_TOKEN_KEY)?.value;

  if (!token && pathname.startsWith('/admin')) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);

    return NextResponse.redirect(loginUrl);
  }


  if (!token) {
    try {
      const internalApiUrl = process.env.INTERNAL_API_URL?.replace(/\/$/, '');
      const loginOptionsUrl = internalApiUrl
        ? `${internalApiUrl}/auth/login-options`
        : new URL('/api/auth/login-options', request.url);
      const response = await fetch(loginOptionsUrl, {
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      });
      const options = response.ok ? await response.json() : null;
      if (options?.requirePortalLogin) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = PORTAL_LOGIN_PATH;
        loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = PORTAL_LOGIN_PATH;
      loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
      loginUrl.searchParams.set('reason', 'settings-unavailable');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/file-shares/:path*", "/trainings/:path*"],
};
