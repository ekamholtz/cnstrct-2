
-- Create enum for payment status if it doesn't exist
CREATE TYPE payment_status AS ENUM ('due', 'partially_paid', 'paid');

-- Create the payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    payment_type expense_payment_method NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL,
    payment_amount NUMERIC NOT NULL CHECK (payment_amount > 0),
    vendor_email TEXT,
    vendor_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    simulation_data JSONB
);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for updating the updated_at timestamp
CREATE TRIGGER update_payment_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_updated_at();

-- Migrate existing payment data
DO $$
DECLARE
    expense_record RECORD;
BEGIN
    FOR expense_record IN 
        SELECT 
            id,
            payment_type,
            payment_status,
            created_at
        FROM expenses 
        WHERE payment_type IS NOT NULL 
        AND payment_status = 'paid'
    LOOP
        INSERT INTO payments (
            expense_id,
            payment_type,
            payment_date,
            payment_amount,
            created_at,
            updated_at
        )
        SELECT
            expense_record.id,
            expense_record.payment_type,
            expense_record.created_at,
            amount,
            expense_record.created_at,
            expense_record.created_at
        FROM expenses
        WHERE id = expense_record.id;
    END LOOP;
END $$;

-- Update expenses table
ALTER TABLE expenses
    -- First remove constraints
    ALTER COLUMN payment_type DROP NOT NULL,
    ALTER COLUMN payment_type DROP DEFAULT;

-- Update expense status based on payments
CREATE OR REPLACE FUNCTION update_expense_status()
RETURNS TRIGGER AS $$
DECLARE
    total_paid NUMERIC;
    expense_amount NUMERIC;
BEGIN
    -- Calculate total paid amount for this expense
    SELECT COALESCE(SUM(payment_amount), 0)
    INTO total_paid
    FROM payments
    WHERE expense_id = NEW.expense_id;

    -- Get expense amount
    SELECT amount
    INTO expense_amount
    FROM expenses
    WHERE id = NEW.expense_id;

    -- Update expense status based on payment amount
    IF total_paid >= expense_amount THEN
        UPDATE expenses
        SET payment_status = 'paid'
        WHERE id = NEW.expense_id;
    ELSIF total_paid > 0 THEN
        UPDATE expenses
        SET payment_status = 'partially_paid'
        WHERE id = NEW.expense_id;
    ELSE
        UPDATE expenses
        SET payment_status = 'due'
        WHERE id = NEW.expense_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update expense status
CREATE TRIGGER update_expense_status_on_payment
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_expense_status();

-- Add RLS policies for payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payments for their expenses"
    ON payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM expenses e
            WHERE e.id = payments.expense_id
            AND (
                e.contractor_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM projects p
                    JOIN clients c ON c.id = p.client_id
                    WHERE p.id = e.project_id
                    AND c.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Contractors can create payments"
    ON payments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM expenses e
            WHERE e.id = expense_id
            AND e.contractor_id = auth.uid()
        )
    );
