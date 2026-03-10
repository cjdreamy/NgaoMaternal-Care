-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('mother', 'family_member', 'healthcare_provider', 'admin');

-- Create risk level enum
CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Create alert status enum
CREATE TYPE public.alert_status AS ENUM ('active', 'acknowledged', 'resolved');

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  email text,
  phone text,
  full_name text,
  role user_role NOT NULL DEFAULT 'mother',
  date_of_birth date,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  assigned_clinic_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create clinics table
CREATE TABLE public.clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  phone text,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  created_at timestamptz DEFAULT now()
);

-- Create health_checkins table
CREATE TABLE public.health_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_date date NOT NULL DEFAULT CURRENT_DATE,
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  heart_rate integer,
  fetal_movement_count integer,
  symptoms text[],
  notes text,
  risk_level risk_level DEFAULT 'low',
  flagged boolean DEFAULT false,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create emergency_alerts table
CREATE TABLE public.emergency_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  triggered_by uuid NOT NULL REFERENCES profiles(id),
  alert_type text NOT NULL,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  location_description text,
  status alert_status DEFAULT 'active',
  acknowledged_by uuid REFERENCES profiles(id),
  acknowledged_at timestamptz,
  resolved_by uuid REFERENCES profiles(id),
  resolved_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create educational_content table
CREATE TABLE public.educational_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  week_number integer,
  language text DEFAULT 'en',
  audio_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create patient_records table
CREATE TABLE public.patient_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expected_due_date date,
  pregnancy_week integer,
  blood_type text,
  allergies text[],
  medical_conditions text[],
  previous_pregnancies integer DEFAULT 0,
  current_medications text[],
  last_clinic_visit date,
  next_clinic_visit date,
  assigned_provider_id uuid REFERENCES profiles(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- Create helper function to check if user is healthcare provider
CREATE OR REPLACE FUNCTION is_healthcare_provider(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'healthcare_provider'::user_role
  );
$$;

-- Create trigger function to sync new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  INSERT INTO public.profiles (id, email, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'mother'::public.user_role END
  );
  RETURN NEW;
END;
$$;

-- Create trigger for user sync
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE educational_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_records ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Admins have full access to profiles" ON profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Healthcare providers can view all profiles" ON profiles
  FOR SELECT TO authenticated USING (is_healthcare_provider(auth.uid()));

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

-- Clinics policies (public read)
CREATE POLICY "Anyone can view clinics" ON clinics
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage clinics" ON clinics
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Health checkins policies
CREATE POLICY "Mothers can view their own checkins" ON health_checkins
  FOR SELECT TO authenticated USING (mother_id = auth.uid());

CREATE POLICY "Mothers can create their own checkins" ON health_checkins
  FOR INSERT TO authenticated WITH CHECK (mother_id = auth.uid());

CREATE POLICY "Healthcare providers can view all checkins" ON health_checkins
  FOR SELECT TO authenticated USING (is_healthcare_provider(auth.uid()) OR is_admin(auth.uid()));

CREATE POLICY "Healthcare providers can update checkins" ON health_checkins
  FOR UPDATE TO authenticated USING (is_healthcare_provider(auth.uid()) OR is_admin(auth.uid()));

-- Emergency alerts policies
CREATE POLICY "Users can view alerts they created or are about" ON emergency_alerts
  FOR SELECT TO authenticated USING (
    mother_id = auth.uid() OR 
    triggered_by = auth.uid() OR 
    is_healthcare_provider(auth.uid()) OR 
    is_admin(auth.uid())
  );

CREATE POLICY "Authenticated users can create alerts" ON emergency_alerts
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Healthcare providers can update alerts" ON emergency_alerts
  FOR UPDATE TO authenticated USING (is_healthcare_provider(auth.uid()) OR is_admin(auth.uid()));

-- Educational content policies
CREATE POLICY "Anyone can view educational content" ON educational_content
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and healthcare providers can manage content" ON educational_content
  FOR ALL TO authenticated USING (is_admin(auth.uid()) OR is_healthcare_provider(auth.uid()));

-- Patient records policies
CREATE POLICY "Mothers can view their own records" ON patient_records
  FOR SELECT TO authenticated USING (mother_id = auth.uid());

CREATE POLICY "Healthcare providers can view all records" ON patient_records
  FOR SELECT TO authenticated USING (is_healthcare_provider(auth.uid()) OR is_admin(auth.uid()));

CREATE POLICY "Healthcare providers can manage records" ON patient_records
  FOR ALL TO authenticated USING (is_healthcare_provider(auth.uid()) OR is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_health_checkins_mother_id ON health_checkins(mother_id);
CREATE INDEX idx_health_checkins_date ON health_checkins(checkin_date DESC);
CREATE INDEX idx_health_checkins_risk ON health_checkins(risk_level) WHERE flagged = true;
CREATE INDEX idx_emergency_alerts_status ON emergency_alerts(status, created_at DESC);
CREATE INDEX idx_emergency_alerts_mother ON emergency_alerts(mother_id);
CREATE INDEX idx_patient_records_mother ON patient_records(mother_id);
CREATE INDEX idx_educational_content_category ON educational_content(category, week_number);