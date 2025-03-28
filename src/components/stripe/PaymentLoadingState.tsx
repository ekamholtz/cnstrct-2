
import React from 'react';
import { Progress } from '@/components/ui/progress';

export function PaymentLoadingState() {
  return (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
      <p className="text-gray-600 mb-4">Setting up Stripe Connect...</p>
      <Progress value={60} className="max-w-md mx-auto" />
      <p className="mt-4 text-sm text-gray-500">This may take a moment while we prepare your payment integration</p>
    </div>
  );
}
