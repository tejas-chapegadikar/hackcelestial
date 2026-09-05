import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isAvailable, rankResources, computeTrustScore } from "@/lib/matching";
import { notify } from "@/lib/notifications";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      resource: {
        include: { provider: { select: { id: true, name: true, city: true, phone: true, address: true } } },
      },
      seeker: { select: { id: true, name: true, city: true, phone: true, address: true } },
      negotiation: { include: { sender: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
      reviews: true,
      bundle: true,
    },
  });

  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isParty =
    request.seekerId === session.user.id || request.resource.providerId === session.user.id;
  if (!isParty) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({ request, viewerId: session.user.id });
}

const actionSchema = z.object({
  action: z.enum(["ACCEPT", "REJECT", "CANCEL", "COMPLETE"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { action } = parsed.data;

  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      resource: {
        include: { unavailableRanges: true, requests: { select: { id: true, startDate: true, endDate: true, status: true } } },
      },
      negotiation: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userId = session.user.id;
  const isSeeker = request.seekerId === userId;
  const isProvider = request.resource.providerId === userId;
  if (!isSeeker && !isProvider) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (action === "ACCEPT" || action === "REJECT") {
    if (request.status !== "PENDING" && request.status !== "COUNTERED") {
      return NextResponse.json({ error: `Cannot ${action.toLowerCase()} a ${request.status} request` }, { status: 409 });
    }
    const lastSenderId = request.negotiation[0]?.senderId ?? request.seekerId;
    if (lastSenderId === userId) {
      return NextResponse.json({ error: "Waiting on the other party to respond" }, { status: 409 });
    }
  }
  if (action === "CANCEL" && request.status !== "PENDING" && request.status !== "COUNTERED" && request.status !== "ACCEPTED") {
    return NextResponse.json({ error: "Cannot cancel this request" }, { status: 409 });
  }
  if (action === "COMPLETE" && request.status !== "ACCEPTED") {
    return NextResponse.json({ error: "Only accepted requests can be completed" }, { status: 409 });
  }

  if (action === "ACCEPT") {
    const stillAvailable = isAvailable(request.resource, request.startDate, request.endDate, request.id);
    if (!stillAvailable) {
      return NextResponse.json({ error: "Resource is no longer available for these dates" }, { status: 409 });
    }
  }

  const statusMap = { ACCEPT: "ACCEPTED", REJECT: "REJECTED", CANCEL: "CANCELLED", COMPLETE: "COMPLETED" } as const;
  const newStatus = statusMap[action];

  const updated = await prisma.$transaction(async (tx) => {
    const r = await tx.request.update({ where: { id }, data: { status: newStatus } });
    await tx.negotiationMessage.create({
      data: {
        requestId: id,
        senderId: userId,
        type: action === "ACCEPT" ? "ACCEPT" : action === "REJECT" ? "REJECT" : "MESSAGE",
        message: action === "CANCEL" ? "Request cancelled" : action === "COMPLETE" ? "Marked as completed" : undefined,
      },
    });
    return r;
  });

  const otherPartyId = isSeeker ? request.resource.providerId : request.seekerId;
  await notify(
    otherPartyId,
    `REQUEST_${newStatus}`,
    `Request for "${request.resource.title}" was ${newStatus.toLowerCase()}`,
    `/requests/${id}`
  );

  let alternatives: unknown[] = [];
  if (action === "REJECT") {
    const candidates = await prisma.resource.findMany({
      where: {
        status: "ACTIVE",
        type: request.resource.type,
        id: { not: request.resourceId },
        ...(request.resource.city ? { city: request.resource.city } : {}),
      },
      include: {
        unavailableRanges: true,
        requests: { select: { id: true, startDate: true, endDate: true, status: true } },
        provider: { select: { id: true, name: true, city: true } },
      },
    });
    const available = candidates.filter((c) => isAvailable(c, request.startDate, request.endDate));
    const providerIds = [...new Set(available.map((c) => c.providerId))];
    const reviews = await prisma.review.findMany({
      where: { toId: { in: providerIds } },
      select: { toId: true, rating: true, onTime: true, conditionOk: true, punctual: true },
    });
    const trustScores = new Map(
      providerIds.map((pid) => [pid, computeTrustScore(reviews.filter((rv) => rv.toId === pid))])
    );
    const ranked = rankResources(
      available,
      {
        startDate: request.startDate,
        endDate: request.endDate,
        quantityNeeded: request.quantityNeeded,
        capacityNeeded: request.capacityNeeded ?? undefined,
        budget: request.budget ?? undefined,
      },
      trustScores
    ).slice(0, 3);
    alternatives = ranked.map((r) => ({
      resource: { id: r.resource.id, title: r.resource.title, pricePerUnit: r.resource.pricePerUnit, city: r.resource.city },
      score: r.score,
    }));
  }

  return NextResponse.json({ request: updated, alternatives });
}
