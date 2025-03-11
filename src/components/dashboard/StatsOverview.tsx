import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Clock, DollarSign, Users } from "lucide-react";
import { Project } from "@/types/project";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Database } from "@/types/supabase";

interface StatsOverviewProps {
  projects: Project[];
}

export function StatsOverview({ projects }: StatsOverviewProps) {
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [totalContractValue, setTotalContractValue] = useState(0);
  const [activeClients, setActiveClients] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get pending approvals count (milestones pending approval)
      // Using type assertion to handle the table that's in the schema but not in the type
      const { data: pendingData, error: pendingError } = await (supabase as any)
        .from('milestones')
        .select('id', { count: 'exact' })
        .eq('status', 'pending')
        .in('project_id', projects.map(p => p.id));

      if (!pendingError) {
        setPendingApprovals(pendingData?.length || 0);
      }

      // Get total contract value from active projects' milestones
      // Using type assertion to handle the table that's in the schema but not in the type
      const { data: milestonesData, error: milestonesError } = await (supabase as any)
        .from('milestones')
        .select('amount')
        .in('project_id', projects.filter(p => p.status === 'active').map(p => p.id));

      if (!milestonesError && milestonesData) {
        const total = milestonesData.reduce((sum: number, milestone: any) => 
          sum + (milestone && typeof milestone === 'object' && typeof milestone.amount === 'number' ? milestone.amount : 0), 
          0
        );
        setTotalContractValue(total);
      }

      // Get unique active clients count
      // Using optional chaining and type assertion to safely access client_id
      const uniqueClientIds = [...new Set(projects
        .map(p => (p as any).client_id)
        .filter(id => id !== undefined && id !== null)
      )];
      setActiveClients(uniqueClientIds.length);
    };

    if (projects.length > 0) {
      fetchStats();
    } else {
      // Reset stats to 0 if there are no projects
      setPendingApprovals(0);
      setTotalContractValue(0);
      setActiveClients(0);
    }
  }, [projects]);

  const stats = [
    {
      label: "Active Projects",
      value: projects.filter(p => p.status === "active").length,
      icon: Building2,
      iconColor: "text-cnstrct-navy",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Current ongoing projects",
      link: "/gc-projects"
    },
    {
      label: "Pending Approvals",
      value: pendingApprovals,
      icon: Clock,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      description: "Awaiting client approval"
    },
    {
      label: "Total Active Project Value",
      value: `$${totalContractValue.toLocaleString()}`,
      icon: DollarSign,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      description: "Active projects",
      link: "/gc-projects"
    },
    {
      label: "Active Clients",
      value: activeClients,
      icon: Users,
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      description: "Currently working with"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const CardWrapper = stat.link ? Link : 'div';
        return (
          <CardWrapper 
            key={stat.label} 
            to={stat.link || ''} 
            className={stat.link ? "block transition-all hover:scale-102 hover:shadow-card-hover" : undefined}
          >
            <Card className={`border ${stat.borderColor} shadow-sm h-full`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div className={`${stat.bgColor} p-2 rounded-lg`}>
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cnstrct-navy">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          </CardWrapper>
        );
      })}
    </div>
  );
}
