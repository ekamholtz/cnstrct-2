
/**
 * Service for retrieving QBO company information
 */
export class QBOCompanyService {
  /**
   * Get company information from QBO API
   */
  async getCompanyInfo(accessToken: string, realmId: string): Promise<{ CompanyName: string; Id: string }> {
    // Since we're using AuthKit, we don't need to implement this method fully
    // but we provide a stub implementation for compatibility
    return {
      CompanyName: "AuthKit Connected Company",
      Id: realmId
    };
  }
}
