import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const bundle = await prisma.bundle.findUnique({
    where: { id },
    include: {
      items: true,
      requests: {
        include: { resource: { select: { id: true, title: true, providerId: true, type: true } } },
      },
    },
  });
  if (!bundle) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (bundle.seekerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ bundle });
}
