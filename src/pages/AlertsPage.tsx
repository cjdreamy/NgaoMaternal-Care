import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getAllEmergencyAlerts, acknowledgeEmergencyAlert, resolveEmergencyAlert } from '@/db/api';
import type { EmergencyAlertWithProfiles } from '@/types';
import { AlertTriangle, MapPin, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<EmergencyAlertWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<EmergencyAlertWithProfiles | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await getAllEmergencyAlerts(100);
      setAlerts(data);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    if (!user) return;
    
    setActionLoading(true);
    try {
      await acknowledgeEmergencyAlert(alertId, user.id);
      toast.success('Alert acknowledged');
      loadAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error('Failed to acknowledge alert');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!user || !selectedAlert) return;
    
    setActionLoading(true);
    try {
      await resolveEmergencyAlert(selectedAlert.id, user.id, resolveNotes);
      toast.success('Alert resolved successfully');
      setSelectedAlert(null);
      setResolveNotes('');
      loadAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string }> = {
      active: { variant: 'destructive', label: 'ACTIVE' },
      acknowledged: { variant: 'secondary', label: 'ACKNOWLEDGED' },
      resolved: { variant: 'default', label: 'RESOLVED' }
    };
    const { variant, label } = config[status] || config.active;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const acknowledgedAlerts = alerts.filter(a => a.status === 'acknowledged');
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved');

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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-emergency" />
            Emergency Alerts
          </h1>
          <p className="text-muted-foreground">Monitor and respond to emergency situations</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emergency">{activeAlerts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{acknowledgedAlerts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{resolvedAlerts.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <Card className="border-emergency">
            <CardHeader>
              <CardTitle className="text-emergency">Active Emergency Alerts</CardTitle>
              <CardDescription>Require immediate attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeAlerts.map((alert) => (
                <div key={alert.id} className="border-2 border-emergency rounded-lg p-4 space-y-3 bg-emergency/5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-bold text-lg">{alert.mother?.full_name || 'Unknown Patient'}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(alert.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    {getStatusBadge(alert.status)}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Alert Type:</span> {alert.alert_type.replace('_', ' ').toUpperCase()}
                    </div>
                    {alert.location_description && (
                      <div className="flex items-start gap-1">
                        <MapPin className="h-4 w-4 mt-0.5 text-emergency" />
                        <span>{alert.location_description}</span>
                      </div>
                    )}
                    {alert.latitude && alert.longitude && (
                      <div className="text-muted-foreground">
                        GPS: {alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Triggered by:</span> {alert.trigger?.full_name || 'Unknown'}
                    </div>
                    {alert.mother?.phone && (
                      <div>
                        <span className="font-medium">Contact:</span> {alert.mother.phone}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleAcknowledge(alert.id)}
                      disabled={actionLoading}
                    >
                      Acknowledge
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedAlert(alert)}
                        >
                          Resolve
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Resolve Emergency Alert</DialogTitle>
                          <DialogDescription>
                            Mark this alert as resolved and add resolution notes
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="notes">Resolution Notes</Label>
                            <Textarea
                              id="notes"
                              placeholder="Describe how the emergency was resolved..."
                              value={resolveNotes}
                              onChange={(e) => setResolveNotes(e.target.value)}
                              rows={4}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            onClick={handleResolve}
                            disabled={actionLoading}
                          >
                            {actionLoading ? 'Resolving...' : 'Resolve Alert'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Acknowledged Alerts */}
        {acknowledgedAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Acknowledged Alerts</CardTitle>
              <CardDescription>Being handled by healthcare team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {acknowledgedAlerts.map((alert) => (
                <div key={alert.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{alert.mother?.full_name || 'Unknown Patient'}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(alert.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    {getStatusBadge(alert.status)}
                  </div>
                  {alert.location_description && (
                    <p className="text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {alert.location_description}
                    </p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedAlert(alert)}
                        >
                          Resolve
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Resolve Emergency Alert</DialogTitle>
                          <DialogDescription>
                            Mark this alert as resolved and add resolution notes
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="notes">Resolution Notes</Label>
                            <Textarea
                              id="notes"
                              placeholder="Describe how the emergency was resolved..."
                              value={resolveNotes}
                              onChange={(e) => setResolveNotes(e.target.value)}
                              rows={4}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            onClick={handleResolve}
                            disabled={actionLoading}
                          >
                            {actionLoading ? 'Resolving...' : 'Resolve Alert'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Resolved Alerts */}
        {resolvedAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Resolved Alerts
              </CardTitle>
              <CardDescription>Successfully handled emergencies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {resolvedAlerts.slice(0, 10).map((alert) => (
                <div key={alert.id} className="border rounded-lg p-4 space-y-2 opacity-75">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{alert.mother?.full_name || 'Unknown Patient'}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(alert.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    {getStatusBadge(alert.status)}
                  </div>
                  {alert.notes && (
                    <p className="text-sm text-muted-foreground italic">
                      Resolution: {alert.notes}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {alerts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No emergency alerts at this time</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
