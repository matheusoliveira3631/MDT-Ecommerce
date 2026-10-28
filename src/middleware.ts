import { NextResponse, type NextRequest } from "next/server";

/**
 * Primeira barreira do /admin: sem cookie de sessão, vai direto para o login.
 * A checagem de verdade (sessão válida e papel admin) fica no layout do admin
 * e em cada ação que grava, porque o middleware não acessa o banco.
 */
export function middleware(request: NextRequest) {
  if (!request.cookies.has("mt_sessao")) {
    const url = new URL("/entrar", request.url);
    url.searchParams.set("voltar", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
