import { useState, useMemo, useCallback } from 'react';
import { GoogleMap, useLoadScript, Marker, DirectionsRenderer, Circle } from '@react-google-maps/api';
import { Project } from '@/data/mockData';
import { Truck, MapPin, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface DeliveryTrackerProps {
  project: Project;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '16px',
};

export default function DeliveryTracker({ project }: DeliveryTrackerProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const [origin, setOrigin] = useState('');
  const [siteAddress, setSiteAddress] = useState(project.address || '');
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [isGeofenceTriggered, setIsGeofenceTriggered] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const destination = useMemo(() => {
    return project.latitude && project.longitude 
      ? { lat: project.latitude, lng: project.longitude } 
      : siteAddress;
  }, [project, siteAddress]);

  const mapCenter = useMemo(() => {
    return project.latitude && project.longitude 
      ? { lat: project.latitude, lng: project.longitude } 
      : { lat: 39.8283, lng: -98.5795 }; // Default US center
  }, [project]);

  const calculateRoute = useCallback(async () => {
    if (!origin || !destination || !window.google) {
      toast.error('Please enter both starting address and destination.');
      return;
    }

    setIsCalculating(true);
    const directionsService = new window.google.maps.DirectionsService();

    try {
      const results = await directionsService.route({
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      });

      setDirections(results);
      
      const leg = results.routes[0].legs[0];
      setDistance(leg.distance?.text || '');
      setDuration(leg.duration?.text || '');

      const distValue = leg.distance?.value || 0;
      const geofenceRadius = project.geofenceRadius || 500;
      
      if (distValue <= geofenceRadius) {
        setIsGeofenceTriggered(true);
        toast.success(`Geofence Alert: Delivery has arrived!`);
      } else {
        setIsGeofenceTriggered(false);
      }
    } catch (err) {
      console.error('Error calculating route:', err);
      toast.error('Could not calculate route. Please check the addresses.');
    } finally {
      setIsCalculating(false);
    }
  }, [origin, destination, project]);

  if (!isLoaded) return <div className="h-[400px] w-full rounded-2xl bg-muted animate-pulse" />;

  const hasCoords = !!(project.latitude && project.longitude);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 space-y-3">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Starting Address (Truck location)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          {!hasCoords && (
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              <input
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                placeholder="Destination Site Address..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary/30 bg-primary/5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}
        </div>
        <button
          onClick={calculateRoute}
          disabled={!origin || (!hasCoords && !siteAddress) || isCalculating}
          className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2 justify-center shrink-0 shadow-lg shadow-primary/20 h-[44px]"
        >
          <Truck className="w-4 h-4" /> 
          {isCalculating ? 'Calculating...' : 'Track Delivery'}
        </button>
      </div>

      {(distance || isGeofenceTriggered) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-border bg-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Distance to Site</p>
              <p className="font-semibold text-foreground">{distance}</p>
            </div>
          </div>
          
          <div className="p-4 rounded-xl border border-border bg-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-warning/10 text-warning flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Est. Arrival Time</p>
              <p className="font-semibold text-foreground">{duration}</p>
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${isGeofenceTriggered ? 'border-success bg-success/5' : 'border-border bg-card'} flex items-center gap-3 transition-colors`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isGeofenceTriggered ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}`}>
              {isGeofenceTriggered ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div>
              <p className={`text-xs ${isGeofenceTriggered ? 'text-success' : 'text-muted-foreground'}`}>Geofence Status</p>
              <p className={`font-semibold ${isGeofenceTriggered ? 'text-success' : 'text-foreground'}`}>
                {isGeofenceTriggered ? 'Arrived at Site' : 'En Route'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden shadow-sm border border-border relative">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={hasCoords || directions ? 12 : 4}
          center={hasCoords ? mapCenter : (directions?.routes[0]?.legs[0]?.end_location || mapCenter)}
          options={{
            styles: [
              { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
            ]
          }}
        >
          {hasCoords && !directions && (
            <Marker position={mapCenter} label="Site" />
          )}
          
          {/* Geofence visualizer */}
          {(hasCoords || directions?.routes[0]?.legs[0]?.end_location) && (
            <Circle
              center={hasCoords ? mapCenter : (directions?.routes[0]?.legs[0]?.end_location as google.maps.LatLng)}
              radius={project.geofenceRadius || 500}
              options={{
                fillColor: isGeofenceTriggered ? "#10b981" : "#3b82f6",
                fillOpacity: 0.2,
                strokeColor: isGeofenceTriggered ? "#10b981" : "#3b82f6",
                strokeOpacity: 0.8,
                strokeWeight: 2,
              }}
            />
          )}

          {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true }} />}
          
          {directions && directions.routes[0]?.legs[0]?.start_location && (
            <Marker position={directions.routes[0].legs[0].start_location} label="Truck" />
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
