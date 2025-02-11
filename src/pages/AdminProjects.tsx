
import { useEffect, useState } from "react";
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
      
      // First fetch the projects with basic client info
      let query = supabase
        .from('projects')
        .select(`
          id,
          name,
          address,
          status,
          created_at,
          client_id,
          clients (
            name,
            email
          )
        `);

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

      // Then fetch related data for each project
      const projectsWithDetails = await Promise.all(
        (projectsData || []).map(async (project) => {
          // Fetch milestones
          const { data: milestones } = await supabase
            .from('milestones')
            .select('id, name, amount, status')
            .eq('project_id', project.id);

          // Fetch invoices
          const { data: invoices } = await supabase
            .from('invoices')
            .select('id, amount, status')
            .eq('project_id', project.id);

          // Fetch expenses
          const { data: expenses } = await supabase
            .from('expenses')
            .select('id, amount')
            .eq('project_id', project.id);

          return {
            ...project,
            milestones: milestones || [],
            invoices: invoices || [],
            expenses: expenses || []
          };
        })
      );

      console.log('Successfully fetched projects with details:', projectsWithDetails);
      return projectsWithDetails;
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
