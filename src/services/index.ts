// Re-export all service functions for ease of use
export * from './utils/userProfileUtils';
export * from './clientService';
export * from './projectService'; 
export * from './milestoneService';
export * from './paymentService';
export * from './expenseService';
export * from './invoiceService';

// Client service exports
export { createClient, findClientByEmail } from './clientService';
