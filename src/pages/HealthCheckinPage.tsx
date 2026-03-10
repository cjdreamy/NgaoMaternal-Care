import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { createHealthCheckin } from '@/db/api';
import type { RiskLevel } from '@/types';
import { Activity, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const COMMON_SYMPTOMS = [
  'Severe headache',
  'Blurred vision',
  'Severe abdominal pain',
  'Vaginal bleeding',
  'Reduced fetal movement',
  'Sudden swelling',
  'Difficulty breathing',
  'Persistent vomiting',
  'Fever',
  'Dizziness'
];

interface HealthCheckinFormData {
  blood_pressure_systolic: string;
  blood_pressure_diastolic: string;
  heart_rate: string;
  fetal_movement_count: string;
  symptoms: string[];
  notes: string;
}

export default function HealthCheckinPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const form = useForm<HealthCheckinFormData>({
    defaultValues: {
      blood_pressure_systolic: '',
      blood_pressure_diastolic: '',
      heart_rate: '',
      fetal_movement_count: '',
      symptoms: [],
      notes: ''
    }
  });

  const assessRiskLevel = (data: HealthCheckinFormData): { level: RiskLevel; flagged: boolean } => {
    const systolic = parseInt(data.blood_pressure_systolic) || 0;
    const diastolic = parseInt(data.blood_pressure_diastolic) || 0;
    const heartRate = parseInt(data.heart_rate) || 0;
    const fetalMovement = parseInt(data.fetal_movement_count) || 0;

    // Critical conditions
    if (
      systolic >= 160 || 
      diastolic >= 110 || 
      fetalMovement < 5 ||
      selectedSymptoms.some(s => ['Severe headache', 'Blurred vision', 'Vaginal bleeding', 'Severe abdominal pain'].includes(s))
    ) {
      return { level: 'critical', flagged: true };
    }

    // High risk
    if (
      systolic >= 140 || 
      diastolic >= 90 || 
      heartRate > 100 || 
      heartRate < 60 ||
      fetalMovement < 8 ||
      selectedSymptoms.length >= 3
    ) {
      return { level: 'high', flagged: true };
    }

    // Medium risk
    if (
      systolic >= 130 || 
      diastolic >= 85 || 
      selectedSymptoms.length >= 1
    ) {
      return { level: 'medium', flagged: false };
    }

    return { level: 'low', flagged: false };
  };

  const onSubmit = async (data: HealthCheckinFormData) => {
    if (!user) return;

    setLoading(true);

    try {
      const { level, flagged } = assessRiskLevel(data);

      await createHealthCheckin({
        mother_id: user.id,
        checkin_date: new Date().toISOString().split('T')[0],
        blood_pressure_systolic: data.blood_pressure_systolic ? parseInt(data.blood_pressure_systolic) : null,
        blood_pressure_diastolic: data.blood_pressure_diastolic ? parseInt(data.blood_pressure_diastolic) : null,
        heart_rate: data.heart_rate ? parseInt(data.heart_rate) : null,
        fetal_movement_count: data.fetal_movement_count ? parseInt(data.fetal_movement_count) : null,
        symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : null,
        notes: data.notes || null,
        risk_level: level,
        flagged
      });

      if (flagged) {
        toast.warning('Health check-in submitted', {
          description: 'Your check-in has been flagged for review by healthcare providers due to concerning symptoms.'
        });
      } else {
        toast.success('Health check-in completed successfully!');
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting check-in:', error);
      toast.error('Failed to submit health check-in');
    } finally {
      setLoading(false);
    }
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Daily Health Check-in</h1>
            <p className="text-muted-foreground">Complete your daily health assessment</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Health Monitoring Form
            </CardTitle>
            <CardDescription>
              Please provide accurate information about your current health status. This helps us monitor your wellbeing and identify any concerns early.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Vital Signs */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Vital Signs</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="systolic">Blood Pressure (Systolic)</Label>
                    <Input
                      id="systolic"
                      type="number"
                      placeholder="120"
                      {...form.register('blood_pressure_systolic')}
                    />
                    <p className="text-xs text-muted-foreground">Normal: 90-120 mmHg</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="diastolic">Blood Pressure (Diastolic)</Label>
                    <Input
                      id="diastolic"
                      type="number"
                      placeholder="80"
                      {...form.register('blood_pressure_diastolic')}
                    />
                    <p className="text-xs text-muted-foreground">Normal: 60-80 mmHg</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                  <Input
                    id="heartRate"
                    type="number"
                    placeholder="75"
                    {...form.register('heart_rate')}
                  />
                  <p className="text-xs text-muted-foreground">Normal: 60-100 bpm</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fetalMovement">Fetal Movement Count (last 2 hours)</Label>
                  <Input
                    id="fetalMovement"
                    type="number"
                    placeholder="10"
                    {...form.register('fetal_movement_count')}
                  />
                  <p className="text-xs text-muted-foreground">Normal: At least 10 movements in 2 hours</p>
                </div>
              </div>

              {/* Symptoms */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Symptoms</h3>
                <p className="text-sm text-muted-foreground">
                  Select any symptoms you are currently experiencing
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  {COMMON_SYMPTOMS.map((symptom) => (
                    <div key={symptom} className="flex items-center space-x-2">
                      <Checkbox
                        id={symptom}
                        checked={selectedSymptoms.includes(symptom)}
                        onCheckedChange={() => toggleSymptom(symptom)}
                      />
                      <Label htmlFor={symptom} className="text-sm font-normal cursor-pointer">
                        {symptom}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any other concerns or observations..."
                  rows={4}
                  {...form.register('notes')}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Submitting...' : 'Submit Check-in'}
                </Button>
                <Link to="/dashboard">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
