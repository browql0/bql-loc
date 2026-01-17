-- Create contact_messages table for storing contact form submissions
-- This table stores messages from the public contact form

CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    agency_name TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    read BOOLEAN DEFAULT false,
    responded BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Only superadmins can read contact messages
CREATE POLICY "Superadmin can read contact messages" 
ON contact_messages 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'superadmin'
    )
);

-- Policy: Anyone can insert contact messages (public form)
CREATE POLICY "Anyone can insert contact messages" 
ON contact_messages 
FOR INSERT 
WITH CHECK (true);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_read ON contact_messages(read) WHERE read = false;

