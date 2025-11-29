// scripts/create-owner.ts
// Run with: npx tsx scripts/create-owner.ts
//
// Creates the first OWNER admin user.
// This script should be run once when setting up the system.
//
// Usage:
//   npx tsx scripts/create-owner.ts <email> <password> <name>
//
// Example:
//   npx tsx scripts/create-owner.ts admin@company.com MySecurePassword123 "יוסי כהן"

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.error("Usage: npx tsx scripts/create-owner.ts <email> <password> <name>");
    console.error("Example: npx tsx scripts/create-owner.ts admin@company.com MyPassword123 \"יוסי כהן\"");
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

  // Check if owner already exists
  const existingOwner = await prisma.adminUser.findFirst({
    where: { role: "OWNER" },
  });

  if (existingOwner) {
    console.error("Error: An OWNER admin already exists.");
    console.error(`Existing owner: ${existingOwner.email}`);
    console.error("If you need to create another owner, change the existing one's role first.");
    process.exit(1);
  }

  // Check if email already exists
  const existingEmail = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (existingEmail) {
    console.error(`Error: An admin with email ${email} already exists.`);
    process.exit(1);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create owner
  const owner = await prisma.adminUser.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: "OWNER",
      status: "ACTIVE",
    },
  });

  console.log("✅ Owner admin created successfully!");
  console.log("   Email:", owner.email);
  console.log("   Name:", owner.name);
  console.log("   Role:", owner.role);
  console.log("");
  console.log("You can now log in at /admin/login");
}

main()
  .catch((error) => {
    console.error("Error creating owner:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
