
import * as z from "zod";

export const profileSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  address: z.string().min(1, "Address is required"),
  phone_number: z.string().optional(),
  bio: z.string().optional(),
  company_name: z.string().optional(),
  license_number: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
