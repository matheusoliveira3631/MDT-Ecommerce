/** Barra de aviso no topo; o texto vem da configuração da loja. */
export function AnnouncementBar({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="bg-linear-to-r from-rose-100 via-lilac-100 to-mint-100 px-4 py-2.5 text-center text-sm font-semibold text-ink">
      {message}
    </div>
  );
}
