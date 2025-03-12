
import { useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { TransactionFilters, TransactionType, TransactionStatus } from "@/components/admin/transactions/TransactionFilters";
import { TransactionsTable } from "@/components/admin/transactions/TransactionsTable";
import { useTransactions } from "@/components/admin/transactions/hooks/useTransactions";
import { Invoice } from "@/types/invoice-types";
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

  // Type cast the data to match the expected interfaces
  const invoices = (rawInvoices || []).map(invoice => {
    // Safely access nested properties
    const milestone_name = invoice.milestones && typeof invoice.milestones === 'object' 
      ? invoice.milestones.name 
      : undefined;
    
    const project_name = invoice.projects && typeof invoice.projects === 'object' 
      ? invoice.projects.name 
      : undefined;
    
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
      notes: undefined // Optional field
    } as Invoice;
  });

  const expenses = (rawExpenses || []).map(expense => {
    // Safely access project name
    const project_name = expense.projects && typeof expense.projects === 'object'
      ? expense.projects.name 
      : 'Unknown';
    
    return {
      id: expense.id,
      name: expense.name,
      payee: expense.payee,
      amount: expense.amount,
      expense_date: expense.expense_date,
      notes: expense.notes,
      project_id: expense.project_id,
      project: { name: project_name },
      expense_type: "other" as const, // Default to "other" if not specified
      payment_status: "due" as const, // Default to "due" if not specified
      created_at: expense.expense_date, // Use expense_date as fallback
      updated_at: expense.expense_date // Use expense_date as fallback
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
          projects={projects}
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
