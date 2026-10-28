"use server";

import { AccessDeniedError, requireAdmin } from "@/server/auth";
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

async function guarded<T>(fn: () => Promise<T>): Promise<T | ActionError> {
  try {
    await requireAdmin();
    return await fn();
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
