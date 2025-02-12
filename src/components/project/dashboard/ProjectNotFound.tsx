
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ClientPageHeader } from "@/components/client-dashboard/ClientPageHeader";

interface ProjectNotFoundProps {
  dashboardRoute: string;
}

export function ProjectNotFound({ dashboardRoute }: ProjectNotFoundProps) {
  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <div className="mb-8">
        <Link to={dashboardRoute}>
          <Button variant="ghost" className="text-gray-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      <ClientPageHeader 
        pageTitle="Project Not Found"
        pageDescription="The project you're looking for doesn't exist or you don't have access to it."
      />
    </div>
  );
}
