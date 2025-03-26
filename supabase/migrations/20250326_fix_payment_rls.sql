-- Add RLS policy to allow GC admins to create payments
CREATE POLICY "GC admins can create payments"
    ON payments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM expenses e
            JOIN projects p ON p.id = e.project_id
            JOIN profiles pr ON pr.gc_account_id = p.gc_account_id
            WHERE e.id = expense_id
            AND pr.id = auth.uid()
            AND pr.role = 'gc_admin'
        )
    );

-- Add RLS policy to allow platform admins to create payments
CREATE POLICY "Platform admins can create payments"
    ON payments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'platform_admin'
        )
    );

-- Add RLS policy to allow GC admins to update payments
CREATE POLICY "GC admins can update payments"
    ON payments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM expenses e
            JOIN projects p ON p.id = e.project_id
            JOIN profiles pr ON pr.gc_account_id = p.gc_account_id
            WHERE e.id = expense_id
            AND pr.id = auth.uid()
            AND pr.role = 'gc_admin'
        )
    );

-- Add RLS policy to allow platform admins to update payments
CREATE POLICY "Platform admins can update payments"
    ON payments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'platform_admin'
        )
    );

-- Add RLS policy to allow GC admins to delete payments
CREATE POLICY "GC admins can delete payments"
    ON payments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM expenses e
            JOIN projects p ON p.id = e.project_id
            JOIN profiles pr ON pr.gc_account_id = p.gc_account_id
            WHERE e.id = expense_id
            AND pr.id = auth.uid()
            AND pr.role = 'gc_admin'
        )
    );

-- Add RLS policy to allow platform admins to delete payments
CREATE POLICY "Platform admins can delete payments"
    ON payments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'platform_admin'
        )
    );
