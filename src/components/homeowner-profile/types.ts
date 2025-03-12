
import { z } from "zod";

export const profileSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  address: z.string().optional(), // Keep as optional to match database schema
  phone_number: z.string().optional(),
  bio: z.string().optional(),
  company_name: z.string().optional(),
  license_number: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  gc_account_id: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  address?: string; // Keep as optional to match usage patterns
  phone_number?: string;
  bio?: string;
  company_name?: string;
  license_number?: string;
  website?: string;
  join_date?: string;
  gc_account_id?: string;
}
