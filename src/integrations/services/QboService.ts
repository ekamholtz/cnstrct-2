/**
 * QboService
 * 
 * Provides methods for interacting with the QuickBooks Online API
 * Handles authentication, company information, and financial data operations
 * Uses the unified CORS proxy for API communication
 */

import axios from 'axios';
import { BaseApiService, ApiResponse } from './BaseApiService';

// Default QBO API configuration
const DEFAULT_PROXY_URL = 'http://localhost:3030';

export interface QboServiceConfig {
  proxyUrl?: string;
  clientId: string;
  clientSecret: string;
}

export interface QboTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  x_refresh_token_expires_in: number;
  id_token?: string;
}

export interface QboCompanyInfo {
  CompanyInfo: {
    Id: string;
    CompanyName: string;
    LegalName: string;
    CompanyAddr?: {
      Line1?: string;
      City?: string;
      CountrySubDivisionCode?: string;
      PostalCode?: string;
    };
    CustomerCommunicationAddr?: {
      Line1?: string;
      City?: string;
      CountrySubDivisionCode?: string;
      PostalCode?: string;
    };
    LegalAddr?: {
      Line1?: string;
      City?: string;
      CountrySubDivisionCode?: string;
      PostalCode?: string;
    };
    PrimaryPhone?: {
      FreeFormNumber?: string;
    };
    Email?: {
      Address?: string;
    };
    SupportedLanguages?: string;
    Country?: string;
    FiscalYearStartMonth?: string;
    NameValue?: Array<{
      Name: string;
      Value: string;
    }>;
  };
  time: string;
}

export interface QboCustomer {
  Id: string;
  DisplayName: string;
  Taxable: boolean;
  Active: boolean;
  Job: boolean;
  Balance: number;
  BalanceWithJobs: number;
  CurrencyRef?: {
    value: string;
    name: string;
  };
  PreferredDeliveryMethod?: string;
  GivenName?: string;
  FamilyName?: string;
  FullyQualifiedName?: string;
  CompanyName?: string;
  PrimaryPhone?: {
    FreeFormNumber: string;
  };
  PrimaryEmailAddr?: {
    Address: string;
  };
  BillAddr?: {
    Line1?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
  };
  ShipAddr?: {
    Line1?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
  };
  MetaData: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
}

export interface QboInvoice {
  Id: string;
  DocNumber: string;
  SyncToken: string;
  TxnDate: string;
  CurrencyRef: {
    value: string;
    name: string;
  };
  ExchangeRate?: number;
  EmailStatus?: string;
  BillEmail?: {
    Address: string;
  };
  ShipAddr?: {
    Line1?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
  };
  ShipFromAddr?: {
    Line1?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
  };
  TotalAmt: number;
  HomeTotalAmt?: number;
  ApplyTaxAfterDiscount?: boolean;
  PrintStatus?: string;
  BillAddr?: {
    Line1?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
  };
  Balance?: number;
  HomeBalance?: number;
  CustomerRef: {
    value: string;
    name: string;
  };
  DueDate: string;
  MetaData: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
  Line: Array<{
    Id?: string;
    LineNum?: number;
    Description?: string;
    Amount: number;
    DetailType: string;
    SalesItemLineDetail?: {
      ItemRef: {
        value: string;
        name: string;
      };
      TaxCodeRef?: {
        value: string;
      };
      UnitPrice?: number;
      Qty?: number;
    };
  }>;
}

export class QboService extends BaseApiService {
  private clientId: string;
  private clientSecret: string;
  
  constructor(config: QboServiceConfig) {
    super({
      proxyUrl: config.proxyUrl || DEFAULT_PROXY_URL,
      serviceName: 'qbo',
      defaultHeaders: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
  }
  
  /**
   * Exchange authorization code for access token
   * 
   * @param code Authorization code from OAuth flow
   * @param redirectUri Redirect URI used in OAuth flow
   * @returns Promise with token response
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<ApiResponse<QboTokenResponse>> {
    this.validateRequiredParams({ code, redirectUri }, ['code', 'redirectUri']);
    
    try {
      const response = await axios.post(`${this.config.proxyUrl}/proxy/qbo/token`, {
        code,
        redirectUri,
        clientId: this.clientId,
        clientSecret: this.clientSecret
      });
      
      return {
        data: response.data,
        success: true
      };
    } catch (error: any) {
      console.error('Error exchanging code for token:', error);
      
      return {
        data: null as unknown as QboTokenResponse,
        success: false,
        error: new Error(
          error.response?.data?.error || 
          error.message || 
          'Error exchanging code for QBO token'
        )
      };
    }
  }
  
  /**
   * Refresh access token
   * 
   * @param refreshToken Refresh token
   * @returns Promise with token response
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<QboTokenResponse>> {
    this.validateRequiredParams({ refreshToken }, ['refreshToken']);
    
    try {
      const response = await axios.post(`${this.config.proxyUrl}/proxy/qbo/refresh`, {
        refreshToken,
        clientId: this.clientId,
        clientSecret: this.clientSecret
      });
      
      return {
        data: response.data,
        success: true
      };
    } catch (error: any) {
      console.error('Error refreshing token:', error);
      
      return {
        data: null as unknown as QboTokenResponse,
        success: false,
        error: new Error(
          error.response?.data?.error || 
          error.message || 
          'Error refreshing QBO token'
        )
      };
    }
  }
  
  /**
   * Test the connection to QuickBooks Online
   * 
   * @param accessToken Access token
   * @param realmId QuickBooks Company ID (Realm ID)
   * @returns Promise with test result
   */
  async testConnection(
    accessToken: string, 
    realmId: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    // Validate parameters
    this.validateRequiredParams({ accessToken, realmId }, ['accessToken', 'realmId']);
    
    try {
      // Make a simple query to test the connection
      const response = await axios.post(`${this.config.proxyUrl}/proxy/qbo/data-operation`, {
        accessToken,
        realmId,
        endpoint: 'query',
        method: 'get',
        data: {
          query: 'SELECT COUNT(*) FROM CompanyInfo'
        }
      });
      
      return {
        success: true,
        data: { success: true }
      };
    } catch (error: any) {
      console.error('QBO connection test failed:', error);
      
      return {
        success: false,
        data: { success: false },
        error: new Error(
          error.response?.data?.error?.message || 
          error.response?.data?.error || 
          error.message || 
          'Failed to test connection to QuickBooks Online'
        )
      };
    }
  }

  /**
   * Get company information
   * 
   * @param accessToken Access token
   * @param realmId QuickBooks Company ID (Realm ID)
   * @returns Promise with company info
   */
  async getCompanyInfo(accessToken: string, realmId: string): Promise<ApiResponse<QboCompanyInfo>> {
    this.validateRequiredParams({ accessToken, realmId }, ['accessToken', 'realmId']);
    
    return this.makeRequest<QboCompanyInfo>(
      `companyinfo/${realmId}`,
      'get',
      null,
      { 
        'Authorization': `Bearer ${accessToken}`,
        'realmId': realmId
      }
    );
  }
  
  /**
   * Query customers
   * 
   * @param accessToken Access token
   * @param realmId QuickBooks Company ID (Realm ID)
   * @param query SQL-like query string (optional)
   * @returns Promise with customers
   */
  async queryCustomers(
    accessToken: string, 
    realmId: string,
    query?: string
  ): Promise<ApiResponse<{ QueryResponse: { Customer: QboCustomer[], startPosition: number, maxResults: number, totalCount: number } }>> {
    this.validateRequiredParams({ accessToken, realmId }, ['accessToken', 'realmId']);
    
    const queryString = query || "SELECT * FROM Customer WHERE Active = true MAXRESULTS 1000";
    
    return this.makeRequest<{ QueryResponse: { Customer: QboCustomer[], startPosition: number, maxResults: number, totalCount: number } }>(
      'query',
      'get',
      { query: queryString },
      { 
        'Authorization': `Bearer ${accessToken}`,
        'realmId': realmId
      }
    );
  }
  
  /**
   * Get customer by ID
   * 
   * @param accessToken Access token
   * @param realmId QuickBooks Company ID (Realm ID)
   * @param customerId Customer ID
   * @returns Promise with customer
   */
  async getCustomer(
    accessToken: string, 
    realmId: string, 
    customerId: string
  ): Promise<ApiResponse<{ Customer: QboCustomer }>> {
    this.validateRequiredParams(
      { accessToken, realmId, customerId }, 
      ['accessToken', 'realmId', 'customerId']
    );
    
    return this.makeRequest<{ Customer: QboCustomer }>(
      `customer/${customerId}`,
      'get',
      null,
      { 
        'Authorization': `Bearer ${accessToken}`,
        'realmId': realmId
      }
    );
  }
  
  /**
   * Create customer
   * 
   * @param accessToken Access token
   * @param realmId QuickBooks Company ID (Realm ID)
   * @param customerData Customer data
   * @returns Promise with created customer
   */
  async createCustomer(
    accessToken: string, 
    realmId: string, 
    customerData: Partial<QboCustomer>
  ): Promise<ApiResponse<{ Customer: QboCustomer }>> {
    this.validateRequiredParams(
      { accessToken, realmId, customerData }, 
      ['accessToken', 'realmId', 'customerData']
    );
    
    // Ensure minimum required fields
    if (!customerData.DisplayName) {
      throw new Error('Customer DisplayName is required');
    }
    
    return this.makeRequest<{ Customer: QboCustomer }>(
      'customer',
      'post',
      customerData,
      { 
        'Authorization': `Bearer ${accessToken}`,
        'realmId': realmId
      }
    );
  }
  
  /**
   * Query invoices
   * 
   * @param accessToken Access token
   * @param realmId QuickBooks Company ID (Realm ID)
   * @param query SQL-like query string (optional)
   * @returns Promise with invoices
   */
  async queryInvoices(
    accessToken: string, 
    realmId: string,
    query?: string
  ): Promise<ApiResponse<{ QueryResponse: { Invoice: QboInvoice[], startPosition: number, maxResults: number, totalCount: number } }>> {
    this.validateRequiredParams({ accessToken, realmId }, ['accessToken', 'realmId']);
    
    const queryString = query || "SELECT * FROM Invoice ORDERBY TxnDate DESC MAXRESULTS 100";
    
    return this.makeRequest<{ QueryResponse: { Invoice: QboInvoice[], startPosition: number, maxResults: number, totalCount: number } }>(
      'query',
      'get',
      { query: queryString },
      { 
        'Authorization': `Bearer ${accessToken}`,
        'realmId': realmId
      }
    );
  }
  
  /**
   * Create invoice
   * 
   * @param accessToken Access token
   * @param realmId QuickBooks Company ID (Realm ID)
   * @param invoiceData Invoice data
   * @returns Promise with created invoice
   */
  async createInvoice(
    accessToken: string, 
    realmId: string, 
    invoiceData: Partial<QboInvoice>
  ): Promise<ApiResponse<{ Invoice: QboInvoice }>> {
    this.validateRequiredParams(
      { accessToken, realmId, invoiceData }, 
      ['accessToken', 'realmId', 'invoiceData']
    );
    
    // Ensure minimum required fields
    if (!invoiceData.CustomerRef || !invoiceData.Line || invoiceData.Line.length === 0) {
      throw new Error('Invoice must have CustomerRef and at least one Line item');
    }
    
    return this.makeRequest<{ Invoice: QboInvoice }>(
      'invoice',
      'post',
      invoiceData,
      { 
        'Authorization': `Bearer ${accessToken}`,
        'realmId': realmId
      }
    );
  }
}
