// scripts/create-platform-admin.ts
// Run with: npx tsx scripts/create-platform-admin.ts
//
// Creates the platform super admin who manages all organizations.
// This is the highest level admin in the multi-tenant system.
//
// Usage:
//   npx tsx scripts/create-platform-admin.ts <email> <password> <name>
//
// Example:
//   npx tsx scripts/create-platform-admin.ts platform@example.com MySecurePassword123 "Platform Admin"

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.error("Usage: npx tsx scripts/create-platform-admin.ts <email> <password> <name>");
    console.error("Example: npx tsx scripts/create-platform-admin.ts platform@example.com MyPassword123 \"Platform Admin\"");
    process.exit(1);
  }

  const [email, password, name] = args;

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error("Error: Invalid email format");
    process.exit(1);
  }

  // Validate password
  if (password.length < 8) {
    console.error("Error: Password must be at least 8 characters");
    process.exit(1);
  }

  // Check if platform admin already exists
  const existingAdmin = await prisma.platformAdmin.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.error(`Error: A platform admin with email ${email} already exists.`);
    process.exit(1);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create platform admin
  const admin = await prisma.platformAdmin.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });

  console.log("✅ Platform admin created successfully!");
  console.log("");
  console.log("Platform Admin:");
  console.log("   Email:", admin.email);
  console.log("   Name:", admin.name);
  console.log("");
  console.log("You can now log in at /platform/login");
  console.log("");
  console.log("From the platform admin panel, you can:");
  console.log("   - Create and manage organizations");
  console.log("   - Monitor all companies using the platform");
  console.log("   - View platform-wide statistics");
}

main()
  .catch((error) => {
    console.error("Error creating platform admin:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
