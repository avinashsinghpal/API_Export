import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with default Indian Exporter demo scenario (Singing Bowls / US)...");

  const workspace = await prisma.workspace.upsert({
    where: { slug: "aura-crafts-india" },
    update: {},
    create: {
      id: "ws_demo_auracrafts",
      name: "Aura Crafts India Pvt. Ltd.",
      slug: "aura-crafts-india",
      senderName: "Avinash Singh | Aura Crafts Exports",
      senderEmail: "exportleads.demo@gmail.com",
      senderAddress: "Plot 42, Export Promotion Zone, Moradabad, UP, India - 244001",
      dailyCap: 40,
      minDelaySeconds: 60,
      maxDelaySeconds: 180,
      warmUpMode: true,
      autoStopOnBounce: true,
      bounceThresholdPct: 5.0,
      emailSignature: "Avinash Singh\nHead of International Trade\nAura Crafts Exports India",
    },
  });

  console.log(`Workspace created/verified: ${workspace.name} (${workspace.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
