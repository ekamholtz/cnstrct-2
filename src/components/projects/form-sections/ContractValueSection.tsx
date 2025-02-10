
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn, useWatch } from "react-hook-form";
import { ProjectFormValues } from "../types";
import { DollarSign } from "lucide-react";

interface ContractValueSectionProps {
  form: UseFormReturn<ProjectFormValues>;
}

export function ContractValueSection({ form }: ContractValueSectionProps) {
  // Watch milestones array for changes
  const milestones = useWatch({
    control: form.control,
    name: "milestones",
  });

  // Calculate total from milestone amounts
  const totalAmount = milestones.reduce((sum, milestone) => {
    const amount = milestone.amount ? parseFloat(milestone.amount) : 0;
    return sum + amount;
  }, 0).toFixed(2);

  // Update form value whenever total changes
  form.setValue("totalContractValue", totalAmount.toString(), {
    shouldValidate: true,
  });

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
                  className="pl-10 bg-gray-50"
                  placeholder="Sum of milestone amounts"
                  {...field}
                  value={totalAmount}
                  readOnly
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
