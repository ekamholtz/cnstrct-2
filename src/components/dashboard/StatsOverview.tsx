
import { useEffect, useState } from "react";
import { Building2, Clock, DollarSign, Users } from "lucide-react";
import { Project } from "@/types/project";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

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
      const { data: pendingData, error: pendingError } = await supabase
        .from('milestones')
        .select('id', { count: 'exact' })
        .eq('status', 'pending')
        .in('project_id', projects.map(p => p.id));

      if (!pendingError) {
        setPendingApprovals(pendingData?.length || 0);
      }

      // Get total contract value from active projects' milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('milestones')
        .select('amount')
        .in('project_id', projects.filter(p => p.status === 'active').map(p => p.id));

      if (!milestonesError) {
        const total = milestonesData?.reduce((sum, milestone) => sum + (milestone.amount || 0), 0) || 0;
        setTotalContractValue(total);
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
      setTotalContractValue(0);
      setActiveClients(0);
    }
  }, [projects]);

  const stats = [
    {
      label: "Active Projects",
      value: projects.filter(p => p.status === "active").length,
      icon: Building2,
      description: "Current ongoing projects",
      link: "/gc-projects",
      color: "shadow-sm",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      label: "Pending Approvals",
      value: pendingApprovals,
      icon: Clock,
      description: "Awaiting client approval",
      color: "shadow-sm",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600"
    },
    {
      label: "Total Active Project Value",
      value: `$${totalContractValue.toLocaleString()}`,
      icon: DollarSign,
      description: "Active projects",
      link: "/gc-projects",
      color: "shadow-sm",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600"
    },
    {
      label: "Active Clients",
      value: activeClients,
      icon: Users,
      description: "Currently working with",
      color: "shadow-sm",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const CardWrapper = stat.link ? Link : 'div';
        return (
          <CardWrapper 
            key={stat.label} 
            to={stat.link || ''} 
            className={`block transition-transform hover:scale-[1.02] ${stat.link ? 'cursor-pointer' : ''}`}
          >
            <div className={`bg-white rounded-lg p-5 h-full hover:shadow-md transition-all duration-300 border border-gray-100`}>
              <div className="flex items-center justify-between">
                <div className={`${stat.iconBg} p-3 rounded-lg ${stat.iconColor}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  {stat.label}
                </h3>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
                <p className="text-sm text-slate-500 mt-1">{stat.description}</p>
              </div>
            </div>
          </CardWrapper>
        );
      })}
    </div>
  );
}
