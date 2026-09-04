import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const RESOURCE_TYPES = [
  "BANQUET_SPACE",
  "PARKING",
  "VEHICLE",
  "KITCHEN",
  "FURNITURE",
  "AV_EQUIPMENT",
  "OTHER",
] as const;

const createSchema = z.object({
  title: z.string().min(2),
  eventDate: z.string(),
  city: z.string().min(2),
  items: z
    .array(
      z.object({
        type: z.enum(RESOURCE_TYPES),
        quantityNeeded: z.number().int().positive().default(1),
        capacityNeeded: z.number().int().positive().optional(),
        budget: z.number().positive().optional(),
        amenities: z.array(z.string()).default([]),
      })
    )
    .min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { title, eventDate, city, items } = parsed.data;

  const bundle = await prisma.bundle.create({
    data: {
      seekerId: session.user.id,
      title,
      city,
      eventDate: new Date(eventDate),
      items: { create: items },
    },
    include: { items: true },
  });

  return NextResponse.json(bundle, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bundles = await prisma.bundle.findMany({
    where: { seekerId: session.user.id },
    include: { items: true, requests: { select: { id: true, status: true, resourceId: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bundles });
}
