import { Pool } from "pg";

// Aceita as variáveis mais comuns geradas por Vercel Postgres/Neon e Supabase
const rawConnectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

if (!rawConnectionString) {
  console.warn(
    "[db] Nenhuma variável de conexão encontrada (POSTGRES_URL / DATABASE_URL). " +
    "Confira Settings → Environment Variables no Vercel."
  );
}

// Remove "sslmode" da própria URL: quando ele vem embutido (ex: sslmode=require),
// o driver monta sua própria config de SSL a partir dele e isso pode entrar em
// conflito com a config explícita abaixo, causando o erro
// "self-signed certificate in certificate chain" com o pooler do Supabase.
function sanitize(cs?: string) {
  if (!cs) return cs;
  try {
    const url = new URL(cs);
    url.searchParams.delete("sslmode");
    url.searchParams.delete("ssl");
    return url.toString();
  } catch {
    return cs;
  }
}

const connectionString = sanitize(rawConnectionString);

export const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes("localhost") ? false : { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 8_000, // falha rápido em vez de travar pra sempre
});

pool.on("error", (err) => {
  console.error("[db] erro inesperado no pool de conexões:", err.message);
});

let tableReady: Promise<void> | null = null;

export function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = pool
      .query(`
        CREATE TABLE IF NOT EXISTS lancamentos (
          id TEXT PRIMARY KEY,
          tipo TEXT NOT NULL CHECK (tipo IN ('entrada','gasto')),
          data DATE NOT NULL,
          categoria TEXT,
          descricao TEXT,
          valor NUMERIC(12,2) NOT NULL,
          criado_em TIMESTAMPTZ DEFAULT now()
        );
      `)
      .then(() => undefined)
      .catch((err) => {
        tableReady = null; // permite tentar de novo na próxima requisição
        throw err;
      });
  }
  return tableReady;
}
