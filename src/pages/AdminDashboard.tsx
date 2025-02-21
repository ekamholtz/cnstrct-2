
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { Loader2 } from "lucide-react";

type AdminStats = {
  total_users?: number;
  active_projects?: number;
  total_revenue?: number;
}

type AdminAction = {
  id: string;
  admin_id: string;
  entity_type: string;
  entity_id: string;
  action_type: string;
  details: any;
  created_at: string;
  admin_name?: string; // Add this field for admin name
}

const AdminDashboard = () => {
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      console.log('Fetching admin stats...');
      const { data, error } = await supabase
        .from('admin_stats_cache')
        .select('*');
      
      if (error) {
        console.error('Error fetching admin stats:', error);
        throw error;
      }

      console.log('Admin stats raw data:', data);
      
      // Transform the data into the expected format
      const transformedStats = data.reduce((acc, stat) => {
        if (stat.stat_type && stat.value !== undefined) {
          acc[stat.stat_type] = Number(stat.value);
        }
        return acc;
      }, {} as AdminStats);

      console.log('Transformed admin stats:', transformedStats);
      return transformedStats;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: recentActions, isLoading: actionsLoading, error: actionsError } = useQuery({
    queryKey: ['admin-actions'],
    queryFn: async () => {
      console.log('Fetching admin actions...');
      // First get the admin actions
      const { data: actions, error: actionsError } = await supabase
        .from('admin_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (actionsError) {
        console.error('Error fetching admin actions:', actionsError);
        throw actionsError;
      }

      // Then fetch the admin names separately
      const adminIds = actions.map(action => action.admin_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', adminIds);

      if (profilesError) {
        console.error('Error fetching admin profiles:', profilesError);
        throw profilesError;
      }

      // Create a map of admin IDs to names
      const adminNames = new Map(profiles.map(profile => [profile.id, profile.full_name]));

      // Combine the data
      const actionsWithNames = actions.map(action => ({
        ...action,
        admin_name: adminNames.get(action.admin_id) || 'Unknown Admin'
      }));

      console.log('Recent actions:', actionsWithNames);
      return actionsWithNames;
    }
  });

  const formatValue = (value: number | undefined, type: string) => {
    if (type === 'total_revenue' && typeof value === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    }
    return typeof value === 'number' 
      ? new Intl.NumberFormat().format(value)
      : '0';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (statsError || actionsError) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <AdminNav />
        <div className="flex-1 container mx-auto p-6 mt-16">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <p className="font-semibold">Error loading dashboard data</p>
            <p className="text-sm mt-1">{statsError?.message || actionsError?.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AdminNav />
      <div className="flex-1 container mx-auto p-6 mt-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Total Users</h3>
            <p className="text-3xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              ) : (
                formatValue(stats?.total_users, 'total_users')
              )}
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Active Projects</h3>
            <p className="text-3xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              ) : (
                formatValue(stats?.active_projects, 'active_projects')
              )}
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              ) : (
                formatValue(stats?.total_revenue, 'total_revenue')
              )}
            </p>
          </Card>
        </div>
        
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
          <Card className="p-6">
            {actionsLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : recentActions && recentActions.length > 0 ? (
              <div className="space-y-4">
                {recentActions.map((action) => (
                  <div key={action.id} className="border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{action.action_type}</p>
                        <p className="text-sm text-gray-600">
                          {action.admin_name} - {action.entity_type}
                        </p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(action.created_at)}
                      </span>
                    </div>
                    {action.details && (
                      <p className="text-sm text-gray-600 mt-1">
                        {JSON.stringify(action.details)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent activity to display</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
