// scripts/clear-approved-by.ts
// Run with: npx tsx scripts/clear-approved-by.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing approvedById from all shifts...");

  const result = await prisma.$executeRawUnsafe(
    `UPDATE "Shift" SET "approvedById" = NULL WHERE "approvedById" IS NOT NULL`
  );

  console.log(`Cleared approvedById from ${result} shifts`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
