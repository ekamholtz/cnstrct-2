import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { ProjectFormValues } from "../types";
import { DollarSign } from "lucide-react";

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
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="pl-10"
                  placeholder="Enter total contract value"
                  {...field}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}