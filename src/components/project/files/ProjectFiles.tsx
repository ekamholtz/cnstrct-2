import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectFileUpload } from './ProjectFileUpload';
import { ProjectFileList } from './ProjectFileList';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ProjectFilesProps {
  projectId: string;
  userRole: string | null;
}

// Fallback UI for errors
const ErrorFallback = ({ title, message }: { title: string, message: string }) => (
  <Alert className="my-4">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
);

export function ProjectFiles({ projectId, userRole }: ProjectFilesProps) {
  // Add debug logging
  console.log('ProjectFiles component rendering', { projectId, userRole, env: process.env.NODE_ENV });
  
  const isClient = userRole === 'homeowner';
  const canUpload = userRole === 'gc_admin' || userRole === 'project_manager';
  
  return (
    <div className="space-y-6">
      <ErrorBoundary
        fallback={
          <ErrorFallback 
            title="Error Loading Files" 
            message="There was a problem loading the project files. Please try refreshing the page." 
          />
        }
      >
        {/* Only show file upload for GC admins and Project Managers */}
        {canUpload && (
          <ProjectFileUpload projectId={projectId} />
        )}
        
        {/* Show file list for all users, but with different views */}
        <ProjectFileList projectId={projectId} isClient={isClient} />
      </ErrorBoundary>
    </div>
  );
}
