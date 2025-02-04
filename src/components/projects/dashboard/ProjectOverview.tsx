import { Building2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectOverviewProps {
  name?: string;
  address?: string;
  status?: string;
}

export function ProjectOverview({ name, address, status }: ProjectOverviewProps) {
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
          <div className="flex items-center mt-2 text-gray-600">
            <Building2 className="h-4 w-4 mr-2" />
            <p>{address}</p>
          </div>
        </div>
        <Button onClick={() => toast({
          title: "Coming Soon",
          description: "Project editing will be available soon!",
        })}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Project Details
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getStatusColor(status || '')}`}>
            {status?.charAt(0).toUpperCase() + status?.slice(1)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}