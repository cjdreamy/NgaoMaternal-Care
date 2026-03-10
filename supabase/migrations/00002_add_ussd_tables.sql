-- Create ussd_users table to track USSD interactions
CREATE TABLE IF NOT EXISTS public.ussd_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text UNIQUE NOT NULL,
  name text,
  created_at timestamptz DEFAULT now()
);

-- Create ussd_emergency_alerts for users not in the profiles table
CREATE TABLE IF NOT EXISTS public.ussd_emergency_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ussd_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ussd_emergency_alerts ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Full access for service role" ON public.ussd_users FOR ALL TO service_role USING (true);
CREATE POLICY "Full access for service role" ON public.ussd_emergency_alerts FOR ALL TO service_role USING (true);

-- Allow authenticated users (admins/doctors) to view
CREATE POLICY "Admins can view ussd_users" ON public.ussd_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can view ussd_alerts" ON public.ussd_emergency_alerts FOR SELECT TO authenticated USING (true);
