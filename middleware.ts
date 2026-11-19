import { NextRequest, NextResponse } from "next/server";

// Protege /admin y /api/admin con usuario y contraseña (Basic Auth).
export function middleware(req: NextRequest) {
  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    const [user, pass] = atob(header.slice(6)).split(":");
    if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS) {
      return NextResponse.next();
    }
  }
  return new NextResponse("Acceso restringido", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Fractale Admin"' },
  });
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
