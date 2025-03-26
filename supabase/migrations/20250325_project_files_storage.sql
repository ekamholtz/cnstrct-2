-- Migration: Project Files Storage Bucket and Policies
-- Date: 2025-03-25

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO UPDATE
SET public = false;

-- Enable RLS on the bucket
UPDATE storage.buckets
SET public = false
WHERE id = 'project-files';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to select files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete files" ON storage.objects;
DROP POLICY IF EXISTS "Platform admins can do everything with storage" ON storage.objects;
DROP POLICY IF EXISTS "GC admins can manage storage for their company" ON storage.objects;
DROP POLICY IF EXISTS "Project managers can manage storage for their projects" ON storage.objects;
DROP POLICY IF EXISTS "Clients can read shared files in storage" ON storage.objects;

-- Platform admins can do everything
CREATE POLICY "Platform admins can do everything with storage"
ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id = 'project-files' AND
    EXISTS (
        SELECT 1 FROM auth.users
        JOIN public.profiles ON profiles.id = auth.users.id
        WHERE auth.users.id = auth.uid()
        AND profiles.role = 'platform_admin'
    )
);

-- GC admins can manage files for their company's projects
CREATE POLICY "GC admins can manage storage for their company"
ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id = 'project-files' AND
    EXISTS (
        SELECT 1 FROM auth.users
        JOIN public.profiles ON profiles.id = auth.users.id
        JOIN public.projects ON projects.gc_account_id = profiles.gc_account_id
        WHERE auth.users.id = auth.uid()
        AND profiles.role = 'gc_admin'
        AND split_part(storage.objects.name, '/', 1) = projects.id::text
    )
);

-- Project managers can manage files for their projects
CREATE POLICY "Project managers can manage storage for their projects"
ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id = 'project-files' AND
    EXISTS (
        SELECT 1 FROM auth.users
        JOIN public.projects ON projects.pm_user_id = auth.users.id
        WHERE auth.users.id = auth.uid()
        AND split_part(storage.objects.name, '/', 1) = projects.id::text
    )
);

-- Clients can only read files that are shared with them
CREATE POLICY "Clients can read shared files in storage"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'project-files' AND
    EXISTS (
        SELECT 1 FROM auth.users
        JOIN public.clients ON clients.user_id = auth.users.id
        JOIN public.projects ON projects.client_id = clients.id
        JOIN public.project_files ON project_files.project_id = projects.id
        WHERE auth.users.id = auth.uid()
        AND split_part(storage.objects.name, '/', 1) = projects.id::text
        AND project_files.share_with_client = TRUE
        AND project_files.file_url LIKE '%' || split_part(storage.objects.name, '/', 2) || '%'
    )
);

-- Enable Row Level Security on the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
