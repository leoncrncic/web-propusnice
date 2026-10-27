CREATE TABLE IF NOT EXISTS passes (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL CHECK (length(trim(name)) > 0),
    document TEXT NOT NULL CHECK (length(trim(document)) > 0),
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT valid_status
        CHECK (status IN ('ACTIVE', 'CANCELLED'))
);
