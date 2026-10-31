CREATE TABLE `configuracoes` (
	`chave` text PRIMARY KEY NOT NULL,
	`valor` text NOT NULL,
	`atualizado_em` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `produtos` ADD `peso_gramas` integer;--> statement-breakpoint
ALTER TABLE `produtos` ADD `altura_cm` integer;--> statement-breakpoint
ALTER TABLE `produtos` ADD `largura_cm` integer;--> statement-breakpoint
ALTER TABLE `produtos` ADD `comprimento_cm` integer;