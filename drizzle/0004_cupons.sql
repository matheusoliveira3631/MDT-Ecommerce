CREATE TABLE `cupons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`codigo` text NOT NULL,
	`descricao` text DEFAULT '' NOT NULL,
	`tipo` text NOT NULL,
	`valor` integer NOT NULL,
	`pedido_minimo_centavos` integer,
	`inicio_em` integer,
	`fim_em` integer,
	`limite_usos` integer,
	`uma_vez_por_cliente` integer DEFAULT false NOT NULL,
	`ativo` integer DEFAULT true NOT NULL,
	`criado_em` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cupons_codigo_unique` ON `cupons` (`codigo`);