
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { ExpenseFormData } from "../types";

interface ExpenseFormActionsProps {
  form: UseFormReturn<ExpenseFormData>;
  isProcessing: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseFormData, action: 'save_as_paid' | 'pay') => Promise<void>;
}

export function ExpenseFormActions({ form, isProcessing, onClose, onSubmit }: ExpenseFormActionsProps) {
  return (
    <div className="flex justify-end space-x-2">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        disabled={isProcessing}
      >
        Cancel
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={() => {
          form.handleSubmit((data) => onSubmit(data, 'save_as_paid'))();
        }}
        disabled={isProcessing}
      >
        Save as Paid
      </Button>
      <Button
        type="button"
        onClick={() => {
          form.handleSubmit((data) => onSubmit(data, 'pay'))();
        }}
        disabled={isProcessing}
      >
        {isProcessing ? "Processing..." : "Pay"}
      </Button>
    </div>
  );
}
