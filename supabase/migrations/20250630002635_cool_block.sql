/*
  # Fix order_items RLS policy for customer insertions

  1. New Policies
    - Add policy to allow customers to insert order items for their own orders
  
  2. Changes
    - Customers can now insert order items when creating orders they own
    - Maintains existing staff permissions
  
  3. Security
    - Policy ensures customers can only insert items for orders they own
    - Validates ownership through orders.customer_id relationship
*/

-- Allow customers to insert order items for their own orders
CREATE POLICY "Customers can insert order items for their orders"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.customer_id = auth.uid()
    )
  );