
import { QBOAuthService } from "../../authService";

/**
 * Service for handling QBO authorization
 */
export class AuthorizationService {
  private authService: QBOAuthService;
  
  constructor() {
    this.authService = new QBOAuthService();
  }
  
  /**
   * Get an authorization token
   */
  async refreshToken(connectionId: string): Promise<string> {
    return this.authService.refreshToken(connectionId);
  }
}
