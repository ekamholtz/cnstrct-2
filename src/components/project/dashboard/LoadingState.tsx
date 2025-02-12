
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ClientPageHeader } from "@/components/client-dashboard/ClientPageHeader";

interface LoadingStateProps {
  dashboardRoute: string;
  isAdmin: boolean;
}

export function LoadingState({ dashboardRoute, isAdmin }: LoadingStateProps) {
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
        pageTitle="Project Details"
        pageDescription="Loading project information..."
      />
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    </div>
  );
}
