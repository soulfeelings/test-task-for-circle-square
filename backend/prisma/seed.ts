import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Создаем тестового пользователя
  const testUser = await prisma.user.upsert({
    where: { username: "testuser" },
    update: {},
    create: {
      username: "testuser",
      role: "SURVIVOR",
    },
  });

  console.log("✅ Created test user:", testUser.username);

  // Создаем тестовый раунд
  const now = new Date();
  const testRound = await prisma.round.create({
    data: {
      startTime: now,
      endTime: new Date(now.getTime() + 60 * 1000), // 1 минута
      status: "ACTIVE",
    },
  });

  console.log("✅ Created test round:", testRound.id);

  console.log("🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
