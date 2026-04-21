import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware disabled for now - auth handled by pages
export function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};