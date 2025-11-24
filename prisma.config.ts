import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // 👇 כאן משתמשים ב־URL המיוחד של Prisma Postgres (prisma+postgres://)
    url: env("DATABASE_PRISMA_DATABASE_URL"),
  },
});
