// prisma/seed.ts
// This script creates initial data for the multi-tenant system.
// Note: For production, use scripts/create-platform-admin.ts to create the platform admin,
// and organizations should be created through the platform admin panel.
//
// This seed script is primarily for development/testing purposes.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed script is disabled for multi-tenant system.");
  console.log("");
  console.log("To set up the system:");
  console.log("1. Run: npx tsx scripts/create-platform-admin.ts <email> <password> <name>");
  console.log("   This creates the platform super admin who manages all organizations.");
  console.log("");
  console.log("2. Log in to /platform/login and create organizations from there.");
  console.log("");
  console.log("3. Each organization can then have its own admins, employees, and work types.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
