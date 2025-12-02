// scripts/create-owner.ts
// Run with: npx tsx scripts/create-owner.ts
//
// Creates the first organization with an OWNER admin user.
// This script should be run once when setting up the first organization.
//
// Note: For platform admin (super admin who manages all organizations),
// use scripts/create-platform-admin.ts instead.
//
// Usage:
//   npx tsx scripts/create-owner.ts <org-name> <org-email> <admin-email> <password> <admin-name>
//
// Example:
//   npx tsx scripts/create-owner.ts "חברה בע\"מ" company@example.com admin@company.com MySecurePassword123 "יוסי כהן"

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 5) {
    console.error("Usage: npx tsx scripts/create-owner.ts <org-name> <org-email> <admin-email> <password> <admin-name>");
    console.error("Example: npx tsx scripts/create-owner.ts \"חברה בע\\\"מ\" company@example.com admin@company.com MyPassword123 \"יוסי כהן\"");
    process.exit(1);
  }

  const [orgName, orgEmail, adminEmail, password, adminName] = args;

  // Validate emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(orgEmail)) {
    console.error("Error: Invalid organization email format");
    process.exit(1);
  }
  if (!emailRegex.test(adminEmail)) {
    console.error("Error: Invalid admin email format");
    process.exit(1);
  }

  // Validate password
  if (password.length < 8) {
    console.error("Error: Password must be at least 8 characters");
    process.exit(1);
  }

  // Check if organization email already exists
  const existingOrg = await prisma.organization.findUnique({
    where: { email: orgEmail },
  });

  if (existingOrg) {
    console.error(`Error: An organization with email ${orgEmail} already exists.`);
    process.exit(1);
  }

  // Check if admin email already exists
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.error(`Error: An admin with email ${adminEmail} already exists.`);
    process.exit(1);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create organization and owner in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create organization
    const organization = await tx.organization.create({
      data: {
        name: orgName,
        email: orgEmail,
        status: "ACTIVE",
        plan: "FREE",
      },
    });

    // Create owner admin
    const owner = await tx.adminUser.create({
      data: {
        organizationId: organization.id,
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        role: "OWNER",
        status: "ACTIVE",
      },
    });

    // Create default work type for the organization
    await tx.workType.create({
      data: {
        organizationId: organization.id,
        name: "עבודה רגילה",
        description: "סוג עבודה ברירת מחדל",
        isDefault: true,
        rateType: "BASE_RATE",
        rateValue: 0,
      },
    });

    return { organization, owner };
  });

  console.log("✅ Organization and Owner admin created successfully!");
  console.log("");
  console.log("Organization:");
  console.log("   Name:", result.organization.name);
  console.log("   Email:", result.organization.email);
  console.log("");
  console.log("Owner Admin:");
  console.log("   Email:", result.owner.email);
  console.log("   Name:", result.owner.name);
  console.log("   Role:", result.owner.role);
  console.log("");
  console.log("You can now log in at /admin/login");
}

main()
  .catch((error) => {
    console.error("Error creating organization:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
