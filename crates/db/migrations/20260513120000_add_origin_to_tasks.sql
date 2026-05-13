ALTER TABLE tasks
ADD COLUMN origin TEXT NOT NULL DEFAULT 'human'
CHECK (origin IN ('human', 'agent'));
