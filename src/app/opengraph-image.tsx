import { ImageResponse } from "next/og";
import { store } from "@/data/mock";

export const alt = `${store.nome} · ${store.descricao}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagem padrão de compartilhamento. Troque por uma foto da loja quando houver. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: "#fdf5f7",
          color: "#4a2734",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="32" fill="#fae6ec" />
          <path d="M32 47s-15-9.4-15-21a8.5 8.5 0 0 1 15-5.6A8.5 8.5 0 0 1 47 26c0 11.6-15 21-15 21z" fill="#ad3560" />
        </svg>
        <div style={{ fontSize: 84, fontWeight: 700, color: "#ad3560" }}>{store.nome}</div>
        <div style={{ fontSize: 36, color: "#7d5a67" }}>{store.descricao}</div>
      </div>
    ),
    size,
  );
}
