export const BOROS = [
  "Bronx",
  "Brooklyn",
  "Manhattan",
  "Queens",
  "Staten Island",
] as const;

export type Boro = (typeof BOROS)[number];

export const DISTRICT_79_PROGRAMS = [
  "Pathways to Graduation (P2G)",
  "Adult Education",
  "Young Adult Borough Centers (YABC)",
  "Co-Op Tech (School of Cooperative Technical Education)",
  "Living for the Young Family through Education (LYFE)",
  "Alternate Learning Centers (ALC)",
  "ReStart Academy",
  "Passages Academy",
  "East River Academy (ERA)",
  "Judith S. Kaye High School (JSK)",
] as const;

export type District79Program = (typeof DISTRICT_79_PROGRAMS)[number];

export type RegistrationStatus = "confirmed" | "waiting_list";

export interface Registration {
  _id?: string;
  firstName: string;
  lastName: string;
  program: string;
  boro: Boro;
  title: string;
  email: string;
  status: RegistrationStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RegistrationInput {
  firstName: string;
  lastName: string;
  program: string;
  boro: Boro;
  title: string;
  email: string;
}

export interface RegisterApiResponse {
  status: RegistrationStatus;
  registration: {
    _id: string;
    firstName: string;
    lastName: string;
    program: string;
    boro: Boro;
    title: string;
    email: string;
    status: RegistrationStatus;
    createdAt: string;
  };
}

export interface EmailPayload {
  firstName: string;
  lastName: string;
  program: string;
  boro: string;
  title: string;
  email: string;
}

export interface EmailApiResponse {
  subject: string;
  body: string;
}
