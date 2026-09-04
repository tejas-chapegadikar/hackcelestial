import { NextResponse } from "next/server";
import { getPriceBenchmark } from "@/lib/pricing";
import type { ResourceType } from "@prisma/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const city = searchParams.get("city");

  if (!type || !city) {
    return NextResponse.json({ error: "type and city are required" }, { status: 400 });
  }

  const benchmark = await getPriceBenchmark(type as ResourceType, city);
  return NextResponse.json({ benchmark });
}
