/**
 * StripeConfig - Singleton configuration provider for Stripe Connect integration
 * Provides centralized access to API keys, URLs, and environment settings
 */

class StripeConfig {
  private static instance: StripeConfig;
  private _clientId: string;
  private _secretKey: string;
  private _publishableKey: string;
  private _webhookSecret: string;
  private _platformFeePercentage: number;
  private _apiBaseUrl: string = 'https://api.stripe.com';
  private _connectBaseUrl: string = 'https://connect.stripe.com';
  private _proxyUrl: string;
  private _isProduction: boolean;
  
  private constructor() {
    this._isProduction = this.detectEnvironment();
    console.log('StripeConfig constructor - isProduction:', this._isProduction);
    
    // Check for test mode flag
    const isTestMode = import.meta.env.VITE_STRIPE_TEST_MODE === 'true';
    console.log('StripeConfig - Using test mode:', isTestMode);
    
    // Load keys from environment variables
    if (isTestMode) {
      // Use test mode keys
      this._secretKey = import.meta.env.VITE_STRIPE_SECRET_KEY || '';
      this._publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
    } else {
      // Use production keys
      this._secretKey = import.meta.env.VITE_STRIPE_SECRET_KEY || '';
      this._publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
    }
    
    this._webhookSecret = import.meta.env.VITE_STRIPE_WEBHOOK_SECRET || '';
    this._platformFeePercentage = parseFloat(import.meta.env.VITE_STRIPE_PLATFORM_FEE_PERCENTAGE || '0.025');
    
    // Set up CORS proxy URL
    this._proxyUrl = this._isProduction ? '/api/proxy/stripe' : (import.meta.env.VITE_CORS_PROXY_URL || 'http://localhost:3030/proxy/stripe');
    
    // Debug logging for environment variables
    console.log('StripeConfig - publishableKey available:', !!this._publishableKey);
    console.log('StripeConfig - secretKey available:', !!this._secretKey);
    console.log('StripeConfig - proxyUrl:', this._proxyUrl);
    
    console.log('StripeConfig Initialization Complete');
  }
  
  /**
   * Detect whether the application is running in production or development
   */
  private detectEnvironment(): boolean {
    const hostname = window.location.hostname;
    console.log('StripeConfig detectEnvironment - hostname:', hostname);
    
    // Check if localhost or common development hostnames
    const isDevelopment = hostname === 'localhost' || 
                          hostname === '127.0.0.1' || 
                          hostname.includes('dev.') || 
                          hostname.includes('.local');
    
    return !isDevelopment;
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): StripeConfig {
    if (!StripeConfig.instance) {
      StripeConfig.instance = new StripeConfig();
    }
    return StripeConfig.instance;
  }
  
  /**
   * Get the appropriate URL for Stripe Connect OAuth
   */
  public get connectOAuthUrl(): string {
    return `${this._connectBaseUrl}/oauth/authorize`;
  }
  
  /**
   * Get the appropriate URL for Stripe Connect token exchange
   */
  public get connectTokenUrl(): string {
    return `${this._apiBaseUrl}/oauth/token`;
  }
  
  // Getters
  public get secretKey(): string { return this._secretKey; }
  public get publishableKey(): string { return this._publishableKey; }
  public get webhookSecret(): string { return this._webhookSecret; }
  public get platformFeePercentage(): number { return this._platformFeePercentage; }
  public get proxyUrl(): string { return this._proxyUrl; }
  public get isProduction(): boolean { return this._isProduction; }
  public get apiBaseUrl(): string { return this._apiBaseUrl; }
}

export default StripeConfig;
