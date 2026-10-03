import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Keeps signed-out visitors and non-admin accounts out of the /admin pages.
// The /api/admin/* handlers check the session themselves (see lib/admin-auth).
export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  if (token.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
