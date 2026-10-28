CREATE TABLE `pedido_itens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pedido_id` integer NOT NULL,
	`produto_id` integer,
	`produto_slug` text NOT NULL,
	`produto_nome` text NOT NULL,
	`preco_unitario_centavos` integer NOT NULL,
	`quantidade` integer NOT NULL,
	`personalizacao` text NOT NULL,
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `pedido_itens_pedido_idx` ON `pedido_itens` (`pedido_id`);--> statement-breakpoint
CREATE TABLE `pedidos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`numero` text NOT NULL,
	`token_acesso` text NOT NULL,
	`chave_idempotencia` text NOT NULL,
	`status` text DEFAULT 'aguardando_pagamento' NOT NULL,
	`usuario_id` integer,
	`cliente_nome` text NOT NULL,
	`cliente_email` text NOT NULL,
	`cliente_cpf` text NOT NULL,
	`cliente_whatsapp` text NOT NULL,
	`endereco` text NOT NULL,
	`frete_servico` text NOT NULL,
	`frete_prazo` text NOT NULL,
	`frete_centavos` integer NOT NULL,
	`cupom_codigo` text,
	`desconto_centavos` integer DEFAULT 0 NOT NULL,
	`subtotal_centavos` integer NOT NULL,
	`total_centavos` integer NOT NULL,
	`pagamento_metodo` text NOT NULL,
	`pagamento_status` text DEFAULT 'pendente' NOT NULL,
	`pagamento_id` text,
	`pagamento_instrucoes` text,
	`estoque_devolvido` integer DEFAULT false NOT NULL,
	`criado_em` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`atualizado_em` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pedidos_numero_unique` ON `pedidos` (`numero`);--> statement-breakpoint
CREATE UNIQUE INDEX `pedidos_chave_idempotencia_unique` ON `pedidos` (`chave_idempotencia`);--> statement-breakpoint
CREATE UNIQUE INDEX `pedidos_pagamento_id_unique` ON `pedidos` (`pagamento_id`);--> statement-breakpoint
CREATE INDEX `pedidos_status_idx` ON `pedidos` (`status`);