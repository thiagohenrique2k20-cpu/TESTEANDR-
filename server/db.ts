import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error(
    "❌ ERRO CRÍTICO: A variável de ambiente DATABASE_URL não está definida.\n" +
    "O banco de dados de produção não está configurado.\n" +
    "O sistema não pode iniciar sem uma conexão com o banco de dados definida explicitamente.\n" +
    "Configure a variável DATABASE_URL antes de iniciar a aplicação."
  );
  process.exit(1);
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
