/**
 * Registration schedule: when registration opens.
 * - REGISTRATION_POSTPONED=true: Registration closed indefinitely (event postponed).
 * - REGISTRATION_OPENS_AT: ISO 8601 date when registration opens (e.g. "2025-02-11T13:00:00.000Z").
 * - If both unset, registration is always open.
 */

const REGISTRATION_POSTPONED =
  process.env.REGISTRATION_POSTPONED === "true" ||
  process.env.REGISTRATION_POSTPONED === "1";
const REGISTRATION_OPENS_AT = process.env.REGISTRATION_OPENS_AT;

export function isRegistrationPostponed(): boolean {
  return REGISTRATION_POSTPONED;
}

export function getRegistrationOpensAt(): Date | null {
  if (REGISTRATION_POSTPONED || !REGISTRATION_OPENS_AT) return null;
  const date = new Date(REGISTRATION_OPENS_AT);
  return isNaN(date.getTime()) ? null : date;
}

export function isRegistrationOpen(): boolean {
  if (REGISTRATION_POSTPONED) return false;
  const opensAt = getRegistrationOpensAt();
  if (!opensAt) return true;
  return new Date() >= opensAt;
}
