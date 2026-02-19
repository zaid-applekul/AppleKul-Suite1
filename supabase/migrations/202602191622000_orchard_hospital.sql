-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ───────────────────────────────────────────────────────────────────
-- TABLE: consultations
-- ───────────────────────────────────────────────────────────────────
create table if not exists consultations (
  id              uuid primary key default gen_random_uuid(),
  grower_name     text not null,
  grower_phone    text not null default '',
  orchard_id      text not null,
  doctor_id       text,
  type            text not null check (type in ('CHAT','CALL','VIDEO','ONSITE_VISIT')),
  status          text not null default 'REQUESTED'
                    check (status in ('REQUESTED','IN_PROGRESS','COMPLETED')),
  target_datetime timestamptz not null,
  notes           text not null default '',
  created_at      timestamptz not null default now()
);

-- ───────────────────────────────────────────────────────────────────
-- TABLE: prescriptions
-- ───────────────────────────────────────────────────────────────────
create table if not exists prescriptions (
  id               uuid primary key default gen_random_uuid(),
  consultation_id  uuid not null references consultations(id) on delete cascade,
  doctor_name      text not null,
  hospital_name    text not null,
  issue_diagnosed  text not null,
  eppo_code        text not null default '',
  recommendation   text not null,
  status           text not null default 'PENDING'
                     check (status in ('PENDING','APPLIED','NEEDS_CORRECTION')),
  issued_at        date not null default current_date,
  follow_up_date   date not null,
  created_at       timestamptz not null default now()
);

-- ───────────────────────────────────────────────────────────────────
-- TABLE: prescription_action_items
-- ───────────────────────────────────────────────────────────────────
create table if not exists prescription_action_items (
  id              uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references prescriptions(id) on delete cascade,
  category        text not null check (category in ('FUNGICIDE','INSECTICIDE','FERTILIZER','LABOR','IRRIGATION','OTHER')),
  product_name    text not null,
  dosage          text not null,
  estimated_cost  numeric(10,2) not null default 0,
  sort_order      int not null default 0
);

-- ───────────────────────────────────────────────────────────────────
-- INDEXES
-- ───────────────────────────────────────────────────────────────────
create index if not exists idx_consultations_orchard   on consultations(orchard_id);
create index if not exists idx_consultations_doctor    on consultations(doctor_id);
create index if not exists idx_prescriptions_consult   on prescriptions(consultation_id);
create index if not exists idx_action_items_rx         on prescription_action_items(prescription_id);

-- ───────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (permissive for dev — tighten per your auth)
-- ───────────────────────────────────────────────────────────────────
alter table consultations             enable row level security;
alter table prescriptions             enable row level security;
alter table prescription_action_items enable row level security;

-- Allow all operations for now (replace with proper policies for prod)
create policy "allow all consultations"
  on consultations for all using (true) with check (true);

create policy "allow all prescriptions"
  on prescriptions for all using (true) with check (true);

create policy "allow all action items"
  on prescription_action_items for all using (true) with check (true);