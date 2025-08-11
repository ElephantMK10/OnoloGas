-- Migration: Add welcome email trigger for new user registrations
-- This trigger automatically sends welcome emails when new profiles are created

-- Create function to send welcome email via Edge Function
CREATE OR REPLACE FUNCTION send_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_first_name TEXT;
  user_last_name TEXT;
  function_url TEXT;
  api_key TEXT;
  payload JSON;
  response_status INTEGER;
BEGIN
  -- Get user email from auth.users table
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;

  -- Extract first and last name from the profile
  user_first_name := NEW.first_name;
  user_last_name := NEW.last_name;

  -- Skip if essential data is missing
  IF user_email IS NULL OR user_first_name IS NULL THEN
    RAISE LOG 'Skipping welcome email: missing email (%) or first_name (%)', user_email, user_first_name;
    RETURN NEW;
  END IF;

  -- Construct the Edge Function URL
  function_url := 'https://lnnqoejqgdmwadtzwuix.supabase.co/functions/v1/welcome-email';
  
  -- Get the service role key from vault (you'll need to set this)
  -- For now, we'll use the anon key which should work for this function
  api_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubnFvZWpxZ2Rtd2FkdHp3dWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NDMzNjIsImV4cCI6MjA2NTUxOTM2Mn0.4ITA99C8PGmVjbcfGdJg9Ghnl9opP0XGEODjT-T6a0s';

  -- Prepare the payload
  payload := json_build_object(
    'email', user_email,
    'firstName', user_first_name,
    'lastName', user_last_name
  );

  -- Log the attempt
  RAISE LOG 'Sending welcome email to: % (% %)', user_email, user_first_name, user_last_name;

  -- Make HTTP request to Edge Function
  -- Note: This uses the http extension which needs to be enabled
  BEGIN
    SELECT status INTO response_status
    FROM http((
      'POST',
      function_url,
      ARRAY[
        http_header('Content-Type', 'application/json'),
        http_header('Authorization', 'Bearer ' || api_key)
      ],
      'application/json',
      payload::text
    ));

    -- Log the response
    IF response_status = 200 THEN
      RAISE LOG 'Welcome email sent successfully to: %', user_email;
    ELSE
      RAISE LOG 'Welcome email failed with status % for: %', response_status, user_email;
    END IF;

  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the profile creation
    RAISE LOG 'Error sending welcome email to %: %', user_email, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable the http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http;

-- Create trigger that fires after profile insert
DROP TRIGGER IF EXISTS trigger_send_welcome_email ON profiles;

CREATE TRIGGER trigger_send_welcome_email
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_email();

-- Add comment for documentation
COMMENT ON FUNCTION send_welcome_email() IS 'Automatically sends welcome email via Edge Function when new profile is created';
COMMENT ON TRIGGER trigger_send_welcome_email ON profiles IS 'Triggers welcome email sending for new user registrations';
