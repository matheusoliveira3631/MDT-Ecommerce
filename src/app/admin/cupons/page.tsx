import type { Metadata } from "next";
import { CouponsManager } from "@/components/admin/CouponsManager";
import { adminListCoupons } from "@/server/admin-coupons";
import { requireAdminPage } from "@/server/auth";

export const metadata: Metadata = { title: "Cupons" };

export default async function AdminCouponsPage() {
  await requireAdminPage("/admin/cupons");
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="m-0 text-h2-sm">Cupons</h1>
        <p className="mt-1 mb-0 text-body text-ink-muted">
          A cliente digita o código na sacola. O uso conta pelos pedidos não cancelados.
        </p>
      </div>
      <CouponsManager cupons={adminListCoupons()} />
    </div>
  );
}
