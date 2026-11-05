import "server-only";
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { REFERENCE_PATTERN } from "@/lib/uploads";

/*
 * Armazenamento das fotos. Com S3_BUCKET definido usa o S3 (upload direto do
 * navegador por URL pré-assinada); sem ele, usa uma pasta local (dev e testes).
 * No EC2, as credenciais vêm do papel IAM da instância: nada de chave no código.
 */

export const IMAGE_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
export type ImageType = keyof typeof IMAGE_TYPES;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** Chaves válidas: "produtos/<uuid>.jpg" (ou categorias/, loja/). Bloqueia "../" e afins. */
export const KEY_PATTERN = /^(produtos|categorias|loja)\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

export const UPLOAD_FOLDERS = ["produtos", "categorias", "loja"] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

export interface UploadTicket {
  chave: string;
  url: string;
  headers: Record<string, string>;
  publicUrl: string;
}

const bucket = process.env.S3_BUCKET;
const region = process.env.S3_REGION ?? "us-east-1";
const s3 = bucket ? new S3Client({ region }) : null;
export const storageDriver: "s3" | "local" = s3 ? "s3" : "local";
export const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR ?? "./data/uploads");
const CACHE_CONTROL = "public, max-age=31536000, immutable";

/** URL pública da foto (S3_PUBLIC_URL: endereço do bucket ou do CloudFront). */
export function publicUrl(chave: string): string {
  if (s3) {
    const base = process.env.S3_PUBLIC_URL ?? `https://${bucket}.s3.${region}.amazonaws.com`;
    return `${base.replace(/\/$/, "")}/${chave}`;
  }
  return `/arquivos/${chave}`;
}

/** Gera a chave e o destino do upload. O chamador já verificou que o usuário é admin. */
export async function createUpload(input: {
  pasta: UploadFolder;
  contentType: string;
  tamanho: number;
}): Promise<UploadTicket> {
  const ext = IMAGE_TYPES[input.contentType as ImageType];
  if (!ext) throw new Error("Envie uma imagem JPG, PNG ou WebP.");
  if (input.tamanho > MAX_IMAGE_BYTES) throw new Error("A imagem passa de 8 MB.");

  const chave = `${input.pasta}/${randomUUID()}.${ext}`;
  if (s3) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: chave,
      ContentType: input.contentType,
      ContentLength: input.tamanho,
      CacheControl: CACHE_CONTROL,
    });
    let url: string;
    try {
      url = await getSignedUrl(s3, command, { expiresIn: 300 });
    } catch (error) {
      console.error("S3: não foi possível assinar o upload", error);
      if (error instanceof Error && error.name === "CredentialsProviderError") {
        throw new Error(
          "O servidor não tem credenciais da AWS para enviar ao S3. Rode “npm run s3:testar” no servidor para ver o que falta.",
        );
      }
      throw new Error("Não foi possível preparar o envio da foto. Tente de novo.");
    }
    return {
      chave,
      url,
      headers: { "Content-Type": input.contentType, "Cache-Control": CACHE_CONTROL },
      publicUrl: publicUrl(chave),
    };
  }
  // Local: o próprio site recebe o PUT em /arquivos/<chave> (rota protegida por sessão de admin)
  return { chave, url: `/arquivos/${chave}`, headers: { "Content-Type": input.contentType }, publicUrl: publicUrl(chave) };
}

/* ---------- Referências das clientes (privadas) ---------- */

// Assina os links do driver local; sem ARQUIVOS_SEGREDO, um segredo por processo (os links duram minutos).
// Fica no globalThis: o Next empacota rotas e ações separadamente, e todas precisam do mesmo segredo.
const globalForFiles = globalThis as unknown as { arquivosSegredo?: string };
const SIGNING_SECRET = process.env.ARQUIVOS_SEGREDO || (globalForFiles.arquivosSegredo ??= randomBytes(32).toString("hex"));

function sign(method: "GET" | "PUT", chave: string, exp: number) {
  return createHmac("sha256", SIGNING_SECRET).update(`${method}:${chave}:${exp}`).digest("base64url");
}

function signedLocalUrl(method: "GET" | "PUT", chave: string, ttlSeconds: number) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  return `/arquivos/${chave}?exp=${exp}&sig=${sign(method, chave, exp)}`;
}

/** Confere o link assinado do driver local (método, chave e validade). */
export function verifySignedUrl(method: "GET" | "PUT", chave: string, exp: string | null, sig: string | null): boolean {
  const expires = Number(exp);
  if (!sig || !Number.isInteger(expires) || expires < Date.now() / 1000) return false;
  const expected = Buffer.from(sign(method, chave, expires));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export interface ReferenceTicket {
  chave: string;
  url: string;
  headers: Record<string, string>;
}

/** Destino do upload da referência da cliente (sem login): só a pasta referencias/, privada. */
export async function createReferenceUpload(input: { contentType: string; tamanho: number }): Promise<ReferenceTicket> {
  const ext = IMAGE_TYPES[input.contentType as ImageType];
  if (!ext) throw new Error("Envie uma imagem JPG, PNG ou WebP.");
  if (!(input.tamanho > 0) || input.tamanho > MAX_IMAGE_BYTES) throw new Error("A imagem passa de 8 MB.");

  const chave = `referencias/${randomUUID()}.${ext}`;
  if (s3) {
    const command = new PutObjectCommand({ Bucket: bucket, Key: chave, ContentType: input.contentType, ContentLength: input.tamanho });
    return { chave, url: await getSignedUrl(s3, command, { expiresIn: 300 }), headers: { "Content-Type": input.contentType } };
  }
  return { chave, url: signedLocalUrl("PUT", chave, 300), headers: { "Content-Type": input.contentType } };
}

/** Link temporário (1 h) para ver uma referência; só para quem já provou acesso ao pedido. */
export async function privateFileUrl(chave: string | null | undefined, ttlSeconds = 3600): Promise<string | null> {
  if (!chave || !REFERENCE_PATTERN.test(chave)) return null;
  if (s3) return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: chave }), { expiresIn: ttlSeconds });
  return signedLocalUrl("GET", chave, ttlSeconds);
}

export async function removeFile(chave: string): Promise<void> {
  if (!KEY_PATTERN.test(chave) && !REFERENCE_PATTERN.test(chave)) return;
  if (s3) {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: chave }));
    return;
  }
  await fs.rm(path.join(UPLOADS_DIR, chave), { force: true });
}

/** Caminho local de uma chave válida (só para o driver local). */
export function localPath(chave: string): string | null {
  return KEY_PATTERN.test(chave) || REFERENCE_PATTERN.test(chave) ? path.join(UPLOADS_DIR, chave) : null;
}
