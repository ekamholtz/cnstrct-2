import * as z from "zod";
import { UserRole } from "@/types/project-types";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Step 1: Initial registration (user + company)
export const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    companyName: z.string().min(2, "Company name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    role: z.enum(["gc_admin", "homeowner"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Step 2: Company details
export const companyDetailsSchema = z.object({
  website: z.string().optional(),
  licenseNumber: z.string().optional(),
  address: z.string().min(1, "Office address is required"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type CompanyDetailsFormData = z.infer<typeof companyDetailsSchema>;

// Re-export UserRole with correct 'export type' syntax for isolatedModules
export type { UserRole };
