
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const profileCompletionSchema = z.object({
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  phoneNumber: z.string().min(5, {
    message: "Please enter a valid phone number.",
  }),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
});

export type ProfileCompletionFormValues = z.infer<typeof profileCompletionSchema>;

export const useProfileForm = () => {
  return useForm<ProfileCompletionFormValues>({
    resolver: zodResolver(profileCompletionSchema),
  });
};
