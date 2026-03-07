import { supabase } from './supabase';
import type {
  Profile,
  Clinic,
  HealthCheckin,
  EmergencyAlert,
  EducationalContent,
  PatientRecord,
  HealthCheckinWithProfile,
  EmergencyAlertWithProfiles,
  PatientRecordWithProfile,
  UserRole,
  RiskLevel,
  AlertStatus
} from '@/types';

// ============ Profiles ============
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getAllProfiles(limit = 50, offset = 0): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function updateUserRole(userId: string, role: UserRole) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getMotherProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'mother')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching mother profiles:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

// ============ Clinics ============
export async function getAllClinics(): Promise<Clinic[]> {
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching clinics:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function getNearestClinic(latitude: number, longitude: number): Promise<Clinic | null> {
  // Simple distance calculation - in production, use PostGIS
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  if (error || !data) return null;

  // Calculate distances and find nearest
  const clinicsWithDistance = data.map(clinic => {
    const lat1 = latitude * Math.PI / 180;
    const lat2 = (clinic.latitude || 0) * Math.PI / 180;
    const dLat = lat2 - lat1;
    const dLon = ((clinic.longitude || 0) - longitude) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = 6371 * c; // Earth radius in km
    
    return { ...clinic, distance };
  });

  clinicsWithDistance.sort((a, b) => a.distance - b.distance);
  return clinicsWithDistance[0] || null;
}

// ============ Health Check-ins ============
export async function createHealthCheckin(checkin: Omit<HealthCheckin, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('health_checkins')
    .insert(checkin)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getHealthCheckins(motherId: string, limit = 30): Promise<HealthCheckin[]> {
  const { data, error } = await supabase
    .from('health_checkins')
    .select('*')
    .eq('mother_id', motherId)
    .order('checkin_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching health checkins:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function getAllHealthCheckins(limit = 50, offset = 0): Promise<HealthCheckinWithProfile[]> {
  const { data, error } = await supabase
    .from('health_checkins')
    .select(`
      *,
      mother:profiles!health_checkins_mother_id_fkey(*)
    `)
    .order('checkin_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching all health checkins:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function getFlaggedCheckins(limit = 50): Promise<HealthCheckinWithProfile[]> {
  const { data, error } = await supabase
    .from('health_checkins')
    .select(`
      *,
      mother:profiles!health_checkins_mother_id_fkey(*)
    `)
    .eq('flagged', true)
    .is('reviewed_by', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching flagged checkins:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function updateHealthCheckin(id: string, updates: Partial<HealthCheckin>) {
  const { data, error } = await supabase
    .from('health_checkins')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function reviewHealthCheckin(id: string, reviewerId: string, notes?: string) {
  const { data, error } = await supabase
    .from('health_checkins')
    .update({
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      notes: notes || null
    })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ============ Emergency Alerts ============
export async function createEmergencyAlert(alert: Omit<EmergencyAlert, 'id' | 'created_at' | 'status'>) {
  const { data, error } = await supabase
    .from('emergency_alerts')
    .insert({ ...alert, status: 'active' })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getEmergencyAlerts(userId: string, limit = 20): Promise<EmergencyAlert[]> {
  const { data, error } = await supabase
    .from('emergency_alerts')
    .select('*')
    .or(`mother_id.eq.${userId},triggered_by.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching emergency alerts:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function getAllEmergencyAlerts(limit = 50, offset = 0): Promise<EmergencyAlertWithProfiles[]> {
  const { data, error } = await supabase
    .from('emergency_alerts')
    .select(`
      *,
      mother:profiles!emergency_alerts_mother_id_fkey(*),
      trigger:profiles!emergency_alerts_triggered_by_fkey(*)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching all emergency alerts:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function getActiveEmergencyAlerts(): Promise<EmergencyAlertWithProfiles[]> {
  const { data, error } = await supabase
    .from('emergency_alerts')
    .select(`
      *,
      mother:profiles!emergency_alerts_mother_id_fkey(*),
      trigger:profiles!emergency_alerts_triggered_by_fkey(*)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active alerts:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function acknowledgeEmergencyAlert(id: string, userId: string) {
  const { data, error } = await supabase
    .from('emergency_alerts')
    .update({
      status: 'acknowledged',
      acknowledged_by: userId,
      acknowledged_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function resolveEmergencyAlert(id: string, userId: string, notes?: string) {
  const { data, error } = await supabase
    .from('emergency_alerts')
    .update({
      status: 'resolved',
      resolved_by: userId,
      resolved_at: new Date().toISOString(),
      notes: notes || null
    })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ============ Educational Content ============
export async function getEducationalContent(limit = 50, category?: string): Promise<EducationalContent[]> {
  let query = supabase
    .from('educational_content')
    .select('*')
    .order('week_number', { ascending: true });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query.limit(limit);

  if (error) {
    console.error('Error fetching educational content:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function getEducationalContentByWeek(weekNumber: number): Promise<EducationalContent[]> {
  const { data, error } = await supabase
    .from('educational_content')
    .select('*')
    .eq('week_number', weekNumber)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching educational content by week:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function createEducationalContent(content: Omit<EducationalContent, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('educational_content')
    .insert(content)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ============ Patient Records ============
export async function getPatientRecord(motherId: string): Promise<PatientRecord | null> {
  const { data, error } = await supabase
    .from('patient_records')
    .select('*')
    .eq('mother_id', motherId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching patient record:', error);
    return null;
  }
  return data;
}

export async function createPatientRecord(record: Omit<PatientRecord, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('patient_records')
    .insert(record)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updatePatientRecord(motherId: string, updates: Partial<PatientRecord>) {
  const { data, error } = await supabase
    .from('patient_records')
    .update(updates)
    .eq('mother_id', motherId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getAllPatientRecords(limit = 50, offset = 0): Promise<PatientRecordWithProfile[]> {
  const { data, error } = await supabase
    .from('patient_records')
    .select(`
      *,
      mother:profiles!patient_records_mother_id_fkey(*)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching all patient records:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

// ============ Statistics ============
export async function getDashboardStats(userId: string, role: string) {
  if (role === 'mother') {
    const [checkins, alerts, record] = await Promise.all([
      getHealthCheckins(userId, 7),
      getEmergencyAlerts(userId, 5),
      getPatientRecord(userId)
    ]);

    return {
      recentCheckins: checkins.length,
      activeAlerts: alerts.filter(a => a.status === 'active').length,
      pregnancyWeek: record?.pregnancy_week || 0,
      nextVisit: record?.next_clinic_visit
    };
  }

  if (role === 'healthcare_provider' || role === 'admin') {
    const [flaggedCheckins, activeAlerts] = await Promise.all([
      getFlaggedCheckins(100),
      getActiveEmergencyAlerts()
    ]);

    return {
      flaggedCheckins: flaggedCheckins.length,
      activeAlerts: activeAlerts.length,
      criticalCases: flaggedCheckins.filter(c => c.risk_level === 'critical').length
    };
  }

  return {};
}
