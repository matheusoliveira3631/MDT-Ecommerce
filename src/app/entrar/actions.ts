"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkCredentials, endSession, startSession } from "@/server/auth";
import { rateLimit, resetRateLimit } from "@/server/rate-limit";

export interface LoginState {
  error?: string;
  email?: string;
}

/** Só caminhos internos: evita redirecionar para outro site depois do login. */
function safeRedirect(target: FormDataEntryValue | null): string {
  const value = typeof target === "string" ? target : "";
  return value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : "/conta";
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  if (!email || !senha) return { error: "Informe e-mail e senha.", email };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `login:${ip}:${email}`;
  // 5 tentativas a cada 15 minutos por IP + e-mail
  const limit = rateLimit(key, 5, 15 * 60 * 1000);
  if (!limit.ok) {
    const minutes = Math.ceil(limit.retryAfterMs / 60000);
    return { error: `Muitas tentativas. Tente de novo em ${minutes} min.`, email };
  }

  const user = await checkCredentials(email, senha);
  if (!user) return { error: "E-mail ou senha incorretos.", email };

  resetRateLimit(key);
  await startSession(user.id);
  redirect(safeRedirect(formData.get("voltar")));
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/");
}
