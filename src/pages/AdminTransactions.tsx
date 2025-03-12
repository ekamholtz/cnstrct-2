
import { useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { TransactionFilters, TransactionType, TransactionStatus } from "@/components/admin/transactions/TransactionFilters";
import { TransactionsTable } from "@/components/admin/transactions/TransactionsTable";
import { useTransactions } from "@/components/admin/transactions/hooks/useTransactions";
import { Invoice } from "@/components/project/invoice/types";
import { Expense } from "@/components/project/expense/types";

const AdminTransactions = () => {
  const [transactionType, setTransactionType] = useState<TransactionType>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  const { projects, invoices: rawInvoices, expenses: rawExpenses } = useTransactions(
    transactionType,
    statusFilter,
    projectFilter
  );

  console.log('AdminTransactions - Projects data received:', projects);
  console.log('AdminTransactions - Invoices data received:', rawInvoices);
  console.log('AdminTransactions - Expenses data received:', rawExpenses);

  // Type cast the data to match the expected interfaces
  const invoices = (rawInvoices || []).map(invoice => {
    // Extract milestone name safely - handle potential null values
    let milestone_name = null;
    if (invoice.milestones) {
      milestone_name = typeof invoice.milestones === 'object' && 'name' in invoice.milestones
        ? invoice.milestones.name
        : null;
    }
    
    // Extract project name safely - handle potential null values
    let project_name = null;
    if (invoice.projects) {
      project_name = typeof invoice.projects === 'object' && 'name' in invoice.projects
        ? invoice.projects.name
        : null;
    }
    
    return {
      id: invoice.id,
      invoice_number: invoice.invoice_number || '',
      amount: invoice.amount,
      status: invoice.status,
      created_at: invoice.created_at,
      milestone_id: invoice.milestone_id,
      project_id: invoice.project_id,
      milestone_name: milestone_name,
      project_name: project_name,
      updated_at: invoice.created_at, // Use created_at as a fallback
      client_id: "", // Default value for required field
      due_date: undefined, // Optional field
      description: undefined, // Optional field
      notes: undefined, // Optional field
      payment_method: invoice.payment_method || null,
      payment_date: invoice.payment_date || null,
      payment_reference: invoice.payment_reference || null,
      payment_gateway: invoice.payment_gateway || null,
      payment_method_type: (invoice.payment_method as "cc" | "check" | "transfer" | "cash" | "simulated" | null) || null,
      simulation_data: invoice.simulation_data || null
    } as Invoice;
  });

  const expenses = (rawExpenses || []).map(expense => {
    // Extract project name safely - handle potential null values
    let project_name: string = 'Unknown';
    if (expense.projects) {
      project_name = typeof expense.projects === 'object' && 'name' in expense.projects
        ? String(expense.projects.name)
        : 'Unknown';
    }
    
    return {
      id: expense.id,
      name: expense.name,
      payee: expense.payee,
      amount: expense.amount,
      expense_date: expense.expense_date,
      notes: expense.notes,
      project_id: expense.project_id,
      project: { name: project_name },
      expense_type: expense.expense_type || "other",
      payment_status: expense.payment_status || "due",
      created_at: expense.expense_date, // Use expense_date as fallback
      updated_at: expense.expense_date, // Use expense_date as fallback
      amount_due: expense.amount_due || expense.amount // If amount_due is not available, use amount
    } as Expense;
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AdminNav />
      <div className="flex-1 container mx-auto p-6 mt-16">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Transaction Oversight</h1>
        </div>

        <TransactionFilters
          transactionType={transactionType}
          setTransactionType={setTransactionType}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          projectFilter={projectFilter}
          setProjectFilter={setProjectFilter}
          projects={projects || []}
        />

        <TransactionsTable
          transactionType={transactionType}
          invoices={invoices}
          expenses={expenses}
        />
      </div>
    </div>
  );
};

export default AdminTransactions;
