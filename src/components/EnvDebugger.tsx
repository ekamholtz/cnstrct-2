import React, { useEffect } from 'react';

const EnvDebugger: React.FC = () => {
  useEffect(() => {
    console.log('Environment variables debug:');
    console.log('VITE_STRIPE_SECRET_KEY exists:', !!import.meta.env.VITE_STRIPE_SECRET_KEY);
    console.log('VITE_STRIPE_PUBLISHABLE_KEY exists:', !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
    console.log('VITE_STRIPE_TEST_MODE exists:', !!import.meta.env.VITE_STRIPE_TEST_MODE);
    console.log('VITE_STRIPE_TEST_MODE value:', import.meta.env.VITE_STRIPE_TEST_MODE);
    console.log('VITE_STRIPE_CLIENT_ID exists:', !!import.meta.env.VITE_STRIPE_CLIENT_ID);
    console.log('VITE_STRIPE_CLIENT_ID value:', import.meta.env.VITE_STRIPE_CLIENT_ID);
    
    // Create an emergency hardcoded fallback for client ID
    if (!import.meta.env.VITE_STRIPE_CLIENT_ID) {
      console.log('⚠️ WARNING: Using hardcoded fallback for Stripe client ID');
      (window as any).EMERGENCY_STRIPE_CLIENT_ID = 'ca_RxKahvJn5Gq2R0c5G3ibvrTHiVjayx53YF';
    }
    
    // List all env variables that start with VITE_
    console.log('All VITE_ environment variables:');
    Object.keys(import.meta.env).forEach(key => {
      if (key.startsWith('VITE_')) {
        console.log(`- ${key} exists`);
      }
    });
  }, []);

  return <div>Environment Variables Debugger (check console)</div>;
};

export default EnvDebugger;
