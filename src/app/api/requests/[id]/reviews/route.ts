import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notify } from "@/lib/notifications";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  onTime: z.boolean().default(true),
  conditionOk: z.boolean().default(true),
  punctual: z.boolean().default(true),
  comment: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const request = await prisma.request.findUnique({
    where: { id },
    include: { resource: { select: { providerId: true, title: true } } },
  });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (request.status !== "COMPLETED") {
    return NextResponse.json({ error: "Can only review completed requests" }, { status: 409 });
  }

  const userId = session.user.id;
  const isSeeker = request.seekerId === userId;
  const isProvider = request.resource.providerId === userId;
  if (!isSeeker && !isProvider) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const toId = isSeeker ? request.resource.providerId : request.seekerId;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.review.findUnique({
    where: { requestId_fromId: { requestId: id, fromId: userId } },
  });
  if (existing) {
    return NextResponse.json({ error: "You already reviewed this request" }, { status: 409 });
  }

  const review = await prisma.review.create({
    data: { requestId: id, fromId: userId, toId, ...parsed.data },
  });

  await notify(toId, "NEW_REVIEW", `You received a new ${parsed.data.rating}★ review`, `/profile`);

  return NextResponse.json(review, { status: 201 });
}
