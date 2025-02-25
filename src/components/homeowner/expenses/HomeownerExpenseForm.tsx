
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { HomeownerExpenseFormData } from "./types";
import { useState } from "react";
import { ExpenseAmountField } from "@/components/project/expense/form/ExpenseAmountField";
import { ExpenseNameField } from "@/components/project/expense/form/ExpenseNameField";
import { ExpensePayeeField } from "@/components/project/expense/form/ExpensePayeeField";
import { ExpenseDateField } from "@/components/project/expense/form/ExpenseDateField";
import { ExpenseTypeField } from "@/components/project/expense/form/ExpenseTypeField";
import { ExpenseNotesField } from "@/components/project/expense/form/ExpenseNotesField";

const homeownerExpenseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.string().min(1, "Amount is required"),
  payee: z.string().min(1, "Payee is required"),
  expense_date: z.string().min(1, "Date is required"),
  expense_type: z.enum(["labor", "materials", "subcontractor", "other"]),
  notes: z.string().optional(),
  project_id: z.string().uuid()
});

interface HomeownerExpenseFormProps {
  projectId: string;
  onSubmit: (data: HomeownerExpenseFormData) => Promise<void>;
}

export function HomeownerExpenseForm({ projectId, onSubmit }: HomeownerExpenseFormProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm<HomeownerExpenseFormData>({
    resolver: zodResolver(homeownerExpenseSchema),
    defaultValues: {
      name: "",
      amount: "",
      payee: "",
      expense_date: "",
      expense_type: "other",
      notes: "",
      project_id: projectId
    },
  });

  const handleSubmit = async (data: HomeownerExpenseFormData) => {
    try {
      setIsProcessing(true);
      await onSubmit(data);
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error submitting expense:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#9b87f5] hover:bg-[#7E69AB]">
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <ExpenseNameField form={form} />
            <ExpenseAmountField form={form} />
            <ExpensePayeeField form={form} />
            <ExpenseDateField form={form} />
            <ExpenseTypeField form={form} />
            <ExpenseNotesField form={form} />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isProcessing}
                className="bg-[#9b87f5] hover:bg-[#7E69AB]"
              >
                {isProcessing ? "Creating..." : "Create Expense"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
