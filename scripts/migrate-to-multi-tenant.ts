// scripts/migrate-to-multi-tenant.ts
// Run with: npx tsx scripts/migrate-to-multi-tenant.ts
//
// This script migrates an existing single-tenant database to multi-tenant.
// It creates a default organization and assigns all existing data to it.
//
// IMPORTANT: Run this script BEFORE running prisma db push!
// After running this script, run: npx prisma db push
//
// Steps:
// 1. This script adds nullable organizationId columns
// 2. Creates a default organization
// 3. Updates all existing records with the organization ID
// 4. After this script succeeds, run prisma db push to make the columns required

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Use raw SQL since the Prisma client doesn't have the new columns yet
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting multi-tenant migration...\n");

  try {
    // Step 1: Create the new tables and columns
    console.log("Step 1: Creating new tables and columns...");

    // Create Organization table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Organization" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "legalName" TEXT,
        "taxId" TEXT,
        "logoUrl" TEXT,
        "status" TEXT NOT NULL DEFAULT 'TRIAL',
        "plan" TEXT NOT NULL DEFAULT 'FREE',
        "trialEndsAt" TIMESTAMP(3),
        "subscribedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Organization_email_key" ON "Organization"("email")
    `);

    // Create PlatformAdmin table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PlatformAdmin" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "email" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PlatformAdmin_pkey" PRIMARY KEY ("id")
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "PlatformAdmin_email_key" ON "PlatformAdmin"("email")
    `);

    console.log("   ✅ Tables created\n");

    // Step 2: Add organizationId columns to existing tables (nullable first)
    console.log("Step 2: Adding organizationId columns...");

    const tables = [
      "AdminUser",
      "AdminInvitation",
      "Department",
      "Employee",
      "WorkType",
      "Shift",
      "TimeEvent",
      "EmployeeBonus",
      "Task",
      "DocumentRequest",
      "EmployeeDocument",
      "Device",
      "AuditLog",
      "LeaveRequest",
    ];

    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "${table}"
          ADD COLUMN IF NOT EXISTS "organizationId" UUID
        `);
        console.log(`   ✅ Added organizationId to ${table}`);
      } catch (e) {
        console.log(`   ⚠️ Column may already exist in ${table}`);
      }
    }

    console.log("");

    // Step 3: Create default organization
    console.log("Step 3: Creating default organization...");

    const orgId = await prisma.$queryRawUnsafe<{ id: string }[]>(`
      INSERT INTO "Organization" ("id", "name", "email", "status", "plan", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'ארגון ברירת מחדל', 'default@organization.local', 'ACTIVE', 'FREE', NOW(), NOW())
      ON CONFLICT ("email") DO UPDATE SET "name" = "Organization"."name"
      RETURNING "id"
    `);

    const organizationId = orgId[0].id;
    console.log(`   ✅ Default organization created with ID: ${organizationId}\n`);

    // Step 4: Update all existing records
    console.log("Step 4: Updating existing records with organization ID...");

    for (const table of tables) {
      try {
        const result = await prisma.$executeRawUnsafe(`
          UPDATE "${table}"
          SET "organizationId" = '${organizationId}'::uuid
          WHERE "organizationId" IS NULL
        `);
        console.log(`   ✅ Updated ${table}`);
      } catch (e) {
        console.log(`   ⚠️ Could not update ${table}: ${e}`);
      }
    }

    console.log("");

    // Step 5: Create platform admin
    console.log("Step 5: Creating platform admin...");

    const hashedPassword = await bcrypt.hash("admin123", 12);

    await prisma.$executeRawUnsafe(`
      INSERT INTO "PlatformAdmin" ("id", "email", "password", "name", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'platform@admin.local', '${hashedPassword}', 'Platform Admin', NOW(), NOW())
      ON CONFLICT ("email") DO NOTHING
    `);

    console.log("   ✅ Platform admin created (email: platform@admin.local, password: admin123)\n");

    // Step 6: Add foreign key constraints
    console.log("Step 6: Adding foreign key constraints...");

    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "${table}"
          ADD CONSTRAINT "${table}_organizationId_fkey"
          FOREIGN KEY ("organizationId")
          REFERENCES "Organization"("id")
          ON DELETE CASCADE
          ON UPDATE CASCADE
        `);
        console.log(`   ✅ Added FK constraint to ${table}`);
      } catch (e) {
        console.log(`   ⚠️ FK may already exist in ${table}`);
      }
    }

    console.log("");
    console.log("✅ Migration completed successfully!");
    console.log("");
    console.log("Next steps:");
    console.log("1. Run: npx prisma db push --accept-data-loss");
    console.log("   (This will make organizationId columns NOT NULL)");
    console.log("");
    console.log("2. Login to /platform/login with:");
    console.log("   Email: platform@admin.local");
    console.log("   Password: admin123");
    console.log("   (Change this password immediately!)");
    console.log("");
    console.log("3. The existing data has been assigned to 'ארגון ברירת מחדל'");
    console.log("   You can rename this organization in the platform admin panel.");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error("Error during migration:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
