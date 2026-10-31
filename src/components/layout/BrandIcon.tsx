/** Potinho com lápis e coração, o ícone da cartilha da marca. Decorativo: o nome ao lado já identifica a loja. */
export function BrandIcon({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false" className={className}>
      {/* lápis */}
      <g strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" stroke="#b08a4e">
        <path d="M14 22 L11.5 9.5 L14.2 6 L16 10.5 L17.6 22 Z" fill="#f6cada" />
        <path d="M19.5 22 L19.5 7 L22 3 L24.5 7 L24.5 22 Z" fill="#decdf1" />
        <path d="M27.5 22 L29.6 8.4 L32.6 5.6 L33.4 10 L31.5 22 Z" fill="#c5e6d2" />
        <path d="M33 22 L36.5 11.5 L39.6 10 L39.4 14 L36.6 22 Z" fill="#f7e3a1" />
      </g>
      {/* potinho */}
      <path
        d="M10 21h28l-2.6 20.2A3 3 0 0 1 32.4 44H15.6a3 3 0 0 1-3-2.8Z"
        fill="#fbe3ec"
        stroke="#cfa765"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M10 21h28" stroke="#cfa765" strokeWidth="1.5" strokeLinecap="round" />
      {/* coração */}
      <path
        d="M24 37.5s-5.2-3.2-5.2-7a2.9 2.9 0 0 1 5.2-1.8 2.9 2.9 0 0 1 5.2 1.8c0 3.8-5.2 7-5.2 7z"
        fill="#eda3be"
        stroke="#b23a6e"
        strokeWidth="0.8"
      />
    </svg>
  );
}
