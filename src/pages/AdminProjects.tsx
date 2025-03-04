
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { ProjectsTable } from "@/components/admin/projects/ProjectsTable";
import { ProjectFilters } from "@/components/admin/projects/ProjectFilters";
import { ClientPageHeader } from "@/components/client-dashboard/ClientPageHeader";
import { Database } from "@/integrations/supabase/types";

type ProjectStatus = Database["public"]["Enums"]["project_status"];

export default function AdminProjects() {
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateSort, setDateSort] = useState<'asc' | 'desc'>('desc');

  const { data: projects, isLoading } = useQuery({
    queryKey: ['admin-projects', statusFilter, dateSort, searchTerm],
    queryFn: async () => {
      console.log('Fetching projects with filters:', { statusFilter, dateSort, searchTerm });
      
      // Use a single query with nested selects
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

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`);
      }

      query = query.order('created_at', { ascending: dateSort === 'asc' });

      const { data: projectsData, error: projectsError } = await query;

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        throw projectsError;
      }

      console.log('Successfully fetched projects:', projectsData);
      return projectsData || [];
    },
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AdminNav />
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        <ClientPageHeader
          pageTitle="Project Management"
          pageDescription="Monitor and manage all construction projects"
        />
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
