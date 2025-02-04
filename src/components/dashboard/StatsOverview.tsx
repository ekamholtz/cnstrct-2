import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Clock, DollarSign, Users } from "lucide-react";
import { Project } from "@/types/project";

interface StatsOverviewProps {
  projects: Project[];
}

export function StatsOverview({ projects }: StatsOverviewProps) {
  const stats = [
    {
      label: "Active Projects",
      value: projects.filter(p => p.status === "active").length,
      icon: Building2,
      description: "Current ongoing projects"
    },
    {
      label: "Pending Approvals",
      value: "3",
      icon: Clock,
      description: "Awaiting client approval"
    },
    {
      label: "Total Revenue",
      value: "$45,231",
      icon: DollarSign,
      description: "Last 30 days"
    },
    {
      label: "Active Clients",
      value: "8",
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