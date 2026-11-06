import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { activeCartTiers } from "@/server/promotions";

/** Faixas do desconto progressivo para a sacola (o pedido aplica as mesmas no servidor). */
export function GET() {
  return NextResponse.json({ faixas: activeCartTiers(db) }, { headers: { "Cache-Control": "no-store" } });
}

export const dynamic = "force-dynamic";
