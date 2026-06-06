import { useMemo } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useState } from 'react';
import { Project } from '@/data/mockData';
import { Link } from 'react-router-dom';

interface ProjectMapProps {
  projects: Project[];
}

const mapContainerStyle = {
  width: '100%',
  height: '600px',
  borderRadius: '16px',
};

export default function ProjectMap({ projects }: ProjectMapProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Center on US by default, or the first project if available
  const center = useMemo(() => {
    if (projects.length > 0 && projects[0].latitude && projects[0].longitude) {
      return { lat: projects[0].latitude, lng: projects[0].longitude };
    }
    return { lat: 39.8283, lng: -98.5795 }; // Center of US
  }, [projects]);

  if (!isLoaded) return <div className="h-[600px] w-full rounded-2xl bg-muted animate-pulse flex items-center justify-center">Loading Maps...</div>;

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-lg border border-border relative">
      {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-warning/90 text-warning-foreground px-4 py-2 rounded-lg text-sm font-medium shadow-lg backdrop-blur-md">
          Please set VITE_GOOGLE_MAPS_API_KEY in your .env file
        </div>
      )}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={4}
        center={center}
        options={{
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        }}
      >
        {projects.map((project) => (
          project.latitude && project.longitude ? (
            <Marker
              key={project.id}
              position={{ lat: project.latitude, lng: project.longitude }}
              onClick={() => setSelectedProject(project)}
            />
          ) : null
        ))}

        {selectedProject && selectedProject.latitude && selectedProject.longitude && (
          <InfoWindow
            position={{ lat: selectedProject.latitude, lng: selectedProject.longitude }}
            onCloseClick={() => setSelectedProject(null)}
          >
            <div className="p-2 max-w-xs text-foreground">
              <h3 className="font-semibold text-base mb-1">{selectedProject.name}</h3>
              <p className="text-xs text-muted-foreground mb-3">{selectedProject.address}</p>
              <div className="flex items-center justify-between text-xs mb-3">
                <span>Progress: {selectedProject.progress}%</span>
                <span className="capitalize text-primary">{selectedProject.status}</span>
              </div>
              <Link 
                to={`/projects/${selectedProject.id}`}
                className="block text-center w-full bg-primary text-primary-foreground py-1.5 rounded-md text-xs font-medium"
              >
                View Project
              </Link>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
