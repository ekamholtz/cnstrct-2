import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function ProjectHeader() {
  return (
    <div className="mb-8">
      <Link to="/dashboard">
        <Button variant="ghost" className="text-gray-600">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </Link>
    </div>
  );
}