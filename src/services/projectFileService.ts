import { supabase } from '@/integrations/supabase/client';
import { FileUploadParams, FileUpdateParams, ProjectFile, ProjectFileWithUploaderInfo } from '@/types/projectFiles';
import { v4 as uuidv4 } from 'uuid';

// Maximum file size in bytes (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Allowed file types
const ALLOWED_FILE_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'text/plain',
  'text/csv',
  
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/svg+xml',
  
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  
  // CAD files
  'application/dxf',
  'application/dwg',
  'application/octet-stream', // For some CAD files
];

/**
 * Service for managing project files
 */
export const ProjectFileService = {
  /**
   * Upload a file to the project
   * @param params File upload parameters
   * @returns The created project file record
   */
  async uploadFile({ projectId, file, shareWithClient }: FileUploadParams): Promise<{ file: ProjectFile | null; error?: string }> {
    console.log('ProjectFileService.uploadFile called', { projectId, fileName: file.name, fileSize: file.size, shareWithClient });
    try {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return { file: null, error: `File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB` };
      }
      
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return { file: null, error: 'File type not allowed. Please upload a supported file format.' };
      }
      
      // Check if user is authenticated
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        return { file: null, error: 'Authentication error. Please sign in again.' };
      }
      
      // Get user role to check permissions
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, gc_account_id')
        .eq('id', userData.user.id)
        .single();
        
      if (profileError) {
        return { file: null, error: 'Error fetching user profile. Please try again.' };
      }
      
      // Check if user has permission to upload files for this project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('gc_account_id, pm_user_id')
        .eq('id', projectId)
        .single();
        
      if (projectError) {
        return { file: null, error: 'Error fetching project data. Please try again.' };
      }
      
      // Verify user has permission to upload files for this project
      const isGcAdmin = profileData.role === 'gc_admin' && profileData.gc_account_id === projectData.gc_account_id;
      const isProjectManager = profileData.role === 'project_manager' && userData.user.id === projectData.pm_user_id;
      const isPlatformAdmin = profileData.role === 'platform_admin';
      
      if (!isGcAdmin && !isProjectManager && !isPlatformAdmin) {
        return { file: null, error: 'You do not have permission to upload files for this project.' };
      }
      
      // Generate a unique file path to avoid collisions
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${projectId}/${fileName}`;
      
      // Upload file to Supabase Storage
      console.log('Uploading file to Supabase Storage');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Error uploading file to storage:', uploadError);
        return { file: null, error: 'Error uploading file to storage. Please try again.' };
      }

      console.log('File uploaded successfully to Supabase Storage');

      // Store the file path instead of the public URL
      // We'll generate signed URLs when needed
      const fileUrl = filePath;

      // Create a record in the project_files table
      console.log('Creating file record in database');
      const { data: fileRecord, error: insertError } = await supabase
        .from('project_files')
        .insert({
          project_id: projectId,
          uploader_id: userData.user.id,
          file_url: fileUrl,
          filename: file.name,
          mime_type: file.type,
          file_size: file.size,
          share_with_client: shareWithClient
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating file record in database:', insertError);
        // Clean up the uploaded file if record creation fails
        await supabase.storage.from('project-files').remove([filePath]);
        return { file: null, error: 'Error creating file record. Please try again.' };
      }

      console.log('File record created successfully in database');

      return { file: fileRecord };
    } catch (error) {
      console.error('Unexpected error in uploadFile:', error);
      return { file: null, error: 'An unexpected error occurred. Please try again.' };
    }
  },

  /**
   * Get all files for a project
   * @param projectId Project ID
   * @returns Array of project files with uploader information
   */
  async getProjectFiles(projectId: string): Promise<{ files: ProjectFileWithUploaderInfo[]; error?: string }> {
    console.log('ProjectFileService.getProjectFiles called', { projectId });
    try {
      // Get the files with a join to the profiles table for uploader info
      console.log('Querying Supabase for project files');
      const { data, error } = await supabase
        .from('project_files')
        .select(`
          *,
          profiles!project_files_uploader_id_fkey(id, full_name, role)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching project files from Supabase:', error);
        return { files: [], error: 'Error fetching project files. Please try again.' };
      }

      console.log(`Found ${data.length} project files in database`);

      // Transform the data to match our expected format
      const filesWithUploaderInfo = data.map(file => ({
        ...file,
        uploader: file.profiles || { id: '', full_name: 'Unknown', role: '' }
      }));

      // For files with paths (not full URLs), generate signed URLs
      console.log('Generating signed URLs for files');
      const filesWithUrls = await Promise.all(
        filesWithUploaderInfo.map(async (file) => {
          // If it's already a full URL, return as is
          if (file.file_url.startsWith('http')) {
            return file;
          }
          
          // Otherwise, generate a signed URL
          console.log(`Generating signed URL for file ${file.file_url}`);
          const { data } = await supabase.storage
            .from('project-files')
            .createSignedUrl(file.file_url, 60 * 60); // 1 hour expiry

          return {
            ...file,
            file_url: data?.signedUrl || file.file_url
          };
        })
      );

      console.log('Signed URLs generated successfully');

      return { files: filesWithUrls };
    } catch (error) {
      console.error('Unexpected error in getProjectFiles:', error);
      return { files: [], error: 'An unexpected error occurred. Please try again.' };
    }
  },

  /**
   * Update a project file's sharing settings
   * @param params File update parameters
   * @returns The updated project file
   */
  async updateFileSharing({ fileId, shareWithClient }: FileUpdateParams): Promise<{ file: ProjectFile | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('project_files')
        .update({ share_with_client: shareWithClient })
        .eq('id', fileId)
        .select()
        .single();

      if (error) {
        return { file: null, error: 'Error updating file sharing settings. Please try again.' };
      }

      return { file: data };
    } catch (error) {
      console.error('Unexpected error in updateFileSharing:', error);
      return { file: null, error: 'An unexpected error occurred. Please try again.' };
    }
  },

  /**
   * Delete a project file
   * @param fileId File ID to delete
   * @returns Success status
   */
  async deleteFile(fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the file record to find the storage path
      const { data: fileData, error: fetchError } = await supabase
        .from('project_files')
        .select('file_url')
        .eq('id', fileId)
        .single();

      if (fetchError) {
        return { success: false, error: 'Error fetching file data. Please try again.' };
      }

      // If the file_url is a full URL, extract the path
      let storagePath = fileData.file_url;
      if (storagePath.startsWith('http')) {
        // Extract the path from the URL - get the last two segments
        const urlParts = storagePath.split('/');
        storagePath = `${urlParts[urlParts.length - 2]}/${urlParts[urlParts.length - 1]}`;
      }

      // Delete the file from storage
      console.log('Deleting file from Supabase Storage');
      const { error: storageError } = await supabase.storage
        .from('project-files')
        .remove([storagePath]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
        // This prevents orphaned records
      }

      console.log('File deleted successfully from Supabase Storage');

      // Delete the record from the database
      console.log('Deleting file record from database');
      const { error: deleteError } = await supabase
        .from('project_files')
        .delete()
        .eq('id', fileId);

      if (deleteError) {
        return { success: false, error: 'Error deleting file record. Please try again.' };
      }

      console.log('File record deleted successfully from database');

      return { success: true };
    } catch (error) {
      console.error('Unexpected error in deleteFile:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  }
};
