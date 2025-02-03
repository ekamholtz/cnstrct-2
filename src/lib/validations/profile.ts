import * as z from "zod";

export const profileCompletionSchema = z.object({
  company_name: z.string().optional(),
  company_address: z.string().optional(),
  license_number: z.string().optional(),
  phone_number: z.string().min(10, "Phone number must be at least 10 digits"),
  website: z.string().url().optional().or(z.literal("")),
  full_name: z.string().optional(),
  address: z.string().optional(),
}).refine((data) => {
  // Validate required fields based on presence of company-related fields
  if (data.company_name || data.company_address || data.license_number) {
    return !!data.company_name && !!data.company_address && !!data.license_number;
  }
  // If no company fields are present, validate customer fields
  return !!data.full_name && !!data.address;
}, {
  message: "Please fill in all required fields for your user type",
});

export type ProfileCompletionFormData = z.infer<typeof profileCompletionSchema>;