import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { ProjectFormValues } from "../types";

interface MilestoneItemProps {
  index: number;
  form: UseFormReturn<ProjectFormValues>;
  onRemove: () => void;
  canRemove: boolean;
}

export function MilestoneItem({ index, form, onRemove, canRemove }: MilestoneItemProps) {
  return (
    <div className="p-4 border rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Milestone {index + 1}</h4>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`milestones.${index}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Milestone Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter milestone name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`milestones.${index}.amount`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter amount"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="md:col-span-2">
          <FormField
            control={form.control}
            name={`milestones.${index}.description`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter milestone description"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}