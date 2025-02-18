
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { ExpenseFormStage1Data } from "../types";

interface ExpenseNameFieldProps {
  form: UseFormReturn<ExpenseFormStage1Data>;
}

export function ExpenseNameField({ form }: ExpenseNameFieldProps) {
  return (
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Expense Name</FormLabel>
          <FormControl>
            <Input placeholder="Enter expense name" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
