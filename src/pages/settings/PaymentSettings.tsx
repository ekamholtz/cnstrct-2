
import React from 'react';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import PaymentSettings from '@/components/stripe/PaymentSettings';

const PaymentSettingsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-10 px-4">
        <PaymentSettings />
      </div>
    </DashboardLayout>
  );
};

export default PaymentSettingsPage;
