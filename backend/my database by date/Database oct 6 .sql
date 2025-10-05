create table public.academic_settings (
  id uuid not null default gen_random_uuid (),
  school_year character varying(20) not null,
  semester_name character varying(50) not null,
  start_date date not null,
  end_date date not null,
  is_active boolean null default true,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  created_by uuid null,
  constraint academic_settings_pkey primary key (id),
  constraint academic_settings_unique_semester unique (school_year, semester_name),
  constraint academic_settings_created_by_fkey foreign KEY (created_by) references counselors (id),
  constraint academic_settings_valid_dates check ((end_date > start_date)),
  constraint academic_settings_valid_school_year check (
    ((school_year)::text ~ '^[0-9]{4}-[0-9]{4}$'::text)
  )
) TABLESPACE pg_default;

create index IF not exists idx_academic_settings_school_year on public.academic_settings using btree (school_year) TABLESPACE pg_default;

create index IF not exists idx_academic_settings_dates on public.academic_settings using btree (start_date, end_date) TABLESPACE pg_default;

create index IF not exists idx_academic_settings_active on public.academic_settings using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_academic_settings_current_date on public.academic_settings using btree (start_date, end_date) TABLESPACE pg_default
where
  (is_active = true);

create trigger trigger_academic_settings_updated_at BEFORE
update on academic_settings for EACH row
execute FUNCTION update_academic_settings_updated_at ();

create trigger trigger_validate_academic_settings_overlap BEFORE INSERT
or
update on academic_settings for EACH row
execute FUNCTION validate_academic_settings_overlap ();








create table public.activity_logs (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  user_type character varying(20) not null,
  action character varying(100) not null,
  details jsonb null,
  ip_address inet null,
  user_agent text null,
  created_at timestamp with time zone null default now(),
  constraint activity_logs_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_activity_user on public.activity_logs using btree (user_id, user_type) TABLESPACE pg_default;

create index IF not exists idx_activity_date on public.activity_logs using btree (created_at) TABLESPACE pg_default;
















create table public.ai_interventions (
  id uuid not null default gen_random_uuid (),
  student_id uuid not null,
  assessment_id uuid null,
  counselor_id uuid null,
  risk_level character varying(20) not null,
  intervention_title text not null,
  intervention_text text not null,
  overall_strategy text null,
  dimension_interventions jsonb null default '{}'::jsonb,
  action_plan jsonb null default '[]'::jsonb,
  intervention_type character varying(50) null default 'ai_generated'::character varying,
  status character varying(20) null default 'generated'::character varying,
  counselor_name character varying(255) null,
  counselor_message text null,
  is_read boolean null default false,
  read_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint ai_interventions_pkey primary key (id),
  constraint fk_ai_interventions_counselor foreign KEY (counselor_id) references counselors (id) on delete set null,
  constraint ai_interventions_intervention_type_check check (
    (
      (intervention_type)::text = any (
        array[
          ('ai_generated'::character varying)::text,
          ('ai_structured'::character varying)::text,
          ('manual'::character varying)::text
        ]
      )
    )
  ),
  constraint ai_interventions_risk_level_check check (
    (
      (risk_level)::text = any (
        array[
          ('at-risk'::character varying)::text,
          ('moderate'::character varying)::text,
          ('healthy'::character varying)::text
        ]
      )
    )
  ),
  constraint ai_interventions_status_check check (
    (
      (status)::text = any (
        array[
          ('generated'::character varying)::text,
          ('sent'::character varying)::text,
          ('read'::character varying)::text,
          ('archived'::character varying)::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_ai_interventions_student_id on public.ai_interventions using btree (student_id) TABLESPACE pg_default;

create index IF not exists idx_ai_interventions_counselor_id on public.ai_interventions using btree (counselor_id) TABLESPACE pg_default;

create index IF not exists idx_ai_interventions_risk_level on public.ai_interventions using btree (risk_level) TABLESPACE pg_default;

create index IF not exists idx_ai_interventions_status on public.ai_interventions using btree (status) TABLESPACE pg_default;

create index IF not exists idx_ai_interventions_created_at on public.ai_interventions using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_ai_interventions_is_read on public.ai_interventions using btree (is_read) TABLESPACE pg_default;

create trigger trigger_update_ai_interventions_updated_at BEFORE
update on ai_interventions for EACH row
execute FUNCTION update_ai_interventions_updated_at ();

create trigger update_ai_interventions_updated_at BEFORE
update on ai_interventions for EACH row
execute FUNCTION update_updated_at_column ();













create table public.assessment_analytics (
  id uuid not null default gen_random_uuid (),
  assessment_id uuid not null,
  student_id uuid not null,
  time_taken_minutes integer not null,
  question_times jsonb null default '{}'::jsonb,
  start_time timestamp with time zone null,
  end_time timestamp with time zone null,
  navigation_pattern jsonb null default '[]'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint assessment_analytics_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_assessment_analytics_assessment_id on public.assessment_analytics using btree (assessment_id) TABLESPACE pg_default;

create index IF not exists idx_assessment_analytics_student_id on public.assessment_analytics using btree (student_id) TABLESPACE pg_default;

create index IF not exists idx_assessment_analytics_time_taken on public.assessment_analytics using btree (time_taken_minutes) TABLESPACE pg_default;

create index IF not exists idx_assessment_analytics_created_at on public.assessment_analytics using btree (created_at) TABLESPACE pg_default;

create trigger trigger_update_assessment_analytics_updated_at BEFORE
update on assessment_analytics for EACH row
execute FUNCTION update_assessment_analytics_updated_at ();


















create table public.assessment_assignments (
  id uuid not null default gen_random_uuid (),
  bulk_assessment_id uuid null,
  student_id uuid null,
  status character varying(50) null default 'assigned'::character varying,
  assigned_at timestamp with time zone null default now(),
  completed_at timestamp with time zone null,
  expires_at timestamp with time zone null,
  risk_level character varying(20) null,
  updated_at timestamp with time zone null default now(),
  constraint assessment_assignments_pkey primary key (id),
  constraint assessment_assignments_bulk_assessment_id_student_id_key unique (bulk_assessment_id, student_id),
  constraint assessment_assignments_bulk_assessment_id_fkey foreign KEY (bulk_assessment_id) references bulk_assessments (id) on delete CASCADE,
  constraint assessment_assignments_student_id_fkey foreign KEY (student_id) references students (id) on delete CASCADE,
  constraint assessment_assignments_risk_level_check check (
    (
      (risk_level)::text = any (
        array[
          ('at-risk'::character varying)::text,
          ('moderate'::character varying)::text,
          ('healthy'::character varying)::text
        ]
      )
    )
  ),
  constraint assessment_assignments_status_check check (
    (
      (status)::text = any (
        array[
          ('assigned'::character varying)::text,
          ('completed'::character varying)::text,
          ('expired'::character varying)::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_assessment_assignments_bulk_id on public.assessment_assignments using btree (bulk_assessment_id) TABLESPACE pg_default;

create index IF not exists idx_assessment_assignments_student_id on public.assessment_assignments using btree (student_id) TABLESPACE pg_default;

create index IF not exists idx_assessment_assignments_status on public.assessment_assignments using btree (status) TABLESPACE pg_default;

create index IF not exists idx_assessment_assignments_id_risk_level on public.assessment_assignments using btree (id, risk_level) TABLESPACE pg_default;

create index IF not exists idx_assessment_assignments_student on public.assessment_assignments using btree (student_id) TABLESPACE pg_default;

create index IF not exists idx_assessment_assignments_updated_at on public.assessment_assignments using btree (updated_at) TABLESPACE pg_default;

create index IF not exists idx_assessment_assignments_student_status_lookup on public.assessment_assignments using btree (student_id, status) TABLESPACE pg_default
where
  ((status)::text = 'assigned'::text);

create trigger trigger_assessment_assignments_updated_at BEFORE
update on assessment_assignments for EACH row
execute FUNCTION update_assessment_assignments_updated_at ();














create table public.assessments_42items (
  id uuid not null default gen_random_uuid (),
  student_id uuid null,
  assessment_type character varying(50) not null,
  responses jsonb not null,
  scores jsonb not null,
  overall_score numeric(5, 2) null,
  risk_level character varying(20) null,
  completed_at timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  assignment_id uuid null,
  at_risk_dimensions jsonb null default '[]'::jsonb,
  updated_at timestamp with time zone null default now(),
  completion_time integer null,
  constraint assessments_pkey primary key (id),
  constraint assessments_risk_level_check check (
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

create index IF not exists idx_assessments_student_id on public.assessments_42items using btree (student_id) TABLESPACE pg_default;

create index IF not exists idx_assessments_completed_at on public.assessments_42items using btree (completed_at) TABLESPACE pg_default;

create index IF not exists idx_assessments_42items_completion_time on public.assessments_42items using btree (completion_time) TABLESPACE pg_default;

create index IF not exists idx_assessments_42items_assignment_risk on public.assessments_42items using btree (assignment_id, risk_level) TABLESPACE pg_default;

create index IF not exists idx_assessments_assignment_id on public.assessments_42items using btree (assignment_id) TABLESPACE pg_default;

create index IF not exists idx_assessments_42items_updated_at on public.assessments_42items using btree (updated_at) TABLESPACE pg_default;

create index IF not exists idx_assessments_42items_student on public.assessments_42items using btree (student_id) TABLESPACE pg_default;

create index IF not exists idx_assessments_42items_assignment on public.assessments_42items using btree (assignment_id) TABLESPACE pg_default;

create index IF not exists idx_assessments_42items_risk_level on public.assessments_42items using btree (risk_level) TABLESPACE pg_default;

create index IF not exists idx_assessments_42items_completed on public.assessments_42items using btree (completed_at) TABLESPACE pg_default;

create trigger trigger_sync_risk_level_42items
after INSERT
or
update OF risk_level on assessments_42items for EACH row when (
  new.risk_level is not null
  and new.assignment_id is not null
)
execute FUNCTION sync_risk_level_to_assignments ();

create trigger update_assessments_42items_updated_at BEFORE
update on assessments_42items for EACH row
execute FUNCTION update_updated_at_column ();







create table public.assessments_42items_history (
  id uuid not null default gen_random_uuid (),
  original_assessment_id uuid not null,
  student_id uuid not null,
  student_name text not null,
  student_email text not null,
  assessment_type text not null default 'ryff_42'::text,
  responses jsonb not null default '{}'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  original_created_at timestamp with time zone not null default now(),
  archived_at timestamp with time zone not null default now(),
  constraint assessments_42items_history_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_assessments_42items_history_original_id on public.assessments_42items_history using btree (original_assessment_id) TABLESPACE pg_default;

create index IF not exists idx_assessments_42items_history_student_id on public.assessments_42items_history using btree (student_id) TABLESPACE pg_default;

create index IF not exists idx_assessments_42items_history_archived_at on public.assessments_42items_history using btree (archived_at) TABLESPACE pg_default;


















create table public.assessments_84items (
  id uuid not null default gen_random_uuid (),
  student_id uuid not null,
  responses jsonb not null,
  scores jsonb not null,
  overall_score numeric(6, 2) null,
  risk_level character varying(20) null,
  completed_at timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  assessment_type character varying(50) not null default '84-item'::character varying,
  assignment_id uuid null,
  at_risk_dimensions jsonb null default '[]'::jsonb,
  updated_at timestamp with time zone null default now(),
  completion_time integer null,
  constraint assessments_84items_pkey primary key (id),
  constraint assessments_84items_risk_level_check check (
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

create index IF not exists idx_assessments_84items_completion_time on public.assessments_84items using btree (completion_time) TABLESPACE pg_default;

create index IF not exists idx_assessments_84items_assignment_risk on public.assessments_84items using btree (assignment_id, risk_level) TABLESPACE pg_default;

create index IF not exists idx_assessments_84items_updated_at on public.assessments_84items using btree (updated_at) TABLESPACE pg_default;

create index IF not exists idx_assessments_84items_student on public.assessments_84items using btree (student_id) TABLESPACE pg_default;

create index IF not exists idx_assessments_84items_risk_level on public.assessments_84items using btree (risk_level) TABLESPACE pg_default;

create index IF not exists idx_assessments_84items_completed on public.assessments_84items using btree (completed_at) TABLESPACE pg_default;

create index IF not exists idx_assessments_84items_type on public.assessments_84items using btree (assessment_type) TABLESPACE pg_default;

create index IF not exists idx_assessments_84items_assignment on public.assessments_84items using btree (assignment_id) TABLESPACE pg_default;

create trigger trigger_sync_risk_level_84items
after INSERT
or
update OF risk_level on assessments_84items for EACH row when (
  new.risk_level is not null
  and new.assignment_id is not null
)
execute FUNCTION sync_risk_level_to_assignments ();

create trigger update_assessments_84items_updated_at BEFORE
update on assessments_84items for EACH row
execute FUNCTION update_updated_at_column ();











create table public.assessments_84items_history (
  id uuid not null default gen_random_uuid (),
  original_assessment_id uuid not null,
  student_id uuid not null,
  student_name text not null,
  student_email text not null,
  assessment_type text not null default 'ryff_84'::text,
  responses jsonb not null default '{}'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  original_created_at timestamp with time zone not null default now(),
  archived_at timestamp with time zone not null default now(),
  constraint assessments_84items_history_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_assessments_84items_history_original_id on public.assessments_84items_history using btree (original_assessment_id) TABLESPACE pg_default;

create index IF not exists idx_assessments_84items_history_student_id on public.assessments_84items_history using btree (student_id) TABLESPACE pg_default;

create index IF not exists idx_assessments_84items_history_archived_at on public.assessments_84items_history using btree (archived_at) TABLESPACE pg_default;










create table public.bulk_assessments (
  id uuid not null default gen_random_uuid (),
  counselor_id uuid null,
  assessment_name character varying(255) not null,
  assessment_type character varying(50) not null,
  target_type character varying(50) not null,
  target_colleges text[] null,
  custom_message text null,
  scheduled_date timestamp with time zone null,
  status character varying(50) null default 'pending'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  target_year_levels integer[] null,
  target_sections text[] null,
  school_year character varying(20) null,
  semester character varying(50) null,
  target_student_id uuid null,
  assessment_source character varying(20) null default 'bulk'::character varying,
  constraint bulk_assessments_pkey primary key (id),
  constraint bulk_assessments_counselor_id_fkey foreign KEY (counselor_id) references counselors (id) on delete CASCADE,
  constraint bulk_assessments_target_student_id_fkey foreign KEY (target_student_id) references students (id),
  constraint bulk_assessments_status_check check (
    (
      (status)::text = any (
        array[
          ('pending'::character varying)::text,
          ('sent'::character varying)::text,
          ('completed'::character varying)::text,
          ('cancelled'::character varying)::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_bulk_assessments_counselor_id on public.bulk_assessments using btree (counselor_id) TABLESPACE pg_default;

create index IF not exists idx_bulk_assessments_status on public.bulk_assessments using btree (status) TABLESPACE pg_default;

create index IF not exists idx_bulk_assessments_scheduled_date on public.bulk_assessments using btree (scheduled_date) TABLESPACE pg_default;

create index IF not exists idx_bulk_assessments_target_year_levels on public.bulk_assessments using gin (target_year_levels) TABLESPACE pg_default;

create index IF not exists idx_bulk_assessments_target_sections on public.bulk_assessments using gin (target_sections) TABLESPACE pg_default;

create index IF not exists idx_bulk_assessments_school_year on public.bulk_assessments using btree (school_year) TABLESPACE pg_default;

create index IF not exists idx_bulk_assessments_semester on public.bulk_assessments using btree (semester) TABLESPACE pg_default;

create index IF not exists idx_bulk_assessments_type_semester_lookup on public.bulk_assessments using btree (assessment_type, school_year, semester) TABLESPACE pg_default;

create trigger update_bulk_assessments_updated_at BEFORE
update on bulk_assessments for EACH row
execute FUNCTION update_updated_at_column ();












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
  risk_distribution jsonb null default '{"at_risk": 0, "healthy": 0, "moderate": 0}'::jsonb,
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
  risk_distribution jsonb null default '{"at_risk": 0, "healthy": 0, "moderate": 0}'::jsonb,
  constraint college_scores_history_pkey primary key (id),
  constraint college_scores_history_risk_level_check check (
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












create table public.counselors (
  id uuid not null default gen_random_uuid (),
  email character varying(255) not null,
  password_hash character varying(255) not null,
  name character varying(255) not null,
  college character varying(255) null,
  role character varying(50) null default 'counselor'::character varying,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint counselors_pkey primary key (id),
  constraint counselors_email_key unique (email)
) TABLESPACE pg_default;

create index IF not exists idx_counselors_email on public.counselors using btree (email) TABLESPACE pg_default;

create index IF not exists idx_counselors_college on public.counselors using btree (college) TABLESPACE pg_default;







create table public.ryff_history (
  id uuid not null default gen_random_uuid (),
  original_id uuid not null,
  student_id uuid not null,
  assessment_type text null,
  responses jsonb null,
  scores jsonb null,
  overall_score integer null,
  risk_level text null,
  at_risk_dimensions jsonb null,
  assignment_id uuid null,
  completed_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  archived_at timestamp with time zone null default now(),
  completion_time integer null,
  constraint ryff_history_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_ryff_history_student_id on public.ryff_history using btree (student_id) TABLESPACE pg_default;

create index IF not exists idx_ryff_history_original_id on public.ryff_history using btree (original_id) TABLESPACE pg_default;

create index IF not exists idx_ryff_history_archived_at on public.ryff_history using btree (archived_at) TABLESPACE pg_default;

create index IF not exists idx_ryff_history_completion_time on public.ryff_history using btree (completion_time) TABLESPACE pg_default;

create trigger trigger_update_ryff_history_completion_time BEFORE INSERT on ryff_history for EACH row
execute FUNCTION update_ryff_history_completion_time ();.










create table public.ryffscoring (
  id uuid not null default gen_random_uuid (),
  student_id uuid not null,
  assessment_type character varying(20) not null,
  responses jsonb not null,
  scores jsonb not null,
  overall_score numeric(5, 2) null,
  risk_level character varying(20) null,
  at_risk_dimensions jsonb null default '[]'::jsonb,
  assignment_id uuid null,
  completed_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint ryffscoring_pkey primary key (id),
  constraint ryffscoring_assessment_type_check check (
    (
      (assessment_type)::text = any (
        array[
          ('ryff_42'::character varying)::text,
          ('ryff_84'::character varying)::text
        ]
      )
    )
  ),
  constraint ryffscoring_risk_level_check check (
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

create index IF not exists idx_ryffscoring_student_id on public.ryffscoring using btree (student_id) TABLESPACE pg_default;

create index IF not exists idx_ryffscoring_assessment_type on public.ryffscoring using btree (assessment_type) TABLESPACE pg_default;

create index IF not exists idx_ryffscoring_risk_level on public.ryffscoring using btree (risk_level) TABLESPACE pg_default;

create index IF not exists idx_ryffscoring_completed_at on public.ryffscoring using btree (completed_at) TABLESPACE pg_default;

create trigger update_ryffscoring_updated_at_trigger BEFORE
update on ryffscoring for EACH row
execute FUNCTION update_ryffscoring_updated_at ();











create table public.students (
  id uuid not null default gen_random_uuid (),
  name character varying(255) not null,
  email character varying(255) not null,
  section character varying(100) null,
  id_number character varying(50) null,
  year_level integer null,
  college character varying(255) null,
  semester character varying(50) null,
  status character varying(20) null default 'active'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  course character varying(255) null,
  gender character varying(20) null default 'Not specified'::character varying,
  password_hash character varying(255) null,
  constraint students_pkey primary key (id),
  constraint students_email_key unique (email),
  constraint students_id_number_key unique (id_number),
  constraint students_gender_check check (
    (
      (gender)::text = any (
        (
          array[
            'Male'::character varying,
            'Female'::character varying,
            'Other'::character varying,
            'Prefer not to say'::character varying,
            'Not specified'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint students_status_check check (
    (
      (status)::text = any (
        array[
          ('active'::character varying)::text,
          ('inactive'::character varying)::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_students_gender on public.students using btree (gender) TABLESPACE pg_default;

create index IF not exists idx_students_email on public.students using btree (email) TABLESPACE pg_default;

create index IF not exists idx_students_college on public.students using btree (college) TABLESPACE pg_default;

create index IF not exists idx_students_status on public.students using btree (status) TABLESPACE pg_default;

create index IF not exists idx_students_section on public.students using btree (section) TABLESPACE pg_default;

create index IF not exists idx_students_college_filters on public.students using btree (college, year_level, section) TABLESPACE pg_default;

create index IF not exists idx_students_course on public.students using btree (course) TABLESPACE pg_default;

create index IF not exists idx_students_college_course_filters on public.students using btree (college, course, year_level, section) TABLESPACE pg_default;

create trigger trigger_students_updated_at BEFORE
update on students for EACH row
execute FUNCTION update_updated_at_column ();












create table public.user_sessions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  user_type character varying(20) not null,
  session_token character varying(255) not null,
  refresh_token character varying(255) null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone null default now(),
  last_accessed timestamp with time zone null default now(),
  ip_address inet null,
  user_agent text null,
  is_active boolean null default true,
  constraint user_sessions_pkey primary key (id),
  constraint user_sessions_refresh_token_key unique (refresh_token),
  constraint user_sessions_session_token_key unique (session_token),
  constraint user_sessions_user_type_check check (
    (
      (user_type)::text = any (
        array[
          ('student'::character varying)::text,
          ('counselor'::character varying)::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_sessions_token on public.user_sessions using btree (session_token) TABLESPACE pg_default;

create index IF not exists idx_sessions_user on public.user_sessions using btree (user_id, user_type) TABLESPACE pg_default;

create index IF not exists idx_sessions_expires on public.user_sessions using btree (expires_at) TABLESPACE pg_default;