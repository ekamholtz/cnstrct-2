
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ExpenseNameField } from "../form/ExpenseNameField";
import { ExpensePayeeField } from "../form/ExpensePayeeField";
import { ExpenseAmountField } from "../form/ExpenseAmountField";
import { ExpenseDateField } from "../form/ExpenseDateField";
import { ExpenseTypeField } from "../form/ExpenseTypeField";
import { ExpenseNotesField } from "../form/ExpenseNotesField";
import { ExpenseProjectField } from "../form/ExpenseProjectField";
import { UseFormReturn } from "react-hook-form";
import { ExpenseFormStage1Data } from "../types";

interface ExpenseFormContentProps {
  form: UseFormReturn<ExpenseFormStage1Data>;
  isProcessing: boolean;
  defaultProjectId?: string;
  onCancel: () => void;
  onSubmit: (action: 'save_as_due' | 'save_as_paid' | 'pay') => void;
}

export function ExpenseFormContent({
  form,
  isProcessing,
  defaultProjectId,
  onCancel,
  onSubmit,
}: ExpenseFormContentProps) {
  return (
    <Form {...form}>
      <form className="space-y-4">
        <ExpenseNameField form={form} />
        <ExpenseAmountField form={form} />
        <ExpensePayeeField form={form} />
        <ExpenseDateField form={form} />
        <ExpenseTypeField form={form} />
        {!defaultProjectId && <ExpenseProjectField form={form} />}
        <ExpenseNotesField form={form} />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onSubmit('save_as_due')}
            disabled={isProcessing}
            className="bg-[#7E69AB] hover:bg-[#9b87f5] text-white"
          >
            Save as Due
          </Button>
          <Button
            type="button"
            onClick={() => onSubmit('save_as_paid')}
            disabled={isProcessing}
            className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white"
          >
            Save as Paid
          </Button>
          <Button
            type="button"
            onClick={() => onSubmit('pay')}
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Pay Now
          </Button>
        </div>
      </form>
    </Form>
  );
}
