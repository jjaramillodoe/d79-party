import type { EmailPayloadInput } from "./validation";

export function formatConfirmationEmail(payload: EmailPayloadInput): {
  subject: string;
  body: string;
} {
  const subject =
    "District 79 Week Mixer: Borough Hall Bash - Registration Confirmed";
  const body = `Dear ${payload.firstName} ${payload.lastName},

Thank you for registering for the District 79 Week Mixer: Borough Hall Bash at Brooklyn Borough Hall on Thursday, Feb 26 from 2 PM to 4 PM. Your spot is confirmed for ${payload.boro}. Please remember to bring a valid ID to enter Borough Hall.

Program: ${payload.program}
Title: ${payload.title}
Email: ${payload.email}

We look forward to seeing you!
District 79`;
  return { subject, body };
}

export function formatWaitingListEmail(payload: EmailPayloadInput): {
  subject: string;
  body: string;
} {
  const subject =
    "District 79 Week Mixer: Borough Hall Bash - Waiting List";
  const body = `Dear ${payload.firstName} ${payload.lastName},

Thank you for your interest in the District 79 Week Mixer: Borough Hall Bash at Brooklyn Borough Hall on Thursday, Feb 26 from 2 PM to 4 PM. The capacity for ${payload.boro} has been reached, and you have been placed on the waiting list.

Program: ${payload.program}
Title: ${payload.title}
Email: ${payload.email}

If a spot becomes available, we will contact you at this email address.

District 79`;
  return { subject, body };
}

/**
 * Escape newlines for JSON (Power Automate may expect \\n in the body string).
 */
export function bodyForJson(body: string): string {
  return body.replace(/\n/g, "\\n");
}
