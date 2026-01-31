-- Migration: Add audit log and notifications tables

-- 1. Audit log table for tracking changes
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL, -- 'order', 'technician', 'profile'
  entity_id uuid NOT NULL,
  action text NOT NULL, -- 'create', 'update', 'delete'
  changed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  old_values jsonb,
  new_values jsonb,
  changed_fields text[],
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_by ON audit_log(changed_by);

-- 2. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'info', 'warning', 'error', 'success'
  title text NOT NULL,
  message text NOT NULL,
  link text, -- URL to related resource
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- 3. Order attachments table for file uploads
CREATE TABLE IF NOT EXISTS order_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer, -- in bytes
  file_type text, -- MIME type
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_attachments_order_id ON order_attachments(order_id);

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log(
  p_entity_type text,
  p_entity_id uuid,
  p_action text,
  p_changed_by uuid,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_changed_fields text[];
BEGIN
  -- Extract changed field names
  IF p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
    SELECT array_agg(key) INTO v_changed_fields
    FROM jsonb_each(p_new_values)
    WHERE p_old_values->>key IS DISTINCT FROM p_new_values->>key;
  END IF;

  INSERT INTO audit_log (
    entity_type,
    entity_id,
    action,
    changed_by,
    old_values,
    new_values,
    changed_fields
  ) VALUES (
    p_entity_type,
    p_entity_id,
    p_action,
    p_changed_by,
    p_old_values,
    p_new_values,
    v_changed_fields
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger function for order changes
CREATE OR REPLACE FUNCTION audit_order_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get current user from session (we'll pass it via application)
  -- For now, we'll use a default or get from context
  v_user_id := current_setting('app.current_user_id', true)::uuid;
  
  IF TG_OP = 'INSERT' THEN
    PERFORM create_audit_log(
      'order',
      NEW.id,
      'create',
      v_user_id,
      NULL,
      row_to_json(NEW)::jsonb
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM create_audit_log(
      'order',
      NEW.id,
      'update',
      v_user_id,
      row_to_json(OLD)::jsonb,
      row_to_json(NEW)::jsonb
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM create_audit_log(
      'order',
      OLD.id,
      'delete',
      v_user_id,
      row_to_json(OLD)::jsonb,
      NULL
    );
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for orders (we'll enable it conditionally)
-- DROP TRIGGER IF EXISTS audit_service_orders_trigger ON service_orders;
-- CREATE TRIGGER audit_service_orders_trigger
--   AFTER INSERT OR UPDATE OR DELETE ON service_orders
--   FOR EACH ROW
--   EXECUTE FUNCTION audit_order_changes();







