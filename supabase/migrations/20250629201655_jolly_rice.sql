/*
  # Fix Orders RLS Policy for Customer Inserts

  1. Security Updates
    - Add INSERT policy for customers to create their own orders
    - Customers can only create orders where customer_id and user_id match their auth.uid()
    - This resolves the "new row violates row-level security policy" error

  2. Changes
    - Add "Customers can insert their own orders" policy
    - Maintains existing security by ensuring customers can only create orders for themselves
*/

-- Add INSERT policy for customers to create their own orders
CREATE POLICY "Customers can insert their own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = customer_id AND 
    auth.uid() = user_id
  );