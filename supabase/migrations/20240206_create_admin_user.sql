
-- Create the admin user if it doesn't exist
DO $$
BEGIN
    -- First check if the user already exists in auth.users
    IF NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'admin@email.com'
    ) THEN
        -- Insert into auth.users using create user function
        PERFORM auth.create_user(
            uid := gen_random_uuid(),
            email := 'admin@email.com',
            password := '123456',
            email_confirm := true,
            raw_user_meta_data := jsonb_build_object(
                'full_name', 'Admin User',
                'role', 'admin'
            )
        );
    END IF;
END
$$;
