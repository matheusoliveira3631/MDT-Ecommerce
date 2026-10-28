/**
 * Cria um usuário admin (ou promove um existente e troca a senha).
 * Uso no servidor:
 *   npm run admin:criar -- email@dominio.com "Nome Completo"
 * Com --cliente cria (ou rebaixa para) um usuário comum, útil para testes.
 * A senha é pedida no terminal (ou vem de ADMIN_SENHA, para automação).
 */
import readline from "node:readline";
import { eq } from "drizzle-orm";
import { createDatabase } from "../src/server/db/connect";
import { usuarios } from "../src/server/db/schema";
import { hashPassword, MIN_PASSWORD_LENGTH } from "../src/server/password";

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const output = rl as unknown as { _writeToOutput: (s: string) => void };
    output._writeToOutput = (s: string) => {
      // Não ecoa a senha digitada
      if (s.includes(question)) process.stdout.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const papel = args.includes("--cliente") ? "cliente" : "admin";
  const [emailArg, ...nomeParts] = args.filter((a) => a !== "--cliente");
  const email = emailArg?.trim().toLowerCase();
  const nome = nomeParts.join(" ").trim();
  if (!email || !email.includes("@") || !nome) {
    console.error('Uso: npm run admin:criar -- email@dominio.com "Nome Completo"');
    process.exit(1);
  }

  const senha = process.env.ADMIN_SENHA ?? (await askHidden("Senha (mínimo 10 caracteres): "));
  if (senha.length < MIN_PASSWORD_LENGTH) {
    console.error(`A senha precisa de pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
    process.exit(1);
  }

  const db = createDatabase(process.env.DATABASE_PATH ?? "./data/loja.db");
  const senhaHash = await hashPassword(senha);
  const existing = db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.email, email)).get();
  if (existing) {
    db.update(usuarios).set({ nome, senhaHash, papel }).where(eq(usuarios.id, existing.id)).run();
    console.log(`${email} atualizado (papel: ${papel}, senha nova).`);
  } else {
    db.insert(usuarios).values({ email, nome, senhaHash, papel }).run();
    console.log(`Usuário ${email} criado (papel: ${papel}).`);
  }
}

main();
