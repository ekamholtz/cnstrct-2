
import { useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { TransactionFilters, TransactionType, TransactionStatus } from "@/components/admin/transactions/TransactionFilters";
import { TransactionsTable } from "@/components/admin/transactions/TransactionsTable";
import { useTransactions } from "@/components/admin/transactions/hooks/useTransactions";

const AdminTransactions = () => {
  const [transactionType, setTransactionType] = useState<TransactionType>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  const { projects, invoices, expenses } = useTransactions(
    transactionType,
    statusFilter,
    projectFilter
  );

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
