import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useProjectFiles } from '@/hooks/useProjectFiles';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProjectFileUploadProps {
  projectId: string;
}

export function ProjectFileUpload({ projectId }: ProjectFileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [shareWithClient, setShareWithClient] = useState(false);
  const { uploadFile, isUploading, uploadProgress, uploadError } = useProjectFiles(projectId);
  const [fileTypeError, setFileTypeError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileTypeError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Basic client-side validation
      if (file.size > 50 * 1024 * 1024) {
        setFileTypeError('File size exceeds the maximum limit of 50MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    if (fileTypeError) return;

    try {
      await uploadFile(selectedFile, shareWithClient);
      // Reset form after successful upload
      setSelectedFile(null);
      setShareWithClient(false);
      // Reset the file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
      // Error is already handled by the hook
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-[#172b70]">Upload Project File</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">Select File</Label>
            <div className="flex items-center gap-2">
              <input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isUploading}
              />
            </div>
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="share-with-client"
              checked={shareWithClient}
              onCheckedChange={(checked) => setShareWithClient(checked === true)}
              disabled={isUploading}
            />
            <Label htmlFor="share-with-client" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Share with client
            </Label>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Uploading...</span>
                <span className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {(uploadError || fileTypeError) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadError || fileTypeError}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            disabled={!selectedFile || isUploading || !!fileTypeError}
            className="bg-[#ff6b24] hover:bg-[#e55a13] text-white"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
