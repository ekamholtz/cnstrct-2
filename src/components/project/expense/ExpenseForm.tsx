
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Plus } from "lucide-react";
import { ExpenseFormData, expenseFormSchema } from "./types";
import { ExpenseNameField } from "./form/ExpenseNameField";
import { ExpensePayeeField } from "./form/ExpensePayeeField";
import { ExpenseAmountField } from "./form/ExpenseAmountField";
import { ExpenseDateField } from "./form/ExpenseDateField";
import { ExpensePaymentTypeField } from "./form/ExpensePaymentTypeField";
import { ExpenseNotesField } from "./form/ExpenseNotesField";

interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData) => Promise<void>;
}

export function ExpenseForm({ onSubmit }: ExpenseFormProps) {
  const [open, setOpen] = useState(false);
  
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      name: "",
      payee: "",
      amount: "",
      expense_date: undefined,
      payment_type: undefined,
      notes: "",
    },
  });

  const handleSubmit = async (data: ExpenseFormData) => {
    try {
      await onSubmit(data);
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error submitting expense:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Expense</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <ExpenseNameField form={form} />
            <ExpensePayeeField form={form} />
            <ExpenseAmountField form={form} />
            <ExpenseDateField form={form} />
            <ExpensePaymentTypeField form={form} />
            <ExpenseNotesField form={form} />
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Expense</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
