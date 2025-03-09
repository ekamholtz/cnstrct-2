
import { ExpandableProjectCard } from "@/components/ui/expandable-card"
import { Project } from "@/types/project";

function ExpandableCardDemo() {
  // Sample project data for the demo
  const sampleProject: Project = {
    id: "sample-1",
    name: "Design System",
    address: "123 Main Street, Springfield",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    gc_account_id: "sample-gc",
    pm_user_id: "sample-pm",
    description: "A sample project for demo purposes"
  };

  const sampleProjectManager = {
    id: "sample-pm",
    full_name: "Project Manager"
  };

  const sampleClient = {
    id: "sample-client",
    name: "Sample Client",
    email: "client@example.com",
    phone_number: "555-123-4567"
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ExpandableProjectCard
        project={sampleProject}
        completionPercentage={75}
        projectManager={sampleProjectManager}
        client={sampleClient}
        contractValue={125000}
      />
      
      <ExpandableProjectCard
        project={{
          ...sampleProject,
          id: "sample-2",
          name: "Analytics Dashboard",
          status: "draft"
        }}
        completionPercentage={45}
        projectManager={sampleProjectManager}
        client={sampleClient}
        contractValue={89000}
      />
    </div>
  )
}

export { ExpandableCardDemo };
