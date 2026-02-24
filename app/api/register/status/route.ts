import { NextResponse } from "next/server";
import {
  isRegistrationOpen,
  getRegistrationOpensAt,
  isRegistrationPostponed,
} from "@/lib/registration-schedule";

export async function GET() {
  const open = isRegistrationOpen();
  const opensAt = getRegistrationOpensAt();
  const postponed = isRegistrationPostponed();
  return NextResponse.json({
    open,
    opensAt: opensAt?.toISOString() ?? null,
    postponed,
  });
}
