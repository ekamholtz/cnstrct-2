
export interface QBOConnection {
  id?: string;
  user_id: string;
  gc_account_id: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  realm_id: string;
  created_at: string;
  expires_at: string;
}

export interface QBOConnectionMinimal {
  user_id: string;
  realm_id: string;
  created_at: string;
  expires_at: string;
}

export interface QBOTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  realmId: string;
}

export interface QBOCompany {
  id: string;
  name: string;
  legalName?: string;
  companyType?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  email?: string;
  phone?: string;
  website?: string;
}
