/**
 * Registration schedule: when registration opens.
 * Set REGISTRATION_OPENS_AT to an ISO 8601 date string (e.g. "2025-02-11T13:00:00.000Z" for 8 AM Eastern).
 * If unset, registration is always open.
 */

const REGISTRATION_OPENS_AT = process.env.REGISTRATION_OPENS_AT;

export function getRegistrationOpensAt(): Date | null {
  if (!REGISTRATION_OPENS_AT) return null;
  const date = new Date(REGISTRATION_OPENS_AT);
  return isNaN(date.getTime()) ? null : date;
}

export function isRegistrationOpen(): boolean {
  const opensAt = getRegistrationOpensAt();
  if (!opensAt) return true;
  return new Date() >= opensAt;
}
