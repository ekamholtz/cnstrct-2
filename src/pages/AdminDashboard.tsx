
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/admin/AdminNav";

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
}

const AdminDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_stats_cache')
        .select('*');
      
      if (error) {
        console.error('Error fetching admin stats:', error);
        throw error;
      }
      
      return data.reduce((acc, stat) => ({
        ...acc,
        [stat.stat_type]: stat.value
      }), {} as AdminStats);
    }
  });

  const { data: recentActions, isLoading: actionsLoading } = useQuery({
    queryKey: ['admin-actions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_actions')
        .select(`
          *,
          admin:profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching admin actions:', error);
        throw error;
      }

      return data;
    }
  });

  const formatValue = (value: number | undefined, type: string) => {
    if (value === undefined) return 'Loading...';
    if (type === 'total_revenue') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    }
    return new Intl.NumberFormat().format(value);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Total Users</h3>
            <p className="text-3xl font-bold">
              {statsLoading ? 'Loading...' : formatValue(stats?.total_users, 'total_users')}
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Active Projects</h3>
            <p className="text-3xl font-bold">
              {statsLoading ? 'Loading...' : formatValue(stats?.active_projects, 'active_projects')}
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold">
              {statsLoading ? 'Loading...' : formatValue(stats?.total_revenue, 'total_revenue')}
            </p>
          </Card>
        </div>
        
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
          <Card className="p-6">
            {actionsLoading ? (
              <p className="text-gray-500">Loading recent activity...</p>
            ) : recentActions && recentActions.length > 0 ? (
              <div className="space-y-4">
                {recentActions.map((action) => (
                  <div key={action.id} className="border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{action.action_type}</p>
                        <p className="text-sm text-gray-600">
                          {action.admin?.full_name} - {action.entity_type}
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
              <p className="text-gray-500">No recent activity to display</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
