/*
 * Datas digitadas no painel ("AAAA-MM-DD") valem o dia inteiro no horário de
 * Brasília, onde a loja está (o servidor roda em UTC).
 */

export const startOfDayBR = (ymd: string) => new Date(`${ymd}T00:00:00.000-03:00`);
export const endOfDayBR = (ymd: string) => new Date(`${ymd}T23:59:59.999-03:00`);

const ymdFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" });

/** Date → "AAAA-MM-DD" no horário de Brasília (para preencher o campo de data). */
export const toYmdBR = (date: Date | null | undefined) => (date ? ymdFormat.format(date) : "");
