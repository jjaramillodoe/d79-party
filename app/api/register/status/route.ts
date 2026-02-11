import { NextResponse } from "next/server";
import {
  isRegistrationOpen,
  getRegistrationOpensAt,
} from "@/lib/registration-schedule";

export async function GET() {
  const open = isRegistrationOpen();
  const opensAt = getRegistrationOpensAt();
  return NextResponse.json({
    open,
    opensAt: opensAt?.toISOString() ?? null,
  });
}
