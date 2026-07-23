-- Run this in your Supabase SQL Editor to add new fields to the assets table

ALTER TABLE public.assets
ADD COLUMN location_building text,
ADD COLUMN location_floor text,
ADD COLUMN location_room text,
ADD COLUMN assigned_department text;
