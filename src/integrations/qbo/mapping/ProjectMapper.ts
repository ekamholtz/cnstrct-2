
import type { ClientProject } from "@/types/project-types";

export class ProjectMapper {
  /**
   * Map a project to a QBO tag/class name
   */
  mapProjectToTagName(project: ClientProject): string {
    // In QBO, tags/classes need to be unique and descriptive
    // Format: ProjectName_ProjectID
    return `${project.name}_${project.id.slice(0, 6)}`;
  }
}
