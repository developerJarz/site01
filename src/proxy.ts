import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isStaffRole } from "@/lib/permissions";

// Keeps signed-out visitors and customer accounts out of the /admin pages. Team roles get in; the
// admin shell then hides what their role can't use, and every /api/admin/* handler checks the
// permission itself (see lib/admin-auth).
export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  if (!isStaffRole(token.role as string | undefined)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
