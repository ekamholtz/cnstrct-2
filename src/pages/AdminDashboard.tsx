
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type AdminStats = {
  total_users?: number;
  active_projects?: number;
  total_revenue?: number;
}

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_stats_cache')
        .select('*');
      
      if (error) {
        console.error('Error fetching admin stats:', error);
        throw error;
      }
      
      // Convert array to object with stat_type as keys
      return data.reduce((acc, stat) => ({
        ...acc,
        [stat.stat_type]: stat.value
      }), {} as AdminStats);
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

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Total Users</h3>
          <p className="text-3xl font-bold">
            {isLoading ? 'Loading...' : formatValue(stats?.total_users, 'total_users')}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Active Projects</h3>
          <p className="text-3xl font-bold">
            {isLoading ? 'Loading...' : formatValue(stats?.active_projects, 'active_projects')}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold">
            {isLoading ? 'Loading...' : formatValue(stats?.total_revenue, 'total_revenue')}
          </p>
        </Card>
      </div>
      
      {/* Recent activity section kept for future implementation */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
        <Card className="p-6">
          <p className="text-gray-500">No recent activity to display</p>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
