
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { ExpenseFormData } from "../types";

interface ExpenseVendorEmailFieldProps {
  form: UseFormReturn<ExpenseFormData>;
}

export function ExpenseVendorEmailField({ form }: ExpenseVendorEmailFieldProps) {
  return (
    <FormField
      control={form.control}
      name="vendor_email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Vendor Email</FormLabel>
          <FormControl>
            <Input type="email" placeholder="vendor@example.com" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
