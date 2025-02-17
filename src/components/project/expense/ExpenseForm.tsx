
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form } from "@/components/ui/form";
import { Plus } from "lucide-react";
import { ExpenseFormData, expenseFormSchema } from "./types";
import { ExpenseNameField } from "./form/ExpenseNameField";
import { ExpensePayeeField } from "./form/ExpensePayeeField";
import { ExpenseVendorEmailField } from "./form/ExpenseVendorEmailField";
import { ExpenseAmountField } from "./form/ExpenseAmountField";
import { ExpenseDateField } from "./form/ExpenseDateField";
import { ExpensePaymentTypeField } from "./form/ExpensePaymentTypeField";
import { ExpenseTypeField } from "./form/ExpenseTypeField";
import { ExpenseNotesField } from "./form/ExpenseNotesField";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData, paymentAction: 'save_as_paid' | 'pay') => Promise<void>;
  defaultProjectId?: string;
}

export function ExpenseForm({ onSubmit, defaultProjectId }: ExpenseFormProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      name: "",
      payee: "",
      vendor_email: "",
      amount: "",
      expense_date: undefined,
      payment_type: undefined,
      expense_type: undefined,
      project_id: defaultProjectId || "",
      notes: "",
    },
  });

  // Fetch projects for dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ['contractor-projects'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('contractor_id', user.id)
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (data: ExpenseFormData, action: 'save_as_paid' | 'pay') => {
    try {
      setIsProcessing(true);
      
      if (action === 'pay') {
        // Simulate payment processing
        toast({
          title: "Processing Payment",
          description: "Please wait while we process the payment...",
        });
        
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      await onSubmit(data, action);
      form.reset();
      setOpen(false);
      
      if (action === 'pay') {
        toast({
          title: "Payment Simulated Successfully",
          description: "The payment has been simulated and the expense has been recorded.",
        });
      }
    } catch (error) {
      console.error("Error submitting expense:", error);
    } finally {
      setIsProcessing(false);
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
      <DialogContent className="sm:max-w-[425px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create New Expense</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-8rem)] overflow-y-auto pr-4">
          <Form {...form}>
            <form className="space-y-4">
              <ExpenseNameField form={form} />
              <ExpensePayeeField form={form} />
              <ExpenseVendorEmailField form={form} />
              <ExpenseAmountField form={form} />
              <ExpenseDateField form={form} />
              <ExpensePaymentTypeField form={form} />
              <ExpenseTypeField form={form} />
              
              {!defaultProjectId && (
                <FormField
                  control={form.control}
                  name="project_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <ExpenseNotesField form={form} />
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const values = form.getValues();
                    form.handleSubmit((data) => handleSubmit(data, 'save_as_paid'))();
                  }}
                  disabled={isProcessing}
                >
                  Save as Paid
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    const values = form.getValues();
                    form.handleSubmit((data) => handleSubmit(data, 'pay'))();
                  }}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Pay"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
