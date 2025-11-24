/*
  # Service Business KPI Dashboard Schema

  ## Overview
  Database schema for "Сервис всем" (Service for All) - computer and household appliance repair service KPI tracking system.

  ## New Tables

  ### 1. `profiles`
  User profile information linked to auth.users
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, unique, not null)
  - `full_name` (text)
  - `role` (text, default 'user') - 'admin' or 'user'
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### 2. `service_orders`
  Service repair orders
  - `id` (uuid, primary key)
  - `order_number` (text, unique, not null)
  - `customer_name` (text, not null)
  - `customer_phone` (text, not null)
  - `device_type` (text, not null) - 'computer', 'laptop', 'household_appliance', 'phone', 'other'
  - `device_brand` (text)
  - `device_model` (text)
  - `issue_description` (text, not null)
  - `status` (text, default 'pending') - 'pending', 'in_progress', 'completed', 'cancelled'
  - `priority` (text, default 'normal') - 'low', 'normal', 'high', 'urgent'
  - `assigned_to` (uuid, references profiles)
  - `received_date` (timestamptz, default now())
  - `completed_date` (timestamptz)
  - `estimated_cost` (decimal)
  - `final_cost` (decimal)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### 3. `technicians`
  Service technicians information
  - `id` (uuid, primary key)
  - `profile_id` (uuid, references profiles)
  - `full_name` (text, not null)
  - `specialization` (text) - 'computer', 'household', 'mobile', 'universal'
  - `hire_date` (date, default today)
  - `is_active` (boolean, default true)
  - `created_at` (timestamptz, default now())

  ### 4. `kpi_metrics`
  Daily KPI metrics aggregation
  - `id` (uuid, primary key)
  - `metric_date` (date, not null)
  - `total_orders` (integer, default 0)
  - `completed_orders` (integer, default 0)
  - `cancelled_orders` (integer, default 0)
  - `revenue` (decimal, default 0)
  - `avg_completion_time_hours` (decimal)
  - `customer_satisfaction` (decimal) - rating 1-5
  - `created_at` (timestamptz, default now())
  - Unique constraint on metric_date

  ## Security
  - Enable RLS on all tables
  - Admin role can access and modify all data
  - User role can view data but limited modifications
  - Profiles are linked to authenticated users
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Technicians table
CREATE TABLE IF NOT EXISTS technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  specialization text CHECK (specialization IN ('computer', 'household', 'mobile', 'universal')),
  hire_date date DEFAULT CURRENT_DATE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active technicians"
  ON technicians FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert technicians"
  ON technicians FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update technicians"
  ON technicians FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete technicians"
  ON technicians FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Service orders table
CREATE TABLE IF NOT EXISTS service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  device_type text NOT NULL CHECK (device_type IN ('computer', 'laptop', 'household_appliance', 'phone', 'other')),
  device_brand text,
  device_model text,
  issue_description text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to uuid REFERENCES technicians(id) ON DELETE SET NULL,
  received_date timestamptz DEFAULT now(),
  completed_date timestamptz,
  estimated_cost decimal(10, 2),
  final_cost decimal(10, 2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view service orders"
  ON service_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert service orders"
  ON service_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update service orders"
  ON service_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete service orders"
  ON service_orders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- KPI metrics table
CREATE TABLE IF NOT EXISTS kpi_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date NOT NULL UNIQUE,
  total_orders integer DEFAULT 0,
  completed_orders integer DEFAULT 0,
  cancelled_orders integer DEFAULT 0,
  revenue decimal(10, 2) DEFAULT 0,
  avg_completion_time_hours decimal(10, 2),
  customer_satisfaction decimal(3, 2),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE kpi_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view KPI metrics"
  ON kpi_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert KPI metrics"
  ON kpi_metrics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update KPI metrics"
  ON kpi_metrics FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_received_date ON service_orders(received_date);
CREATE INDEX IF NOT EXISTS idx_service_orders_assigned_to ON service_orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_date ON kpi_metrics(metric_date);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_service_orders_updated_at') THEN
    CREATE TRIGGER update_service_orders_updated_at
      BEFORE UPDATE ON service_orders
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;