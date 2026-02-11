import { NextResponse } from "next/server";
import { registrationSchema } from "@/lib/validation";
import {
  ensureCapacityDocs,
  ensureRegistrationsIndex,
  tryClaimConfirmedSpot,
  releaseConfirmedSpot,
  getRegistrationsCollection,
} from "@/lib/mongodb";
import {
  isRegistrationOpen,
  getRegistrationOpensAt,
} from "@/lib/registration-schedule";
import type {
  Boro,
  RegistrationStatus,
  RegisterApiResponse,
} from "@/types/registration";

const PA_SECRET = process.env.PA_SECRET;
const POWER_AUTOMATE_CONFIRMATION_URL =
  process.env.POWER_AUTOMATE_CONFIRMATION_URL;
const POWER_AUTOMATE_WAITING_LIST_URL =
  process.env.POWER_AUTOMATE_WAITING_LIST_URL;

async function notifyPowerAutomate(
  url: string,
  payload: {
    firstName: string;
    lastName: string;
    program: string;
    boro: string;
    title: string;
    email: string;
  }
): Promise<void> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(
        `Power Automate hook failed: ${url} status=${res.status}`,
        await res.text()
      );
    }
  } catch (err) {
    console.error("Power Automate hook error:", err);
  }
}

export async function POST(request: Request) {
  try {
    if (!isRegistrationOpen()) {
      const opensAt = getRegistrationOpensAt();
      const message = opensAt
        ? `Registration opens on ${opensAt.toLocaleDateString("en-US", { dateStyle: "long" })} at ${opensAt.toLocaleTimeString("en-US", { timeStyle: "short", timeZone: "America/New_York" })} ET.`
        : "Registration is not yet open.";
      return NextResponse.json(
        { error: message },
        { status: 503 }
      );
    }

    const body = await request.json();
    const parsed = registrationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;

    await ensureRegistrationsIndex();
    await ensureCapacityDocs();

    const registrations = await getRegistrationsCollection();
    const existing = await registrations.findOne(
      { email: data.email.trim() },
      { collation: { locale: "en", strength: 2 } }
    );
    if (existing) {
      return NextResponse.json(
        { error: "This email is already registered. Only one registration per person is allowed." },
        { status: 409 }
      );
    }

    const claimed = await tryClaimConfirmedSpot(data.boro);
    const status: RegistrationStatus = claimed ? "confirmed" : "waiting_list";

    const doc = {
      firstName: data.firstName,
      lastName: data.lastName,
      program: data.program,
      boro: data.boro,
      title: data.title,
      email: data.email,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let insertedId: string;
    try {
      const result = await registrations.insertOne(doc);
      insertedId = result.insertedId.toString();
    } catch (insertErr: unknown) {
      if (claimed) {
        await releaseConfirmedSpot(data.boro);
      }
      const code = insertErr && typeof insertErr === "object" && "code" in insertErr ? (insertErr as { code: number }).code : undefined;
      if (code === 11000) {
        return NextResponse.json(
          { error: "This email is already registered. Only one registration per person is allowed." },
          { status: 409 }
        );
      }
      throw insertErr;
    }

    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      program: data.program,
      boro: data.boro,
      title: data.title,
      email: data.email,
    };

    if (status === "confirmed" && POWER_AUTOMATE_CONFIRMATION_URL) {
      await notifyPowerAutomate(POWER_AUTOMATE_CONFIRMATION_URL, payload);
    } else if (
      status === "waiting_list" &&
      POWER_AUTOMATE_WAITING_LIST_URL
    ) {
      await notifyPowerAutomate(POWER_AUTOMATE_WAITING_LIST_URL, payload);
    }
    const response: RegisterApiResponse = {
      status,
      registration: {
        _id: insertedId,
        firstName: data.firstName,
        lastName: data.lastName,
        program: data.program,
        boro: data.boro as Boro,
        title: data.title,
        email: data.email,
        status,
        createdAt: (doc.createdAt as Date).toISOString(),
      },
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error("Registration API error:", err);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
