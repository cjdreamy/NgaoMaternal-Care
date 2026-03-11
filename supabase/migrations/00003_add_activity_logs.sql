-- Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id),
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins and providers can view all logs" ON public.activity_logs
  FOR SELECT TO authenticated USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('healthcare_provider', 'admin')
  );

CREATE POLICY "Authenticated users can create logs" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Create index
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
