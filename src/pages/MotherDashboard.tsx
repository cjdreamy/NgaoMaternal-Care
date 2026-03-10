import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { Activity, Bell, BookOpen, Calendar, Heart, AlertTriangle } from 'lucide-react';
import { getDashboardStats, getHealthCheckins, getPatientRecord, getEmergencyAlerts } from '@/db/api';
import type { HealthCheckin, PatientRecord, EmergencyAlert } from '@/types';
import { format } from 'date-fns';
import { PanicButton } from '@/components/features/PanicButton';

export default function MotherDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [recentCheckins, setRecentCheckins] = useState<HealthCheckin[]>([]);
  const [patientRecord, setPatientRecord] = useState<PatientRecord | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      const [statsData, checkins, record, alerts] = await Promise.all([
        getDashboardStats(user.id, 'mother'),
        getHealthCheckins(user.id, 7),
        getPatientRecord(user.id),
        getEmergencyAlerts(user.id, 5)
      ]);

      setStats(statsData);
      setRecentCheckins(checkins);
      setPatientRecord(record);
      setRecentAlerts(alerts);
    } catch (error) {
      console.error('Error loading dashboard:', error);
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

  const getPregnancyProgress = () => {
    const week = patientRecord?.pregnancy_week || 0;
    return (week / 40) * 100;
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
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold">Welcome, {profile?.full_name || 'Mother'}</h1>
          <p className="text-muted-foreground">Monitor your health and stay connected with your care team</p>
        </div>

        {/* Emergency Alert */}
        {recentAlerts.some(a => a.status === 'active') && (
          <Alert variant="destructive" className="border-emergency">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have an active emergency alert. Help is on the way.
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pregnancy Week</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patientRecord?.pregnancy_week || 0}</div>
              <p className="text-xs text-muted-foreground">
                {40 - (patientRecord?.pregnancy_week || 0)} weeks remaining
              </p>
              <Progress value={getPregnancyProgress()} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Check-ins</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentCheckins.length}</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Visit</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {patientRecord?.next_clinic_visit 
                  ? format(new Date(patientRecord.next_clinic_visit), 'MMM d')
                  : 'Not set'}
              </div>
              <p className="text-xs text-muted-foreground">Clinic appointment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {recentAlerts.filter(a => a.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">Emergency alerts</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Daily Health Check-in</CardTitle>
              <CardDescription>
                Complete your daily health assessment to help us monitor your wellbeing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/health-checkin">
                <Button className="w-full">
                  <Activity className="mr-2 h-4 w-4" />
                  Start Check-in
                </Button>
              </Link>
              {recentCheckins.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Last check-in: {format(new Date(recentCheckins[0].checkin_date), 'MMM d, yyyy')}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Emergency Alert</CardTitle>
              <CardDescription>
                Press the panic button if you need immediate medical assistance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PanicButton motherId={user?.id} />
            </CardContent>
          </Card>
        </div>

        {/* Recent Check-ins */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Health Check-ins</CardTitle>
            <CardDescription>Your health monitoring history</CardDescription>
          </CardHeader>
          <CardContent>
            {recentCheckins.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No check-ins yet. Complete your first health check-in to start monitoring.
              </p>
            ) : (
              <div className="space-y-4">
                {recentCheckins.slice(0, 5).map((checkin) => (
                  <div key={checkin.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {format(new Date(checkin.checkin_date), 'MMMM d, yyyy')}
                      </p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {checkin.blood_pressure_systolic && (
                          <span>BP: {checkin.blood_pressure_systolic}/{checkin.blood_pressure_diastolic}</span>
                        )}
                        {checkin.heart_rate && <span>HR: {checkin.heart_rate} bpm</span>}
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Educational Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Educational Resources</CardTitle>
            <CardDescription>Learn about pregnancy health and warning signs</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/education">
              <Button variant="outline" className="w-full">
                <BookOpen className="mr-2 h-4 w-4" />
                Browse Educational Content
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
