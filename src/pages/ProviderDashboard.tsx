import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getDashboardStats, getFlaggedCheckins, getActiveEmergencyAlerts, getAllPatientRecords, getUssdAlerts, reviewCheckin, resolveUssdAlert, getActivityLogs } from '@/db/api';
import type { HealthCheckinWithProfile, EmergencyAlertWithProfiles, PatientRecordWithProfile, ActivityLog } from '@/types';
import { Activity, AlertTriangle, Users, TrendingUp, CheckCircle, Phone, History, Clock, Info } from 'lucide-react';
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
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [selectedUssdAlert, setSelectedUssdAlert] = useState<any | null>(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const [statsData, checkins, alerts, patientRecords, ussd, logs] = await Promise.all([
        getDashboardStats(user.id, profile?.role || 'healthcare_provider'),
        getFlaggedCheckins(50),
        getActiveEmergencyAlerts(),
        getAllPatientRecords(20),
        getUssdAlerts(),
        getActivityLogs(20)
      ]);

      setStats(statsData);
      setFlaggedCheckins(checkins);
      setActiveAlerts(alerts);
      setPatients(patientRecords);
      setUssdAlerts(ussd.filter((a: any) => a.status === 'active'));
      setActivityLogs(logs);
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

  const handleResolveUssd = async () => {
    if (!user || !selectedUssdAlert) return;
    setActionLoading(true);
    try {
      await resolveUssdAlert(selectedUssdAlert.id, user.id, resolveNotes);
      toast.success('USSD Alert resolved successfully');
      setSelectedUssdAlert(null);
      setResolveNotes('');
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
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
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
                          <Dialog open={selectedUssdAlert?.id === alert.id} onOpenChange={(open) => !open && setSelectedUssdAlert(null)}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-orange-600 hover:bg-orange-700"
                                onClick={() => setSelectedUssdAlert(alert)}
                              >
                                Mark as Resolved
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Resolve USSD Emergency</DialogTitle>
                                <DialogDescription>
                                  Mark emergency from {alert.phone_number} as resolved
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="dashboard-ussd-notes">Resolution Notes</Label>
                                  <Textarea
                                    id="dashboard-ussd-notes"
                                    placeholder="Briefly describe the outcome..."
                                    value={resolveNotes}
                                    onChange={(e) => setResolveNotes(e.target.value)}
                                    rows={4}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={handleResolveUssd}
                                  disabled={actionLoading}
                                >
                                  {actionLoading ? 'Resolving...' : 'Confirm Resolution'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
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

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Recent Provider Activity
                </CardTitle>
                <CardDescription>Tracking actions taken by healthcare providers</CardDescription>
              </CardHeader>
              <CardContent>
                {activityLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No activity logs found</p>
                ) : (
                  <div className="space-y-4">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                        <div className="mt-1">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Info className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">
                            {log.action}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {log.details}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {log.user?.full_name || 'System'}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(log.created_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        </div>
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
