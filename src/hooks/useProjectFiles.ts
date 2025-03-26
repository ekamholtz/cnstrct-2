import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProjectFileService } from '@/services/projectFileService';
import { FileUploadParams, FileUpdateParams, ProjectFileWithUploaderInfo, ProjectFile } from '@/types/projectFiles';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for managing project files
 * @param projectId The ID of the project
 */
export const useProjectFiles = (projectId: string) => {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Query for fetching project files
  const {
    data: filesData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['projectFiles', projectId],
    queryFn: async () => {
      const result = await ProjectFileService.getProjectFiles(projectId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.files;
    },
    enabled: !!projectId,
  });

  const files = filesData || [];

  // Mutation for uploading a file
  const uploadFileMutation = useMutation({
    mutationFn: async (params: FileUploadParams) => {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 20;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 500);
      
      try {
        const result = await ProjectFileService.uploadFile(params);
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        if (result.error) {
          setUploadError(result.error);
          setTimeout(() => setIsUploading(false), 500);
          throw new Error(result.error);
        }
        
        setTimeout(() => setIsUploading(false), 500);
        return result.file;
      } catch (err: any) {
        clearInterval(progressInterval);
        const errorMessage = err.message || 'Upload failed';
        setUploadError(errorMessage);
        setIsUploading(false);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectFiles', projectId] });
    }
  });

  // Mutation for updating file sharing settings
  const updateFileSharingMutation = useMutation({
    mutationFn: async (params: FileUpdateParams) => {
      const result = await ProjectFileService.updateFileSharing(params);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.file;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectFiles', projectId] });
    }
  });

  // Mutation for deleting a file
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const result = await ProjectFileService.deleteFile(fileId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectFiles', projectId] });
    }
  });

  // Get a signed URL for a file
  const getSignedFileUrl = async (fileId: string): Promise<string> => {
    try {
      // First, get the file path from the database
      const { data: fileData } = await supabase
        .from('project_files')
        .select('file_url')
        .eq('id', fileId)
        .single();
      
      if (!fileData) {
        throw new Error('File not found');
      }
      
      // Check if the file_url is already a full URL or just a path
      if (fileData.file_url.startsWith('http')) {
        // For existing records with full URLs, just return the URL
        return fileData.file_url;
      } else {
        // For new records with just the file path, create a signed URL
        const { data } = await supabase.storage
          .from('project-files')
          .createSignedUrl(fileData.file_url, 60 * 60); // 1 hour expiry
        
        if (!data?.signedUrl) {
          throw new Error('Failed to generate signed URL');
        }
        
        return data.signedUrl;
      }
    } catch (error) {
      console.error('Error getting signed URL:', error);
      throw new Error('Failed to get file download link');
    }
  };

  // Filter files for client view (only show files that are shared with client)
  const clientSharedFiles = files.filter(file => file.share_with_client);

  return {
    files,
    clientSharedFiles,
    isLoading,
    isError,
    isUploading,
    uploadProgress,
    uploadError,
    uploadFile: (file: File, shareWithClient: boolean) => 
      uploadFileMutation.mutateAsync({ projectId, file, shareWithClient }),
    updateFileSharing: (fileId: string, shareWithClient: boolean) => 
      updateFileSharingMutation.mutateAsync({ fileId, shareWithClient }),
    deleteFile: (fileId: string) => deleteFileMutation.mutateAsync(fileId),
    getSignedFileUrl
  };
};
