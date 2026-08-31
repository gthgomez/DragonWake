-- Dragon Wake MVP schema (PostgreSQL 16)
-- Apply once per empty database.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE realms (
  id              SMALLSERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  map_w           INT NOT NULL DEFAULT 100,
  map_h           INT NOT NULL DEFAULT 100,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE players (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realm_id        SMALLINT NOT NULL REFERENCES realms(id),
  display_name    TEXT NOT NULL,
  faction         TEXT NOT NULL CHECK (faction IN ('northern_kingdom','mountain_realm','forest_people','coastal_lords')),
  password_hash   TEXT, -- null for pure guest
  guest_token     TEXT UNIQUE,
  chronite        BIGINT NOT NULL DEFAULT 0,
  player_level    INT NOT NULL DEFAULT 1,
  xp              BIGINT NOT NULL DEFAULT 0,
  protection_until TIMESTAMPTZ,
  last_active_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (realm_id, display_name)
);

CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL UNIQUE,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  realm_id        SMALLINT NOT NULL REFERENCES realms(id),
  kind            TEXT NOT NULL DEFAULT 'capital'
                  CHECK (kind IN (
                    'capital','marcher_keep','brinehold','stonekeel',
                    'cinderreach','galeari','mnemolith','citadel_other'
                  )),
  name            TEXT NOT NULL,
  map_x           INT NOT NULL,
  map_y           INT NOT NULL,
  food            BIGINT NOT NULL DEFAULT 1000,
  timber          BIGINT NOT NULL DEFAULT 1000,
  stone           BIGINT NOT NULL DEFAULT 1000,
  iron            BIGINT NOT NULL DEFAULT 500,
  coin            BIGINT NOT NULL DEFAULT 500,
  tax_rate        NUMERIC(5,2) NOT NULL DEFAULT 10,
  happiness       NUMERIC(5,2) NOT NULL DEFAULT 100,
  defense_posture TEXT NOT NULL DEFAULT 'withdraw'
                  CHECK (defense_posture IN ('withdraw','garrison','full')),
  last_posture_change BIGINT NOT NULL DEFAULT 0,
  last_resource_tick TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (realm_id, map_x, map_y)
);

ALTER TABLE cities ADD COLUMN IF NOT EXISTS population INT NOT NULL DEFAULT 0;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS max_population INT NOT NULL DEFAULT 0;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS used_manpower INT NOT NULL DEFAULT 0;

-- Fractional production carry (economy fix): sub-unit remainders.
ALTER TABLE cities ADD COLUMN IF NOT EXISTS res_fraction JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS pop_fraction DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE INDEX cities_player_idx ON cities(player_id);

CREATE TABLE buildings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id         UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  slot_index      INT NOT NULL,
  building_type   TEXT NOT NULL,
  level           INT NOT NULL DEFAULT 1,
  UNIQUE (city_id, slot_index)
);

CREATE TABLE field_plots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id         UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  slot_index      INT NOT NULL,
  plot_type       TEXT, -- null = empty; farm, lumber_yard, quarry, mine
  level           INT NOT NULL DEFAULT 0,
  UNIQUE (city_id, slot_index)
);

CREATE TABLE unit_stacks (
  city_id         UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  unit_id         TEXT NOT NULL,
  count           BIGINT NOT NULL DEFAULT 0 CHECK (count >= 0),
  PRIMARY KEY (city_id, unit_id)
);

CREATE TABLE research_levels (
  city_id         UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  tech_id         TEXT NOT NULL,
  level           INT NOT NULL DEFAULT 0,
  PRIMARY KEY (city_id, tech_id)
);

CREATE TABLE queue_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id         UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  kind            TEXT NOT NULL CHECK (kind IN ('build','research','train')),
  payload         JSONB NOT NULL,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finishes_at     TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'running'
                  CHECK (status IN ('running','completed','cancelled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX queue_jobs_due_idx ON queue_jobs(status, finishes_at);

CREATE TABLE commanders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  stars           INT NOT NULL DEFAULT 1,
  leadership      INT NOT NULL DEFAULT 10,
  attack          INT NOT NULL DEFAULT 10,
  defense         INT NOT NULL DEFAULT 10,
  life            INT NOT NULL DEFAULT 10,
  busy_march_id   UUID,
  xp              BIGINT NOT NULL DEFAULT 0,
  wounded_until   TIMESTAMPTZ
);

CREATE TABLE item_stacks (
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  item_id         TEXT NOT NULL,
  count           BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (player_id, item_id)
);

CREATE TABLE map_cells (
  realm_id        SMALLINT NOT NULL REFERENCES realms(id),
  x               INT NOT NULL,
  y               INT NOT NULL,
  terrain         TEXT NOT NULL,
  PRIMARY KEY (realm_id, x, y)
);

CREATE TABLE wilderness_claims (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realm_id        SMALLINT NOT NULL REFERENCES realms(id),
  x               INT NOT NULL,
  y               INT NOT NULL,
  level           INT NOT NULL,
  resource_type   TEXT NOT NULL,
  owner_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  UNIQUE (realm_id, x, y)
);

CREATE TABLE camps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realm_id        SMALLINT NOT NULL REFERENCES realms(id),
  x               INT NOT NULL,
  y               INT NOT NULL,
  level           INT NOT NULL,
  UNIQUE (realm_id, x, y)
);

CREATE TABLE marches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realm_id        SMALLINT NOT NULL REFERENCES realms(id),
  player_id       UUID NOT NULL REFERENCES players(id),
  from_city_id    UUID NOT NULL REFERENCES cities(id),
  commander_id    UUID REFERENCES commanders(id),
  intent          TEXT NOT NULL
                  CHECK (intent IN ('scout','attack','occupy','reinforce','haul')),
  target_type     TEXT NOT NULL
                  CHECK (target_type IN ('camp','wilderness','city','coords')),
  target_id       UUID,
  target_x        INT NOT NULL,
  target_y        INT NOT NULL,
  composition     JSONB NOT NULL, -- { "reefbow": 100, ... }
  depart_at       TIMESTAMPTZ NOT NULL,
  arrive_at       TIMESTAMPTZ NOT NULL,
  return_at       TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'en_route'
                  CHECK (status IN ('en_route','resolving','returning','completed','cancelled')),
  battle_report_id UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX marches_due_idx ON marches(status, arrive_at);

CREATE TABLE battle_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realm_id        SMALLINT NOT NULL REFERENCES realms(id),
  march_id        UUID REFERENCES marches(id),
  attacker_player_id UUID,
  defender_player_id UUID,
  result          JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE alliances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realm_id        SMALLINT NOT NULL REFERENCES realms(id),
  name            TEXT NOT NULL,
  tag             TEXT NOT NULL,
  leader_id       UUID NOT NULL REFERENCES players(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (realm_id, tag)
);

CREATE TABLE alliance_members (
  alliance_id     UUID NOT NULL REFERENCES alliances(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  rank            TEXT NOT NULL DEFAULT 'member'
                  CHECK (rank IN ('leader','officer','member')),
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (alliance_id, player_id),
  UNIQUE (player_id) -- one alliance per player MVP
);

CREATE TABLE chat_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realm_id        SMALLINT NOT NULL REFERENCES realms(id),
  channel         TEXT NOT NULL CHECK (channel IN ('world','alliance','private')),
  alliance_id     UUID REFERENCES alliances(id) ON DELETE CASCADE,
  from_player_id  UUID NOT NULL REFERENCES players(id),
  to_player_id    UUID REFERENCES players(id),
  body            TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tutorial_progress (
  player_id       UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  step            INT NOT NULL DEFAULT 0,
  completed       BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE bestiary_entries (
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  entry_id        TEXT NOT NULL,
  observation_level INT NOT NULL DEFAULT 0,
  encounter_count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (player_id, entry_id)
);

CREATE TABLE dragon_progress (
  player_id       UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  bestiary_studied INT NOT NULL DEFAULT 0,
  research_level  INT NOT NULL DEFAULT 0,
  materials_collected INT NOT NULL DEFAULT 0,
  camp_types_defeated TEXT[] NOT NULL DEFAULT '{}',
  expedition_stage INT NOT NULL DEFAULT 0,
  charter_earned  BOOLEAN NOT NULL DEFAULT FALSE,
  camps_defeated  INT NOT NULL DEFAULT 0,
  scouts_sent     INT NOT NULL DEFAULT 0
);

CREATE TABLE quest_progress (
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  quest_id        TEXT NOT NULL,
  progress        INT NOT NULL DEFAULT 0,
  completed       BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (player_id, quest_id)
);

-- One row per player = current UTC day (PK bounds growth).
CREATE TABLE IF NOT EXISTS daily_state (
  player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  day_key   TEXT NOT NULL,
  quests    JSONB,
  clue_used INT NOT NULL DEFAULT 0
);

-- Seed realm 1
INSERT INTO realms (id, name) VALUES (1, 'Dragon Wake Beta')
ON CONFLICT DO NOTHING;
