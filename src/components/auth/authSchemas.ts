
import * as z from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters",
  }),
});

export const registerSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters",
  }),
  companyName: z.string().min(1, { message: "Company name is required" }),
  role: z.enum(["gc_admin", "homeowner"]),
});

export const companyDetailsSchema = z.object({
  website: z.string().optional(),
  licenseNumber: z.string().optional(),
  address: z.string().min(1, { message: "Address is required" }),
  phoneNumber: z.string().min(1, { message: "Phone number is required" }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type CompanyDetailsFormData = z.infer<typeof companyDetailsSchema>;
