import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding SQLite database at ./data/app.db with singing bowls B2B buyer leads...");

  // Seed default exporter setting
  await prisma.setting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      companyName: "Aura Crafts Exports",
      exporterName: "Avinash Singh",
      exporterEmail: "avinash@auracraftsexports.com",
      exporterPhone: "+91 98110 23456",
      exporterAddress: "Moradabad, Uttar Pradesh, India",
      monthlyPlacesLimit: 100,
      googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY || null,
      geminiApiKey: process.env.GEMINI_API_KEY || null,
    },
  });

  console.log("Default Exporter Settings verified.");

  // Import mock data directly or read INITIAL_LEADS
  // Let's create an initial discovery run
  const run = await prisma.discoveryRun.upsert({
    where: { id: "run-001" },
    update: {},
    create: {
      id: "run-001",
      params: JSON.stringify({
        product: "Singing Bowls",
        category: "Home Decor",
        country: "United States",
        state: "Texas",
        city: "Austin",
        buyerTypes: ["Wholesaler", "Importer", "Showroom", "Retailer"],
      }),
      status: "COMPLETED",
      foundCount: 36,
      duplicatesCount: 14,
      startedAt: new Date(Date.now() - 3600000 * 24),
      finishedAt: new Date(Date.now() - 3600000 * 24 + 120000),
    },
  });

  await prisma.runLog.createMany({
    data: [
      { runId: run.id, level: "INFO", message: "Discovery query generated: 'wholesaler singing bowls Austin Texas'" },
      { runId: run.id, level: "SUCCESS", message: "Found 36 potential B2B buyer leads across Texas, California, New York." },
      { runId: run.id, level: "INFO", message: "Deduplication filtered 14 matching root domains & contact emails." },
    ],
  });

  // Seed 36 initial leads
  const rawData = [
    {
      id: "lead-001",
      company: "Serenity Sound & Decor Wholesale",
      website: "https://serenitysoundwholesale.com",
      contactName: "Marcus Vance",
      email: "marcus.v@serenitysoundwholesale.com",
      phone: "+15125550142",
      country: "United States",
      state: "Texas",
      city: "Austin",
      source: "GOOGLE_PLACES",
      buyerType: "Wholesaler",
      emailValid: true,
      aiClass: "b2b",
      aiConfidence: 0.96,
      aiReasoning: "Registered LLC bulk sound bath equipment distributor with wholesale portal.",
      emailStatus: "replied",
      called: true,
      callNotes: "Requested MOQ for 7-chakra hand-hammered bronze bowl sets. Follow up Tuesday."
    },
    {
      id: "lead-002",
      company: "Sedona Mystic Hearth & Home",
      website: "https://sedonamystichearth.com",
      contactName: "Elena Rostova",
      email: "buyer@sedonamystichearth.com",
      phone: "+19285550199",
      country: "United States",
      state: "Arizona",
      city: "Sedona",
      source: "DIRECTORY",
      buyerType: "Showroom",
      emailValid: true,
      aiClass: "b2b",
      aiConfidence: 0.94,
      aiReasoning: "High-end luxury spiritual and home decor showroom with 3 retail physical locations.",
      emailStatus: "opened",
      called: false,
      callNotes: ""
    },
    {
      id: "lead-003",
      company: "Pacific Holistic Imports LLC",
      website: "https://pacificholisticimports.com",
      contactName: "David Chen",
      email: "purchasing@pacificholisticimports.com",
      phone: "+14155550183",
      country: "United States",
      state: "California",
      city: "San Francisco",
      source: "WEBSITE",
      buyerType: "Importer",
      emailValid: true,
      aiClass: "b2b",
      aiConfidence: 0.98,
      aiReasoning: "High volume West Coast sea-freight container consignee for handcrafted brass wares.",
      emailStatus: "replied",
      called: true,
      callNotes: "Sea-freight FOB Mundra quote sent for 20ft container mixed bells & bowls."
    },
    {
      id: "lead-004",
      company: "Zenith Living NY Showroom",
      website: "https://zenithlivingnyc.com",
      contactName: "Chloe Sterling",
      email: "chloe@zenithlivingnyc.com",
      phone: "+12125550171",
      country: "United States",
      state: "New York",
      city: "New York",
      source: "GOOGLE_PLACES",
      buyerType: "Showroom",
      emailValid: true,
      aiClass: "b2b",
      aiConfidence: 0.92,
      aiReasoning: "Manhattan design studio sourcing Asian artisanal metalwork & meditation bowls.",
      emailStatus: "opened",
      called: false,
      callNotes: ""
    },
    {
      id: "lead-005",
      company: "Bhakti Sound & Stone Retailers",
      website: "https://bhaktisoundstone.com",
      contactName: "Arjun Mehta",
      email: "orders@bhaktisoundstone.com",
      phone: "+13035550165",
      country: "United States",
      state: "Colorado",
      city: "Boulder",
      source: "DIRECTORY",
      buyerType: "Retailer",
      emailValid: true,
      aiClass: "b2b",
      aiConfidence: 0.95,
      aiReasoning: "Established specialty retailer stocking authentic Himalayan sound bowls and cushions.",
      emailStatus: "sent",
      called: false,
      callNotes: ""
    },
    {
      id: "lead-006",
      company: "Harmonic Haven Distributors",
      website: "https://harmonichavendist.com",
      contactName: "Sarah Jenkins",
      email: "sarah.j@harmonichavendist.com",
      phone: "+13125550119",
      country: "United States",
      state: "Illinois",
      city: "Chicago",
      source: "GOOGLE_PLACES",
      buyerType: "Distributor",
      emailValid: true,
      aiClass: "b2b",
      aiConfidence: 0.97,
      aiReasoning: "Midwest regional supplier distributing acoustic wellness instruments to 65+ studios.",
      emailStatus: "replied",
      called: true,
      callNotes: "Interested in custom branded etched striker mallets and brocade ring cushions."
    },
    {
      id: "lead-007",
      company: "Texas Acoustic Wellness Co.",
      website: "https://texasacousticwellness.com",
      contactName: "Caleb Wright",
      email: "caleb@texasacousticwellness.com",
      phone: "+17135550133",
      country: "United States",
      state: "Texas",
      city: "Houston",
      source: "GOOGLE_PLACES",
      buyerType: "Wellness Store",
      emailValid: false,
      emailValidationReason: "Domain MX lookup failed; host unreachable",
      aiClass: "b2b",
      aiConfidence: 0.88,
      aiReasoning: "Regional sound therapy studio chain.",
      emailStatus: "bounced",
      called: false,
      callNotes: ""
    },
    {
      id: "lead-008",
      company: "Aura Oasis Spa & Home Boutique",
      website: "https://auraoasisboutique.com",
      contactName: "Maya Lin",
      email: "procurement@auraoasisboutique.com",
      phone: "+12065550188",
      country: "United States",
      state: "Washington",
      city: "Seattle",
      source: "WEBSITE",
      buyerType: "Showroom",
      emailValid: true,
      aiClass: "b2b",
      aiConfidence: 0.91,
      aiReasoning: "Curated lifestyle boutique stocking mindfulness decor and hand-tuned singing bowls.",
      emailStatus: "sent",
      called: false,
      callNotes: ""
    },
    {
      id: "lead-009",
      company: "Veda Home Living Miami",
      website: "https://vedahomemiami.com",
      contactName: "Lucas Silva",
      email: "lucas@vedahomemiami.com",
      phone: "+13055550147",
      country: "United States",
      state: "Florida",
      city: "Miami",
      source: "GOOGLE_PLACES",
      buyerType: "Wholesaler",
      emailValid: true,
      aiClass: "b2b",
      aiConfidence: 0.95,
      aiReasoning: "Wholesale importer serving South Florida luxury resorts and wellness centers.",
      emailStatus: "opened",
      called: false,
      callNotes: ""
    },
    {
      id: "lead-010",
      company: "Prana Decor Imports",
      website: "https://pranadecorimports.com",
      contactName: "Rachel Adams",
      email: "rachel@pranadecorimports.com",
      phone: "+15035550155",
      country: "United States",
      state: "Oregon",
      city: "Portland",
      source: "DIRECTORY",
      buyerType: "Importer",
      emailValid: true,
      aiClass: "b2b",
      aiConfidence: 0.96,
      aiReasoning: "Direct importer of Asian handicraft home goods and meditation bells.",
      emailStatus: "replied",
      called: true,
      callNotes: "Sent 2026 PDF catalog. Requested FOB quotes for 8-inch F# Heart Chakra bowls."
    }
  ];

  for (const l of rawData) {
    const domain = l.website.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    const emailLower = l.email.toLowerCase();

    await prisma.lead.upsert({
      where: { emailLower },
      update: {},
      create: {
        id: l.id,
        company: l.company,
        domain,
        website: l.website,
        contactName: l.contactName,
        email: l.email,
        emailLower,
        phone: l.phone,
        country: l.country,
        state: l.state,
        city: l.city,
        source: l.source,
        buyerType: l.buyerType,
        emailValid: l.emailValid,
        emailValidationReason: l.emailValidationReason || null,
        aiClass: l.aiClass,
        aiConfidence: l.aiConfidence,
        aiReasoning: l.aiReasoning,
        emailStatus: l.emailStatus,
        called: l.called,
        callNotes: l.callNotes,
      },
    });
  }

  // Record initial API usage
  await prisma.apiUsage.upsert({
    where: { provider_month: { provider: "google_places", month: "2026-11" } },
    update: {},
    create: {
      provider: "google_places",
      month: "2026-11",
      requestCount: 8,
    },
  });

  console.log(`Database seeded successfully! Total leads in SQLite: ${await prisma.lead.count()}`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
