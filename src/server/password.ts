import { hash, verify } from "@node-rs/argon2";

export const MIN_PASSWORD_LENGTH = 10;

/** argon2id com os parâmetros padrão da biblioteca (recomendados pela OWASP). */
export function hashPassword(senha: string): Promise<string> {
  return hash(senha);
}

export async function verifyPassword(senhaHash: string, senha: string): Promise<boolean> {
  try {
    return await verify(senhaHash, senha);
  } catch {
    return false;
  }
}
