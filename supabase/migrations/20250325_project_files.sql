-- Migration: Project Files Table and RLS Policies
-- Date: 2025-03-25

-- Create project_files table
CREATE TABLE IF NOT EXISTS project_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    file_url TEXT NOT NULL,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size NUMERIC NOT NULL,
    share_with_client BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster lookups by project
CREATE INDEX project_files_project_id_idx ON project_files(project_id);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_file_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for updating the updated_at timestamp
CREATE TRIGGER update_project_file_updated_at
    BEFORE UPDATE ON project_files
    FOR EACH ROW
    EXECUTE FUNCTION update_project_file_updated_at();

-- Enable Row Level Security
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_files

-- Platform admins can do everything
CREATE POLICY "Platform admins can do everything with project files"
    ON project_files
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'platform_admin'
        )
    );

-- GC admins can view, create, update, and delete files for their company's projects
CREATE POLICY "GC admins can manage project files for their company"
    ON project_files
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            JOIN projects ON projects.gc_account_id = profiles.gc_account_id
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'gc_admin'
            AND projects.id = project_files.project_id
        )
    );

-- Project managers can view, create, update, and delete files for their projects
CREATE POLICY "Project managers can manage files for their projects"
    ON project_files
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_files.project_id
            AND projects.pm_user_id = auth.uid()
        )
    );

-- Clients can only view files that are shared with them
CREATE POLICY "Clients can view files shared with them"
    ON project_files
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM projects
            JOIN clients ON clients.id = projects.client_id
            WHERE projects.id = project_files.project_id
            AND clients.user_id = auth.uid()
            AND project_files.share_with_client = TRUE
        )
    );

-- Team members can view all files for their projects
CREATE POLICY "Team members can view all files for their projects"
    ON project_files
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_files.project_id
            AND (
                -- Check if user is a project manager for this project
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'project_manager'
                    AND p.pm_user_id = profiles.id
                )
                -- Or if user is a gc_admin for the GC account
                OR EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'gc_admin'
                    AND profiles.gc_account_id = p.gc_account_id
                )
                -- Or if user is a homeowner associated with this project
                OR EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'homeowner'
                    AND EXISTS (
                        SELECT 1 FROM clients
                        WHERE clients.user_id = auth.uid()
                        AND p.client_id = clients.id
                    )
                )
            )
        )
    );

-- Create storage bucket for project files if it doesn't exist
-- Note: This assumes Supabase storage is being used
DO $$
BEGIN
    -- This is a placeholder as direct bucket creation might require admin privileges
    -- In a real implementation, ensure the bucket 'project-files' exists in Supabase storage
    RAISE NOTICE 'Remember to create a storage bucket named "project-files" in Supabase dashboard';
END
$$;
