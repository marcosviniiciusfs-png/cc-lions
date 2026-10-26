CREATE TABLE IF NOT EXISTS leads (
  event_id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  full_name TEXT NOT NULL CHECK (length(full_name) BETWEEN 1 AND 160),
  phone TEXT NOT NULL CHECK (length(phone) BETWEEN 12 AND 13),
  service_type TEXT NOT NULL CHECK (service_type IN ('Consórcio', 'Imobiliária')),
  asset_type TEXT,
  credit_range TEXT,
  has_entry INTEGER NOT NULL DEFAULT 0 CHECK (has_entry IN (0, 1)),
  entry_amount TEXT,
  monthly_range TEXT,
  notes TEXT,
  meta_status TEXT NOT NULL DEFAULT 'pending' CHECK (meta_status IN ('pending', 'sent', 'failed'))
);

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);
