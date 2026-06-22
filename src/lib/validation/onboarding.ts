import { z } from "zod";

// Official org email domain. Sign-up and onboarding both require it.
export const SRMIST_EMAIL_SUFFIX = "@srmist.edu.in";

export const srmistEmail = z
  .email({ message: "Enter a valid email address" })
  .refine((value) => value.toLowerCase().endsWith(SRMIST_EMAIL_SUFFIX), {
    message: `Email must be a ${SRMIST_EMAIL_SUFFIX} address`,
  });

// Domains a member can join (mirrors the `domain` enum / `domains` table).
export const DOMAIN_IDS = [
  "technical",
  "creatives",
  "operations",
  "outreach",
] as const;

export const signupSchema = z
  .object({
    email: srmistEmail,
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;

export const onboardingSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  phone: z.string().trim().min(5, "Enter a valid phone number"),
  gender: z.enum(["male", "female"]),
  dateOfBirth: z.coerce.date({ message: "Enter a valid date of birth" }),
  domains: z.array(z.enum(DOMAIN_IDS)).min(1, "Select at least one domain"),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
