ALTER TABLE `pedidos` ADD `desconto_descricao` text;--> statement-breakpoint
ALTER TABLE `produtos` ADD `preco_promo_centavos` integer;--> statement-breakpoint
ALTER TABLE `produtos` ADD `promo_inicio_em` integer;--> statement-breakpoint
ALTER TABLE `produtos` ADD `promo_fim_em` integer;