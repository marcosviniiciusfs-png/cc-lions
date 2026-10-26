ALTER TABLE leads
ADD COLUMN crm_status TEXT NOT NULL DEFAULT 'pending'
CHECK (crm_status IN ('pending', 'sent', 'failed'));
