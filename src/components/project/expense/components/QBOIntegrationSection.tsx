
import { Separator } from "@/components/ui/separator";
import { GLAccountSelect } from "../GLAccountSelect";

interface QBOIntegrationSectionProps {
  hasConnection: boolean;
  glAccountId: string;
  onGlAccountChange: (value: string) => void;
}

export function QBOIntegrationSection({ 
  hasConnection, 
  glAccountId, 
  onGlAccountChange 
}: QBOIntegrationSectionProps) {
  if (!hasConnection) {
    return null;
  }
  
  return (
    <>
      <Separator className="my-4" />
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">QuickBooks Integration</h4>
        <GLAccountSelect 
          value={glAccountId} 
          onChange={onGlAccountChange} 
        />
      </div>
    </>
  );
}
