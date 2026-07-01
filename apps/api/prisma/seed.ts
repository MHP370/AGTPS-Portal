import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: {
      username: "admin",
    },

    update: {},

    create: {
      username: "admin",
      email: "admin@agtps.local",

      password:
        "$2b$10$Kdfmu.ogLJRO1kj9Wgwcq.NADXxLSywmQU/2HO2n4QpxSd.po0Gda",

      firstName: "System",
      lastName: "Administrator",

      isActive: true,
    },
  });

  console.log(admin);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
