import { defineConfig } from "drizzle-kit";

const connectionString = process.env.NEON_DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("NEON_DATABASE_URL, POSTGRES_URL ou DATABASE_URL é obrigatória para executar migrações");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
