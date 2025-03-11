
-- Function to create the get_client_invoices function if it doesn't exist
CREATE OR REPLACE FUNCTION create_get_client_invoices_function()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the function already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_client_invoices'
  ) THEN
    -- Create the function to get client invoices by project IDs
    EXECUTE '
    CREATE OR REPLACE FUNCTION get_client_invoices(project_ids uuid[])
    RETURNS TABLE (
      id uuid,
      invoice_number text,
      amount numeric,
      status text,
      created_at timestamp with time zone,
      updated_at timestamp with time zone,
      milestone_id uuid,
      project_id uuid,
      payment_method text,
      payment_date timestamp with time zone,
      payment_reference text,
      payment_gateway text,
      simulation_data jsonb,
      milestone_name text,
      project_name text
    )
    LANGUAGE sql
    SECURITY DEFINER
    AS $$
      SELECT 
        i.id,
        i.invoice_number,
        i.amount,
        i.status,
        i.created_at,
        i.updated_at,
        i.milestone_id,
        i.project_id,
        i.payment_method,
        i.payment_date,
        i.payment_reference,
        i.payment_gateway,
        i.simulation_data,
        m.name as milestone_name,
        p.name as project_name
      FROM 
        invoices i
      JOIN 
        milestones m ON i.milestone_id = m.id
      JOIN
        projects p ON i.project_id = p.id
      WHERE 
        i.project_id = ANY($1)
      ORDER BY
        i.created_at DESC;
    $$;';
  END IF;
END;
$$;
