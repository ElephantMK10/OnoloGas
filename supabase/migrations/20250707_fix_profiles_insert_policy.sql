/*
  # Fix Missing Profiles INSERT Policy

  1. Problem
    - Users cannot register because profiles table is missing INSERT policy
    - Error: "new row violates row-level security policy for table profiles"
    - Registration fails at profile creation step

  2. Solution
    - Add missing INSERT policy for authenticated users to create their own profiles
    - Ensure policy allows users to insert profiles where auth.uid() = id
    - This matches the existing UPDATE and SELECT policies

  3. Security
    - Users can only create profiles for their own auth.uid()
    - Maintains security by preventing users from creating profiles for other users
*/

-- Ensure the INSERT policy exists for profiles table
-- This allows authenticated users to create their own profile during registration
CREATE POLICY IF NOT EXISTS "Authenticated users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
