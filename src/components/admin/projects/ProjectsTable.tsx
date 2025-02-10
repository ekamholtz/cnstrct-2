
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { calculateProjectCompletion } from "@/utils/project-calculations";

interface ProjectsTableProps {
  projects: any[];
  isLoading: boolean;
}

export function ProjectsTable({ projects, isLoading }: ProjectsTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateTotalValue = (project: any) => {
    const totalInvoices = project.invoices?.reduce((sum: number, inv: any) => 
      sum + (inv.amount || 0), 0) || 0;
    const totalExpenses = project.expenses?.reduce((sum: number, exp: any) => 
      sum + (exp.amount || 0), 0) || 0;
    return totalInvoices - totalExpenses;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project Name</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell>
                <Link 
                  to={`/project/${project.id}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {project.name}
                </Link>
                <div className="text-sm text-gray-500">{project.address}</div>
              </TableCell>
              <TableCell>
                <div>{project.clients?.name || 'No Client'}</div>
                <div className="text-sm text-gray-500">{project.clients?.email}</div>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(project.status)}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                {calculateProjectCompletion(project.milestones)}%
              </TableCell>
              <TableCell>${calculateTotalValue(project).toLocaleString()}</TableCell>
              <TableCell>
                {format(new Date(project.created_at), 'MMM d, yyyy')}
              </TableCell>
            </TableRow>
          ))}
          {projects.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                No projects found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
