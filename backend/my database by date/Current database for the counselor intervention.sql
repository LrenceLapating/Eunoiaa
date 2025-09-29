create table public.counselor_interventions (
  id uuid not null default gen_random_uuid (),
  student_id uuid not null,
  assessment_id uuid null,
  counselor_id uuid not null,
  risk_level character varying(20) not null,
  intervention_title text not null,
  intervention_text text not null,
  counselor_message text null,
  is_read boolean null default false,
  read_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  overall_strategy text null,
  dimension_interventions jsonb null default '{}'::jsonb,
  action_plan jsonb null default '[]'::jsonb,
  status character varying(20) null default 'pending'::character varying,
  assessment_type character varying(20) null default 'unknown'::character varying,
  overall_score integer null,
  dimension_scores jsonb null default '{}'::jsonb,
  constraint counselor_interventions_pkey primary key (id),
  constraint counselor_interventions_counselor_id_fkey foreign KEY (counselor_id) references counselors (id) on delete CASCADE,
  constraint fk_counselor_interventions_assessment foreign KEY (assessment_id) references assessment_assignments (id) on delete CASCADE,
  constraint fk_counselor_interventions_counselor foreign KEY (counselor_id) references counselors (id) on delete CASCADE,
  constraint fk_counselor_interventions_student foreign KEY (student_id) references students (id) on delete CASCADE,
  constraint counselor_interventions_risk_level_check check (
    (
      (risk_level)::text = any (
        array[
          ('low'::character varying)::text,
          ('moderate'::character varying)::text,
          ('high'::character varying)::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_counselor_interventions_student_id on public.counselor_interventions using btree (student_id) TABLESPACE pg_default;

create index IF not exists idx_counselor_interventions_counselor_id on public.counselor_interventions using btree (counselor_id) TABLESPACE pg_default;

create index IF not exists idx_counselor_interventions_created_at on public.counselor_interventions using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_counselor_interventions_counselor_status on public.counselor_interventions using btree (counselor_id, status) TABLESPACE pg_default;

create index IF not exists idx_counselor_interventions_status on public.counselor_interventions using btree (status) TABLESPACE pg_default;

create index IF not exists idx_counselor_interventions_assessment_type on public.counselor_interventions using btree (assessment_type) TABLESPACE pg_default;

create index IF not exists idx_counselor_interventions_student_assessment_type on public.counselor_interventions using btree (student_id, assessment_type) TABLESPACE pg_default;

create index IF not exists idx_counselor_interventions_overall_score on public.counselor_interventions using btree (overall_score) TABLESPACE pg_default;

create index IF not exists idx_counselor_interventions_dimension_scores on public.counselor_interventions using gin (dimension_scores) TABLESPACE pg_default;

create trigger update_counselor_interventions_updated_at BEFORE
update on counselor_interventions for EACH row
execute FUNCTION update_updated_at_column ();











create table public.counselor_intervention_history (
  id uuid not null default gen_random_uuid (),
  original_intervention_id uuid not null,
  student_id uuid not null,
  assessment_id uuid null,
  counselor_id uuid not null,
  risk_level character varying(20) not null,
  intervention_title text not null,
  intervention_text text not null,
  counselor_message text null,
  is_read boolean null default false,
  read_at timestamp with time zone null,
  overall_strategy text null,
  dimension_interventions jsonb null default '{}'::jsonb,
  action_plan jsonb null default '[]'::jsonb,
  status character varying(20) null default 'sent'::character varying,
  assessment_type character varying(20) null default 'unknown'::character varying,
  overall_score integer null,
  dimension_scores jsonb null default '{}'::jsonb,
  original_created_at timestamp with time zone null,
  original_updated_at timestamp with time zone null,
  deactivated_at timestamp with time zone null default now(),
  deactivated_by uuid null,
  constraint counselor_intervention_history_pkey primary key (id),
  constraint fk_counselor_intervention_history_assessment foreign KEY (assessment_id) references assessment_assignments (id) on delete set null,
  constraint fk_counselor_intervention_history_counselor foreign KEY (counselor_id) references counselors (id) on delete CASCADE,
  constraint fk_counselor_intervention_history_deactivated_by foreign KEY (deactivated_by) references counselors (id) on delete set null,
  constraint fk_counselor_intervention_history_student foreign KEY (student_id) references students (id) on delete CASCADE,
  constraint counselor_intervention_history_risk_level_check check (
    (
      (risk_level)::text = any (
        (
          array[
            'low'::character varying,
            'moderate'::character varying,
            'high'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_counselor_intervention_history_student_id on public.counselor_intervention_history using btree (student_id) TABLESPACE pg_default;

create index IF not exists idx_counselor_intervention_history_counselor_id on public.counselor_intervention_history using btree (counselor_id) TABLESPACE pg_default;

create index IF not exists idx_counselor_intervention_history_deactivated_at on public.counselor_intervention_history using btree (deactivated_at) TABLESPACE pg_default;

create index IF not exists idx_counselor_intervention_history_assessment_type on public.counselor_intervention_history using btree (assessment_type) TABLESPACE pg_default;

create index IF not exists idx_counselor_intervention_history_student_assessment_type on public.counselor_intervention_history using btree (student_id, assessment_type) TABLESPACE pg_default;