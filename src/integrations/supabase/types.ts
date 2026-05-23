export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  redex: {
    Tables: {
      acknowledgments: {
        Row: {
          acknowledged_at: string
          enrollment_id: string
          id: string
          lesson_id: string
          statement_text: string
        }
        Insert: {
          acknowledged_at?: string
          enrollment_id: string
          id?: string
          lesson_id: string
          statement_text: string
        }
        Update: {
          acknowledged_at?: string
          enrollment_id?: string
          id?: string
          lesson_id?: string
          statement_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "acknowledgments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_training_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acknowledgments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "training_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_attempts: {
        Row: {
          answers: Json
          attempted_at: string
          enrollment_id: string
          id: string
          lesson_id: string
          passed: boolean
          score_percent: number
        }
        Insert: {
          answers: Json
          attempted_at?: string
          enrollment_id: string
          id?: string
          lesson_id: string
          passed: boolean
          score_percent: number
        }
        Update: {
          answers?: Json
          attempted_at?: string
          enrollment_id?: string
          id?: string
          lesson_id?: string
          passed?: boolean
          score_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_attempts_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_training_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "training_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_questions: {
        Row: {
          assessment_id: string
          correct_index: number
          explanation: string | null
          id: string
          options: Json
          order_index: number
          prompt: string
        }
        Insert: {
          assessment_id: string
          correct_index: number
          explanation?: string | null
          id?: string
          options: Json
          order_index: number
          prompt: string
        }
        Update: {
          assessment_id?: string
          correct_index?: number
          explanation?: string | null
          id?: string
          options?: Json
          order_index?: number
          prompt?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          module_version_id: string | null
          passing_threshold: number
          question_count: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          module_version_id?: string | null
          passing_threshold: number
          question_count?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          module_version_id?: string | null
          passing_threshold?: number
          question_count?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "training_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_module_version_id_fkey"
            columns: ["module_version_id"]
            isOneToOne: false
            referencedRelation: "module_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          assignee_role: string | null
          assignee_user_id: string | null
          due_at: string | null
          id: string
          module_version_id: string
          status: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          assignee_role?: string | null
          assignee_user_id?: string | null
          due_at?: string | null
          id?: string
          module_version_id: string
          status?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          assignee_role?: string | null
          assignee_user_id?: string | null
          due_at?: string | null
          id?: string
          module_version_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_assignee_user_id_fkey"
            columns: ["assignee_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_module_version_id_fkey"
            columns: ["module_version_id"]
            isOneToOne: false
            referencedRelation: "module_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          actor_name: string
          actor_user_id: string
          entity_id: string
          entity_label: string
          entity_type: string
          event_type: string
          id: string
          metadata: Json | null
          occurred_at: string
        }
        Insert: {
          actor_name: string
          actor_user_id: string
          entity_id: string
          entity_label: string
          entity_type: string
          event_type: string
          id?: string
          metadata?: Json | null
          occurred_at?: string
        }
        Update: {
          actor_name?: string
          actor_user_id?: string
          entity_id?: string
          entity_label?: string
          entity_type?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          occurred_at?: string
        }
        Relationships: []
      }
      generated_content_reviews: {
        Row: {
          confidence: string | null
          created_at: string
          has_placeholders: boolean
          has_unsupported_claim: boolean
          id: string
          lesson_id: string | null
          module_version_id: string
          notes: string | null
          review_type: string
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_user_id: string | null
          status: string
        }
        Insert: {
          confidence?: string | null
          created_at?: string
          has_placeholders?: boolean
          has_unsupported_claim?: boolean
          id?: string
          lesson_id?: string | null
          module_version_id: string
          notes?: string | null
          review_type: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_user_id?: string | null
          status?: string
        }
        Update: {
          confidence?: string | null
          created_at?: string
          has_placeholders?: boolean
          has_unsupported_claim?: boolean
          id?: string
          lesson_id?: string | null
          module_version_id?: string
          notes?: string | null
          review_type?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_user_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_content_reviews_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "training_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_content_reviews_module_version_id_fkey"
            columns: ["module_version_id"]
            isOneToOne: false
            referencedRelation: "module_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_content_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_content_reviews_reviewer_user_id_fkey"
            columns: ["reviewer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_jobs: {
        Row: {
          actual_cost_cents: number
          attempt_count: number
          completed_at: string | null
          cost_breakdown: Json
          created_at: string
          current_stage: string | null
          estimated_cost_cents: number | null
          id: string
          idempotency_key: string | null
          input_payload: Json
          job_type: string
          last_error_message: string | null
          last_error_stage: string | null
          model_used: string | null
          module_id: string
          operation: string | null
          output_payload: Json
          prompt_version: string | null
          stage_map: Json
          status: string
          submitted_by: string | null
          target_section_id: string | null
          updated_at: string
        }
        Insert: {
          actual_cost_cents?: number
          attempt_count?: number
          completed_at?: string | null
          cost_breakdown?: Json
          created_at?: string
          current_stage?: string | null
          estimated_cost_cents?: number | null
          id?: string
          idempotency_key?: string | null
          input_payload: Json
          job_type: string
          last_error_message?: string | null
          last_error_stage?: string | null
          model_used?: string | null
          module_id: string
          operation?: string | null
          output_payload?: Json
          prompt_version?: string | null
          stage_map?: Json
          status?: string
          submitted_by?: string | null
          target_section_id?: string | null
          updated_at?: string
        }
        Update: {
          actual_cost_cents?: number
          attempt_count?: number
          completed_at?: string | null
          cost_breakdown?: Json
          created_at?: string
          current_stage?: string | null
          estimated_cost_cents?: number | null
          id?: string
          idempotency_key?: string | null
          input_payload?: Json
          job_type?: string
          last_error_message?: string | null
          last_error_stage?: string | null
          model_used?: string | null
          module_id?: string
          operation?: string | null
          output_payload?: Json
          prompt_version?: string | null
          stage_map?: Json
          status?: string
          submitted_by?: string | null
          target_section_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_jobs_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_jobs_target_section_id_fkey"
            columns: ["target_section_id"]
            isOneToOne: false
            referencedRelation: "source_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      module_source_bindings: {
        Row: {
          binding_kind: string
          bound_revision_id: string | null
          created_at: string
          flag_reason: string | null
          flagged_for_review: boolean
          id: string
          lesson_ids: string[] | null
          module_id: string
          module_version_id: string | null
          source_file_id: string
          source_file_version_id: string
          source_section_id: string | null
        }
        Insert: {
          binding_kind?: string
          bound_revision_id?: string | null
          created_at?: string
          flag_reason?: string | null
          flagged_for_review?: boolean
          id?: string
          lesson_ids?: string[] | null
          module_id: string
          module_version_id?: string | null
          source_file_id: string
          source_file_version_id: string
          source_section_id?: string | null
        }
        Update: {
          binding_kind?: string
          bound_revision_id?: string | null
          created_at?: string
          flag_reason?: string | null
          flagged_for_review?: boolean
          id?: string
          lesson_ids?: string[] | null
          module_id?: string
          module_version_id?: string | null
          source_file_id?: string
          source_file_version_id?: string
          source_section_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_source_bindings_module_version_fk"
            columns: ["module_version_id"]
            isOneToOne: false
            referencedRelation: "module_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_source_bindings_source_file_id_fkey"
            columns: ["source_file_id"]
            isOneToOne: false
            referencedRelation: "source_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_source_bindings_source_file_version_id_fkey"
            columns: ["source_file_version_id"]
            isOneToOne: false
            referencedRelation: "source_file_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_source_bindings_source_section_id_fkey"
            columns: ["source_section_id"]
            isOneToOne: false
            referencedRelation: "source_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      module_versions: {
        Row: {
          approval_state: string | null
          approved_by: string | null
          assessment_version: string | null
          completed_count: number | null
          created_at: string
          id: string
          module_id: string
          module_title: string
          published_at: string | null
          published_by: string | null
          source_binder_version: string | null
          source_stale: boolean
          stale_since: string | null
          status: string
          updated_at: string
          version_number: number
        }
        Insert: {
          approval_state?: string | null
          approved_by?: string | null
          assessment_version?: string | null
          completed_count?: number | null
          created_at?: string
          id?: string
          module_id: string
          module_title: string
          published_at?: string | null
          published_by?: string | null
          source_binder_version?: string | null
          source_stale?: boolean
          stale_since?: string | null
          status?: string
          updated_at?: string
          version_number: number
        }
        Update: {
          approval_state?: string | null
          approved_by?: string | null
          assessment_version?: string | null
          completed_count?: number | null
          created_at?: string
          id?: string
          module_id?: string
          module_title?: string
          published_at?: string | null
          published_by?: string | null
          source_binder_version?: string | null
          source_stale?: boolean
          stale_since?: string | null
          status?: string
          updated_at?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "module_versions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_versions_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_versions_source_binder_version_fkey"
            columns: ["source_binder_version"]
            isOneToOne: false
            referencedRelation: "source_binders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          display_name: string
          email: string
          id: string
          manager_id: string | null
          org_id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          display_name: string
          email: string
          id: string
          manager_id?: string | null
          org_id: string
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          display_name?: string
          email?: string
          id?: string
          manager_id?: string | null
          org_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      source_binders: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          org_id: string
          title: string
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          org_id: string
          title: string
          version_number: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          org_id?: string
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "source_binders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      source_change_events: {
        Row: {
          detected_at: string
          id: string
          new_revision_id: string
          old_revision_id: string
          section_ids_changed: string[]
          source_file_id: string
          source_file_name: string
          status: string
        }
        Insert: {
          detected_at?: string
          id?: string
          new_revision_id: string
          old_revision_id: string
          section_ids_changed: string[]
          source_file_id: string
          source_file_name: string
          status?: string
        }
        Update: {
          detected_at?: string
          id?: string
          new_revision_id?: string
          old_revision_id?: string
          section_ids_changed?: string[]
          source_file_id?: string
          source_file_name?: string
          status?: string
        }
        Relationships: []
      }
      source_file_versions: {
        Row: {
          content_hash: string | null
          created_at: string
          head_revision_id: string
          id: string
          is_current: boolean
          modified_time: string | null
          parse_status: Database["redex"]["Enums"]["source_file_processing_status"]
          raw_text: string | null
          raw_text_preview: string | null
          size_bytes: number | null
          source_file_id: string
        }
        Insert: {
          content_hash?: string | null
          created_at?: string
          head_revision_id: string
          id?: string
          is_current?: boolean
          modified_time?: string | null
          parse_status?: Database["redex"]["Enums"]["source_file_processing_status"]
          raw_text?: string | null
          raw_text_preview?: string | null
          size_bytes?: number | null
          source_file_id: string
        }
        Update: {
          content_hash?: string | null
          created_at?: string
          head_revision_id?: string
          id?: string
          is_current?: boolean
          modified_time?: string | null
          parse_status?: Database["redex"]["Enums"]["source_file_processing_status"]
          raw_text?: string | null
          raw_text_preview?: string | null
          size_bytes?: number | null
          source_file_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_file_versions_source_file_id_fkey"
            columns: ["source_file_id"]
            isOneToOne: false
            referencedRelation: "source_files"
            referencedColumns: ["id"]
          },
        ]
      }
      source_files: {
        Row: {
          authority: Database["redex"]["Enums"]["source_authority_level"]
          authority_source: string
          created_at: string
          current_version_id: string | null
          drive_file_id: string
          drive_path: string | null
          id: string
          last_synced_at: string | null
          mime_type: string
          processing_status: Database["redex"]["Enums"]["source_file_processing_status"]
          title: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          authority?: Database["redex"]["Enums"]["source_authority_level"]
          authority_source?: string
          created_at?: string
          current_version_id?: string | null
          drive_file_id: string
          drive_path?: string | null
          id?: string
          last_synced_at?: string | null
          mime_type: string
          processing_status?: Database["redex"]["Enums"]["source_file_processing_status"]
          title: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          authority?: Database["redex"]["Enums"]["source_authority_level"]
          authority_source?: string
          created_at?: string
          current_version_id?: string | null
          drive_file_id?: string
          drive_path?: string | null
          id?: string
          last_synced_at?: string | null
          mime_type?: string
          processing_status?: Database["redex"]["Enums"]["source_file_processing_status"]
          title?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_files_current_version_fk"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "source_file_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      source_sections: {
        Row: {
          body: string
          created_at: string
          has_placeholders: boolean
          heading: string
          id: string
          level: number
          position_index: number
          slug: string
          source_file_version_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          has_placeholders?: boolean
          heading?: string
          id?: string
          level: number
          position_index: number
          slug: string
          source_file_version_id: string
        }
        Update: {
          body?: string
          created_at?: string
          has_placeholders?: boolean
          heading?: string
          id?: string
          level?: number
          position_index?: number
          slug?: string
          source_file_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_sections_source_file_version_id_fkey"
            columns: ["source_file_version_id"]
            isOneToOne: false
            referencedRelation: "source_file_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_courses: {
        Row: {
          created_at: string
          description: string | null
          estimated_minutes: number
          id: string
          learning_objectives: Json
          level: string
          org_id: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimated_minutes?: number
          id?: string
          learning_objectives?: Json
          level?: string
          org_id?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          estimated_minutes?: number
          id?: string
          learning_objectives?: Json
          level?: string
          org_id?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_lessons: {
        Row: {
          content: Json
          created_at: string
          criticality: string
          estimated_minutes: number
          id: string
          lesson_type: string
          module_id: string
          order_index: number
          resources: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          content: Json
          created_at?: string
          criticality: string
          estimated_minutes?: number
          id?: string
          lesson_type: string
          module_id: string
          order_index: number
          resources?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          criticality?: string
          estimated_minutes?: number
          id?: string
          lesson_type?: string
          module_id?: string
          order_index?: number
          resources?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      training_modules: {
        Row: {
          course_id: string
          created_at: string
          criticality: string
          estimated_minutes: number
          id: string
          order_index: number
          title: string
          unlock_rule: string | null
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          criticality: string
          estimated_minutes?: number
          id?: string
          order_index: number
          title: string
          unlock_rule?: string | null
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          criticality?: string
          estimated_minutes?: number
          id?: string
          order_index?: number
          title?: string
          unlock_rule?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_training_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          progress_percentage: number
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          progress_percentage?: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          progress_percentage?: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_training_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_training_progress: {
        Row: {
          acknowledgment_id: string | null
          completed_at: string | null
          created_at: string
          enrollment_id: string
          id: string
          lesson_id: string
          status: string
          time_spent_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          acknowledgment_id?: string | null
          completed_at?: string | null
          created_at?: string
          enrollment_id: string
          id?: string
          lesson_id: string
          status?: string
          time_spent_seconds?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          acknowledgment_id?: string | null
          completed_at?: string | null
          created_at?: string
          enrollment_id?: string
          id?: string
          lesson_id?: string
          status?: string
          time_spent_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_training_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_training_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_training_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "training_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_next_generation_job: {
        Args: Record<PropertyKey, never>
        Returns: Database["redex"]["Tables"]["generation_jobs"]["Row"][]
      }
    }
    Enums: {
      source_authority_level: "authoritative" | "supporting" | "context"
      source_file_processing_status:
        | "pending"
        | "processing"
        | "processed"
        | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  redex: {
    Enums: {
      source_authority_level: ["authoritative", "supporting", "context"],
      source_file_processing_status: [
        "pending",
        "processing",
        "processed",
        "failed",
      ],
    },
  },
} as const
