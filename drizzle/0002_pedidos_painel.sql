CREATE TABLE `pedido_historico` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pedido_id` integer NOT NULL,
	`status` text NOT NULL,
	`autor` text NOT NULL,
	`nota` text,
	`criado_em` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pedido_historico_pedido_idx` ON `pedido_historico` (`pedido_id`);--> statement-breakpoint
ALTER TABLE `pedidos` ADD `codigo_rastreio` text;--> statement-breakpoint
INSERT INTO `pedido_historico` (`pedido_id`, `status`, `autor`, `criado_em`) SELECT `id`, `status`, 'Loja', `criado_em` FROM `pedidos`;
