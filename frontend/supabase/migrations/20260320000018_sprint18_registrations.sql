-- ============================================================================
-- Sprint 18: Nhà thờ họ — Member Registrations + Council Settings
-- AncestorTree v3.0.0
-- ============================================================================

-- ─── Member registrations table ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS member_registrations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
    reject_reason   TEXT,
    reviewed_by     UUID REFERENCES auth.users(id),
    reviewed_at     TIMESTAMPTZ,
    person_id       UUID REFERENCES people(id),
    honeypot        TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_registrations_status ON member_registrations(status, created_at DESC);

COMMENT ON TABLE member_registrations IS 'Sprint 18: Public member registration requests';

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE member_registrations ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can submit a registration
CREATE POLICY "Anyone can submit registration"
ON member_registrations FOR INSERT TO anon, authenticated
WITH CHECK (status = 'pending');

-- Only admin/editor can view registrations
CREATE POLICY "Admin/editor can view registrations"
ON member_registrations FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'editor'))
);

-- Only admin/editor can update (approve/reject)
CREATE POLICY "Admin/editor can update registrations"
ON member_registrations FOR UPDATE TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'editor'))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'editor'))
);

-- Only admin can delete registrations
CREATE POLICY "Admin can delete registrations"
ON member_registrations FOR DELETE TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- ─── Extend clan_settings for council + ancestral hall ──────────────────────

ALTER TABLE clan_settings ADD COLUMN IF NOT EXISTS council_members JSONB DEFAULT '[]'::jsonb;
ALTER TABLE clan_settings ADD COLUMN IF NOT EXISTS clan_history TEXT;
ALTER TABLE clan_settings ADD COLUMN IF NOT EXISTS clan_mission TEXT;
ALTER TABLE clan_settings ADD COLUMN IF NOT EXISTS ancestral_hall_images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE clan_settings ADD COLUMN IF NOT EXISTS ancestral_hall_address TEXT;
ALTER TABLE clan_settings ADD COLUMN IF NOT EXISTS ancestral_hall_coordinates JSONB;
ALTER TABLE clan_settings ADD COLUMN IF NOT EXISTS ancestral_hall_history TEXT;
ALTER TABLE clan_settings ADD COLUMN IF NOT EXISTS ceremony_schedule JSONB DEFAULT '[]'::jsonb;
