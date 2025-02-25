
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const simulationSchema = z.object({
  payment_amount: z.string().min(1, "Payment amount is required"),
  payee_email: z.string().email().optional(),
  payee_phone: z.string().optional(),
});

type SimulationFormData = z.infer<typeof simulationSchema>;

interface PaymentSimulationFormProps {
  initialPayee: string;
  initialAmount: string;
  onSubmit: (data: SimulationFormData) => Promise<void>;
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
        <div className="bg-gray-50 p-4 rounded">
          <p className="font-medium">Payment to: {initialPayee}</p>
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
              <FormLabel>Payee Email (Optional)</FormLabel>
              <FormControl>
                <Input 
                  type="email"
                  placeholder="Enter payee email"
                  {...field}
                />
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
              <FormLabel>Payee Phone (Optional)</FormLabel>
              <FormControl>
                <Input 
                  type="tel"
                  placeholder="Enter payee phone"
                  {...field}
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
            {isSubmitting ? "Processing..." : "Proceed with Payment"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
