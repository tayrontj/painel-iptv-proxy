type Environment = Record<string, string | undefined>;

const postgresUrl = (value: string | undefined) => value?.startsWith("postgres://") || value?.startsWith("postgresql://") ? value : undefined;

/** Resolve a URL PostgreSQL configurada no Neon/Vercel sem aceitar o banco MySQL herdado do ambiente de desenvolvimento. */
export function resolveNeonDatabaseUrl(env: Environment = process.env) {
  return postgresUrl(env.NEON_DATABASE_URL) ?? postgresUrl(env.POSTGRES_URL) ?? postgresUrl(env.DATABASE_URL);
}
