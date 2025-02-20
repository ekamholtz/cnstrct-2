
import * as z from "zod";

export const profileCompletionSchema = z.object({
  company_name: z.string().optional(),
  address: z.string().optional(), // Changed from company_address to address
  license_number: z.string().optional(),
  phone_number: z.string().min(1, "Phone number is required"),
  website: z.string().url().optional().or(z.literal("")),
  full_name: z.string().optional(),
}).superRefine((data, ctx) => {
  // For contractors
  const isContractor = data.company_name || data.license_number;
  
  if (isContractor) {
    if (!data.company_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Company name is required for contractors",
        path: ["company_name"],
      });
    }
    if (!data.address) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Address is required for contractors",
        path: ["address"],
      });
    }
    if (!data.license_number) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "License number is required for contractors",
        path: ["license_number"],
      });
    }
  } else {
    // For homeowners
    if (!data.full_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Full name is required for homeowners",
        path: ["full_name"],
      });
    }
    if (!data.address) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Address is required for homeowners",
        path: ["address"],
      });
    }
  }
});

export type ProfileCompletionFormData = z.infer<typeof profileCompletionSchema>;
