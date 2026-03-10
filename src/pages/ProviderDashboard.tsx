import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDashboardStats, getFlaggedCheckins, getActiveEmergencyAlerts, getAllPatientRecords, getUssdAlerts, reviewCheckin, resolveUssdAlert } from '@/db/api';
import type { HealthCheckinWithProfile, EmergencyAlertWithProfiles, PatientRecordWithProfile } from '@/types';
import { Activity, AlertTriangle, Users, TrendingUp, CheckCircle, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function ProviderDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [flaggedCheckins, setFlaggedCheckins] = useState<HealthCheckinWithProfile[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlertWithProfiles[]>([]);
  const [ussdAlerts, setUssdAlerts] = useState<any[]>([]);
  const [patients, setPatients] = useState<PatientRecordWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const [statsData, checkins, alerts, patientRecords, ussd] = await Promise.all([
        getDashboardStats(user.id, profile?.role || 'healthcare_provider'),
        getFlaggedCheckins(50),
        getActiveEmergencyAlerts(),
        getAllPatientRecords(20),
        getUssdAlerts()
      ]);

      setStats(statsData);
      setFlaggedCheckins(checkins);
      setActiveAlerts(alerts);
      setPatients(patientRecords);
      setUssdAlerts(ussd.filter((a: any) => a.status === 'active'));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveCheckin = async (id: string) => {
    if (!user) return;
    setActionLoading(true);
    try {
      await reviewCheckin(id, user.id);
      toast.success('Check-in marked as reviewed');
      loadDashboardData();
    } catch (error) {
      toast.error('Failed to review check-in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveUssd = async (id: string) => {
    console.log('Resolving USSD alert:', id);
    setActionLoading(true);
    try {
      await resolveUssdAlert(id);
      toast.success('USSD Alert resolved');
      loadDashboardData();
    } catch (error) {
      console.error('USSD Resolution failed:', error);
      toast.error('Failed to resolve USSD alert');
    } finally {
      setActionLoading(false);
    }
  };

  const getRiskBadge = (level: string) => {
    const config: Record<string, { variant: any; label: string }> = {
      low: { variant: 'default', label: 'LOW' },
      medium: { variant: 'secondary', label: 'MEDIUM' },
      high: { variant: 'destructive', label: 'HIGH' },
      critical: { variant: 'destructive', label: 'CRITICAL' }
    };
    const { variant, label } = config[level] || config.low;
    return <Badge variant={variant}>{label}</Badge>;
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Healthcare Provider Dashboard</h1>
          <p className="text-muted-foreground">Monitor patients and respond to alerts</p>
        </div>

        {/* Active Alerts Warning */}
        {activeAlerts.length > 0 && (
          <Alert variant="destructive" className="border-emergency">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{activeAlerts.length} active emergency alert{activeAlerts.length > 1 ? 's' : ''}</strong> requiring immediate attention.
              <Link to="/alerts" className="ml-2 underline font-medium">
                View all alerts
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-emergency" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emergency">{stats.activeAlerts || 0}</div>
              <p className="text-xs text-muted-foreground">Require immediate response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flagged Check-ins</CardTitle>
              <Activity className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.flaggedCheckins || 0}</div>
              <p className="text-xs text-muted-foreground">Pending review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
              <TrendingUp className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.criticalCases || 0}</div>
              <p className="text-xs text-muted-foreground">High-risk patients</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPatients || patients.length}</div>
              <p className="text-xs text-muted-foreground">Under monitoring</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="flagged" className="space-y-4">
          <TabsList>
            <TabsTrigger value="flagged">Flagged Check-ins</TabsTrigger>
            <TabsTrigger value="alerts">Emergency Alerts</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
          </TabsList>

          <TabsContent value="flagged" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Flagged Health Check-ins</CardTitle>
                <CardDescription>Review and respond to concerning health reports</CardDescription>
              </CardHeader>
              <CardContent>
                {flaggedCheckins.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No flagged check-ins at this time</p>
                ) : (
                  <div className="space-y-4">
                    {flaggedCheckins.map((checkin) => (
                      <div key={checkin.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{checkin.mother?.full_name || 'Unknown Patient'}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(checkin.checkin_date), 'MMMM d, yyyy')}
                            </p>
                          </div>
                          {getRiskBadge(checkin.risk_level)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          {checkin.blood_pressure_systolic && (
                            <div>
                              <span className="text-muted-foreground">BP:</span>{' '}
                              {checkin.blood_pressure_systolic}/{checkin.blood_pressure_diastolic}
                            </div>
                          )}
                          {checkin.heart_rate && (
                            <div>
                              <span className="text-muted-foreground">HR:</span> {checkin.heart_rate} bpm
                            </div>
                          )}
                          {checkin.fetal_movement_count !== null && (
                            <div>
                              <span className="text-muted-foreground">Fetal Movement:</span> {checkin.fetal_movement_count}
                            </div>
                          )}
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
                        <div className="flex gap-2 pt-2">
                          <Link to={`/patients/${checkin.mother_id}`}>
                            <Button size="sm" variant="outline">View Patient</Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleResolveCheckin(checkin.id)}
                            disabled={actionLoading}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Reviewed
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Emergency Alerts</CardTitle>
                <CardDescription>Respond to emergency situations immediately</CardDescription>
              </CardHeader>
              <CardContent>
                {activeAlerts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No active emergency alerts</p>
                ) : (
                  <div className="space-y-4">
                    {activeAlerts.map((alert) => (
                      <div key={alert.id} className="border-2 border-emergency rounded-lg p-4 space-y-2 bg-emergency/5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-emergency font-bold">APP EMERGENCY ALERT</p>
                            <p className="font-medium">{alert.mother?.full_name || 'Unknown Patient'}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(alert.created_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                          <Badge variant="destructive">ACTIVE</Badge>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Link to="/alerts">
                            <Button size="sm" variant="destructive">Open in Alert Center</Button>
                          </Link>
                        </div>
                      </div>
                    ))}

                    {/* USSD Alerts */}
                    {ussdAlerts.map((alert) => (
                      <div key={alert.id} className="border-2 border-orange-500 rounded-lg p-4 space-y-2 bg-orange-50">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-orange-600 font-bold flex items-center gap-2">
                              <Phone className="h-4 w-4" /> USSD EMERGENCY (GUEST)
                            </p>
                            <p className="font-medium text-lg">{alert.phone_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(alert.created_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                          <Badge variant="destructive" className="bg-orange-600">ACTIVE</Badge>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-orange-600 hover:bg-orange-700"
                            onClick={() => handleResolveUssd(alert.id)}
                            disabled={actionLoading}
                          >
                            Mark as Resolved
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Patient Records</CardTitle>
                <CardDescription>View and manage patient information</CardDescription>
              </CardHeader>
              <CardContent>
                {patients.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No patient records available</p>
                ) : (
                  <div className="space-y-3">
                    {patients.map((record) => (
                      <div key={record.id} className="border rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{record.mother?.full_name || 'Unknown Patient'}</p>
                          <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                            {record.pregnancy_week && <span>Week {record.pregnancy_week}</span>}
                            {record.expected_due_date && (
                              <span>Due: {format(new Date(record.expected_due_date), 'MMM d, yyyy')}</span>
                            )}
                          </div>
                        </div>
                        <Link to={`/patients/${record.mother_id}`}>
                          <Button size="sm" variant="outline">View Details</Button>
                        </Link>
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
