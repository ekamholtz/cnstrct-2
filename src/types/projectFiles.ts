import { Database } from './supabase';

export type ProjectFile = Database['public']['Tables']['project_files']['Row'];

export interface ProjectFileWithUploaderInfo extends ProjectFile {
  uploader: {
    id: string;
    full_name: string;
    role: string;
  };
}

export interface FileUploadParams {
  projectId: string;
  file: File;
  shareWithClient: boolean;
}

export interface FileUpdateParams {
  fileId: string;
  shareWithClient: boolean;
}
