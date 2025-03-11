import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/database.types';

// Define a type for project users
interface ProjectUser {
  id: string;
  project_id: string;
  user_id: string;
  role?: string;
  created_at?: string;
}

export const ProjectRelationshipsDebug = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [projectUsers, setProjectUsers] = useState<ProjectUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("No authenticated user found");
          setLoading(false);
          return;
        }

        // Get current user profile
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          setError(`Error fetching user profile: ${profileError.message}`);
          setLoading(false);
          return;
        }

        setCurrentUser(userProfile);
        console.log("Current user profile:", userProfile);

        // Get all projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*');

        if (projectsError) {
          setError(`Error fetching projects: ${projectsError.message}`);
          setLoading(false);
          return;
        }

        setProjects(projectsData || []);
        console.log(`Found ${projectsData?.length || 0} projects`);

        // Since 'project_users' table doesn't exist, we'll use the project's relationships
        // Use relationships from projects table itself
        // Project relationships are managed via contractor_id, owner_user_id, and pm_user_id fields
        const typedProjectUsers: ProjectUser[] = [];
        
        // For each project, extract user relationships
        projectsData?.forEach(project => {
          // Extract owner relationship
          if (project.owner_user_id) {
            typedProjectUsers.push({
              id: `owner-${project.id}`,
              project_id: project.id,
              user_id: project.owner_user_id,
              role: 'owner'
            });
          }
          
          // Extract contractor relationship
          if (project.contractor_id) {
            typedProjectUsers.push({
              id: `contractor-${project.id}`,
              project_id: project.id,
              user_id: project.contractor_id,
              role: 'contractor'
            });
          }
          
          // Extract project manager relationship
          if (project.pm_user_id) {
            typedProjectUsers.push({
              id: `pm-${project.id}`,
              project_id: project.id,
              user_id: project.pm_user_id,
              role: 'project_manager'
            });
          }
        });
        
        setProjectUsers(typedProjectUsers);
        console.log(`Created ${typedProjectUsers.length} project user relationships from project data`);

        // Get all profiles
        const { data: allProfiles, error: allProfilesError } = await supabase
          .from('profiles')
          .select('*');

        if (allProfilesError) {
          console.error("Error fetching all profiles:", allProfilesError);
        } else {
          console.log(`Found ${allProfiles?.length || 0} total profiles`);
          
          // Check which projects the current user is associated with
          const currentUserProjectIds: string[] = [];
          
          for (const pu of typedProjectUsers) {
            if (pu.user_id === user.id) {
              currentUserProjectIds.push(pu.project_id);
            }
          }
            
          console.log(`Current user is associated with ${currentUserProjectIds.length} projects:`, currentUserProjectIds);
          
          // Find other users associated with these projects
          const relatedUserIds: string[] = [];
          
          for (const pu of typedProjectUsers) {
            if (currentUserProjectIds.includes(pu.project_id) && pu.user_id !== user.id) {
              relatedUserIds.push(pu.user_id);
            }
          }
            
          console.log(`Found ${relatedUserIds.length} other users associated with the same projects:`, relatedUserIds);
          
          // Find profiles for these users
          const relatedProfiles = allProfiles?.filter(p => relatedUserIds.includes(p.id));
          console.log(`Found ${relatedProfiles?.length || 0} profiles for related users:`, relatedProfiles);
        }
      } catch (e) {
        console.error("Error in project relationships debug:", e);
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group project users by project
  const usersByProject = projects.map(project => {
    const users = projectUsers
      .filter(pu => pu.project_id === project.id)
      .map(pu => pu.user_id);
    return {
      project,
      userIds: users
    };
  });

  return (
    <Card className="mt-8 border-green-300">
      <CardHeader>
        <CardTitle className="text-green-500">Project Relationships Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <div className="bg-red-100 p-3 rounded-md">
              <h3 className="font-bold mb-2">Error</h3>
              <p className="text-red-500">{error}</p>
            </div>
          )}

          <div className="bg-gray-100 p-3 rounded-md">
            <h3 className="font-bold mb-2">Current User</h3>
            {loading ? (
              <p>Loading...</p>
            ) : currentUser ? (
              <div className="text-sm">
                <p><strong>ID:</strong> {currentUser.id}</p>
                <p><strong>Name:</strong> {currentUser.full_name ?? 'N/A'}</p>
                <p><strong>Role:</strong> {currentUser.role ?? 'N/A'}</p>
                <p><strong>GC Account ID:</strong> {currentUser.gc_account_id ?? 'N/A'}</p>
              </div>
            ) : (
              <p>No user data available</p>
            )}
          </div>

          <div className="bg-gray-100 p-3 rounded-md">
            <h3 className="font-bold mb-2">Projects and Users</h3>
            {loading ? (
              <p>Loading...</p>
            ) : usersByProject.length > 0 ? (
              <div>
                <p className="mb-2">Found {projects.length} projects with user relationships:</p>
                <div className="space-y-3">
                  {usersByProject.map((item) => (
                    <div key={item.project.id} className="border p-2 rounded">
                      <p className="font-bold">{item.project.name ?? 'Unnamed Project'}</p>
                      <p className="text-xs">Project ID: {item.project.id}</p>
                      <p className="text-xs">GC Account ID: {item.project.gc_account_id ?? 'N/A'}</p>
                      <div className="mt-2">
                        <p className="text-xs font-semibold">Users ({item.userIds.length}):</p>
                        <ul className="text-xs list-disc pl-5">
                          {item.userIds.map((userId) => (
                            <li key={userId}>
                              {userId === currentUser?.id ? 
                                <span className="font-bold">{userId} (Current User)</span> : 
                                userId}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p>No project relationships found</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
