import { NextResponse } from "next/server";
import { getCapacityCollection } from "@/lib/mongodb";
import { BOROS } from "@/types/registration";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

function getSecret(request: Request): string | null {
  const header = request.headers.get("x-admin-secret");
  if (header) return header;
  const url = new URL(request.url);
  return url.searchParams.get("secret");
}

function isAuthorized(request: Request): boolean {
  if (!ADMIN_SECRET) return true;
  const secret = getSecret(request);
  return secret === ADMIN_SECRET;
}

export async function PATCH(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { boro?: string; maxCapacity?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const boro = body.boro;
  const maxCapacity = body.maxCapacity;

  if (!boro || !BOROS.includes(boro as (typeof BOROS)[number])) {
    return NextResponse.json({ error: "Invalid borough" }, { status: 400 });
  }
  if (typeof maxCapacity !== "number" || maxCapacity < 0 || !Number.isInteger(maxCapacity)) {
    return NextResponse.json(
      { error: "maxCapacity must be a non-negative integer" },
      { status: 400 }
    );
  }

  const doc = await (await getCapacityCollection()).findOne({ _id: boro });
  const currentConfirmed = doc?.confirmedCount ?? 0;
  if (maxCapacity < currentConfirmed) {
    return NextResponse.json(
      { error: `Cannot set max below current confirmed count (${currentConfirmed})` },
      { status: 400 }
    );
  }

  try {
    const capacity = await getCapacityCollection();
    await capacity.updateOne(
      { _id: boro },
      { $set: { maxCapacity } }
    );
    return NextResponse.json({ success: true, maxCapacity });
  } catch (err) {
    console.error("Admin capacity update error:", err);
    return NextResponse.json(
      { error: "Failed to update capacity" },
      { status: 500 }
    );
  }
}
