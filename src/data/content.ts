import type { StoreConfig } from "@/lib/types";

/*
 * Conteúdo das páginas de ajuda e legais (no lugar de um CMS).
 * Só está escrito o que o fluxo da loja já define; regras que a loja ainda
 * precisa decidir ficam entre colchetes. As páginas legais precisam de revisão jurídica.
 */

export interface ContentSection {
  titulo: string;
  paragrafos: string[];
}

export interface ContentPage {
  slug: string;
  titulo: string;
  resumo: string;
  secoes?: ContentSection[];
  /** Perguntas frequentes: viram um acordeão. */
  perguntas?: Array<{ pergunta: string; resposta: string }>;
  atualizadoEm?: string;
}

export function helpPages(store: StoreConfig): ContentPage[] {
  return [
    {
      slug: "prazos",
      titulo: "Prazos de produção",
      resumo: "Cada peça é feita à mão depois que você aprova a arte. Veja como o prazo é contado.",
      secoes: [
        {
          titulo: "Quando o prazo começa",
          paragrafos: [
            "Depois do pagamento, enviamos a arte pelo WhatsApp para você aprovar. O prazo de produção começa a contar a partir da aprovação, não da data da compra.",
            `O prazo de cada produto aparece na página dele. Em geral, a produção leva ${store.prazoProducaoPadrao} dias úteis.`,
          ],
        },
        {
          titulo: "Ajustes na arte",
          paragrafos: [
            "Ajustes de texto e cor estão incluídos. [Quantidade de rodadas de ajuste incluídas e o que acontece depois disso.]",
          ],
        },
        {
          titulo: "Datas comemorativas",
          paragrafos: [
            "Em datas como Natal, Páscoa e Dia das Mães a procura aumenta. Quando houver data limite para encomendas, ela aparece no banner da loja e no selo do produto.",
          ],
        },
      ],
    },
    {
      slug: "frete",
      titulo: "Frete e entrega",
      resumo: "Enviamos para todo o Brasil, com embalagem protegida.",
      secoes: [
        {
          titulo: "Como calcular",
          paragrafos: [
            "Informe o CEP na página do produto ou na sacola para ver as opções, prazos e valores. O prazo de entrega começa a contar depois da produção.",
          ],
        },
        {
          titulo: "Opções de envio",
          paragrafos: ["[Transportadoras e serviços disponíveis, retirada no local (se houver) e endereço de retirada.]"],
        },
        {
          titulo: "Rastreamento",
          paragrafos: ["Quando o pedido sair para entrega, enviamos o código de rastreamento por e-mail e WhatsApp."],
        },
      ],
    },
    {
      slug: "trocas",
      titulo: "Trocas e cancelamentos",
      resumo: "Como funcionam trocas, cancelamentos e devoluções de produtos personalizados.",
      secoes: [
        {
          titulo: "Antes da aprovação da arte",
          paragrafos: ["[Regra de cancelamento antes da aprovação da arte e prazo de estorno.]"],
        },
        {
          titulo: "Depois da aprovação",
          paragrafos: [
            "[Regra para pedidos já aprovados e em produção. Explique como se aplica o direito de arrependimento (CDC, art. 49) a produtos personalizados. Revisar com advogado.]",
          ],
        },
        {
          titulo: "Defeito ou dano no transporte",
          paragrafos: [
            `Se o pedido chegar com defeito ou danificado, fale com a gente pelo WhatsApp ${store.whatsapp.exibicao} com fotos da embalagem e das peças. [Prazo para avisar e como a reposição é feita.]`,
          ],
        },
      ],
    },
    {
      slug: "perguntas-frequentes",
      titulo: "Perguntas frequentes",
      resumo: "Respostas rápidas sobre personalização, pagamento e entrega.",
      perguntas: [
        {
          pergunta: "Como funciona a personalização?",
          resposta:
            "Na página do produto você escolhe o tema, informa o nome, a idade ou ocasião e as cores. Também pode enviar uma imagem de referência, como o convite da festa.",
        },
        {
          pergunta: "Vou ver a arte antes da produção?",
          resposta:
            "Sim. Depois do pagamento enviamos a arte pelo WhatsApp e só começamos a produzir com o seu ok.",
        },
        {
          pergunta: "Existe pedido mínimo?",
          resposta: "Alguns produtos têm quantidade mínima. Quando houver, ela aparece na página do produto e a quantidade já começa nela.",
        },
        {
          pergunta: "Quais são as formas de pagamento?",
          resposta: `Pix com ${store.descontoPix}% de desconto, cartão de crédito em até ${store.parcelas}x e boleto.`,
        },
        {
          pergunta: "Vocês enviam para todo o Brasil?",
          resposta: "Sim. Calcule o frete com o seu CEP na página do produto ou na sacola.",
        },
        {
          pergunta: "Posso mudar a personalização depois de colocar na sacola?",
          resposta: "Pode. Na sacola, use “Editar personalização” no item. Depois do pagamento, fale com a gente pelo WhatsApp.",
        },
      ],
    },
  ];
}

export function legalPages(store: StoreConfig): ContentPage[] {
  return [
    {
      slug: "privacidade",
      titulo: "Política de privacidade",
      resumo: `Como a ${store.nome} coleta, usa e protege os seus dados, de acordo com a LGPD.`,
      atualizadoEm: "[data da última atualização]",
      secoes: [
        {
          titulo: "Dados que coletamos",
          paragrafos: [
            "Para entregar o pedido, coletamos nome, e-mail, CPF, WhatsApp e endereço. Para produzir a arte, guardamos a personalização e as imagens de referência que você enviar.",
          ],
        },
        {
          titulo: "Para que usamos",
          paragrafos: [
            "Usamos os dados para processar o pagamento, enviar a arte para aprovação, emitir nota fiscal e entregar o pedido. [Outras finalidades, como newsletter e análise de navegação, e a base legal de cada uma.]",
          ],
        },
        {
          titulo: "Com quem compartilhamos",
          paragrafos: ["[Gateway de pagamento, transportadoras e serviços de armazenamento, com o motivo de cada um.]"],
        },
        {
          titulo: "Seus direitos",
          paragrafos: [
            `Você pode pedir acesso, correção ou exclusão dos seus dados pelo e-mail ${store.email}. [Nome e contato do encarregado de dados (DPO).]`,
          ],
        },
        {
          titulo: "Cookies e armazenamento no navegador",
          paragrafos: [
            "A sacola fica salva no seu navegador para você não perder os itens. [Cookies de terceiros e de análise, se houver.]",
          ],
        },
      ],
    },
    {
      slug: "termos",
      titulo: "Termos de uso",
      resumo: `Regras de uso do site e de compra na ${store.nome}.`,
      atualizadoEm: "[data da última atualização]",
      secoes: [
        {
          titulo: "Sobre a loja",
          paragrafos: [`${store.nome} · CNPJ ${store.cnpj}. [Razão social e endereço.]`],
        },
        {
          titulo: "Pedidos e personalização",
          paragrafos: [
            "Você é responsável por conferir nomes, datas e cores na arte antes de aprovar. Depois da aprovação, a peça é produzida exatamente como aprovada.",
          ],
        },
        {
          titulo: "Imagens de referência",
          paragrafos: [
            "Ao enviar uma imagem de referência, você declara ter o direito de usá-la. [Regra para uso de personagens e marcas registradas.]",
          ],
        },
        {
          titulo: "Preços e pagamento",
          paragrafos: ["[Validade dos preços, cupons e regras do desconto no Pix.]"],
        },
      ],
    },
  ];
}
