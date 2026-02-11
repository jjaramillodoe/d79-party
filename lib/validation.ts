import { z } from "zod";
import { BOROS, DISTRICT_79_PROGRAMS } from "@/types/registration";

export const registrationSchema = z.object({
  firstName: z.string().min(1, "First name is required").trim(),
  lastName: z.string().min(1, "Last name is required").trim(),
  program: z.enum(DISTRICT_79_PROGRAMS as unknown as [string, ...string[]], {
    message: "Please select a program",
  }),
  boro: z.enum(BOROS as unknown as [string, ...string[]], {
    message: "Please select a borough",
  }),
  title: z.string().min(1, "Title is required").trim(),
  email: z
    .string()
    .email("Please enter a valid email address")
    .trim()
    .refine(
      (e) => e.toLowerCase().endsWith("@schools.nyc.gov"),
      "Registration is only allowed for DOE staff. Please use your @schools.nyc.gov email address."
    ),
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;

export const emailPayloadSchema = z.object({
  firstName: z.string().min(1).trim(),
  lastName: z.string().min(1).trim(),
  program: z.string().min(1).trim(),
  boro: z.string().min(1).trim(),
  title: z.string().min(1).trim(),
  email: z
    .string()
    .email()
    .trim()
    .refine(
      (e) => e.toLowerCase().endsWith("@schools.nyc.gov"),
      "Email must be @schools.nyc.gov"
    ),
});

export type EmailPayloadInput = z.infer<typeof emailPayloadSchema>;
