/** Barra de aviso no topo; o texto vem da configuração da loja. */
export function AnnouncementBar({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="bg-rose-100 px-4 py-2.5 text-center text-sm font-semibold text-ink">
      {message}
    </div>
  );
}
