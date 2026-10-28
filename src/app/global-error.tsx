"use client";

/**
 * Erro no próprio layout raiz: não há CSS nem fontes da loja aqui,
 * por isso os estilos são inline.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
          textAlign: "center",
          background: "#fdf5f7",
          color: "#4a2734",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28 }}>Algo deu errado por aqui</h1>
        <p style={{ margin: 0, color: "#7d5a67" }}>Tente carregar a página de novo.</p>
        <button
          type="button"
          onClick={reset}
          style={{
            height: 50,
            padding: "0 26px",
            border: 0,
            borderRadius: 999,
            background: "#ad3560",
            color: "#fff",
            fontWeight: 800,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Tentar de novo
        </button>
      </body>
    </html>
  );
}
