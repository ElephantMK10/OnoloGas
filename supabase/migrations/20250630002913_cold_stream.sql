/*
  # Fix order_items RLS policies

  1. Security Updates
    - Drop existing problematic RLS policies on order_items table
    - Create new, properly structured RLS policies that allow:
      - Customers to insert order items for their own orders
      - Staff to insert order items for any order
      - Proper read access for order items

  2. Policy Improvements
    - Use more reliable RLS policy structure
    - Ensure proper user context evaluation
    - Add debugging-friendly policy names
*/

-- Drop existing RLS policies on order_items table
DROP POLICY IF EXISTS "Customers can insert order items for their orders" ON order_items;
DROP POLICY IF EXISTS "Staff can insert order items" ON order_items;
DROP POLICY IF EXISTS "Users can read order items for accessible orders" ON order_items;

-- Create new RLS policies with improved structure

-- Allow customers to insert order items for orders they own
CREATE POLICY "customers_can_insert_own_order_items"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.customer_id = auth.uid() OR orders.user_id = auth.uid())
    )
  );

-- Allow staff to insert order items for any order
CREATE POLICY "staff_can_insert_any_order_items"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Allow customers to read order items for their own orders
CREATE POLICY "customers_can_read_own_order_items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.customer_id = auth.uid() OR orders.user_id = auth.uid())
    )
  );

-- Allow staff to read all order items
CREATE POLICY "staff_can_read_all_order_items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff', 'driver')
    )
  );

-- Allow staff to update order items
CREATE POLICY "staff_can_update_order_items"
  ON order_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Allow staff to delete order items (for order management)
CREATE POLICY "staff_can_delete_order_items"
  ON order_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );