import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useProjectFiles } from '@/hooks/useProjectFiles';
import { ProjectFileWithUploaderInfo } from '@/types/projectFiles';
import { 
  FileIcon, 
  FileText as FileTextIcon, 
  Image as ImageIcon, 
  File as FileDocIcon, 
  Trash as TrashIcon, 
  Download as DownloadIcon,
  AlertCircle
} from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDistanceToNow } from 'date-fns';

interface ProjectFileListProps {
  projectId: string;
  isClient?: boolean;
}

export function ProjectFileList({ projectId, isClient = false }: ProjectFileListProps) {
  const { 
    files, 
    clientSharedFiles, 
    isLoading, 
    isError, 
    updateFileSharing, 
    deleteFile, 
    getSignedFileUrl 
  } = useProjectFiles(projectId);
  
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [sharingUpdates, setSharingUpdates] = useState<Record<string, boolean>>({});
  const [sharingError, setSharingError] = useState<string | null>(null);

  // Display client-shared files only if this is the client view
  const displayFiles = isClient ? clientSharedFiles : files;

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    } else if (mimeType === 'application/pdf') {
      return <FileDocIcon className="h-5 w-5 text-red-500" />;
    } else if (mimeType.startsWith('text/')) {
      return <FileTextIcon className="h-5 w-5 text-green-500" />;
    } else {
      return <FileIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  const handleSharingToggle = async (file: ProjectFileWithUploaderInfo) => {
    const newSharingState = !file.share_with_client;
    setSharingError(null);
    
    // Optimistically update UI
    setSharingUpdates({
      ...sharingUpdates,
      [file.id]: newSharingState
    });
    
    try {
      await updateFileSharing(file.id, newSharingState);
    } catch (error: any) {
      // Revert on error
      setSharingUpdates({
        ...sharingUpdates,
        [file.id]: file.share_with_client
      });
      setSharingError(error.message || 'Error updating file sharing settings');
      console.error('Error updating file sharing:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      const result = await deleteFile(fileToDelete);
      if (result) {
        setFileToDelete(null);
      }
    } catch (error: any) {
      setDeleteError(error.message || 'Failed to delete file. Please try again.');
      console.error('Error deleting file:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#172b70]">
            {isClient ? 'Project Documents' : 'Project Files'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6b24]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#172b70]">
            {isClient ? 'Project Documents' : 'Project Files'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading project files. Please refresh the page and try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-[#172b70]">
          {isClient ? 'Project Documents' : 'Project Files'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sharingError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{sharingError}</AlertDescription>
          </Alert>
        )}
        
        {displayFiles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {isClient 
              ? 'No documents have been shared for this project yet.' 
              : 'No files have been uploaded for this project yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Uploaded</TableHead>
                  {!isClient && <TableHead>Share with Client</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.mime_type)}
                        <span className="font-medium">{file.filename}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatFileSize(file.file_size)}</TableCell>
                    <TableCell>{file.uploader?.full_name || 'Unknown'}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                    </TableCell>
                    {!isClient && (
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`share-${file.id}`}
                            checked={sharingUpdates[file.id] !== undefined 
                              ? sharingUpdates[file.id] 
                              : file.share_with_client}
                            onCheckedChange={() => handleSharingToggle(file)}
                          />
                          <Label htmlFor={`share-${file.id}`} className="sr-only">
                            Share with client
                          </Label>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const signedUrl = await getSignedFileUrl(file.id);
                            window.open(signedUrl, '_blank');
                          }}
                        >
                          <DownloadIcon className="h-4 w-4" />
                          <span className="sr-only">Download</span>
                        </Button>
                        
                        {!isClient && (
                          <AlertDialog open={fileToDelete === file.id} onOpenChange={(open) => !open && setFileToDelete(null)}>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => setFileToDelete(file.id)}
                              >
                                <TrashIcon className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the file "{file.filename}". 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              {deleteError && (
                                <Alert variant="destructive" className="mt-2">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertDescription>{deleteError}</AlertDescription>
                                </Alert>
                              )}
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDeleteConfirm();
                                  }}
                                  disabled={isDeleting}
                                  className="bg-red-500 hover:bg-red-700 text-white"
                                >
                                  {isDeleting ? 'Deleting...' : 'Delete'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
