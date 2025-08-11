/*
  # Fix profiles table RLS policies

  1. Security Updates
    - Drop existing conflicting policies on profiles table
    - Create clear, consistent policies for authenticated users
    - Ensure authenticated users can SELECT, INSERT, and UPDATE their own profiles
    - Remove overly broad policies that allow viewing all profiles

  2. Policy Changes
    - Remove the "view all profiles" policy that grants access to all profiles
    - Standardize all policies to use auth.uid() for authenticated users
    - Ensure consistent role assignment (authenticated vs public)
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Create new, consistent policies for authenticated users
CREATE POLICY "Authenticated users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Authenticated users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);