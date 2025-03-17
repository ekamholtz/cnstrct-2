
// Update just the syncToQBO function in the ExpenseDetails component
// Make sure it properly uses the syncExpenseToQBO method

const syncToQBO = async () => {
  if (!expense || qboSyncMutation.isSyncing) return;
  
  try {
    setSyncError(null);
    
    // Call the syncExpenseToQBO method directly with the expense ID
    await qboSyncMutation.syncExpenseToQBO(expense.id);
    
    // Refresh the expense data to show updated sync status
    refetch();
    
    toast({
      title: "Sync Successful",
      description: "Expense was successfully synced to QuickBooks Online",
    });
  } catch (error) {
    console.error("Error syncing to QBO:", error);
    setSyncError(error instanceof Error ? error.message : "Failed to sync expense to QBO");
    
    toast({
      title: "Sync Failed",
      description: "Failed to sync expense to QuickBooks Online. Please try again.",
      variant: "destructive",
    });
  }
};
