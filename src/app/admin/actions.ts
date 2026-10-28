"use server";

import { revalidatePath } from "next/cache";
import { cancelOrderAdmin, updateOrderStatus, type OrderActionResult } from "@/server/admin-orders";
import { AccessDeniedError, requireAdmin, type SessionUser } from "@/server/auth";
import { db } from "@/server/db";
import {
  deleteCategory,
  deleteProduct,
  saveCategory,
  saveProduct,
  type SaveResult,
} from "@/server/admin-catalog";
import { createUpload, type UploadTicket } from "@/server/storage";

/*
 * Toda ação aqui confere de novo se quem chama é admin: esconder a página não
 * basta, porque uma Server Action pode ser chamada direto.
 */

type ActionError = { ok: false; errors: Record<string, string> };

async function guarded<T>(fn: (user: SessionUser) => Promise<T>): Promise<T | ActionError> {
  try {
    const user = await requireAdmin();
    return await fn(user);
  } catch (error) {
    if (error instanceof AccessDeniedError) return { ok: false, errors: { form: "Sua sessão expirou. Entre de novo." } };
    console.error(error);
    return { ok: false, errors: { form: error instanceof Error ? error.message : "Não foi possível salvar." } };
  }
}

export async function saveProductAction(input: unknown): Promise<SaveResult | ActionError> {
  return guarded(() => saveProduct(input));
}

export async function deleteProductAction(id: number): Promise<{ ok: true } | ActionError> {
  return guarded(async () => {
    await deleteProduct(id);
    return { ok: true as const };
  });
}

export async function saveCategoryAction(input: unknown): Promise<SaveResult | ActionError> {
  return guarded(() => saveCategory(input));
}

export async function deleteCategoryAction(id: number): Promise<{ ok: true } | ActionError> {
  return guarded(async () => {
    const result = await deleteCategory(id);
    return result.ok ? result : { ok: false as const, errors: { form: result.error } };
  });
}

/** Pede o destino de upload de uma foto (URL pré-assinada do S3 ou a rota local). */
export async function requestUploadAction(input: {
  pasta: "produtos" | "categorias";
  contentType: string;
  tamanho: number;
}): Promise<{ ok: true; ticket: UploadTicket } | ActionError> {
  return guarded(async () => {
    if (input.pasta !== "produtos" && input.pasta !== "categorias") throw new Error("Pasta inválida.");
    return { ok: true as const, ticket: await createUpload(input) };
  });
}

/** Avança (ou corrige) o status de um pedido pago; o histórico guarda quem mudou. */
export async function updateOrderStatusAction(input: unknown): Promise<OrderActionResult> {
  const result = await guarded(async (user) => updateOrderStatus(db, input, user.nome));
  return orderResult(result);
}

/** Cancela o pedido e devolve o estoque (o reembolso, se houver, é feito no gateway). */
export async function cancelOrderAction(input: unknown): Promise<OrderActionResult> {
  const result = await guarded(async (user) => cancelOrderAdmin(db, input, user.nome));
  return orderResult(result);
}

function orderResult(result: OrderActionResult | ActionError): OrderActionResult {
  if ("errors" in result) return { ok: false, error: result.errors.form ?? "Não foi possível salvar." };
  if (result.ok) revalidatePath("/admin", "layout");
  return result;
}
