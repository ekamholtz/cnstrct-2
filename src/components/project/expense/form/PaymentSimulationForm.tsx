
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const simulationSchema = z.object({
  payment_amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  payee_email: z.string().email("Must be a valid email").optional(),
  payee_phone: z.string().optional(),
  payment_reference: z.string().optional(),
});

type SimulationFormData = z.infer<typeof simulationSchema>;

interface PaymentSimulationFormProps {
  initialPayee: string;
  initialAmount: string;
  onSubmit: (data: { 
    payment_amount: string;
    payee_email?: string;
    payee_phone?: string;
    payment_reference?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export function PaymentSimulationForm({
  initialPayee,
  initialAmount,
  onSubmit,
  onCancel,
}: PaymentSimulationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SimulationFormData>({
    resolver: zodResolver(simulationSchema),
    defaultValues: {
      payment_amount: initialAmount,
      payee_email: "",
      payee_phone: "",
      payment_reference: "",
    },
  });

  const handleSubmit = async (data: SimulationFormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } catch (error) {
      console.error("Error simulating payment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="bg-gray-50 p-4 rounded mb-4">
          <p className="font-medium">Payment to: {initialPayee}</p>
          <p className="text-sm text-gray-500 mt-2">
            This is a simulation. In production, this would connect to a payment processor.
          </p>
        </div>

        <FormField
          control={form.control}
          name="payment_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Amount</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01"
                  min="0"
                  {...field}
                />
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
                <Input 
                  type="email"
                  placeholder="Enter payee email"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>Payment confirmation will be sent here</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="payee_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payee Phone (Optional)</FormLabel>
              <FormControl>
                <Input 
                  type="tel"
                  placeholder="Enter payee phone"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="payment_reference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Reference (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter payment reference or invoice number"
                  {...field}
                  value={field.value || ''}
                />
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
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#9b87f5] hover:bg-[#7E69AB]"
          >
            {isSubmitting ? "Processing..." : "Simulate Payment"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
