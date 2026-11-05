/** Imagem de referência que a cliente envia na página do produto (convite, decoração). Privada: só o pedido e o painel veem. */
export const REFERENCE_PATTERN = /^referencias\/[0-9a-f-]{36}\.(jpg|png|webp)$/;
export const REFERENCE_ACCEPT = "image/jpeg,image/png,image/webp";
export const REFERENCE_MAX_MB = 8;
