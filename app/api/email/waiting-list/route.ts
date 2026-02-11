import { NextResponse } from "next/server";
import { emailPayloadSchema } from "@/lib/validation";
import {
  formatWaitingListEmail,
  bodyForJson,
} from "@/lib/email-helpers";
import type { EmailApiResponse } from "@/types/registration";

const PA_SECRET = process.env.PA_SECRET;

function getSecret(request: Request): string | null {
  const header = request.headers.get("x-pa-secret");
  if (header) return header;
  const url = new URL(request.url);
  return url.searchParams.get("x-pa-secret");
}

export async function POST(request: Request) {
  if (PA_SECRET) {
    const secret = getSecret(request);
    if (secret !== PA_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const body = await request.json();
    const parsed = emailPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { subject, body: emailBody } = formatWaitingListEmail(parsed.data);
    const response: EmailApiResponse = {
      subject,
      body: bodyForJson(emailBody),
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error("Waiting list email API error:", err);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 500 }
    );
  }
}
