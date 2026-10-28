import "server-only";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/*
 * Armazenamento das fotos. Com S3_BUCKET definido usa o S3 (upload direto do
 * navegador por URL pré-assinada); sem ele, usa uma pasta local (dev e testes).
 * No EC2, as credenciais vêm do papel IAM da instância: nada de chave no código.
 */

export const IMAGE_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
export type ImageType = keyof typeof IMAGE_TYPES;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** Chaves válidas: "produtos/<uuid>.jpg". Bloqueia "../" e afins. */
export const KEY_PATTERN = /^(produtos|categorias)\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

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
  pasta: "produtos" | "categorias";
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
    const url = await getSignedUrl(s3, command, { expiresIn: 300 });
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

export async function removeFile(chave: string): Promise<void> {
  if (!KEY_PATTERN.test(chave)) return;
  if (s3) {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: chave }));
    return;
  }
  await fs.rm(path.join(UPLOADS_DIR, chave), { force: true });
}

/** Caminho local de uma chave válida (só para o driver local). */
export function localPath(chave: string): string | null {
  return KEY_PATTERN.test(chave) ? path.join(UPLOADS_DIR, chave) : null;
}
