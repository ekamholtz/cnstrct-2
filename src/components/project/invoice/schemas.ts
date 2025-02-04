import { z } from "zod";

export const paymentSchema = z.object({
  payment_method: z.enum(["cc", "check", "transfer", "cash"], {
    required_error: "Please select a payment method",
  }),
  payment_date: z.date({
    required_error: "Please select a payment date",
  }),
});