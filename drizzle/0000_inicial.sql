CREATE TABLE `categorias` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`nome` text NOT NULL,
	`foto_chave` text,
	`posicao` integer DEFAULT 0 NOT NULL,
	`criado_em` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categorias_slug_unique` ON `categorias` (`slug`);--> statement-breakpoint
CREATE TABLE `produto_fotos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`produto_id` integer NOT NULL,
	`chave` text NOT NULL,
	`alt` text DEFAULT '' NOT NULL,
	`posicao` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `produto_fotos_produto_idx` ON `produto_fotos` (`produto_id`);--> statement-breakpoint
CREATE TABLE `produtos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`nome` text NOT NULL,
	`categoria_id` integer NOT NULL,
	`resumo` text DEFAULT '' NOT NULL,
	`descricao` text DEFAULT '' NOT NULL,
	`medidas` text DEFAULT '' NOT NULL,
	`preco_base_centavos` integer,
	`preco_pix_centavos` integer,
	`preco_varia` integer DEFAULT true NOT NULL,
	`pedido_minimo` integer DEFAULT 1 NOT NULL,
	`prazo_producao_dias` integer,
	`temas` text DEFAULT '[]' NOT NULL,
	`cores` text DEFAULT '[]' NOT NULL,
	`aceita_referencia` integer DEFAULT true NOT NULL,
	`selos` text DEFAULT '[]' NOT NULL,
	`estoque` integer DEFAULT 0 NOT NULL,
	`ativo` integer DEFAULT true NOT NULL,
	`destaque` integer DEFAULT false NOT NULL,
	`criado_em` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`atualizado_em` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `produtos_slug_unique` ON `produtos` (`slug`);--> statement-breakpoint
CREATE INDEX `produtos_categoria_idx` ON `produtos` (`categoria_id`);--> statement-breakpoint
CREATE TABLE `sessoes` (
	`id` text PRIMARY KEY NOT NULL,
	`usuario_id` integer NOT NULL,
	`expira_em` integer NOT NULL,
	`criado_em` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessoes_usuario_idx` ON `sessoes` (`usuario_id`);--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`nome` text NOT NULL,
	`senha_hash` text NOT NULL,
	`papel` text DEFAULT 'cliente' NOT NULL,
	`criado_em` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_email_unique` ON `usuarios` (`email`);