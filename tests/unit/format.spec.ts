import { expect, test } from "@playwright/test";
import { centsToInput, formatPrice, isValidCpf, maskCep, maskCpf, maskPhone, parseBRLToCents, pluralItens, slugify } from "../../src/lib/format";

test("formata preço em reais ou mostra o placeholder", () => {
  expect(formatPrice(1234.5).replace(/\s/g, " ")).toBe("R$ 1.234,50");
  expect(formatPrice(null)).toBe("R$ [preço]");
  expect(formatPrice(undefined, "R$ [frete]")).toBe("R$ [frete]");
});

test("máscaras de CEP, CPF e celular", () => {
  expect(maskCep("37200000")).toBe("37200-000");
  expect(maskCep("37200-0001234")).toBe("37200-000");
  expect(maskCpf("52998224725")).toBe("529.982.247-25");
  expect(maskCpf("5299822")).toBe("529.982.2");
  expect(maskPhone("35999998888")).toBe("(35) 99999-8888");
  expect(maskPhone("3599")).toBe("(35) 99");
});

test("valida os dígitos verificadores do CPF", () => {
  expect(isValidCpf("529.982.247-25")).toBe(true);
  expect(isValidCpf("529.982.247-24")).toBe(false);
  expect(isValidCpf("111.111.111-11")).toBe(false);
  expect(isValidCpf("123")).toBe(false);
});

test("pluraliza itens", () => {
  expect(pluralItens(1)).toBe("1 item");
  expect(pluralItens(2)).toBe("2 itens");
});

test("lê o preço digitado em centavos", () => {
  expect(parseBRLToCents("12")).toBe(1200);
  expect(parseBRLToCents("12,5")).toBe(1250);
  expect(parseBRLToCents("R$ 1.234,56")).toBe(123456);
  expect(parseBRLToCents("")).toBeNull();
  expect(parseBRLToCents("12.5")).toBeNaN();
  expect(parseBRLToCents("abc")).toBeNaN();
  expect(centsToInput(123456)).toBe("1.234,56");
  expect(centsToInput(null)).toBe("");
});

test("gera o endereço (slug) sem acentos", () => {
  expect(slugify("Caixa Milk Café!")).toBe("caixa-milk-cafe");
  expect(slugify("  Festa  Junina  ")).toBe("festa-junina");
});
