
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const paymentSimulationSchema = z.object({
  payee_name: z.string().min(1, "Payee name is required"),
  payee_email: z.string().email("Invalid email address"),
  payee_phone: z.string().min(10, "Phone number must be at least 10 digits"),
  payment_amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Payment amount must be a positive number",
  }),
});

type PaymentSimulationData = z.infer<typeof paymentSimulationSchema>;

interface PaymentSimulationFormProps {
  initialPayee: string;
  initialAmount: string;
  onSubmit: (data: PaymentSimulationData) => Promise<void>;
  onCancel: () => void;
}

export function PaymentSimulationForm({ 
  initialPayee, 
  initialAmount, 
  onSubmit,
  onCancel 
}: PaymentSimulationFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const form = useForm<PaymentSimulationData>({
    resolver: zodResolver(paymentSimulationSchema),
    defaultValues: {
      payee_name: initialPayee,
      payee_email: "",
      payee_phone: "",
      payment_amount: initialAmount,
    },
  });

  const handleSubmit = async (data: PaymentSimulationData) => {
    try {
      setIsProcessing(true);
      await onSubmit(data);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <p className="text-sm text-blue-700">
            This is a simulated payment process for demonstration purposes.
          </p>
        </div>

        <FormField
          control={form.control}
          name="payee_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payee Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="payee_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payee Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="payee_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payee Phone Number</FormLabel>
              <FormControl>
                <Input type="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="payment_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Amount</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
            type="submit"
            disabled={isProcessing}
            className="bg-[#9b87f5] hover:bg-[#7E69AB]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              'Process Payment'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
