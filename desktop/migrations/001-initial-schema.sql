-- ═══════════════════════════════════════════════════════════════════════════
-- AncestorTree Desktop — SQLite Initial Schema
-- Mirrors PostgreSQL schema from Supabase migrations (Sprint 1-8)
-- 13 tables: 7 core + 4 culture + 2 ceremony
-- No RLS (single-user desktop mode = admin)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Core Genealogy ─────────────────────────────────────────────────────────

-- 1. People
CREATE TABLE IF NOT EXISTS people (
    id              TEXT PRIMARY KEY,
    handle          TEXT UNIQUE NOT NULL,
    display_name    TEXT NOT NULL,
    first_name      TEXT,
    middle_name     TEXT,
    surname         TEXT,
    pen_name        TEXT,
    taboo_name      TEXT,
    gender          INTEGER CHECK (gender IN (1, 2)),
    generation      INTEGER NOT NULL DEFAULT 1,
    chi             INTEGER,
    birth_date      TEXT,
    birth_year      INTEGER,
    birth_place     TEXT,
    death_date      TEXT,
    death_year      INTEGER,
    death_place     TEXT,
    death_lunar     TEXT,
    is_living       INTEGER DEFAULT 1,
    is_patrilineal  INTEGER DEFAULT 1,
    phone           TEXT,
    email           TEXT,
    zalo            TEXT,
    facebook        TEXT,
    address         TEXT,
    hometown        TEXT,
    occupation      TEXT,
    biography       TEXT,
    notes           TEXT,
    avatar_url      TEXT,
    privacy_level   INTEGER DEFAULT 1,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_people_surname ON people(surname);
CREATE INDEX IF NOT EXISTS idx_people_generation ON people(generation);
CREATE INDEX IF NOT EXISTS idx_people_chi ON people(chi);
CREATE INDEX IF NOT EXISTS idx_people_display_name ON people(display_name);

-- 2. Families
CREATE TABLE IF NOT EXISTS families (
    id              TEXT PRIMARY KEY,
    handle          TEXT UNIQUE NOT NULL,
    father_id       TEXT REFERENCES people(id) ON DELETE SET NULL,
    mother_id       TEXT REFERENCES people(id) ON DELETE SET NULL,
    marriage_date   TEXT,
    marriage_place  TEXT,
    divorce_date    TEXT,
    notes           TEXT,
    sort_order      INTEGER DEFAULT 0,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_families_father ON families(father_id);
CREATE INDEX IF NOT EXISTS idx_families_mother ON families(mother_id);

-- 3. Children (junction)
CREATE TABLE IF NOT EXISTS children (
    id              TEXT PRIMARY KEY,
    family_id       TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    person_id       TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    sort_order      INTEGER DEFAULT 0,
    created_at      TEXT DEFAULT (datetime('now')),
    UNIQUE(family_id, person_id)
);

CREATE INDEX IF NOT EXISTS idx_children_family ON children(family_id);
CREATE INDEX IF NOT EXISTS idx_children_person ON children(person_id);

-- ─── Platform ───────────────────────────────────────────────────────────────

-- 4. Profiles (single admin row for desktop)
CREATE TABLE IF NOT EXISTS profiles (
    id              TEXT PRIMARY KEY,
    user_id         TEXT UNIQUE NOT NULL,
    email           TEXT,
    full_name       TEXT,
    role            TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'editor', 'viewer')),
    linked_person   TEXT REFERENCES people(id) ON DELETE SET NULL,
    edit_root_person_id TEXT REFERENCES people(id) ON DELETE SET NULL,
    avatar_url      TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);

-- 5. Contributions
CREATE TABLE IF NOT EXISTS contributions (
    id              TEXT PRIMARY KEY,
    author_id       TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    target_person   TEXT REFERENCES people(id) ON DELETE CASCADE,
    change_type     TEXT CHECK (change_type IN ('create', 'update', 'delete')),
    changes         TEXT,
    reason          TEXT,
    status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by     TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at     TEXT,
    review_notes    TEXT,
    created_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contributions_status ON contributions(status);

-- 6. Events
CREATE TABLE IF NOT EXISTS events (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    description     TEXT,
    event_date      TEXT,
    event_lunar     TEXT,
    event_type      TEXT DEFAULT 'other' CHECK (event_type IN ('gio', 'hop_ho', 'le_tet', 'other')),
    person_id       TEXT REFERENCES people(id) ON DELETE SET NULL,
    location        TEXT,
    recurring       INTEGER DEFAULT 0,
    created_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);

-- 7. Media
CREATE TABLE IF NOT EXISTS media (
    id              TEXT PRIMARY KEY,
    person_id       TEXT REFERENCES people(id) ON DELETE CASCADE,
    type            TEXT DEFAULT 'photo' CHECK (type IN ('photo', 'document', 'video')),
    url             TEXT NOT NULL,
    caption         TEXT,
    is_primary      INTEGER DEFAULT 0,
    sort_order      INTEGER DEFAULT 0,
    created_at      TEXT DEFAULT (datetime('now'))
);

-- ─── Culture (Sprint 6) ────────────────────────────────────────────────────

-- 8. Achievements
CREATE TABLE IF NOT EXISTS achievements (
    id              TEXT PRIMARY KEY,
    person_id       TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    category        TEXT NOT NULL CHECK (category IN ('hoc_tap', 'su_nghiep', 'cong_hien', 'other')),
    description     TEXT,
    year            INTEGER,
    awarded_by      TEXT,
    is_featured     INTEGER DEFAULT 0,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_achievements_person ON achievements(person_id);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);

-- 9. Fund Transactions
CREATE TABLE IF NOT EXISTS fund_transactions (
    id                TEXT PRIMARY KEY,
    type              TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category          TEXT NOT NULL CHECK (category IN ('dong_gop', 'hoc_bong', 'khen_thuong', 'other')),
    amount            REAL NOT NULL CHECK (amount > 0),
    donor_name        TEXT,
    donor_person_id   TEXT REFERENCES people(id) ON DELETE SET NULL,
    recipient_id      TEXT REFERENCES people(id) ON DELETE SET NULL,
    description       TEXT,
    transaction_date  TEXT NOT NULL DEFAULT (date('now')),
    academic_year     TEXT,
    created_by        TEXT REFERENCES profiles(id),
    created_at        TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_fund_tx_type ON fund_transactions(type);
CREATE INDEX IF NOT EXISTS idx_fund_tx_category ON fund_transactions(category);
CREATE INDEX IF NOT EXISTS idx_fund_tx_date ON fund_transactions(transaction_date);

-- 10. Scholarships
CREATE TABLE IF NOT EXISTS scholarships (
    id              TEXT PRIMARY KEY,
    person_id       TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    type            TEXT NOT NULL CHECK (type IN ('hoc_bong', 'khen_thuong')),
    amount          REAL NOT NULL CHECK (amount > 0),
    reason          TEXT,
    academic_year   TEXT NOT NULL,
    school          TEXT,
    grade_level     TEXT,
    status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
    approved_by     TEXT REFERENCES profiles(id),
    approved_at     TEXT,
    created_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_scholarships_person ON scholarships(person_id);
CREATE INDEX IF NOT EXISTS idx_scholarships_type ON scholarships(type);
CREATE INDEX IF NOT EXISTS idx_scholarships_status ON scholarships(status);

-- 11. Clan Articles
CREATE TABLE IF NOT EXISTS clan_articles (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    content         TEXT NOT NULL,
    category        TEXT NOT NULL CHECK (category IN ('gia_huan', 'quy_uoc', 'loi_dan')),
    sort_order      INTEGER DEFAULT 0,
    is_featured     INTEGER DEFAULT 0,
    author_id       TEXT REFERENCES profiles(id),
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_clan_articles_category ON clan_articles(category);

-- ─── Ceremony (Sprint 7) ───────────────────────────────────────────────────

-- 12. Cau Duong Pools
CREATE TABLE IF NOT EXISTS cau_duong_pools (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    ancestor_id     TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
    min_generation  INTEGER NOT NULL DEFAULT 1,
    max_age_lunar   INTEGER NOT NULL DEFAULT 70,
    description     TEXT,
    is_active       INTEGER DEFAULT 1,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cau_duong_pools_ancestor ON cau_duong_pools(ancestor_id);

-- 13. Cau Duong Assignments
CREATE TABLE IF NOT EXISTS cau_duong_assignments (
    id                      TEXT PRIMARY KEY,
    pool_id                 TEXT NOT NULL REFERENCES cau_duong_pools(id) ON DELETE CASCADE,
    year                    INTEGER NOT NULL,
    ceremony_type           TEXT NOT NULL CHECK (
                                ceremony_type IN ('tet', 'ram_thang_gieng', 'gio_to', 'ram_thang_bay')
                            ),
    host_person_id          TEXT REFERENCES people(id) ON DELETE SET NULL,
    actual_host_person_id   TEXT REFERENCES people(id) ON DELETE SET NULL,
    status                  TEXT DEFAULT 'scheduled' CHECK (
                                status IN ('scheduled', 'completed', 'delegated', 'rescheduled', 'cancelled')
                            ),
    scheduled_date          TEXT,
    actual_date             TEXT,
    reason                  TEXT,
    notes                   TEXT,
    rotation_index          INTEGER,
    created_by              TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    created_at              TEXT DEFAULT (datetime('now')),
    updated_at              TEXT DEFAULT (datetime('now')),
    UNIQUE(pool_id, year, ceremony_type)
);

CREATE INDEX IF NOT EXISTS idx_cau_duong_assignments_pool ON cau_duong_assignments(pool_id);
CREATE INDEX IF NOT EXISTS idx_cau_duong_assignments_year ON cau_duong_assignments(year);
CREATE INDEX IF NOT EXISTS idx_cau_duong_assignments_host ON cau_duong_assignments(host_person_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Desktop Admin Profile (single-user mode)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT OR IGNORE INTO profiles (id, user_id, email, full_name, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'admin@desktop.local',
    'Admin',
    'admin'
);
