
import * as z from "zod";

export const profileCompletionSchema = z.object({
  company_name: z.string().min(1, "Company name is required").optional(),
  company_address: z.string().min(1, "Company address is required").optional(),
  license_number: z.string().min(1, "License number is required").optional(),
  phone_number: z.string().min(10, "Phone number must be at least 10 digits"),
  website: z.string().url().optional().or(z.literal("")),
  full_name: z.string().min(1, "Full name is required").optional(),
  address: z.string().min(1, "Address is required").optional(),
}).refine((data) => {
  // Validate required fields based on presence of company-related fields
  if (data.company_name || data.company_address || data.license_number) {
    // All company fields must be filled if any are present
    const hasAllCompanyFields = !!data.company_name && !!data.company_address && !!data.license_number;
    return hasAllCompanyFields;
  }
  // If no company fields are present, validate customer fields
  return !!data.full_name && !!data.address;
}, {
  message: "Please fill in all required fields for your user type",
});

export type ProfileCompletionFormData = z.infer<typeof profileCompletionSchema>;
