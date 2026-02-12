import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import {
  getRegistrationsCollection,
  tryClaimConfirmedSpot,
  releaseConfirmedSpot,
} from "@/lib/mongodb";
import { BOROS, type Boro } from "@/types/registration";

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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const registrations = await getRegistrationsCollection();
    const doc = await registrations.findOne({ _id: objectId });
    if (!doc) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    if (doc.status === "confirmed") {
      await releaseConfirmedSpot(doc.boro as string);
    }
    await registrations.deleteOne({ _id: objectId });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin delete registration error:", err);
    return NextResponse.json(
      { error: "Failed to delete registration" },
      { status: 500 }
    );
  }
}

const PATCH_SCHEMA = {
  firstName: "string",
  lastName: "string",
  program: "string",
  boro: "string",
  title: "string",
  email: "string",
  status: "string",
} as const;

function isValidBoro(s: string): s is Boro {
  return BOROS.includes(s as Boro);
}

function isValidStatus(s: string): s is "confirmed" | "waiting_list" {
  return s === "confirmed" || s === "waiting_list";
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  for (const [key, type] of Object.entries(PATCH_SCHEMA)) {
    if (key in body && typeof body[key] === type) {
      updates[key] = body[key];
    }
  }
  if (updates.boro && !isValidBoro(updates.boro as string)) {
    return NextResponse.json({ error: "Invalid borough" }, { status: 400 });
  }
  if (updates.status && !isValidStatus(updates.status as string)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid updates" }, { status: 400 });
  }

  try {
    const registrations = await getRegistrationsCollection();
    const current = await registrations.findOne({ _id: objectId });
    if (!current) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    const oldStatus = current.status as "confirmed" | "waiting_list";
    const oldBoro = current.boro as string;
    const newStatus = (updates.status as "confirmed" | "waiting_list") ?? oldStatus;
    const newBoro = (updates.boro as string) ?? oldBoro;

    if (oldStatus === "confirmed" && newStatus === "waiting_list") {
      await releaseConfirmedSpot(oldBoro);
    } else if (oldStatus === "waiting_list" && newStatus === "confirmed") {
      const claimed = await tryClaimConfirmedSpot(newBoro);
      if (!claimed) {
        return NextResponse.json(
          { error: "Borough is at capacity; cannot change to confirmed" },
          { status: 400 }
        );
      }
    } else if (oldStatus === "confirmed" && newStatus === "confirmed" && oldBoro !== newBoro) {
      const claimed = await tryClaimConfirmedSpot(newBoro);
      if (!claimed) {
        return NextResponse.json(
          { error: "New borough is at capacity" },
          { status: 400 }
        );
      }
      await releaseConfirmedSpot(oldBoro);
    }

    updates.updatedAt = new Date();
    await registrations.updateOne(
      { _id: objectId },
      { $set: updates }
    );

    const updated = await registrations.findOne({ _id: objectId });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("Admin update registration error:", err);
    return NextResponse.json(
      { error: "Failed to update registration" },
      { status: 500 }
    );
  }
}
