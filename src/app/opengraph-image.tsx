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
          background: "linear-gradient(135deg, #fdf2f6 0%, #fffbf6 50%, #f8f3fc 100%)",
          color: "#4e3443",
          border: "12px solid #cfa765",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="30" fill="#fbe3ec" stroke="#cfa765" strokeWidth="3" />
          <path d="M32 47s-15-9.4-15-21a8.5 8.5 0 0 1 15-5.6A8.5 8.5 0 0 1 47 26c0 11.6-15 21-15 21z" fill="#e0679a" />
        </svg>
        <div style={{ fontSize: 84, fontWeight: 700, color: "#b23a6e" }}>{store.nome}</div>
        <div style={{ fontSize: 36, color: "#765966" }}>{store.descricao}</div>
        <div style={{ fontSize: 30, color: "#76539f" }}>Papelaria personalizada · Mococa</div>
      </div>
    ),
    size,
  );
}
