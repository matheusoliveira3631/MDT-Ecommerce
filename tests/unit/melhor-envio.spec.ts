import { expect, test } from "@playwright/test";
import { quoteMelhorEnvio, ShippingUnavailableError, type ShippingPackage } from "../../src/server/melhor-envio";

const pacote: ShippingPackage = { id: "caixa-milk", largura: 11, altura: 2, comprimento: 16, pesoGramas: 200, valorCentavos: 550, quantidade: 20 };

function fakeFetch(status: number, body: unknown) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fn = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
  return { fn, calls };
}

test("cota a partir do CEP da loja e devolve os serviços do mais barato ao mais caro", async () => {
  const { fn, calls } = fakeFetch(200, [
    { id: 2, name: "SEDEX", price: "45.90", delivery_time: 3, company: { name: "Correios" } },
    { id: 1, name: "PAC", price: "25.90", custom_price: "24.10", delivery_time: 8, custom_delivery_time: 9, company: { name: "Correios" } },
    { id: 3, name: ".Package", error: "Serviço indisponível para o trecho.", company: { name: "Jadlog" } },
  ]);
  const quotes = await quoteMelhorEnvio({ token: "tk", contato: "loja@x.com", fetch: fn }, "13732000", "37200000", [pacote]);

  expect(quotes).toEqual([
    { servico: "Correios PAC", prazoDias: 9, valorCentavos: 2410 },
    { servico: "Correios SEDEX", prazoDias: 3, valorCentavos: 4590 },
  ]);
  expect(calls[0].url).toBe("https://www.melhorenvio.com.br/api/v2/me/shipment/calculate");
  const headers = calls[0].init.headers as Record<string, string>;
  expect(headers.Authorization).toBe("Bearer tk");
  expect(headers["User-Agent"]).toContain("loja@x.com");
  const body = JSON.parse(String(calls[0].init.body));
  expect(body.from.postal_code).toBe("13732000");
  expect(body.to.postal_code).toBe("37200000");
  expect(body.products[0]).toEqual({ id: "caixa-milk", width: 11, height: 2, length: 16, weight: 0.2, insurance_value: 5.5, quantity: 20 });
  expect(body.services).toBeUndefined();
});

test("sandbox e filtro de serviços", async () => {
  const { fn, calls } = fakeFetch(200, []);
  await quoteMelhorEnvio({ token: "tk", contato: "c", ambiente: "sandbox", servicos: "1,2", fetch: fn }, "13732000", "01001000", [pacote]);
  expect(calls[0].url).toBe("https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate");
  expect(JSON.parse(String(calls[0].init.body)).services).toBe("1,2");
});

test("CEP inválido vira lista vazia; falha da API vira erro de indisponibilidade", async () => {
  expect(await quoteMelhorEnvio({ token: "tk", contato: "c", fetch: fakeFetch(422, { message: "CEP inválido" }).fn }, "13732000", "99999999", [pacote])).toEqual([]);
  await expect(quoteMelhorEnvio({ token: "tk", contato: "c", fetch: fakeFetch(401, "Unauthenticated").fn }, "13732000", "37200000", [pacote])).rejects.toBeInstanceOf(
    ShippingUnavailableError,
  );
  const offline = (async () => {
    throw new TypeError("fetch failed");
  }) as unknown as typeof fetch;
  await expect(quoteMelhorEnvio({ token: "tk", contato: "c", fetch: offline }, "13732000", "37200000", [pacote])).rejects.toBeInstanceOf(
    ShippingUnavailableError,
  );
});
