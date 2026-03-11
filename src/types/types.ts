export type UserRole = 'mother' | 'family_member' | 'healthcare_provider' | 'admin';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface Profile {
  id: string;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  full_name?: string | null;
  role: UserRole;
  date_of_birth?: string | null;
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  assigned_clinic_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
}

export interface HealthCheckin {
  id: string;
  mother_id: string;
  checkin_date: string;
  blood_pressure_systolic?: number | null;
  blood_pressure_diastolic?: number | null;
  heart_rate?: number | null;
  fetal_movement_count?: number | null;
  symptoms?: string[] | null;
  notes?: string | null;
  risk_level: RiskLevel;
  flagged: boolean;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

export interface EmergencyAlert {
  id: string;
  mother_id: string;
  triggered_by: string;
  alert_type: string;
  latitude?: number | null;
  longitude?: number | null;
  location_description?: string | null;
  status: AlertStatus;
  acknowledged_by?: string | null;
  acknowledged_at?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface EducationalContent {
  id: string;
  title: string;
  content: string;
  category: string;
  week_number?: number | null;
  language: string;
  audio_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientRecord {
  id: string;
  mother_id: string;
  expected_due_date?: string | null;
  pregnancy_week?: number | null;
  blood_type?: string | null;
  allergies?: string[] | null;
  medical_conditions?: string[] | null;
  previous_pregnancies: number;
  current_medications?: string[] | null;
  last_clinic_visit?: string | null;
  next_clinic_visit?: string | null;
  assigned_provider_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealthCheckinWithProfile extends HealthCheckin {
  mother?: Profile | null;
  reviewer?: Profile | null;
}

export interface EmergencyAlertWithProfiles extends EmergencyAlert {
  mother?: Profile | null;
  trigger?: Profile | null;
  acknowledger?: Profile | null;
  resolver?: Profile | null;
}

export interface PatientRecordWithProfile extends PatientRecord {
  mother?: Profile | null;
  provider?: Profile | null;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: string | null;
  created_at: string;
  user?: Profile | null;
}
