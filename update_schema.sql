-- Run this in your Supabase SQL Editor to add the status column and read receipt functionality

ALTER TABLE public.ticket_messages
ADD COLUMN status text DEFAULT 'sent';

UPDATE public.ticket_messages
SET status = 'sent'
WHERE status IS NULL;
