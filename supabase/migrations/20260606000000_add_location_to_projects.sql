-- Add location and geofencing fields to the projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS geofence_radius INTEGER DEFAULT 500; -- 500 meters default radius
