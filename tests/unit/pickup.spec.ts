import { expect, test } from "@playwright/test";
import { pickupAvailable, pickupPrefixes, pickupQuote } from "../../src/server/pickup";

test("retirada só para Mococa e região, sem custo", () => {
  const regiao = pickupPrefixes("");
  expect(regiao).toEqual(["137"]);
  expect(pickupAvailable("13732-000", regiao)).toBe(true);
  expect(pickupAvailable("13720000", regiao)).toBe(true);
  expect(pickupAvailable("37200-000", regiao)).toBe(false);
  expect(pickupAvailable("1373", regiao)).toBe(false);
  expect(pickupQuote().valorCentavos).toBe(0);
});

test("prefixos configuráveis e retirada desligada", () => {
  expect(pickupPrefixes("137, 378")).toEqual(["137", "378"]);
  expect(pickupAvailable("37800000", pickupPrefixes("137,378"))).toBe(true);
  expect(pickupPrefixes("-")).toEqual([]);
  expect(pickupAvailable("13732000", pickupPrefixes("-"))).toBe(false);
});
