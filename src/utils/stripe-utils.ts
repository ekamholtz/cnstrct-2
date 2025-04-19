
/**
 * Stripe utility functions for handling Stripe integration
 */

/**
 * Loads the Stripe.js script
 * @returns A promise that resolves when the Stripe script is loaded
 */
export const loadStripeScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      if ((window as any).Stripe) {
        console.log('Stripe already loaded');
        resolve();
        return;
      }
      
      console.log('Loading Stripe script...');
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      
      script.onload = () => {
        console.log('Stripe script loaded successfully');
        resolve();
      };
      
      script.onerror = (error) => {
        console.error('Failed to load Stripe script:', error);
        reject(new Error('Failed to load Stripe script'));
      };
      
      document.body.appendChild(script);
    } catch (error) {
      console.error('Error in loadStripeScript:', error);
      reject(error);
    }
  });
};

/**
 * Initializes a Stripe instance
 * @param publicKey The Stripe public key
 * @returns The Stripe instance
 */
export const initializeStripe = (publicKey: string): any => {
  if (!(window as any).Stripe) {
    throw new Error('Stripe.js not loaded');
  }
  
  return (window as any).Stripe(publicKey);
};

/**
 * Creates a checkout session and redirects to Stripe checkout
 * @param stripe The Stripe instance
 * @param sessionId The checkout session ID
 * @returns A promise that resolves when redirection is complete
 */
export const redirectToStripeCheckout = async (stripe: any, sessionId: string): Promise<void> => {
  return stripe.redirectToCheckout({ sessionId });
};
