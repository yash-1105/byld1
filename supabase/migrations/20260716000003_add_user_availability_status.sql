-- Teams-style availability status per user. Four states; 'available' is the column default so
-- existing rows get a sensible value, while 'offline' is the neutral option a user can pick to
-- signal they're not around. Users only ever set their OWN status (enforced in the app — the
-- users table's existing owner-scoped UPDATE path already covers this).

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT 'available'
CHECK (availability_status IN ('available', 'busy', 'away', 'offline'));
