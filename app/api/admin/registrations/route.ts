import { NextResponse } from "next/server";
import {
  getRegistrationsCollection,
  getCapacityCollection,
  DEFAULT_BORO_CAPACITY,
} from "@/lib/mongodb";
import { BOROS } from "@/types/registration";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

function getSecret(request: Request): string | null {
  const header = request.headers.get("x-admin-secret");
  if (header) return header;
  const url = new URL(request.url);
  return url.searchParams.get("secret");
}

export async function GET(request: Request) {
  if (ADMIN_SECRET) {
    const secret = getSecret(request);
    if (secret !== ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const registrations = await getRegistrationsCollection();
    const capacity = await getCapacityCollection();

    const [allRegistrations, capacityDocs] = await Promise.all([
      registrations
        .find({})
        .sort({ createdAt: -1 })
        .project({
          _id: 1,
          firstName: 1,
          lastName: 1,
          program: 1,
          boro: 1,
          title: 1,
          email: 1,
          status: 1,
          createdAt: 1,
        })
        .toArray(),
      capacity.find({}).toArray(),
    ]);

    type CapacityDoc = { _id: string; confirmedCount?: number; maxCapacity?: number };
    const capacityMap = new Map<string, number>(
      (capacityDocs as unknown as CapacityDoc[]).map((d) => [
        String(d._id),
        d.confirmedCount ?? 0,
      ])
    );
    const maxCapacityMap = new Map<string, number>(
      (capacityDocs as unknown as CapacityDoc[]).map((d) => [
        String(d._id),
        d.maxCapacity ?? DEFAULT_BORO_CAPACITY,
      ])
    );

    const byBoro: Record<
      string,
      { confirmed: typeof allRegistrations; waiting_list: typeof allRegistrations }
    > = {};
    for (const boro of BOROS) {
      byBoro[boro] = { confirmed: [], waiting_list: [] };
    }
    for (const r of allRegistrations) {
      const boro = r.boro as string;
      if (byBoro[boro]) {
        if (r.status === "confirmed") byBoro[boro].confirmed.push(r);
        else byBoro[boro].waiting_list.push(r);
      }
    }

    const counts = BOROS.map((boro) => ({
      boro,
      confirmedCount: byBoro[boro].confirmed.length,
      waitingListCount: byBoro[boro].waiting_list.length,
      maxConfirmed: maxCapacityMap.get(boro) ?? DEFAULT_BORO_CAPACITY,
    }));

    return NextResponse.json({
      registrations: allRegistrations,
      byBoro,
      counts,
      capacityMap: Object.fromEntries(capacityMap),
    });
  } catch (err) {
    console.error("Admin registrations API error:", err);
    return NextResponse.json(
      { error: "Failed to load registrations" },
      { status: 500 }
    );
  }
}
