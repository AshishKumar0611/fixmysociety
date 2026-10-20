import { NextResponse, type NextRequest } from "next/server";

/**
 * First line of defence only: bounce visitors without a session cookie away from app pages
 * before rendering. The real checks (valid session, role, ownership, society) happen on the
 * server in every page, server action and route handler.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has("fms_session")) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/resident/:path*", "/manager/:path*", "/api/attachments/:path*"],
};
