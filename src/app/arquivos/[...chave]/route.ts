import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { REFERENCE_PATTERN } from "@/lib/uploads";
import { IMAGE_TYPES, localPath, MAX_IMAGE_BYTES, storageDriver, verifySignedUrl, type ImageType } from "@/server/storage";

/*
 * Fotos no driver local (sem S3): GET serve o arquivo, PUT recebe o upload do
 * admin. Com S3 configurado, as fotos nem passam por aqui.
 * As referências das clientes (referencias/) são privadas: GET e PUT só com
 * link assinado e dentro da validade.
 */

interface Params {
  params: Promise<{ chave: string[] }>;
}

const CONTENT_TYPES: Record<string, ImageType> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

async function resolve(params: Params["params"]) {
  const chave = (await params).chave.join("/");
  return { chave, file: localPath(chave) };
}

const signed = (request: NextRequest, method: "GET" | "PUT", chave: string) =>
  verifySignedUrl(method, chave, request.nextUrl.searchParams.get("exp"), request.nextUrl.searchParams.get("sig"));

export async function GET(request: NextRequest, { params }: Params) {
  const { chave, file } = await resolve(params);
  if (storageDriver !== "local" || !file) return new NextResponse(null, { status: 404 });
  const privado = REFERENCE_PATTERN.test(chave);
  if (privado && !signed(request, "GET", chave)) return new NextResponse(null, { status: 404 });
  try {
    const data = await fs.readFile(file);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": CONTENT_TYPES[chave.split(".").pop()!],
        // A chave é única por arquivo: a foto pública pode ficar em cache para sempre; a referência, não
        "Cache-Control": privado ? "private, no-store" : "public, max-age=31536000, immutable",
        ...(privado && { "X-Robots-Tag": "noindex" }),
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { chave, file } = await resolve(params);
  if (REFERENCE_PATTERN.test(chave)) {
    // Referência da cliente: vale o link assinado que a loja entregou
    if (!signed(request, "PUT", chave)) return NextResponse.json({ erro: "Link de envio inválido ou vencido." }, { status: 403 });
  } else {
    const user = await getCurrentUser();
    if (!user || user.papel !== "admin") return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
  }

  if (storageDriver !== "local" || !file) return NextResponse.json({ erro: "Chave inválida." }, { status: 400 });

  const contentType = request.headers.get("content-type") ?? "";
  if (CONTENT_TYPES[chave.split(".").pop()!] !== contentType || !(contentType in IMAGE_TYPES)) {
    return NextResponse.json({ erro: "Tipo de arquivo não confere." }, { status: 415 });
  }
  const body = new Uint8Array(await request.arrayBuffer());
  if (body.byteLength === 0 || body.byteLength > MAX_IMAGE_BYTES) {
    return NextResponse.json({ erro: "A imagem passa de 8 MB." }, { status: 413 });
  }

  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, body);
  return new NextResponse(null, { status: 201 });
}
