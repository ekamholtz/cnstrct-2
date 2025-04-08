
import * as z from "zod";

export type UserRole = "gc_admin" | "homeowner" | "team_member" | "platform_admin";

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
  confirmPassword: z.string().min(6, { message: "Password confirmation is required" }),
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  companyName: z.string().min(1, { message: "Company name is required" }),
  role: z.enum(["gc_admin", "homeowner"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
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
