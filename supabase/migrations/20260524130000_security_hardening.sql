-- Security hardening and relational integrity fixes for Redex Education.
-- P0: prevent authenticated self-escalation through the owner email allowlist.
ALTER TABLE redex.allowed_owner_emails ENABLE ROW LEVEL SECURITY;

-- P1: SET NULL delete actions require nullable columns.
ALTER TABLE redex.assignments ALTER COLUMN assignee_user_id DROP NOT NULL;
ALTER TABLE redex.assignments ALTER COLUMN assigned_by DROP NOT NULL;
ALTER TABLE redex.profiles ALTER COLUMN manager_id DROP NOT NULL;
ALTER TABLE redex.generation_jobs ALTER COLUMN target_section_id DROP NOT NULL;

-- P1: make user/profile deletes non-blocking for dependent records that can retain history.
ALTER TABLE redex.assignments
  DROP CONSTRAINT assignments_assignee_user_id_fkey,
  ADD CONSTRAINT assignments_assignee_user_id_fkey
    FOREIGN KEY (assignee_user_id) REFERENCES redex.profiles(id) ON DELETE SET NULL;

ALTER TABLE redex.assignments
  DROP CONSTRAINT assignments_assigned_by_fkey,
  ADD CONSTRAINT assignments_assigned_by_fkey
    FOREIGN KEY (assigned_by) REFERENCES redex.profiles(id) ON DELETE SET NULL;

ALTER TABLE redex.profiles
  DROP CONSTRAINT profiles_manager_id_fkey,
  ADD CONSTRAINT profiles_manager_id_fkey
    FOREIGN KEY (manager_id) REFERENCES redex.profiles(id) ON DELETE SET NULL;

ALTER TABLE redex.generated_content_reviews
  DROP CONSTRAINT generated_content_reviews_lesson_id_fkey,
  ADD CONSTRAINT generated_content_reviews_lesson_id_fkey
    FOREIGN KEY (lesson_id) REFERENCES redex.training_lessons(id) ON DELETE CASCADE;

ALTER TABLE redex.generation_jobs
  DROP CONSTRAINT generation_jobs_target_section_id_fkey,
  ADD CONSTRAINT generation_jobs_target_section_id_fkey
    FOREIGN KEY (target_section_id) REFERENCES redex.source_sections(id) ON DELETE SET NULL;

-- P1: hot-path FK indexes for joins and delete/update checks.
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_enrollment_id ON redex.assessment_attempts(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_assessments_module_version_id ON redex.assessments(module_version_id);
CREATE INDEX IF NOT EXISTS idx_assignments_module_version_id ON redex.assignments(module_version_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_reviews_lesson_id ON redex.generated_content_reviews(lesson_id);
CREATE INDEX IF NOT EXISTS idx_source_files_current_version_id ON redex.source_files(current_version_id);

-- P1: make approval_state deterministic for module version lifecycle code.
UPDATE redex.module_versions SET approval_state = 'draft' WHERE approval_state IS NULL;
ALTER TABLE redex.module_versions ALTER COLUMN approval_state SET NOT NULL;
ALTER TABLE redex.module_versions ALTER COLUMN approval_state SET DEFAULT 'draft';
