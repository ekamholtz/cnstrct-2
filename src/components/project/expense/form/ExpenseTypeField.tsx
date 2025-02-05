
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { ExpenseFormData } from "../types";

interface ExpenseTypeFieldProps {
  form: UseFormReturn<ExpenseFormData>;
}

export function ExpenseTypeField({ form }: ExpenseTypeFieldProps) {
  return (
    <FormField
      control={form.control}
      name="expense_type"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Expense Type</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select expense type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="labor">Labor</SelectItem>
              <SelectItem value="materials">Materials</SelectItem>
              <SelectItem value="subcontractor">Subcontractor</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
