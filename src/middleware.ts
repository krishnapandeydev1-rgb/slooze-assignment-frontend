import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith("/login");
  const isProtectedPage = ["/restaurants", "/cart"].some((path) =>
    pathname.startsWith(path)
  );

  // 🏠 If user visits "/", redirect appropriately
  if (pathname === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/restaurants", req.url));
    } else {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // ✅ If already logged in, prevent visiting login page
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/restaurants", req.url));
  }

  // 🚫 If not logged in, protect private routes
  if (isProtectedPage && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/restaurants/:path*", "/cart/:path*", "/login"],
};
