
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ProjectNotFoundProps {
  errorMessage?: string;
}

export function ProjectNotFound({ errorMessage = "Project not found or you don't have permission to view it." }: ProjectNotFoundProps) {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Project Not Available</h2>
        <p className="text-gray-600 mb-8">
          {errorMessage}
        </p>
        <div className="space-x-4">
          <Button 
            onClick={() => navigate('/dashboard')}
            variant="default"
          >
            Return to Dashboard
          </Button>
          <Button 
            onClick={() => navigate(-1)}
            variant="outline"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
