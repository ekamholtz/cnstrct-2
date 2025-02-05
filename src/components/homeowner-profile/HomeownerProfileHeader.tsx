
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface HomeownerProfileHeaderProps {
  isEditing: boolean;
  onEdit: () => void;
}

export function HomeownerProfileHeader({ isEditing, onEdit }: HomeownerProfileHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        {!isEditing && (
          <Button onClick={onEdit} variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>
      <p className="text-gray-600">
        Manage your personal information and contact details
      </p>
    </div>
  );
}
