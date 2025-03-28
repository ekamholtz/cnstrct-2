import React from 'react';
import { PaymentSettings } from '@/components/stripe/PaymentSettings';
import { Layout } from '@/components/layout/Layout';
import { Heading } from '@/components/ui/heading';

const PaymentSettingsPage = () => {
  return (
    <Layout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <Heading 
          title="Payment Settings" 
          description="Manage your Stripe Connect account and payment preferences" 
        />
        <div className="mt-6">
          <PaymentSettings />
        </div>
      </div>
    </Layout>
  );
};

export default PaymentSettingsPage;
