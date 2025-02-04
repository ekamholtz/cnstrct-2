import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProjectHeaderProps {
  name: string;
  address: string;
}

export function ProjectHeader({ name, address }: ProjectHeaderProps) {
  const { toast } = useToast();

  return (
    <div className="mb-8">
      <div className="mb-8">
        <Link to="/dashboard">
          <Button variant="ghost" className="text-gray-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
      </div>

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
    </div>
  );
}