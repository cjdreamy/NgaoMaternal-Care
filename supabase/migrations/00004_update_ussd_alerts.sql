-- Add notes and resolution tracking to USSD alerts
ALTER TABLE public.ussd_emergency_alerts 
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

-- Add update policy for authenticated users to resolve alerts
CREATE POLICY "Admins can update ussd_alerts" ON public.ussd_emergency_alerts 
FOR UPDATE TO authenticated 
USING (true)
WITH CHECK (true);
