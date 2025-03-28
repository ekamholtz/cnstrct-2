
/**
 * Environment variable type-safe access
 * Provides type-safe access to environment variables with defaults
 */

// Define all environment variables types
type Environment = {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
};

// Create a proxy to safely access environment variables
export const env = new Proxy(
  {},
  {
    get: (_, prop: keyof Environment) => {
      // For client-side variables (VITE_* prefix)
      if (prop.startsWith('VITE_')) {
        return import.meta.env[prop] || '';
      }
      
      // For server-side variables (accessed through edge functions)
      return '';
    },
  }
) as Environment;

/**
 * Utility to check if running in production environment
 */
export const isProduction = import.meta.env.PROD === true;

/**
 * Utility to check if running in development environment
 */
export const isDevelopment = import.meta.env.DEV === true;
