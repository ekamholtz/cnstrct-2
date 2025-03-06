
import { fetchMilestoneWithProject, updateMilestoneStatus } from "../utils/milestoneStatusUtils";
import { createMilestoneInvoice, deleteInvoicesForMilestone, generateInvoiceNumber } from "@/services/invoiceService";

/**
 * Service function to complete a milestone, which includes:
 * 1. Fetching milestone details
 * 2. Generating an invoice number
 * 3. Creating an invoice
 * 4. Updating milestone status to completed
 */
export const completeMilestoneService = async (milestoneId: string) => {
  console.log("Starting milestone completion process for:", milestoneId);

  // Step 1: Get the milestone details
  const milestone = await fetchMilestoneWithProject(milestoneId);
  
  // Step 2: Generate invoice number with milestone ID
  const invoiceNumber = await generateInvoiceNumber(milestoneId);
  
  // Step 3: Create invoice
  const invoice = await createMilestoneInvoice(milestone, invoiceNumber);
  
  // Step 4: Update milestone status
  await updateMilestoneStatus(milestoneId, 'completed');
  
  console.log('Milestone completion process finished successfully');
  return { milestone, invoice };
};

/**
 * Service function to undo milestone completion, which includes:
 * 1. Deleting the associated invoice(s)
 * 2. Updating milestone status back to pending
 */
export const undoMilestoneCompletionService = async (milestoneId: string) => {
  console.log("Starting milestone undo process for:", milestoneId);
  
  // Step 1: Delete associated invoice(s)
  await deleteInvoicesForMilestone(milestoneId);
  
  // Step 2: Update milestone status back to pending
  const updatedMilestone = await updateMilestoneStatus(milestoneId, 'pending');
  
  console.log('Milestone undo process finished successfully');
  return updatedMilestone;
};
