-- Sprint 18: Member Registrations + Council Settings (SQLite)

CREATE TABLE IF NOT EXISTS member_registrations (
    id              TEXT PRIMARY KEY,
    full_name       TEXT NOT NULL,
    gender          INTEGER NOT NULL CHECK (gender IN (1, 2)),
    birth_year      INTEGER,
    birth_place     TEXT,
    phone           TEXT,
    email           TEXT,
    parent_name     TEXT,
    generation      INTEGER,
    chi             INTEGER,
    relationship    TEXT,
    notes           TEXT,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reject_reason   TEXT,
    reviewed_by     TEXT,
    reviewed_at     TEXT,
    person_id       TEXT,
    honeypot        TEXT,
    created_at      TEXT DEFAULT (datetime('now'))
);

-- Extend clan_settings
ALTER TABLE clan_settings ADD COLUMN council_members TEXT DEFAULT '[]';
ALTER TABLE clan_settings ADD COLUMN clan_history TEXT;
ALTER TABLE clan_settings ADD COLUMN clan_mission TEXT;
ALTER TABLE clan_settings ADD COLUMN ancestral_hall_images TEXT DEFAULT '[]';
ALTER TABLE clan_settings ADD COLUMN ancestral_hall_address TEXT;
ALTER TABLE clan_settings ADD COLUMN ancestral_hall_coordinates TEXT;
ALTER TABLE clan_settings ADD COLUMN ancestral_hall_history TEXT;
ALTER TABLE clan_settings ADD COLUMN ceremony_schedule TEXT DEFAULT '[]';
