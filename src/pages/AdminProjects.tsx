
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

  // Basic query to test data access without RLS
  const { data: projects, isLoading } = useQuery({
    queryKey: ['admin-projects', statusFilter, dateSort, searchTerm],
    queryFn: async () => {
      console.log('Fetching all projects - RLS disabled');
      
      // Simple query to test data access
      const { data, error } = await supabase
        .from('projects')
        .select('*, clients ( name, email )');

      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }

      console.log('Projects fetched:', data);
      return data || [];
    }
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
