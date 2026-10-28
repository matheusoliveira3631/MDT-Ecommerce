import type { NextConfig } from "next";

/** Endereço público das fotos no S3/CloudFront (lido no build para liberar o next/image). */
const s3Public = process.env.S3_PUBLIC_URL
  ? new URL(process.env.S3_PUBLIC_URL)
  : process.env.S3_BUCKET
    ? new URL(`https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION ?? "us-east-1"}.amazonaws.com`)
    : null;

const nextConfig: NextConfig = {
  // Módulos nativos: rodam só no servidor, fora do bundle
  serverExternalPackages: ["better-sqlite3", "@node-rs/argon2"],
  images: {
    remotePatterns: s3Public
      ? [{ protocol: s3Public.protocol.replace(":", "") as "https", hostname: s3Public.hostname, pathname: `${s3Public.pathname.replace(/\/$/, "")}/**` }]
      : [],
  },
};

export default nextConfig;
