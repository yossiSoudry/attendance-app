// scripts/delete-admins.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const deleted = await prisma.adminUser.deleteMany();
  console.log(`Deleted ${deleted.count} admin user(s)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
