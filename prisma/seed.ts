// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Check if there's already a default work type
  const existingDefault = await prisma.workType.findFirst({
    where: { isDefault: true },
  });

  if (!existingDefault) {
    // Create default work type
    const defaultWorkType = await prisma.workType.create({
      data: {
        name: "עבודה רגילה",
        description: "סוג עבודה ברירת מחדל",
        isDefault: true,
        rateType: "BASE_RATE",
        rateValue: 0,
      },
    });

    console.log("Created default work type:", defaultWorkType.name);
  } else {
    console.log("Default work type already exists:", existingDefault.name);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
