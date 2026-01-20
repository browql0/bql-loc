-- Migration: Enhance contact_messages table
-- Adds phone, ip_address, and user_agent fields for better tracking and security

-- Add columns if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contact_messages' AND column_name = 'phone') THEN
        ALTER TABLE contact_messages ADD COLUMN phone TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contact_messages' AND column_name = 'ip_address') THEN
        ALTER TABLE contact_messages ADD COLUMN ip_address TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contact_messages' AND column_name = 'user_agent') THEN
        ALTER TABLE contact_messages ADD COLUMN user_agent TEXT;
    END IF;
END $$;

-- Note: Ensure that the 'Anyone can insert contact messages' policy still works.
-- It was already set to WITH CHECK (true), so no changes needed there.
-- The IP and User Agent should be handled by the client or middleware (if any).
