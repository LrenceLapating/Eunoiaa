create table public.college_scores (
  id uuid not null default gen_random_uuid (),
  college_name character varying(255) not null,
  dimension_name character varying(100) not null,
  raw_score numeric(6, 2) not null,
  student_count integer not null default 0,
  risk_level character varying(20) null,
  assessment_type character varying(50) not null,
  assessment_name character varying(255) not null,
  last_calculated timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  available_year_levels jsonb null default '[]'::jsonb,
  available_sections jsonb null default '[]'::jsonb,
  constraint college_scores_pkey primary key (id),
  constraint college_scores_assessment_type_check check (
    (
      (assessment_type)::text = any (
        array[
          ('ryff_42'::character varying)::text,
          ('ryff_84'::character varying)::text
        ]
      )
    )
  ),
  constraint college_scores_risk_level_check check (
    (
      (risk_level)::text = any (
        array[
          ('low'::character varying)::text,
          ('moderate'::character varying)::text,
          ('high'::character varying)::text,
          ('at-risk'::character varying)::text,
          ('healthy'::character varying)::text
        ]
      )
    )
  ),
  constraint college_scores_student_count_check check ((student_count >= 0))
) TABLESPACE pg_default;

create index IF not exists idx_college_scores_college_name on public.college_scores using btree (college_name) TABLESPACE pg_default;

create index IF not exists idx_college_scores_dimension_name on public.college_scores using btree (dimension_name) TABLESPACE pg_default;

create index IF not exists idx_college_scores_assessment_type on public.college_scores using btree (assessment_type) TABLESPACE pg_default;

create index IF not exists idx_college_scores_assessment_name on public.college_scores using btree (assessment_name) TABLESPACE pg_default;

create index IF not exists idx_college_scores_risk_level on public.college_scores using btree (risk_level) TABLESPACE pg_default;

create index IF not exists idx_college_scores_college_assessment on public.college_scores using btree (college_name, assessment_type, assessment_name) TABLESPACE pg_default;

create index IF not exists idx_college_scores_college_dimension on public.college_scores using btree (college_name, dimension_name) TABLESPACE pg_default;

create index IF not exists idx_college_scores_last_calculated on public.college_scores using btree (last_calculated) TABLESPACE pg_default;

create index IF not exists idx_college_scores_year_levels on public.college_scores using gin (available_year_levels) TABLESPACE pg_default;

create index IF not exists idx_college_scores_sections on public.college_scores using gin (available_sections) TABLESPACE pg_default;

create trigger trigger_college_scores_updated_at BEFORE
update on college_scores for EACH row
execute FUNCTION update_college_scores_updated_at ();



create table public.college_scores_history (
  id uuid not null default gen_random_uuid (),
  college_name character varying(255) not null,
  dimension_name character varying(100) not null,
  raw_score numeric(6, 2) null,
  student_count integer null default 0,
  risk_level character varying(20) null,
  assessment_type character varying(50) not null,
  assessment_name character varying(255) null,
  last_calculated timestamp with time zone null,
  archived_at timestamp with time zone not null default now(),
  archived_from_id uuid null,
  archive_reason character varying(255) null default 'student_deactivation'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  student_id uuid null,
  available_year_levels_backup integer[] null,
  available_sections_backup text[] null,
  available_year_levels jsonb null default '[]'::jsonb,
  available_sections jsonb null default '[]'::jsonb,
  constraint college_scores_history_pkey primary key (id),
  constraint college_scores_history_student_id_fkey foreign KEY (student_id) references students (id) on delete CASCADE,
  constraint college_scores_history_risk_level_check check (
    (
      (risk_level)::text = any (
        array[
          ('low'::character varying)::text,
          ('moderate'::character varying)::text,
          ('high'::character varying)::text,
          ('at_risk'::character varying)::text,
          ('healthy'::character varying)::text
        ]
      )
    )
  ),
  constraint college_scores_history_student_count_check check ((student_count >= 0))
) TABLESPACE pg_default;

create index IF not exists idx_college_scores_history_college_name on public.college_scores_history using btree (college_name) TABLESPACE pg_default;

create index IF not exists idx_college_scores_history_assessment_type on public.college_scores_history using btree (assessment_type) TABLESPACE pg_default;

create index IF not exists idx_college_scores_history_assessment_name on public.college_scores_history using btree (assessment_name) TABLESPACE pg_default;

create index IF not exists idx_college_scores_history_archived_at on public.college_scores_history using btree (archived_at desc) TABLESPACE pg_default;

create index IF not exists idx_college_scores_history_archive_reason on public.college_scores_history using btree (archive_reason) TABLESPACE pg_default;

create index IF not exists idx_college_scores_history_college_assessment on public.college_scores_history using btree (college_name, assessment_type, assessment_name) TABLESPACE pg_default;

create index IF not exists idx_college_scores_history_college_archived on public.college_scores_history using btree (college_name, archived_at desc) TABLESPACE pg_default;

create index IF not exists idx_college_scores_history_student_id on public.college_scores_history using btree (student_id) TABLESPACE pg_default;

create index IF not exists idx_college_scores_history_year_levels on public.college_scores_history using gin (available_year_levels) TABLESPACE pg_default;

create index IF not exists idx_college_scores_history_sections on public.college_scores_history using gin (available_sections) TABLESPACE pg_default;

create trigger update_college_scores_history_updated_at BEFORE
update on college_scores_history for EACH row
execute FUNCTION update_updated_at_column ();