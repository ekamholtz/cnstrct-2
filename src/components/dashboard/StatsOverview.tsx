
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Clock, DollarSign, Users } from "lucide-react";
import { Project } from "@/types/project";
import { supabase } from "@/integrations/supabase/client";

interface StatsOverviewProps {
  projects: Project[];
}

export function StatsOverview({ projects }: StatsOverviewProps) {
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [activeClients, setActiveClients] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get pending approvals count (milestones pending approval)
      const { data: pendingData, error: pendingError } = await supabase
        .from('milestones')
        .select('id', { count: 'exact' })
        .eq('status', 'pending')
        .in('project_id', projects.map(p => p.id));

      if (!pendingError) {
        setPendingApprovals(pendingData?.length || 0);
      }

      // Get total revenue from paid invoices in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: revenueData, error: revenueError } = await supabase
        .from('invoices')
        .select('amount')
        .eq('status', 'paid')
        .in('project_id', projects.map(p => p.id))
        .gte('payment_date', thirtyDaysAgo.toISOString());

      if (!revenueError) {
        const total = revenueData?.reduce((sum, invoice) => sum + invoice.amount, 0) || 0;
        setTotalRevenue(total);
      }

      // Get unique active clients count
      const uniqueClientIds = [...new Set(projects.map(p => p.client_id))];
      setActiveClients(uniqueClientIds.length);
    };

    if (projects.length > 0) {
      fetchStats();
    } else {
      // Reset stats to 0 if there are no projects
      setPendingApprovals(0);
      setTotalRevenue(0);
      setActiveClients(0);
    }
  }, [projects]);

  const stats = [
    {
      label: "Active Projects",
      value: projects.filter(p => p.status === "active").length,
      icon: Building2,
      description: "Current ongoing projects"
    },
    {
      label: "Pending Approvals",
      value: pendingApprovals,
      icon: Clock,
      description: "Awaiting client approval"
    },
    {
      label: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: "Last 30 days"
    },
    {
      label: "Active Clients",
      value: activeClients,
      icon: Users,
      description: "Currently working with"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.label}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-gray-500">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
