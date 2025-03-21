import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches all historical projects for a GC account with financial data
 */
export const fetchHistoricalProjects = async (gcAccountId: string) => {
  console.log('Fetching historical projects for GC account:', gcAccountId);
  
  try {
    // First fetch the projects
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        milestones:milestones(id, name, amount, status),
        expenses:expenses(id, name, amount, expense_type, payment_status, expense_date),
        invoices:invoices(id, amount, status, payment_date)
      `)
      .eq('gc_account_id', gcAccountId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching historical projects:', error);
      throw error;
    }

    console.log(`Fetched ${projects?.length || 0} historical projects`);
    
    // Ensure each project has invoices and expenses arrays to prevent errors in PnL calculations
    const projectsWithDefaults = projects.map(project => {
      // Create a properly typed project object with pm property
      const typedProject: any = {
        ...project,
        invoices: project.invoices || [],
        expenses: project.expenses || [],
        pm: undefined // Initialize the pm property
      };
      
      return typedProject;
    });
    
    // If we have projects, fetch the project managers separately
    if (projectsWithDefaults && projectsWithDefaults.length > 0) {
      // Get unique PM user IDs
      const pmUserIds = projectsWithDefaults
        .map(project => project.pm_user_id)
        .filter(id => id !== null && id !== undefined);
      
      const uniquePmUserIds = [...new Set(pmUserIds)];
      
      if (uniquePmUserIds.length > 0) {
        console.log(`Fetching ${uniquePmUserIds.length} project managers`);
        
        // Fetch the project managers
        const { data: projectManagers, error: pmError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', uniquePmUserIds);
        
        if (pmError) {
          console.error('Error fetching project managers:', pmError);
        } else if (projectManagers) {
          console.log(`Fetched ${projectManagers.length} project managers`);
          
          // Add project manager details to each project
          projectsWithDefaults.forEach(project => {
            if (project.pm_user_id) {
              const pm = projectManagers.find(pm => pm.id === project.pm_user_id);
              if (pm) {
                project.pm = pm;
              }
            }
          });
        }
      }
    }
    
    return projectsWithDefaults;
  } catch (error) {
    console.error('Error in fetchHistoricalProjects:', error);
    throw error;
  }
};

/**
 * Calculates project profit and loss
 */
export const calculateProjectPnL = (project: any) => {
  try {
    // Ensure project has required data structures
    if (!project) {
      console.warn('Missing project data for PnL calculation');
      return getDefaultPnLValues();
    }
    
    // Ensure invoices is an array
    if (!project.invoices || !Array.isArray(project.invoices)) {
      console.warn('Project missing invoices array for PnL calculation:', project?.id);
      project.invoices = [];
    }
    
    // Ensure expenses is an array
    if (!project.expenses || !Array.isArray(project.expenses)) {
      console.warn('Project missing expenses array for PnL calculation:', project?.id);
      project.expenses = [];
    }
    
    // Calculate total revenue (all invoiced amounts regardless of payment status)
    const revenue = project.invoices
      .reduce((sum: number, invoice: any) => sum + (invoice.amount || 0), 0);
    
    // Calculate cash in (only paid invoices)
    const cashIn = project.invoices
      .filter((invoice: any) => invoice.status === 'paid')
      .reduce((sum: number, invoice: any) => sum + (invoice.amount || 0), 0);
    
    // Calculate total expenses (all expenses regardless of payment status)
    const expenses = project.expenses
      .reduce((sum: number, expense: any) => sum + (expense.amount || 0), 0);
    
    // Calculate cash out (only paid expenses)
    const cashOut = project.expenses
      .filter((expense: any) => expense.payment_status === 'paid' || expense.payment_status === 'partially_paid')
      .reduce((sum: number, expense: any) => sum + (expense.amount || 0), 0);
    
    // Calculate profit/loss (accrual accounting)
    const profit = revenue - expenses;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
    
    // Calculate net cash flow (cash accounting)
    const netCashFlow = cashIn - cashOut;
    
    return {
      revenue,
      expenses,
      profit,
      profitMargin,
      cashIn,
      cashOut,
      netCashFlow
    };
  } catch (error) {
    console.error('Error calculating project PnL:', error instanceof Error ? error.message : 'Unknown error');
    return getDefaultPnLValues();
  }
};

// Helper function to return default PnL values
const getDefaultPnLValues = () => ({
  revenue: 0,
  expenses: 0,
  profit: 0,
  profitMargin: 0,
  cashIn: 0,
  cashOut: 0,
  netCashFlow: 0
});

/**
 * Groups projects by project manager and calculates performance metrics
 */
export const getProjectsByPM = (projects: any[]) => {
  try {
    console.log(`Grouping ${projects.length} projects by PM`);
    const pmMap = new Map();
    
    projects.forEach(project => {
      const pmId = project.pm_user_id || 'unknown';
      const pmName = project.pm?.full_name || 'Unknown';
      
      if (!pmMap.has(pmId)) {
        pmMap.set(pmId, {
          pmId,
          pmName,
          projects: [],
          totalRevenue: 0,
          totalExpenses: 0,
          totalProfit: 0,
          avgProfitMargin: 0,
          totalCashIn: 0,
          totalCashOut: 0,
          totalNetCashFlow: 0
        });
      }
      
      const pnl = calculateProjectPnL(project);
      const pmData = pmMap.get(pmId);
      
      pmData.projects.push({
        ...project,
        ...pnl,
      });
      
      pmData.totalRevenue += pnl.revenue;
      pmData.totalExpenses += pnl.expenses;
      pmData.totalProfit += pnl.profit;
      pmData.totalCashIn += pnl.cashIn;
      pmData.totalCashOut += pnl.cashOut;
      pmData.totalNetCashFlow += pnl.netCashFlow;
    });
    
    // Calculate average profit margin for each PM
    pmMap.forEach(pmData => {
      if (pmData.totalRevenue > 0) {
        pmData.avgProfitMargin = (pmData.totalProfit / pmData.totalRevenue) * 100;
      }
    });
    
    const result = Array.from(pmMap.values());
    console.log(`Grouped projects into ${result.length} PMs`);
    return result;
  } catch (error) {
    console.error('Error grouping projects by PM:', error);
    return [];
  }
};

/**
 * Groups projects by type and calculates performance metrics
 */
export const getProjectsByType = (projects: any[]) => {
  try {
    console.log(`Grouping ${projects.length} projects by type`);
    const typeMap = new Map();
    
    // Define common project types to look for in descriptions
    const projectTypes = ['bathroom', 'kitchen', 'roof', 'remodel', 'new build', 'addition'];
    
    projects.forEach(project => {
      // Try to detect project type from description
      let projectType = 'Other';
      
      if (project.description) {
        // First try to find [type] pattern
        const typeMatch = project.description.match(/\[(.*?)\]/);
        if (typeMatch) {
          projectType = typeMatch[1].toLowerCase();
        } else {
          // Otherwise look for known types in the description
          for (const type of projectTypes) {
            if (project.description.toLowerCase().includes(type)) {
              projectType = type;
              break;
            }
          }
        }
      }
      
      if (!typeMap.has(projectType)) {
        typeMap.set(projectType, {
          type: projectType,
          projects: [],
          totalRevenue: 0,
          totalExpenses: 0,
          totalProfit: 0,
          avgProfitMargin: 0,
          totalCashIn: 0,
          totalCashOut: 0,
          totalNetCashFlow: 0
        });
      }
      
      const pnl = calculateProjectPnL(project);
      const typeData = typeMap.get(projectType);
      
      typeData.projects.push({
        ...project,
        ...pnl,
      });
      
      typeData.totalRevenue += pnl.revenue;
      typeData.totalExpenses += pnl.expenses;
      typeData.totalProfit += pnl.profit;
      typeData.totalCashIn += pnl.cashIn;
      typeData.totalCashOut += pnl.cashOut;
      typeData.totalNetCashFlow += pnl.netCashFlow;
    });
    
    // Calculate average profit margin for each project type
    typeMap.forEach(typeData => {
      if (typeData.totalRevenue > 0) {
        typeData.avgProfitMargin = (typeData.totalProfit / typeData.totalRevenue) * 100;
      }
    });
    
    const result = Array.from(typeMap.values());
    console.log(`Grouped projects into ${result.length} types:`, result.map(t => t.type).join(', '));
    return result;
  } catch (error) {
    console.error('Error grouping projects by type:', error);
    return [];
  }
};

/**
 * Gets monthly revenue and profit data for trend analysis
 */
export const getMonthlyFinancialData = (projects: any[]) => {
  try {
    console.log(`Calculating monthly data for ${projects.length} projects`);
    const monthlyData = new Map();
    
    // Initialize with last 12 months
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData.set(monthKey, {
        month: monthKey,
        revenue: 0,
        expenses: 0,
        profit: 0,
        cashIn: 0,
        cashOut: 0,
        netCashFlow: 0
      });
    }
    
    // Aggregate financial data by month
    projects.forEach(project => {
      // Ensure project has invoices and expenses arrays
      if (!project.invoices || !Array.isArray(project.invoices)) {
        console.warn('Project missing invoices array for monthly data:', project?.id);
        project.invoices = [];
      }
      
      if (!project.expenses || !Array.isArray(project.expenses)) {
        console.warn('Project missing expenses array for monthly data:', project?.id);
        project.expenses = [];
      }
      
      // Process invoices
      project.invoices.forEach((invoice: any) => {
        if (invoice.status === 'paid' && invoice.payment_date) {
          const paymentDate = new Date(invoice.payment_date);
          const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
          
          if (monthlyData.has(monthKey)) {
            const monthData = monthlyData.get(monthKey);
            monthData.cashIn += invoice.amount || 0;
          }
        }
      });
      
      project.expenses.forEach((expense: any) => {
        if ((expense.payment_status === 'paid' || expense.payment_status === 'partially_paid') && expense.expense_date) {
          const expenseDate = new Date(expense.expense_date);
          const monthKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
          
          if (monthlyData.has(monthKey)) {
            const monthData = monthlyData.get(monthKey);
            monthData.cashOut += expense.amount || 0;
          }
        }
      });
      
      const pnl = calculateProjectPnL(project);
      const projectDate = new Date(project.created_at);
      const monthKey = `${projectDate.getFullYear()}-${String(projectDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyData.has(monthKey)) {
        const monthData = monthlyData.get(monthKey);
        monthData.revenue += pnl.revenue;
        monthData.expenses += pnl.expenses;
        monthData.profit += pnl.profit;
      }
    });
    
    // Calculate net cash flow for each month
    monthlyData.forEach(data => {
      data.netCashFlow = data.cashIn - data.cashOut;
    });
    
    // Convert to array and sort by month
    const result = Array.from(monthlyData.values())
      .sort((a, b) => a.month.localeCompare(b.month));
    
    console.log(`Calculated data for ${result.length} months`);
    return result;
  } catch (error) {
    console.error('Error calculating monthly financial data:', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
};
