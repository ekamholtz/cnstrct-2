import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { ProjectFormValues } from "../types";
import { useEffect } from "react";
import { MilestoneItem } from "./MilestoneItem";

interface MilestonesSectionProps {
  form: UseFormReturn<ProjectFormValues>;
}

export function MilestonesSection({ form }: MilestonesSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "milestones",
  });

  // Watch all milestone amounts for changes
  const milestoneAmounts = fields.map((_, index) => 
    form.watch(`milestones.${index}.amount`)
  );

  // Calculate total and update contract value whenever any milestone amount changes
  useEffect(() => {
    const total = milestoneAmounts.reduce((sum, amount) => 
      sum + (Number(amount) || 0), 0
    );
    
    form.setValue("totalContractValue", total.toString(), {
      shouldValidate: true
    });
  }, [milestoneAmounts, form]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Milestones</h3>
      
      <div className="space-y-4">
        {fields.map((field, index) => (
          <MilestoneItem
            key={field.id}
            index={index}
            form={form}
            onRemove={() => remove(index)}
            canRemove={fields.length > 1}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => append({ name: "", description: "", amount: "" })}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Milestone
      </Button>
    </div>
  );
}