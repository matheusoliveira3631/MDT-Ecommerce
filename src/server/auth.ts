import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import { sessoes, usuarios } from "./db/schema";
import { hashPassword, verifyPassword } from "./password";

export const SESSION_COOKIE = "mt_sessao";
const SESSION_DAYS = 30;

export interface SessionUser {
  id: number;
  nome: string;
  email: string;
  papel: "cliente" | "admin";
}

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/** Hash fixo para comparar quando o e-mail não existe: a resposta leva o mesmo tempo. */
let dummyHash: Promise<string> | null = null;

/** Confere e-mail e senha. Devolve o usuário ou null (sem dizer qual dos dois errou). */
export async function checkCredentials(email: string, senha: string): Promise<SessionUser | null> {
  const user = db.select().from(usuarios).where(eq(usuarios.email, email.trim().toLowerCase())).get();
  if (!user) {
    dummyHash ??= hashPassword("senha-que-nao-existe");
    await verifyPassword(await dummyHash, senha);
    return null;
  }
  if (!(await verifyPassword(user.senhaHash, senha))) return null;
  return { id: user.id, nome: user.nome, email: user.email, papel: user.papel };
}

/** Cria a sessão e grava o cookie (só em Server Actions e Route Handlers). */
export async function startSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiraEm = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  db.insert(sessoes).values({ id: sha256(token), usuarioId: userId, expiraEm }).run();
  // Aproveita para limpar sessões vencidas
  db.delete(sessoes).where(lt(sessoes.expiraEm, new Date())).run();

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // Em produção o site roda em HTTPS (Nginx + certificado); COOKIE_SECURE=false só para testar sem HTTPS
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false",
    path: "/",
    expires: expiraEm,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) db.delete(sessoes).where(eq(sessoes.id, sha256(token))).run();
  store.delete(SESSION_COOKIE);
}

/** Usuário logado (uma consulta por requisição), ou null. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = db
    .select({ id: usuarios.id, nome: usuarios.nome, email: usuarios.email, papel: usuarios.papel })
    .from(sessoes)
    .innerJoin(usuarios, eq(sessoes.usuarioId, usuarios.id))
    .where(and(eq(sessoes.id, sha256(token)), gt(sessoes.expiraEm, new Date())))
    .get();
  return row ?? null;
});

/**
 * Para páginas: sem login vai para /entrar; logado sem ser admin vê a 404
 * (não revela que a área existe).
 */
export async function requireAdminPage(voltar: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?voltar=${encodeURIComponent(voltar)}`);
  if (user.papel !== "admin") notFound();
  return user;
}

export class AccessDeniedError extends Error {
  constructor() {
    super("Acesso negado.");
  }
}

/** Para Server Actions e rotas que gravam: toda escrita do admin passa por aqui. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user || user.papel !== "admin") throw new AccessDeniedError();
  return user;
}
