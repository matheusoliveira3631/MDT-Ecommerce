/**
 * Confere a configuração do S3 passo a passo, com as mesmas variáveis da loja:
 *   npm run s3:testar
 * Rode no mesmo lugar onde a loja roda (no EC2: dentro de /srv/mimos).
 * Envia uma imagem de 1 pixel para produtos/, lê pela URL pública e apaga.
 */
import "./env";
import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucket = process.env.S3_BUCKET;
const region = process.env.S3_REGION ?? "us-east-1";
const site = process.env.NEXT_PUBLIC_SITE_URL;

// PNG 1×1 transparente
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

const ok = (msg: string) => console.log(`  ✓ ${msg}`);
function fail(msg: string, ...dicas: string[]): never {
  console.log(`  ✗ ${msg}`);
  for (const d of dicas) console.log(`    → ${d}`);
  process.exit(1);
}

async function main() {
  console.log("S3 da loja\n");
  if (!bucket) {
    fail(
      "S3_BUCKET está vazio: a loja usa a pasta local (UPLOADS_DIR), sem S3.",
      "No servidor, preencha S3_BUCKET e S3_REGION no .env.production, rode npm run build e reinicie (sudo systemctl restart mimos).",
    );
  }
  ok(`bucket ${bucket}, região ${region}`);

  // 1. Credenciais
  const s3 = new S3Client({ region });
  let creds;
  try {
    creds = await s3.config.credentials();
  } catch {
    fail(
      "Nenhuma credencial da AWS encontrada.",
      "No EC2: crie um papel IAM do tipo “EC2” com deploy/iam-policy.json e ANEXE à instância",
      "  (console do EC2 → instância → Ações → Segurança → Modificar função do IAM). Depois: sudo systemctl restart mimos.",
      "No seu computador não existe papel de instância: deixe S3_BUCKET vazio no .env.local (fotos na pasta local)",
      "  ou configure uma chave de um usuário IAM com `aws configure` (nunca no repositório).",
    );
  }
  const origem = creds.sessionToken ? "temporária (papel IAM da instância ou SSO)" : "chave fixa (usuário IAM)";
  ok(`credencial encontrada: ${creds.accessKeyId.slice(0, 4)}… ${origem}`);

  // 2. Upload igual ao do painel (URL pré-assinada)
  const chave = `produtos/${randomUUID()}.png`;
  const cacheControl = "public, max-age=31536000, immutable";
  const url = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: bucket, Key: chave, ContentType: "image/png", ContentLength: PIXEL.length, CacheControl: cacheControl }),
    { expiresIn: 300 },
  );
  const put = await fetch(url, { method: "PUT", headers: { "Content-Type": "image/png", "Cache-Control": cacheControl }, body: PIXEL });
  if (!put.ok) {
    const body = await put.text();
    const code = body.match(/<Code>(.*?)<\/Code>/)?.[1] ?? put.status;
    const dicas: Record<string, string[]> = {
      AccessDenied: [
        "O papel/usuário não pode gravar em produtos/. Confira a política (deploy/iam-policy.json) com o nome certo do bucket no lugar de SEU-BUCKET.",
      ],
      NoSuchBucket: ["O bucket não existe com esse nome. Confira S3_BUCKET."],
      PermanentRedirect: [`O bucket está em outra região. Confira S3_REGION (hoje: ${region}).`],
      AuthorizationHeaderMalformed: [`O bucket está em outra região. Confira S3_REGION (hoje: ${region}).`],
      InvalidAccessKeyId: ["A chave de acesso não existe (apagada ou digitada errado)."],
      SignatureDoesNotMatch: ["A chave secreta não confere com a chave de acesso."],
    };
    fail(`envio recusado pelo S3: ${code}`, ...(dicas[String(code)] ?? [body.slice(0, 300)]));
  }
  ok(`envio de teste gravado em ${chave}`);

  try {
    // 3. Leitura pública (é o endereço que a loja usa nas fotos)
    const base = (process.env.S3_PUBLIC_URL || `https://${bucket}.s3.${region}.amazonaws.com`).replace(/\/$/, "");
    const get = await fetch(`${base}/${chave}`);
    if (get.ok) ok(`foto pública abre em ${base}`);
    else {
      console.log(`  ✗ a foto não abre publicamente (${get.status}) em ${base}`);
      console.log("    → Aplique deploy/s3-bucket-policy.json no bucket e, em “Bloquear acesso público”, desmarque as opções de políticas de bucket.");
      process.exitCode = 1;
    }

    // 4. CORS: o navegador do painel envia direto para o S3
    if (!site) {
      console.log("  ! NEXT_PUBLIC_SITE_URL vazio: CORS não testado.");
    } else {
      const preflight = await fetch(url, {
        method: "OPTIONS",
        headers: { Origin: site, "Access-Control-Request-Method": "PUT", "Access-Control-Request-Headers": "content-type,cache-control" },
      });
      const allowed = preflight.headers.get("access-control-allow-origin");
      if (preflight.ok && (allowed === site || allowed === "*")) ok(`CORS libera envios de ${site}`);
      else {
        console.log(`  ✗ CORS não libera envios de ${site} (${preflight.status})`);
        console.log("    → Aplique deploy/s3-cors.json no bucket (Permissões → CORS) com o domínio exato da loja, com https e sem barra no fim.");
        process.exitCode = 1;
      }
    }
  } finally {
    // 5. Limpeza
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: chave }));
      ok("arquivo de teste apagado");
    } catch {
      console.log(`  ! não consegui apagar ${chave} (falta s3:DeleteObject na política?)`);
    }
  }

  console.log(process.exitCode ? "\nAinda falta ajustar o que está com ✗." : "\nTudo certo: o painel já consegue enviar fotos.");
}

main();
