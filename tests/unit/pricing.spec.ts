import { expect, test } from "@playwright/test";
import { computeTotals, couponDiscount } from "../../src/lib/pricing";

const caixa = { quantidade: 20, unitCents: 550, unitPixCents: 500 };
const topo = { quantidade: 1, unitCents: 4590, unitPixCents: null };

test("soma em centavos inteiros, com Pix caindo no preço normal quando falta", () => {
  const t = computeTotals([caixa, topo], 2590, null);
  expect(t.subtotal).toBe(20 * 550 + 4590);
  expect(t.subtotalPix).toBe(20 * 500 + 4590);
  expect(t.total).toBe(20 * 550 + 4590 + 2590);
  expect(t.discount).toBeUndefined();
});

test("sem frete escolhido, o frete fica de fora; com frete indefinido, o total fica indefinido", () => {
  expect(computeTotals([caixa], undefined, null).total).toBe(11000);
  expect(computeTotals([caixa], null, null).total).toBeNull();
});

test("cupom percentual arredonda e aplica em cada base; fixo nunca passa do subtotal", () => {
  const t = computeTotals([{ quantidade: 3, unitCents: 333, unitPixCents: 300 }], 0, { codigo: "A", tipo: "percentual", valor: 10 });
  expect(t.discount).toBe(100); // 10% de 999 = 99,9 → 100
  expect(t.discountPix).toBe(90);
  expect(t.total).toBe(899);
  expect(couponDiscount({ codigo: "B", tipo: "fixo", valor: 5000 }, 1200)).toBe(1200);
});

test("preço sem cadastro deixa subtotal e total indefinidos", () => {
  const t = computeTotals([caixa, { quantidade: 1, unitCents: null, unitPixCents: null }], 0, null);
  expect(t.subtotal).toBeNull();
  expect(t.total).toBeNull();
});
