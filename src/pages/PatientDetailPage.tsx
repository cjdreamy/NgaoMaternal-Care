import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getProfile, getPatientRecord, getHealthCheckins, getEmergencyAlerts } from '@/db/api';
import type { Profile, PatientRecord, HealthCheckin, EmergencyAlert } from '@/types';
import { ArrowLeft, User, Activity, AlertTriangle, Calendar, Heart } from 'lucide-react';
import { format } from 'date-fns';

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Profile | null>(null);
  const [record, setRecord] = useState<PatientRecord | null>(null);
  const [checkins, setCheckins] = useState<HealthCheckin[]>([]);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPatientData();
    }
  }, [id]);

  const loadPatientData = async () => {
    if (!id) return;

    try {
      const [patientData, recordData, checkinsData, alertsData] = await Promise.all([
        getProfile(id),
        getPatientRecord(id),
        getHealthCheckins(id, 30),
        getEmergencyAlerts(id, 20)
      ]);

      setPatient(patientData);
      setRecord(recordData);
      setCheckins(checkinsData);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (level: string) => {
    const variants: Record<string, any> = {
      low: 'default',
      medium: 'secondary',
      high: 'destructive',
      critical: 'destructive'
    };
    return <Badge variant={variants[level] || 'default'}>{level.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Patient not found</p>
            <Link to="/patients">
              <Button className="mt-4">Back to Patients</Button>
            </Link>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/provider-dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{patient.full_name || 'Patient Details'}</h1>
            <p className="text-muted-foreground">Complete patient health record</p>
          </div>
        </div>

        {/* Patient Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{patient.full_name || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{patient.phone || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">
                  {patient.date_of_birth ? format(new Date(patient.date_of_birth), 'MMM d, yyyy') : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{patient.address || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Emergency Contact</p>
                <p className="font-medium">{patient.emergency_contact_name || 'Not set'}</p>
                {patient.emergency_contact_phone && (
                  <p className="text-sm text-muted-foreground">{patient.emergency_contact_phone}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Record */}
        {record && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Medical Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pregnancy Week</p>
                  <p className="font-medium text-lg">{record.pregnancy_week || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected Due Date</p>
                  <p className="font-medium">
                    {record.expected_due_date ? format(new Date(record.expected_due_date), 'MMM d, yyyy') : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Blood Type</p>
                  <p className="font-medium">{record.blood_type || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Previous Pregnancies</p>
                  <p className="font-medium">{record.previous_pregnancies}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Clinic Visit</p>
                  <p className="font-medium">
                    {record.last_clinic_visit ? format(new Date(record.last_clinic_visit), 'MMM d, yyyy') : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Clinic Visit</p>
                  <p className="font-medium">
                    {record.next_clinic_visit ? format(new Date(record.next_clinic_visit), 'MMM d, yyyy') : 'Not set'}
                  </p>
                </div>
              </div>
              {record.allergies && record.allergies.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Allergies</p>
                  <div className="flex flex-wrap gap-2">
                    {record.allergies.map((allergy, idx) => (
                      <Badge key={idx} variant="outline">{allergy}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {record.medical_conditions && record.medical_conditions.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Medical Conditions</p>
                  <div className="flex flex-wrap gap-2">
                    {record.medical_conditions.map((condition, idx) => (
                      <Badge key={idx} variant="secondary">{condition}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabs for History */}
        <Tabs defaultValue="checkins" className="space-y-4">
          <TabsList>
            <TabsTrigger value="checkins">Health Check-ins</TabsTrigger>
            <TabsTrigger value="alerts">Emergency Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="checkins">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Health Check-in History
                </CardTitle>
                <CardDescription>Recent health monitoring data</CardDescription>
              </CardHeader>
              <CardContent>
                {checkins.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No check-ins recorded</p>
                ) : (
                  <div className="space-y-4">
                    {checkins.map((checkin) => (
                      <div key={checkin.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{format(new Date(checkin.checkin_date), 'MMMM d, yyyy')}</p>
                            <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                              {checkin.blood_pressure_systolic && (
                                <span>BP: {checkin.blood_pressure_systolic}/{checkin.blood_pressure_diastolic}</span>
                              )}
                              {checkin.heart_rate && <span>HR: {checkin.heart_rate} bpm</span>}
                              {checkin.fetal_movement_count !== null && (
                                <span>Fetal Movement: {checkin.fetal_movement_count}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getRiskBadge(checkin.risk_level)}
                            {checkin.flagged && (
                              <Badge variant="outline" className="text-warning">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Flagged
                              </Badge>
                            )}
                          </div>
                        </div>
                        {checkin.symptoms && checkin.symptoms.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {checkin.symptoms.map((symptom, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {symptom}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {checkin.notes && (
                          <p className="text-sm text-muted-foreground italic">{checkin.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Emergency Alert History
                </CardTitle>
                <CardDescription>Past emergency situations</CardDescription>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No emergency alerts recorded</p>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{format(new Date(alert.created_at), 'MMM d, yyyy h:mm a')}</p>
                            <p className="text-sm text-muted-foreground">{alert.alert_type.replace('_', ' ').toUpperCase()}</p>
                          </div>
                          <Badge variant={alert.status === 'resolved' ? 'default' : 'destructive'}>
                            {alert.status.toUpperCase()}
                          </Badge>
                        </div>
                        {alert.location_description && (
                          <p className="text-sm">{alert.location_description}</p>
                        )}
                        {alert.notes && (
                          <p className="text-sm text-muted-foreground italic">Resolution: {alert.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
