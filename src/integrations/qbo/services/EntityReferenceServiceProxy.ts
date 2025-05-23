
import { BaseQBOEdgeFunction } from "./BaseQBOEdgeFunction";

export class EntityReferenceServiceProxy {
  private baseService: BaseQBOEdgeFunction;
  
  constructor(baseService: BaseQBOEdgeFunction) {
    this.baseService = baseService;
    console.log("EntityReferenceServiceProxy initialized with Edge Function support");
  }

  /**
   * Get an entity reference from QBO
   */
  async getEntityReference(entityType: string, entityId: string) {
    try {
      console.log(`Getting ${entityType} reference from QBO using Edge Function...`);
      const connection = await this.baseService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      // Use the Edge Function for the query operation
      const response = await this.baseService.makeDataOperation({
        accessToken: connection.access_token,
        realmId: connection.company_id,
        endpoint: "query",
        method: "get",
        data: {
          query: `SELECT * FROM ${entityType} WHERE Id = '${entityId}'`
        }
      });
      
      const entities = response.QueryResponse?.[entityType] || [];
      
      if (entities.length > 0) {
        return {
          success: true,
          data: entities[0]
        };
      }
      
      return {
        success: true,
        data: null
      };
    } catch (error) {
      console.error(`Error getting QBO ${entityType} reference:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Store an entity reference in the database
   */
  async storeEntityReference(entityType: string, localId: string, qboId: string) {
    try {
      console.log(`Storing ${entityType} reference in database...`);
      await this.baseService.storeEntityReference(entityType, localId, qboId);
      
      return {
        success: true
      };
    } catch (error) {
      console.error(`Error storing ${entityType} reference:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
