
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { ProjectsTable } from "@/components/admin/projects/ProjectsTable";
import { ProjectFilters } from "@/components/admin/projects/ProjectFilters";
import { Header } from "@/components/landing/Header";
import { ClientPageHeader } from "@/components/client-dashboard/ClientPageHeader";

export default function AdminProjects() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateSort, setDateSort] = useState<'asc' | 'desc'>('desc');

  const { data: projects, isLoading } = useQuery({
    queryKey: ['admin-projects', statusFilter, dateSort],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select(`
          *,
          clients (
            name,
            email
          ),
          milestones (
            id,
            name,
            amount,
            status
          ),
          invoices (
            id,
            amount,
            status
          ),
          expenses (
            id,
            amount
          )
        `);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`);
      }

      query = query.order('created_at', { ascending: dateSort === 'asc' });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }

      return data;
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-16">
        <ClientPageHeader
          pageTitle="Project Management"
          pageDescription="Monitor and manage all construction projects"
        />
        <AdminNav />
        <div className="mt-8">
          <ProjectFilters
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            dateSort={dateSort}
            onDateSortChange={setDateSort}
          />
          <ProjectsTable projects={projects || []} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
}
