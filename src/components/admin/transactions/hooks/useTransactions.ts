
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { TransactionType, TransactionStatus } from "../TransactionFilters";
import type { Expense } from "@/components/project/expense/types";

interface Project {
  id: string;
  name: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  created_at: string;
  project_id: string;
  milestones?: { name: string } | null;
  projects?: { name: string } | null;
}

export function useTransactions(
  transactionType: TransactionType,
  statusFilter: TransactionStatus,
  projectFilter: string
) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);

  // Fetch projects
  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Fetch invoices
  const { data: invoices } = useQuery({
    queryKey: ["admin-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          id,
          invoice_number,
          amount,
          status,
          created_at,
          project_id,
          milestones (name),
          projects (name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch expenses
  const { data: expenses } = useQuery({
    queryKey: ["admin-expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select(`
          id,
          name,
          expense_number,
          amount,
          amount_due,
          payee,
          expense_date,
          expense_type,
          payment_status,
          notes,
          project_id,
          gc_account_id,
          created_at,
          updated_at,
          project:project_id (name)
        `)
        .order("expense_date", { ascending: false });

      if (error) throw error;
      return data as Expense[];
    },
  });

  // Update projects when data changes
  useEffect(() => {
    if (projectsData) {
      setProjects(projectsData);
    }
  }, [projectsData]);

  // Filter invoices based on transaction type, status, and project
  useEffect(() => {
    if (invoices) {
      let filtered = [...invoices];

      // Filter by project
      if (projectFilter !== "all") {
        filtered = filtered.filter((invoice) => invoice.project_id === projectFilter);
      }

      // Filter by status
      if (statusFilter !== "all") {
        filtered = filtered.filter((invoice) => {
          if (statusFilter === "pending_payment") {
            return ["pending_payment", "due", "partially_paid"].includes(invoice.status);
          }
          return invoice.status === statusFilter;
        });
      }

      setFilteredInvoices(filtered);
    }
  }, [invoices, statusFilter, projectFilter]);

  // Filter expenses based on transaction type, status, and project
  useEffect(() => {
    if (expenses) {
      let filtered = [...expenses];

      // Filter by project
      if (projectFilter !== "all") {
        filtered = filtered.filter((expense) => expense.project_id === projectFilter);
      }

      // Filter by status
      if (statusFilter !== "all") {
        filtered = filtered.filter((expense) => {
          if (statusFilter === "pending_payment") {
            return ["due", "partially_paid"].includes(expense.payment_status);
          }
          return expense.payment_status === statusFilter;
        });
      }

      setFilteredExpenses(filtered);
    }
  }, [expenses, statusFilter, projectFilter]);

  return {
    projects,
    invoices: filteredInvoices,
    expenses: filteredExpenses,
  };
}
