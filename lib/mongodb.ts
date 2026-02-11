import { MongoClient, Db, Collection } from "mongodb";
import { BOROS } from "@/types/registration";

interface CapacityDoc {
  _id: string;
  confirmedCount: number;
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not set");
}

const options = {};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Cache the MongoDB connection in development and production (Vercel serverless)
// to avoid creating a new connection on every request.
if (!global._mongoClientPromise) {
  global._mongoClientPromise = new MongoClient(uri, options).connect();
}
const clientPromise = global._mongoClientPromise;

export async function getDb(): Promise<Db> {
  const c = await clientPromise;
  return c.db();
}

const REGISTRATIONS = "registrations";
const CAPACITY = "capacity";

const BORO_CAPACITY = 30;

export async function ensureCapacityDocs(): Promise<void> {
  const db = await getDb();
  const col = db.collection<CapacityDoc>(CAPACITY);
  for (const boro of BOROS) {
    await col.updateOne(
      { _id: boro },
      { $setOnInsert: { confirmedCount: 0 } },
      { upsert: true }
    );
  }
}

/**
 * Atomically claim one confirmed spot for the borough if under capacity.
 * Returns true if a spot was claimed, false if borough is at capacity.
 */
export async function tryClaimConfirmedSpot(boro: string): Promise<boolean> {
  const db = await getDb();
  const col = db.collection<CapacityDoc>(CAPACITY);
  const result = await col.findOneAndUpdate(
    { _id: boro, confirmedCount: { $lt: BORO_CAPACITY } },
    { $inc: { confirmedCount: 1 } },
    { returnDocument: "after" }
  );
  return result !== null;
}

/**
 * Release a confirmed spot (e.g. when insert failed after claiming).
 */
export async function releaseConfirmedSpot(boro: string): Promise<void> {
  const db = await getDb();
  const col = db.collection<CapacityDoc>(CAPACITY);
  await col.updateOne({ _id: boro }, { $inc: { confirmedCount: -1 } });
}

const REGISTRATIONS_EMAIL_INDEX = "registrations_email_unique";

/** Ensures a unique index on email (case-insensitive) so only one registration per email is allowed. */
export async function ensureRegistrationsIndex(): Promise<void> {
  const db = await getDb();
  const col = db.collection(REGISTRATIONS);
  try {
    await col.createIndex(
      { email: 1 },
      {
        unique: true,
        name: REGISTRATIONS_EMAIL_INDEX,
        collation: { locale: "en", strength: 2 },
      }
    );
  } catch (err: unknown) {
    const code = err && typeof err === "object" && "code" in err ? (err as { code: number }).code : undefined;
    // E11000: duplicate key - collection has duplicate emails, index build failed
    // 85/86: index already exists with same or different options
    if (code === 11000 || code === 85 || code === 86) {
      console.warn(
        "Registrations index skipped (duplicate emails in collection or index already exists):",
        code
      );
      return;
    }
    throw err;
  }
}

export async function getRegistrationsCollection() {
  const db = await getDb();
  return db.collection(REGISTRATIONS);
}

export async function getCapacityCollection(): Promise<
  Collection<CapacityDoc>
> {
  const db = await getDb();
  return db.collection<CapacityDoc>(CAPACITY);
}

export { REGISTRATIONS, CAPACITY, BORO_CAPACITY };
