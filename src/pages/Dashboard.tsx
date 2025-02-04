import { useEffect, useState } from "react";
import { Header } from "@/components/landing/Header";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Clock, DollarSign, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ProjectCreationForm from "@/components/projects/ProjectCreationForm";

interface Project {
  id: string;
  name: string;
  address: string;
  status: string;
  created_at: string;
}

interface DashboardStat {
  label: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load projects. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const stats: DashboardStat[] = [
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">General Contractor Dashboard</h1>
            <p className="text-gray-600">Manage your projects and track progress</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Fill in the project details below to create a new project.
                </DialogDescription>
              </DialogHeader>
              <ProjectCreationForm 
                onSuccess={() => {
                  setIsDialogOpen(false);
                  fetchProjects();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
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

        {/* Recent Projects */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : projects.length > 0 ? (
              projects.map((project) => (
                <div key={project.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-500">{project.address}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      project.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-8 text-gray-500">
                No projects found. Create your first project to get started.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}