import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { ProjectFormValues } from "../types";

interface ContractValueSectionProps {
  form: UseFormReturn<ProjectFormValues>;
}

export function ContractValueSection({ form }: ContractValueSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Contract Value</h3>
      <FormField
        control={form.control}
        name="totalContractValue"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Total Contract Value</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter total contract value"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}