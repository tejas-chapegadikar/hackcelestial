import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  businessType: z.enum([
    "HOTEL",
    "RESTAURANT",
    "CATERER",
    "BANQUET_VENUE",
    "RESORT",
    "EVENT_ORGANIZER",
    "OTHER",
  ]),
  city: z.string().min(2),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, password, businessType, city, phone, address } = parsed.data;

  const existing = await prisma.business.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const business = await prisma.business.create({
    data: { name, email, passwordHash, businessType, city, phone, address },
  });

  return NextResponse.json({ id: business.id, email: business.email });
}
