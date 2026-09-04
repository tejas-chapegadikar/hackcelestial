import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "password123";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await prisma.review.deleteMany();
  await prisma.negotiationMessage.deleteMany();
  await prisma.request.deleteMany();
  await prisma.bundleItem.deleteMany();
  await prisma.bundle.deleteMany();
  await prisma.unavailableRange.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.business.deleteMany();

  const grandHotel = await prisma.business.create({
    data: {
      name: "Grand Horizon Hotel",
      email: "provider1@demo.com",
      passwordHash,
      businessType: "HOTEL",
      city: "Mumbai",
      lat: 19.076,
      lng: 72.8777,
      phone: "9800000001",
      address: "Marine Drive, Mumbai",
    },
  });

  const seasideResort = await prisma.business.create({
    data: {
      name: "Seaside Resort & Spa",
      email: "provider2@demo.com",
      passwordHash,
      businessType: "RESORT",
      city: "Mumbai",
      lat: 19.05,
      lng: 72.83,
      phone: "9800000002",
      address: "Juhu, Mumbai",
    },
  });

  const cityBanquets = await prisma.business.create({
    data: {
      name: "City Banquets Pune",
      email: "provider3@demo.com",
      passwordHash,
      businessType: "BANQUET_VENUE",
      city: "Pune",
      lat: 18.5204,
      lng: 73.8567,
      phone: "9800000003",
      address: "FC Road, Pune",
    },
  });

  const tastyCatering = await prisma.business.create({
    data: {
      name: "Tasty Bites Catering",
      email: "seeker1@demo.com",
      passwordHash,
      businessType: "CATERER",
      city: "Mumbai",
      lat: 19.09,
      lng: 72.88,
      phone: "9800000004",
      address: "Andheri, Mumbai",
    },
  });

  const eventCraft = await prisma.business.create({
    data: {
      name: "EventCraft Organizers",
      email: "seeker2@demo.com",
      passwordHash,
      businessType: "EVENT_ORGANIZER",
      city: "Mumbai",
      lat: 19.06,
      lng: 72.87,
      phone: "9800000005",
      address: "Bandra, Mumbai",
    },
  });

  const resources = await Promise.all([
    prisma.resource.create({
      data: {
        providerId: grandHotel.id,
        type: "BANQUET_SPACE",
        title: "Grand Ballroom",
        description: "Elegant 5000 sqft ballroom with stage and AC.",
        quantity: 1,
        capacity: 300,
        unit: "DAY",
        pricePerUnit: 85000,
        minRentalPeriod: 1,
        amenities: ["AC", "Stage", "Sound System", "Parking"],
        city: "Mumbai",
        lat: 19.076,
        lng: 72.8777,
      },
    }),
    prisma.resource.create({
      data: {
        providerId: grandHotel.id,
        type: "PARKING",
        title: "Hotel Valet Parking Lot",
        description: "Secure covered parking, valet available.",
        quantity: 60,
        capacity: 60,
        unit: "DAY",
        pricePerUnit: 500,
        minRentalPeriod: 1,
        amenities: ["Security", "Covered"],
        city: "Mumbai",
        lat: 19.076,
        lng: 72.8777,
      },
    }),
    prisma.resource.create({
      data: {
        providerId: grandHotel.id,
        type: "KITCHEN",
        title: "Commercial Kitchen Bay",
        description: "Spare industrial kitchen capacity, off-peak hours.",
        quantity: 1,
        capacity: 40,
        unit: "DAY",
        pricePerUnit: 12000,
        minRentalPeriod: 2,
        amenities: ["Gas Line", "Cold Storage"],
        city: "Mumbai",
        lat: 19.076,
        lng: 72.8777,
      },
    }),
    prisma.resource.create({
      data: {
        providerId: seasideResort.id,
        type: "BANQUET_SPACE",
        title: "Beachfront Lawn",
        description: "Open-air lawn with sea view, ideal for weddings.",
        quantity: 1,
        capacity: 500,
        unit: "DAY",
        pricePerUnit: 120000,
        minRentalPeriod: 1,
        amenities: ["Sea View", "Generator"],
        city: "Mumbai",
        lat: 19.05,
        lng: 72.83,
      },
    }),
    prisma.resource.create({
      data: {
        providerId: seasideResort.id,
        type: "VEHICLE",
        title: "Luxury Guest Shuttle Van",
        description: "12-seater van with driver, for guest transport.",
        quantity: 2,
        capacity: 12,
        unit: "DAY",
        pricePerUnit: 6000,
        minRentalPeriod: 1,
        amenities: ["AC", "Driver Included"],
        city: "Mumbai",
        lat: 19.05,
        lng: 72.83,
      },
    }),
    prisma.resource.create({
      data: {
        providerId: seasideResort.id,
        type: "FURNITURE",
        title: "Banquet Chairs & Tables Set",
        description: "200 chairs, 25 round tables, linens included.",
        quantity: 200,
        capacity: null,
        unit: "DAY",
        pricePerUnit: 15000,
        minRentalPeriod: 1,
        amenities: ["Linens Included"],
        city: "Mumbai",
        lat: 19.05,
        lng: 72.83,
      },
    }),
    prisma.resource.create({
      data: {
        providerId: cityBanquets.id,
        type: "BANQUET_SPACE",
        title: "City Banquets Main Hall",
        description: "Centrally located hall, budget friendly.",
        quantity: 1,
        capacity: 200,
        unit: "DAY",
        pricePerUnit: 45000,
        minRentalPeriod: 1,
        amenities: ["AC", "Stage"],
        city: "Pune",
        lat: 18.5204,
        lng: 73.8567,
      },
    }),
    prisma.resource.create({
      data: {
        providerId: cityBanquets.id,
        type: "AV_EQUIPMENT",
        title: "Full AV & Lighting Rig",
        description: "Projectors, mics, LED walls, DJ lighting.",
        quantity: 1,
        capacity: null,
        unit: "DAY",
        pricePerUnit: 22000,
        minRentalPeriod: 1,
        amenities: ["Technician Included"],
        city: "Pune",
        lat: 18.5204,
        lng: 73.8567,
      },
    }),
  ]);

  console.log(`Seeded ${resources.length} resources across 3 providers and 2 seeker-heavy businesses.`);
  console.log("\nDemo accounts (all use password: " + DEMO_PASSWORD + "):");
  for (const b of [grandHotel, seasideResort, cityBanquets, tastyCatering, eventCraft]) {
    console.log(`  ${b.email}  (${b.name})`);
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
