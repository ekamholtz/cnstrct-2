
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { PaymentDetailsData } from "../types";
import { PaymentTypeField } from "./PaymentTypeField";
import { PaymentDateField } from "./PaymentDateField";
import { PaymentAmountField } from "./PaymentAmountField";
import { usePaymentDetailsForm } from "../hooks/usePaymentDetailsForm";
import { PaymentErrorAlert } from "../components/PaymentErrorAlert";
import { PartialPaymentConfirmDialog } from "../components/PartialPaymentConfirmDialog";

interface PaymentDetailsFormProps {
  expenseAmount: number;
  amountDue: number;
  onSubmit: (data: PaymentDetailsData, isPartialPayment: boolean) => Promise<void>;
  onCancel: () => void;
}

export function PaymentDetailsForm({ expenseAmount, amountDue, onSubmit, onCancel }: PaymentDetailsFormProps) {
  const {
    form,
    showPartialPaymentConfirm,
    setShowPartialPaymentConfirm,
    showErrorAlert,
    isProcessing,
    pendingData,
    handleSubmit,
    handlePartialPaymentConfirm,
  } = usePaymentDetailsForm({ expenseAmount, amountDue, onSubmit });

  return (
    <>
      {showErrorAlert && <PaymentErrorAlert amountDue={amountDue} />}

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
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isProcessing}
              className="bg-[#9b87f5] hover:bg-[#7E69AB]"
            >
              {isProcessing ? "Processing..." : "Save Payment"}
            </Button>
          </div>
        </form>
      </Form>

      <PartialPaymentConfirmDialog
        open={showPartialPaymentConfirm}
        onOpenChange={setShowPartialPaymentConfirm}
        pendingData={pendingData}
        expenseAmount={expenseAmount}
        onConfirm={handlePartialPaymentConfirm}
      />
    </>
  );
}
