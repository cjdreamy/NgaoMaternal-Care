import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AlertCircle } from 'lucide-react';
import { createEmergencyAlert, getNearestClinic } from '@/db/api';
import { toast } from 'sonner';

interface PanicButtonProps {
  motherId?: string;
}

export function PanicButton({ motherId }: PanicButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleEmergencyAlert = async () => {
    if (!motherId) {
      toast.error('User not authenticated');
      return;
    }

    setLoading(true);

    try {
      // Get user's location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;

      // Find nearest clinic
      const nearestClinic = await getNearestClinic(latitude, longitude);

      // Create emergency alert
      await createEmergencyAlert({
        mother_id: motherId,
        triggered_by: motherId,
        alert_type: 'panic_button',
        latitude,
        longitude,
        location_description: nearestClinic 
          ? `Near ${nearestClinic.name}` 
          : 'Location captured'
      });

      toast.success('Emergency alert sent! Help is on the way.', {
        description: nearestClinic 
          ? `Nearest clinic: ${nearestClinic.name}` 
          : 'Emergency services have been notified'
      });
    } catch (error: any) {
      console.error('Emergency alert error:', error);
      
      // If location fails, still create alert without location
      if (error.code === 1) { // Permission denied
        try {
          await createEmergencyAlert({
            mother_id: motherId,
            triggered_by: motherId,
            alert_type: 'panic_button',
            location_description: 'Location unavailable - permission denied'
          });
          toast.warning('Emergency alert sent without location', {
            description: 'Please enable location services for better emergency response'
          });
        } catch (err) {
          toast.error('Failed to send emergency alert');
        }
      } else {
        toast.error('Failed to send emergency alert');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="lg" 
          className="w-full h-20 text-lg font-bold emergency-pulse"
          disabled={loading}
        >
          <AlertCircle className="mr-2 h-6 w-6" />
          EMERGENCY PANIC BUTTON
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-emergency">Confirm Emergency Alert</AlertDialogTitle>
          <AlertDialogDescription>
            This will immediately notify the nearest healthcare facility and your emergency contacts. 
            Your location will be shared. Only press if you need urgent medical assistance.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleEmergencyAlert}
            className="bg-emergency hover:bg-emergency/90"
            disabled={loading}
          >
            {loading ? 'Sending Alert...' : 'Send Emergency Alert'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
