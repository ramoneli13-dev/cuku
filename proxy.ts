import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  if (!request.cookies.has("cuku_access_token")) {
    return NextResponse.redirect(new URL("/compradores/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/compradores/dashboard/:path*"],
};
