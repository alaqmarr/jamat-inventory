import { prisma } from "./src/lib/db";

async function main() {
  const users = await prisma.user.findMany({
    select: { username: true, password: true },
  });

  console.log("Password Format Check:");
  console.log("----------------------");

  let plainTextCount = 0;
  let hashedCount = 0;

  users.forEach((u) => {
    const isHashed = u.password.startsWith("$2");
    if (isHashed) {
      hashedCount++;
    } else {
      plainTextCount++;
      console.log(
        `[PLAIN TEXT] User: ${u.username} (Password length: ${u.password.length})`,
      );
    }
  });

  console.log("----------------------");
  console.log(`Total Hashed: ${hashedCount}`);
  console.log(`Total Plain Text: ${plainTextCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
