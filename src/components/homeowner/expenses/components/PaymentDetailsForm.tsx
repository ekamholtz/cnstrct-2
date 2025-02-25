
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { PaymentDateField } from "@/components/project/expense/form/PaymentDateField";
import { PaymentAmountField } from "@/components/project/expense/form/PaymentAmountField";
import { PaymentTypeField } from "@/components/project/expense/form/PaymentTypeField";
import { useState } from "react";
import { PaymentDetailsData, PaymentMethodCode } from "../types";

interface PaymentDetailsFormProps {
  expenseAmount: number;
  amountDue: number;
  onSubmit: (data: PaymentDetailsData) => Promise<void>;
  onCancel: () => void;
}

const paymentSchema = z.object({
  payment_method_code: z.enum(["cc", "check", "transfer", "cash"] as const),
  payment_date: z.string().min(1, "Payment date is required"),
  amount: z.string().min(1, "Amount is required").transform((val) => Number(val)),
  notes: z.string().optional(),
});

type FormData = {
  payment_method_code?: PaymentMethodCode;
  payment_date?: string;
  amount?: string;
  notes?: string;
};

export function PaymentDetailsForm({
  expenseAmount,
  amountDue,
  onSubmit,
  onCancel,
}: PaymentDetailsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_method_code: undefined,
      payment_date: new Date().toISOString().split('T')[0],
      amount: amountDue.toString(),
      notes: "",
    },
  });

  const handleSubmit = async (formData: FormData) => {
    if (!formData.payment_method_code || !formData.payment_date || !formData.amount) {
      return;
    }

    try {
      setIsSubmitting(true);
      const paymentData: PaymentDetailsData = {
        payment_method_code: formData.payment_method_code,
        payment_date: formData.payment_date,
        amount: Number(formData.amount),
        notes: formData.notes
      };
      await onSubmit(paymentData);
    } catch (error) {
      console.error("Error processing payment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <PaymentTypeField form={form} />
        <PaymentDateField form={form} />
        <PaymentAmountField form={form} amountDue={amountDue} />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#9b87f5] hover:bg-[#7E69AB]"
          >
            {isSubmitting ? "Processing..." : "Submit Payment"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
