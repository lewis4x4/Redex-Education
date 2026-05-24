-- Slice: Onboarding Workflow
-- Adds onboarding-specific profile fields used by /admin/onboard.

ALTER TABLE redex.profiles
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS manager_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_manager_id_fkey'
      AND conrelid = 'redex.profiles'::regclass
  ) THEN
    ALTER TABLE redex.profiles
      ADD CONSTRAINT profiles_manager_id_fkey
      FOREIGN KEY (manager_id) REFERENCES redex.profiles(id) ON DELETE SET NULL;
  END IF;
END
$$;

COMMENT ON COLUMN redex.profiles.start_date IS 'Employee start date used for onboarding timeline and reporting.';
COMMENT ON COLUMN redex.profiles.department IS 'Employee department used for onboarding segmentation and reporting.';
COMMENT ON COLUMN redex.profiles.manager_id IS 'Direct manager profile id for reporting relationships and manager views.';
