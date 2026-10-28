import { expect, test } from "@playwright/test";
import { formatPrice, isValidCpf, maskCep, maskCpf, maskPhone, pluralItens } from "../../src/lib/format";

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
