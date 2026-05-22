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
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string
          device_id: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          location_id: string | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          project_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          device_id?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          location_id?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          project_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          device_id?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          location_id?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          project_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log_archive: {
        Row: {
          action: string
          created_at: string
          device_id: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          location_id: string | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          project_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          device_id?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          location_id?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          project_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          device_id?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          location_id?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          project_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_feedback: {
        Row: {
          created_at: string | null
          feedback_text: string | null
          id: string
          message_id: string | null
          rating: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          message_id?: string | null
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          message_id?: string | null
          rating?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ai_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          user_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          user_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_query_cache: {
        Row: {
          citations: Json | null
          created_at: string | null
          hit_count: number | null
          id: string
          last_used_at: string | null
          query_embedding: string | null
          query_text: string
          response_text: string
        }
        Insert: {
          citations?: Json | null
          created_at?: string | null
          hit_count?: number | null
          id?: string
          last_used_at?: string | null
          query_embedding?: string | null
          query_text: string
          response_text: string
        }
        Update: {
          citations?: Json | null
          created_at?: string | null
          hit_count?: number | null
          id?: string
          last_used_at?: string | null
          query_embedding?: string | null
          query_text?: string
          response_text?: string
        }
        Relationships: []
      }
      alarm_customer_addresses: {
        Row: {
          city: string | null
          country_id: number | null
          country_name: string | null
          created_at: string | null
          customer_id: number
          geocoded_at: string | null
          geocoding_error: string | null
          id: string
          latitude: number | null
          longitude: number | null
          state: string | null
          street1: string | null
          street2: string | null
          sub_city: string | null
          sub_state: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          city?: string | null
          country_id?: number | null
          country_name?: string | null
          created_at?: string | null
          customer_id: number
          geocoded_at?: string | null
          geocoding_error?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          state?: string | null
          street1?: string | null
          street2?: string | null
          sub_city?: string | null
          sub_state?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          city?: string | null
          country_id?: number | null
          country_name?: string | null
          created_at?: string | null
          customer_id?: number
          geocoded_at?: string | null
          geocoding_error?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          state?: string | null
          street1?: string | null
          street2?: string | null
          sub_city?: string | null
          sub_state?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      alarm_customers: {
        Row: {
          account_name: string | null
          alarm_customer_id: number
          company_name: string | null
          contract_end_date: string | null
          contract_length_months: number | null
          created_at: string | null
          created_by_user_id: string | null
          created_from_project_id: string | null
          cs_account_number: string | null
          cs_account_prefix: string | null
          customer_type: number | null
          dealer_customer_id: string | null
          dealer_id: number | null
          detailed_panel_version: string | null
          email: string | null
          facility: string | null
          first_name: string
          id: string
          installer: string | null
          is_demo: boolean | null
          is_enrolled_in_maintenance: boolean | null
          is_terminated: boolean | null
          join_date: string | null
          last_name: string
          last_synced_at: string | null
          login_name: string | null
          monitoring_station_forward_signals: string | null
          monitoring_station_name: string | null
          network_generation: string | null
          panel_type: string | null
          panel_version: number | null
          pending_termination_date: string | null
          phone_number: string | null
          property_type: number | null
          ready_date: string | null
          receiver_number_phone_key: string | null
          sales_rep: string | null
          service_package: string | null
          source: string | null
          store_code: string | null
          sub_dealer_id: number | null
          sub_dealer_name: string | null
          system_group_id: number | null
          term_date: string | null
          unit_description: string | null
          updated_at: string | null
          upgraded_from_prospect_at: string | null
        }
        Insert: {
          account_name?: string | null
          alarm_customer_id: number
          company_name?: string | null
          contract_end_date?: string | null
          contract_length_months?: number | null
          created_at?: string | null
          created_by_user_id?: string | null
          created_from_project_id?: string | null
          cs_account_number?: string | null
          cs_account_prefix?: string | null
          customer_type?: number | null
          dealer_customer_id?: string | null
          dealer_id?: number | null
          detailed_panel_version?: string | null
          email?: string | null
          facility?: string | null
          first_name: string
          id?: string
          installer?: string | null
          is_demo?: boolean | null
          is_enrolled_in_maintenance?: boolean | null
          is_terminated?: boolean | null
          join_date?: string | null
          last_name: string
          last_synced_at?: string | null
          login_name?: string | null
          monitoring_station_forward_signals?: string | null
          monitoring_station_name?: string | null
          network_generation?: string | null
          panel_type?: string | null
          panel_version?: number | null
          pending_termination_date?: string | null
          phone_number?: string | null
          property_type?: number | null
          ready_date?: string | null
          receiver_number_phone_key?: string | null
          sales_rep?: string | null
          service_package?: string | null
          source?: string | null
          store_code?: string | null
          sub_dealer_id?: number | null
          sub_dealer_name?: string | null
          system_group_id?: number | null
          term_date?: string | null
          unit_description?: string | null
          updated_at?: string | null
          upgraded_from_prospect_at?: string | null
        }
        Update: {
          account_name?: string | null
          alarm_customer_id?: number
          company_name?: string | null
          contract_end_date?: string | null
          contract_length_months?: number | null
          created_at?: string | null
          created_by_user_id?: string | null
          created_from_project_id?: string | null
          cs_account_number?: string | null
          cs_account_prefix?: string | null
          customer_type?: number | null
          dealer_customer_id?: string | null
          dealer_id?: number | null
          detailed_panel_version?: string | null
          email?: string | null
          facility?: string | null
          first_name?: string
          id?: string
          installer?: string | null
          is_demo?: boolean | null
          is_enrolled_in_maintenance?: boolean | null
          is_terminated?: boolean | null
          join_date?: string | null
          last_name?: string
          last_synced_at?: string | null
          login_name?: string | null
          monitoring_station_forward_signals?: string | null
          monitoring_station_name?: string | null
          network_generation?: string | null
          panel_type?: string | null
          panel_version?: number | null
          pending_termination_date?: string | null
          phone_number?: string | null
          property_type?: number | null
          ready_date?: string | null
          receiver_number_phone_key?: string | null
          sales_rep?: string | null
          service_package?: string | null
          source?: string | null
          store_code?: string | null
          sub_dealer_id?: number | null
          sub_dealer_name?: string | null
          system_group_id?: number | null
          term_date?: string | null
          unit_description?: string | null
          updated_at?: string | null
          upgraded_from_prospect_at?: string | null
        }
        Relationships: []
      }
      alarm_modem_info: {
        Row: {
          created_at: string | null
          customer_id: number
          firmware_version: number | null
          id: string
          imei: string | null
          modem_phone_number: string | null
          modem_serial: string | null
          network: number | null
          radio_network_type: number | null
          two_way_voice_capable: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: number
          firmware_version?: number | null
          id?: string
          imei?: string | null
          modem_phone_number?: string | null
          modem_serial?: string | null
          network?: number | null
          radio_network_type?: number | null
          two_way_voice_capable?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: number
          firmware_version?: number | null
          id?: string
          imei?: string | null
          modem_phone_number?: string | null
          modem_serial?: string | null
          network?: number | null
          radio_network_type?: number | null
          two_way_voice_capable?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      alarm_service_plans: {
        Row: {
          addons: number[] | null
          created_at: string | null
          customer_id: number
          id: string
          package_description: string | null
          package_id: number | null
          plan_type: number | null
          total_service_price: number | null
          updated_at: string | null
        }
        Insert: {
          addons?: number[] | null
          created_at?: string | null
          customer_id: number
          id?: string
          package_description?: string | null
          package_id?: number | null
          plan_type?: number | null
          total_service_price?: number | null
          updated_at?: string | null
        }
        Update: {
          addons?: number[] | null
          created_at?: string | null
          customer_id?: number
          id?: string
          package_description?: string | null
          package_id?: number | null
          plan_type?: number | null
          total_service_price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      alarm_sync_log: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_details: Json | null
          id: string
          metadata: Json | null
          records_failed: number | null
          records_processed: number | null
          records_succeeded: number | null
          service: string
          started_at: string
          status: string
          sync_type: string
          total_records: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          id?: string
          metadata?: Json | null
          records_failed?: number | null
          records_processed?: number | null
          records_succeeded?: number | null
          service?: string
          started_at: string
          status: string
          sync_type?: string
          total_records?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          id?: string
          metadata?: Json | null
          records_failed?: number | null
          records_processed?: number | null
          records_succeeded?: number | null
          service?: string
          started_at?: string
          status?: string
          sync_type?: string
          total_records?: number | null
        }
        Relationships: []
      }
      alarm_webhook_events: {
        Row: {
          customer_id: string | null
          event_type: string
          filter_id: number | null
          id: string
          payload: Json
          processed: boolean | null
          processed_at: string | null
          received_at: string
          site_id: string | null
        }
        Insert: {
          customer_id?: string | null
          event_type: string
          filter_id?: number | null
          id?: string
          payload: Json
          processed?: boolean | null
          processed_at?: string | null
          received_at?: string
          site_id?: string | null
        }
        Update: {
          customer_id?: string | null
          event_type?: string
          filter_id?: number | null
          id?: string
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
          received_at?: string
          site_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alarm_webhook_events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_events: {
        Row: {
          camera_integration_id: string | null
          count_in: number | null
          count_out: number | null
          event_type: string | null
          id: string
          ows_alert_id: string | null
          payload: Json
          received_at: string
          rule_name: string | null
        }
        Insert: {
          camera_integration_id?: string | null
          count_in?: number | null
          count_out?: number | null
          event_type?: string | null
          id?: string
          ows_alert_id?: string | null
          payload: Json
          received_at?: string
          rule_name?: string | null
        }
        Update: {
          camera_integration_id?: string | null
          count_in?: number | null
          count_out?: number | null
          event_type?: string | null
          id?: string
          ows_alert_id?: string | null
          payload?: Json
          received_at?: string
          rule_name?: string | null
        }
        Relationships: []
      }
      anomaly_logs: {
        Row: {
          affected_users: number | null
          anomaly_type: string
          description: string | null
          detected_at: string
          id: string
          metrics: Json | null
          module_id: string
          resolved: boolean | null
          resolved_at: string | null
          severity: string | null
        }
        Insert: {
          affected_users?: number | null
          anomaly_type: string
          description?: string | null
          detected_at?: string
          id?: string
          metrics?: Json | null
          module_id: string
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string | null
        }
        Update: {
          affected_users?: number | null
          anomaly_type?: string
          description?: string | null
          detected_at?: string
          id?: string
          metrics?: Json | null
          module_id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string | null
        }
        Relationships: []
      }
      api_call_log: {
        Row: {
          created_at: string | null
          endpoint: string
          error_message: string | null
          id: number
          method: string
          response_time_ms: number | null
          status_code: number | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          id?: number
          method: string
          response_time_ms?: number | null
          status_code?: number | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          id?: number
          method?: string
          response_time_ms?: number | null
          status_code?: number | null
        }
        Relationships: []
      }
      artifacts: {
        Row: {
          artifact_type: string
          created_at: string
          download_count: number | null
          expires_at: string | null
          file_name: string
          file_size_bytes: number | null
          generated_at: string
          generated_by: string | null
          id: string
          last_downloaded_at: string | null
          metadata: Json | null
          project_id: string
          storage_bucket: string | null
          storage_path: string
          version: number | null
        }
        Insert: {
          artifact_type: string
          created_at?: string
          download_count?: number | null
          expires_at?: string | null
          file_name: string
          file_size_bytes?: number | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          last_downloaded_at?: string | null
          metadata?: Json | null
          project_id: string
          storage_bucket?: string | null
          storage_path: string
          version?: number | null
        }
        Update: {
          artifact_type?: string
          created_at?: string
          download_count?: number | null
          expires_at?: string | null
          file_name?: string
          file_size_bytes?: number | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          last_downloaded_at?: string | null
          metadata?: Json | null
          project_id?: string
          storage_bucket?: string | null
          storage_path?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "artifacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "artifacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_attempts: {
        Row: {
          answers: Json | null
          attempt_date: string
          id: string
          max_score: number
          passed: boolean
          score: number
          skill_code: string
          time_taken_minutes: number | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          attempt_date?: string
          id?: string
          max_score: number
          passed: boolean
          score: number
          skill_code: string
          time_taken_minutes?: number | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          attempt_date?: string
          id?: string
          max_score?: number
          passed?: boolean
          score?: number
          skill_code?: string
          time_taken_minutes?: number | null
          user_id?: string
        }
        Relationships: []
      }
      assignment_candidates: {
        Row: {
          availability_score: number | null
          can_meet_window: boolean | null
          computed_at: string | null
          cost_score: number | null
          distance_score: number | null
          eta_minutes: number | null
          has_certs: boolean | null
          has_skills: boolean | null
          id: string
          job_id: string | null
          reasons: string[] | null
          service_date: string
          skills_score: number | null
          technician_id: string | null
          total_score: number | null
          travel_km: number | null
          within_hours: boolean | null
        }
        Insert: {
          availability_score?: number | null
          can_meet_window?: boolean | null
          computed_at?: string | null
          cost_score?: number | null
          distance_score?: number | null
          eta_minutes?: number | null
          has_certs?: boolean | null
          has_skills?: boolean | null
          id?: string
          job_id?: string | null
          reasons?: string[] | null
          service_date: string
          skills_score?: number | null
          technician_id?: string | null
          total_score?: number | null
          travel_km?: number | null
          within_hours?: boolean | null
        }
        Update: {
          availability_score?: number | null
          can_meet_window?: boolean | null
          computed_at?: string | null
          cost_score?: number | null
          distance_score?: number | null
          eta_minutes?: number | null
          has_certs?: boolean | null
          has_skills?: boolean | null
          id?: string
          job_id?: string | null
          reasons?: string[] | null
          service_date?: string
          skills_score?: number | null
          technician_id?: string | null
          total_score?: number | null
          travel_km?: number | null
          within_hours?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_candidates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignment_candidates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignment_candidates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignment_candidates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_candidates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignment_candidates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignment_candidates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignment_candidates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignment_candidates_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_candidates_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_tech_capacity_daily"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      assignments: {
        Row: {
          actual_hours: number | null
          actual_travel_km: number | null
          end_at: string | null
          id: string
          job_id: string | null
          planned_hours: number | null
          role: string | null
          start_at: string | null
          status: Database["public"]["Enums"]["assign_status"] | null
          technician_id: string | null
          technician_profile_id: string | null
          travel_from_site_id: string | null
          travel_minutes_est: number | null
        }
        Insert: {
          actual_hours?: number | null
          actual_travel_km?: number | null
          end_at?: string | null
          id?: string
          job_id?: string | null
          planned_hours?: number | null
          role?: string | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["assign_status"] | null
          technician_id?: string | null
          technician_profile_id?: string | null
          travel_from_site_id?: string | null
          travel_minutes_est?: number | null
        }
        Update: {
          actual_hours?: number | null
          actual_travel_km?: number | null
          end_at?: string | null
          id?: string
          job_id?: string | null
          planned_hours?: number | null
          role?: string | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["assign_status"] | null
          technician_id?: string | null
          technician_profile_id?: string | null
          travel_from_site_id?: string | null
          travel_minutes_est?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignments_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_tech_capacity_daily"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "assignments_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "assignments_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "assignments_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "assignments_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "assignments_travel_from_site_id_fkey"
            columns: ["travel_from_site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          after: Json | null
          before: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          occurred_at: string
          reason: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          after?: Json | null
          before?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          occurred_at?: string
          reason?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          after?: Json | null
          before?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          occurred_at?: string
          reason?: string | null
        }
        Relationships: []
      }
      audit_log_archive: {
        Row: {
          action: string
          actor_email: string | null
          after: Json | null
          before: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          occurred_at: string
          reason: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          after?: Json | null
          before?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          occurred_at?: string
          reason?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          after?: Json | null
          before?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          occurred_at?: string
          reason?: string | null
        }
        Relationships: []
      }
      automation_workflows: {
        Row: {
          actions: Json | null
          conditions: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          trigger_table: string
          user_id: string | null
        }
        Insert: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          trigger_table: string
          user_id?: string | null
        }
        Update: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_table?: string
          user_id?: string | null
        }
        Relationships: []
      }
      billing_jobs_archive: {
        Row: {
          additional_trip_reason: string | null
          created_at: string
          customer: string | null
          data_quality_notes: string | null
          id: string
          installed_meraki_mx67w: boolean | null
          installed_mg52e_cellular_backup: boolean | null
          installed_mr36_access_point: boolean | null
          installed_ms130: boolean | null
          job_date: string | null
          job_scope: string | null
          job_scope_billable: number
          location: string | null
          manager: string | null
          market: string | null
          mg52_add_on: boolean | null
          network_cleanup_billable: number
          network_cleanup_hours: number | null
          notes: string | null
          org_id: string | null
          project: string | null
          raw: Json | null
          record_id: string | null
          region: string | null
          store_number: string | null
          team_number: string | null
          technician: string | null
          ticket: string | null
          total_billable: number
          trip_reason: string | null
          updated_at: string
        }
        Insert: {
          additional_trip_reason?: string | null
          created_at?: string
          customer?: string | null
          data_quality_notes?: string | null
          id?: string
          installed_meraki_mx67w?: boolean | null
          installed_mg52e_cellular_backup?: boolean | null
          installed_mr36_access_point?: boolean | null
          installed_ms130?: boolean | null
          job_date?: string | null
          job_scope?: string | null
          job_scope_billable?: number
          location?: string | null
          manager?: string | null
          market?: string | null
          mg52_add_on?: boolean | null
          network_cleanup_billable?: number
          network_cleanup_hours?: number | null
          notes?: string | null
          org_id?: string | null
          project?: string | null
          raw?: Json | null
          record_id?: string | null
          region?: string | null
          store_number?: string | null
          team_number?: string | null
          technician?: string | null
          ticket?: string | null
          total_billable?: number
          trip_reason?: string | null
          updated_at?: string
        }
        Update: {
          additional_trip_reason?: string | null
          created_at?: string
          customer?: string | null
          data_quality_notes?: string | null
          id?: string
          installed_meraki_mx67w?: boolean | null
          installed_mg52e_cellular_backup?: boolean | null
          installed_mr36_access_point?: boolean | null
          installed_ms130?: boolean | null
          job_date?: string | null
          job_scope?: string | null
          job_scope_billable?: number
          location?: string | null
          manager?: string | null
          market?: string | null
          mg52_add_on?: boolean | null
          network_cleanup_billable?: number
          network_cleanup_hours?: number | null
          notes?: string | null
          org_id?: string | null
          project?: string | null
          raw?: Json | null
          record_id?: string | null
          region?: string | null
          store_number?: string | null
          team_number?: string | null
          technician?: string | null
          ticket?: string | null
          total_billable?: number
          trip_reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cameras: {
        Row: {
          id: string
          is_entry: boolean | null
          name: string | null
          ows_camera_integration_id: string | null
          store_id: string | null
        }
        Insert: {
          id?: string
          is_entry?: boolean | null
          name?: string | null
          ows_camera_integration_id?: string | null
          store_id?: string | null
        }
        Update: {
          id?: string
          is_entry?: boolean | null
          name?: string | null
          ows_camera_integration_id?: string | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cameras_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_device_types: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean | null
          manufacturer: string
          model: string
          specifications: Json | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          manufacturer: string
          model: string
          specifications?: Json | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          manufacturer?: string
          model?: string
          specifications?: Json | null
        }
        Relationships: []
      }
      catalog_dsc_sensors: {
        Row: {
          category: string
          created_at: string
          description: string | null
          has_auxiliary_input: boolean | null
          id: string
          image_url: string | null
          is_pet_immune: boolean | null
          is_powerg: boolean | null
          is_wireless: boolean | null
          model_number: string
          product_name: string
          product_url: string | null
          sensor_type: string | null
          specifications: Json | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          has_auxiliary_input?: boolean | null
          id?: string
          image_url?: string | null
          is_pet_immune?: boolean | null
          is_powerg?: boolean | null
          is_wireless?: boolean | null
          model_number: string
          product_name: string
          product_url?: string | null
          sensor_type?: string | null
          specifications?: Json | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          has_auxiliary_input?: boolean | null
          id?: string
          image_url?: string | null
          is_pet_immune?: boolean | null
          is_powerg?: boolean | null
          is_wireless?: boolean | null
          model_number?: string
          product_name?: string
          product_url?: string | null
          sensor_type?: string | null
          specifications?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      catalog_mount_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          mount_category: string
          mount_type: string
          typical_height_ft: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          mount_category: string
          mount_type: string
          typical_height_ft?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          mount_category?: string
          mount_type?: string
          typical_height_ft?: number | null
        }
        Relationships: []
      }
      catalog_sensor_types: {
        Row: {
          created_at: string
          id: string
          manufacturer: string | null
          model: string | null
          sensor_category: string
          sensor_type: string
          specifications: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          manufacturer?: string | null
          model?: string | null
          sensor_category: string
          sensor_type: string
          specifications?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          manufacturer?: string | null
          model?: string | null
          sensor_category?: string
          sensor_type?: string
          specifications?: Json | null
        }
        Relationships: []
      }
      category_hub_requirements: {
        Row: {
          created_at: string | null
          hub_product_code: string | null
          id: string
          notes: string | null
          product_category: string
          requires_hub: boolean | null
        }
        Insert: {
          created_at?: string | null
          hub_product_code?: string | null
          id?: string
          notes?: string | null
          product_category: string
          requires_hub?: boolean | null
        }
        Update: {
          created_at?: string | null
          hub_product_code?: string | null
          id?: string
          notes?: string | null
          product_category?: string
          requires_hub?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "category_hub_requirements_hub_product_code_fkey"
            columns: ["hub_product_code"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_code"]
          },
          {
            foreignKeyName: "category_hub_requirements_hub_product_code_fkey"
            columns: ["hub_product_code"]
            isOneToOne: false
            referencedRelation: "v_popular_survey_equipment"
            referencedColumns: ["sku"]
          },
        ]
      }
      central_station_info: {
        Row: {
          account_number: string | null
          account_prefix: string | null
          central_station_phone_number_key: string | null
          created_at: string | null
          customer_id: number | null
          event_groups_to_forward: Json | null
          forwarding_option: number | null
          id: number
          phone_line_present: boolean | null
          receiver_phone_number: string | null
          two_way_voice_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          account_number?: string | null
          account_prefix?: string | null
          central_station_phone_number_key?: string | null
          created_at?: string | null
          customer_id?: number | null
          event_groups_to_forward?: Json | null
          forwarding_option?: number | null
          id?: number
          phone_line_present?: boolean | null
          receiver_phone_number?: string | null
          two_way_voice_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          account_number?: string | null
          account_prefix?: string | null
          central_station_phone_number_key?: string | null
          created_at?: string | null
          customer_id?: number | null
          event_groups_to_forward?: Json | null
          forwarding_option?: number | null
          id?: number
          phone_line_present?: boolean | null
          receiver_phone_number?: string | null
          two_way_voice_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "central_station_info_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "central_station_info_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "central_station_info_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      certifications: {
        Row: {
          cert_code: string
          expires_months: number | null
          id: string
          issuing_authority: string | null
          name: string
          state: string | null
        }
        Insert: {
          cert_code: string
          expires_months?: number | null
          id?: string
          issuing_authority?: string | null
          name: string
          state?: string | null
        }
        Update: {
          cert_code?: string
          expires_months?: number | null
          id?: string
          issuing_authority?: string | null
          name?: string
          state?: string | null
        }
        Relationships: []
      }
      checklist_items: {
        Row: {
          created_at: string
          id: string
          is_required: boolean | null
          item_description: string | null
          item_text: string
          item_type: Database["public"]["Enums"]["checklist_item_type"]
          max_photos: number | null
          min_photos: number | null
          parent_item_id: string | null
          requires_photo: boolean | null
          requires_signature: boolean | null
          sort_order: number | null
          template_id: string
          updated_at: string
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean | null
          item_description?: string | null
          item_text: string
          item_type?: Database["public"]["Enums"]["checklist_item_type"]
          max_photos?: number | null
          min_photos?: number | null
          parent_item_id?: string | null
          requires_photo?: boolean | null
          requires_signature?: boolean | null
          sort_order?: number | null
          template_id: string
          updated_at?: string
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean | null
          item_description?: string | null
          item_text?: string
          item_type?: Database["public"]["Enums"]["checklist_item_type"]
          max_photos?: number | null
          min_photos?: number | null
          parent_item_id?: string | null
          requires_photo?: boolean | null
          requires_signature?: boolean | null
          sort_order?: number | null
          template_id?: string
          updated_at?: string
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_parent_item_id_fkey"
            columns: ["parent_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_responses: {
        Row: {
          checklist_item_id: string | null
          checklist_run_id: string
          created_at: string
          field_id: string | null
          field_label: string | null
          field_type: string | null
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          responded_at: string
          responded_by: string | null
          response_boolean: boolean | null
          response_json: Json | null
          response_number: number | null
          response_value: string | null
          updated_at: string
        }
        Insert: {
          checklist_item_id?: string | null
          checklist_run_id: string
          created_at?: string
          field_id?: string | null
          field_label?: string | null
          field_type?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          responded_at?: string
          responded_by?: string | null
          response_boolean?: boolean | null
          response_json?: Json | null
          response_number?: number | null
          response_value?: string | null
          updated_at?: string
        }
        Update: {
          checklist_item_id?: string | null
          checklist_run_id?: string
          created_at?: string
          field_id?: string | null
          field_label?: string | null
          field_type?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          responded_at?: string
          responded_by?: string | null
          response_boolean?: boolean | null
          response_json?: Json | null
          response_number?: number | null
          response_value?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_responses_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_responses_checklist_run_id_fkey"
            columns: ["checklist_run_id"]
            isOneToOne: false
            referencedRelation: "checklist_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_runs: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completion_percentage: number | null
          created_at: string
          device_id: string | null
          id: string
          location_id: string | null
          project_id: string | null
          started_at: string
          started_by: string | null
          status: string | null
          technician_id: string | null
          template_id: string
          template_name: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string
          device_id?: string | null
          id?: string
          location_id?: string | null
          project_id?: string | null
          started_at?: string
          started_by?: string | null
          status?: string | null
          technician_id?: string | null
          template_id: string
          template_name?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string
          device_id?: string | null
          id?: string
          location_id?: string | null
          project_id?: string | null
          started_at?: string
          started_by?: string | null
          status?: string | null
          technician_id?: string | null
          template_id?: string
          template_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_runs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_runs_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "checklist_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "checklist_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_runs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          applies_to: string
          category: string
          created_at: string
          description: string | null
          device_type: string | null
          id: string
          is_active: boolean | null
          name: string
          schema: Json | null
          updated_at: string
          version: number | null
        }
        Insert: {
          applies_to: string
          category: string
          created_at?: string
          description?: string | null
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          schema?: Json | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          applies_to?: string
          category?: string
          created_at?: string
          description?: string | null
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          schema?: Json | null
          updated_at?: string
          version?: number | null
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "module_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_profiles: {
        Row: {
          daily_double_after_hours: number | null
          daily_ot_after_hours: number | null
          id: string
          meal_break_mins_per_5h: number | null
          notes: string | null
          profile_code: string
          rest_break_10min_per_4h: boolean | null
          second_meal_after_10h: boolean | null
          state: string | null
        }
        Insert: {
          daily_double_after_hours?: number | null
          daily_ot_after_hours?: number | null
          id?: string
          meal_break_mins_per_5h?: number | null
          notes?: string | null
          profile_code: string
          rest_break_10min_per_4h?: boolean | null
          second_meal_after_10h?: boolean | null
          state?: string | null
        }
        Update: {
          daily_double_after_hours?: number | null
          daily_ot_after_hours?: number | null
          id?: string
          meal_break_mins_per_5h?: number | null
          notes?: string | null
          profile_code?: string
          rest_break_10min_per_4h?: boolean | null
          second_meal_after_10h?: boolean | null
          state?: string | null
        }
        Relationships: []
      }
      cost_allocation_rules: {
        Row: {
          active: boolean | null
          allocation_method: string
          created_at: string | null
          expense_category: string
          id: string
        }
        Insert: {
          active?: boolean | null
          allocation_method: string
          created_at?: string | null
          expense_category: string
          id?: string
        }
        Update: {
          active?: boolean | null
          allocation_method?: string
          created_at?: string | null
          expense_category?: string
          id?: string
        }
        Relationships: []
      }
      cost_config: {
        Row: {
          id: boolean
          opp_cost_weight: number | null
          overhead_pct: number | null
          per_diem_per_day: number | null
          per_diem_threshold_km: number | null
          sla_penalty_default: number | null
          speed_kph: number | null
          toll_default: number | null
          updated_at: string
          use_mileage_model: boolean | null
        }
        Insert: {
          id?: boolean
          opp_cost_weight?: number | null
          overhead_pct?: number | null
          per_diem_per_day?: number | null
          per_diem_threshold_km?: number | null
          sla_penalty_default?: number | null
          speed_kph?: number | null
          toll_default?: number | null
          updated_at?: string
          use_mileage_model?: boolean | null
        }
        Update: {
          id?: boolean
          opp_cost_weight?: number | null
          overhead_pct?: number | null
          per_diem_per_day?: number | null
          per_diem_threshold_km?: number | null
          sla_penalty_default?: number | null
          speed_kph?: number | null
          toll_default?: number | null
          updated_at?: string
          use_mileage_model?: boolean | null
        }
        Relationships: []
      }
      customer_active_issues: {
        Row: {
          customer_id: string
          description: string
          device_id: string | null
          device_name: string | null
          first_detected_at: string
          id: string
          issue_type: string
          last_updated_at: string
          metadata: Json | null
          resolved_at: string | null
          severity: string
          site_id: string | null
          status: string
          webhook_event_id: string | null
        }
        Insert: {
          customer_id: string
          description: string
          device_id?: string | null
          device_name?: string | null
          first_detected_at?: string
          id?: string
          issue_type: string
          last_updated_at?: string
          metadata?: Json | null
          resolved_at?: string | null
          severity?: string
          site_id?: string | null
          status?: string
          webhook_event_id?: string | null
        }
        Update: {
          customer_id?: string
          description?: string
          device_id?: string | null
          device_name?: string | null
          first_detected_at?: string
          id?: string
          issue_type?: string
          last_updated_at?: string
          metadata?: Json | null
          resolved_at?: string | null
          severity?: string
          site_id?: string | null
          status?: string
          webhook_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_active_issues_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_active_issues_webhook_event_id_fkey"
            columns: ["webhook_event_id"]
            isOneToOne: false
            referencedRelation: "alarm_webhook_events"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          city: string | null
          country_id: number | null
          created_at: string | null
          customer_id: number | null
          id: number
          state: string | null
          street1: string | null
          street2: string | null
          sub_city: string | null
          sub_state: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          city?: string | null
          country_id?: number | null
          created_at?: string | null
          customer_id?: number | null
          id?: number
          state?: string | null
          street1?: string | null
          street2?: string | null
          sub_city?: string | null
          sub_state?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          city?: string | null
          country_id?: number | null
          created_at?: string | null
          customer_id?: number | null
          id?: number
          state?: string | null
          street1?: string | null
          street2?: string | null
          sub_city?: string | null
          sub_state?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customer_contacts: {
        Row: {
          created_at: string | null
          customer_id: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          role: string | null
          salesforce_contact_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          role?: string | null
          salesforce_contact_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          role?: string | null
          salesforce_contact_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["alarm_uuid"]
          },
        ]
      }
      customer_issue_notes: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          issue_id: string
          notes: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          issue_id: string
          notes: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          issue_id?: string
          notes?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_issue_notes_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "customer_active_issues"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_notes: {
        Row: {
          created_at: string
          created_by: string
          customer_id: string
          customer_snapshot: Json | null
          id: string
          is_important: boolean | null
          note_category: string | null
          note_text: string
          tags: string[] | null
        }
        Insert: {
          created_at?: string
          created_by: string
          customer_id: string
          customer_snapshot?: Json | null
          id?: string
          is_important?: boolean | null
          note_category?: string | null
          note_text: string
          tags?: string[] | null
        }
        Update: {
          created_at?: string
          created_by?: string
          customer_id?: string
          customer_snapshot?: Json | null
          id?: string
          is_important?: boolean | null
          note_category?: string | null
          note_text?: string
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "customer_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "customer_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "customer_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "customer_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["alarm_uuid"]
          },
        ]
      }
      customer_permits: {
        Row: {
          alarm_customer_id: number | null
          created_at: string | null
          created_by: string | null
          customer_id: number | null
          document_url: string | null
          emergency_contact_1_name: string | null
          emergency_contact_1_phone: string | null
          emergency_contact_2_name: string | null
          emergency_contact_2_phone: string | null
          expiration_date: string | null
          id: string
          issue_date: string | null
          issuing_authority: string | null
          jurisdiction_name: string
          jurisdiction_type: string | null
          last_renewal_date: string | null
          metadata: Json | null
          notes: string | null
          permit_fee: number | null
          permit_holder_email: string | null
          permit_holder_name: string | null
          permit_holder_phone: string | null
          permit_number: string
          permit_subtype: string | null
          permit_type: string
          renewal_fee: number | null
          site_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          alarm_customer_id?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: number | null
          document_url?: string | null
          emergency_contact_1_name?: string | null
          emergency_contact_1_phone?: string | null
          emergency_contact_2_name?: string | null
          emergency_contact_2_phone?: string | null
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          jurisdiction_name: string
          jurisdiction_type?: string | null
          last_renewal_date?: string | null
          metadata?: Json | null
          notes?: string | null
          permit_fee?: number | null
          permit_holder_email?: string | null
          permit_holder_name?: string | null
          permit_holder_phone?: string | null
          permit_number: string
          permit_subtype?: string | null
          permit_type: string
          renewal_fee?: number | null
          site_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          alarm_customer_id?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: number | null
          document_url?: string | null
          emergency_contact_1_name?: string | null
          emergency_contact_1_phone?: string | null
          emergency_contact_2_name?: string | null
          emergency_contact_2_phone?: string | null
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          jurisdiction_name?: string
          jurisdiction_type?: string | null
          last_renewal_date?: string | null
          metadata?: Json | null
          notes?: string | null
          permit_fee?: number | null
          permit_holder_email?: string | null
          permit_holder_name?: string | null
          permit_holder_phone?: string | null
          permit_number?: string
          permit_subtype?: string | null
          permit_type?: string
          renewal_fee?: number | null
          site_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_permits_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_permits_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_permits_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_permits_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          account_name: string | null
          address: string | null
          alarm_customer_id: number | null
          alarm_uuid: string | null
          billing_address: string | null
          city: string | null
          company_name: string | null
          contract_end_date: string | null
          contract_length_months: number | null
          created_at: string | null
          customer_type: string | null
          dealer_customer_id: string | null
          dealer_id: number | null
          detailed_panel_version: string | null
          email: string | null
          facility: string | null
          first_name: string | null
          id: number
          is_demo: boolean | null
          is_enrolled_in_maintenance: boolean | null
          is_terminated: boolean | null
          join_date: string | null
          last_name: string | null
          last_synced_at: string | null
          latitude: number | null
          login_name: string | null
          longitude: number | null
          name: string | null
          panel_type: string | null
          panel_version: number | null
          pending_termination_date: string | null
          phone: string | null
          phone_number: string | null
          property_type: number | null
          salesforce_id: string | null
          service_package: string | null
          source: string | null
          source_job_id: string | null
          state: string | null
          status: string | null
          store_code: string | null
          sub_dealer_id: number | null
          system_group_id: number | null
          term_date: string | null
          unit_description: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          account_name?: string | null
          address?: string | null
          alarm_customer_id?: number | null
          alarm_uuid?: string | null
          billing_address?: string | null
          city?: string | null
          company_name?: string | null
          contract_end_date?: string | null
          contract_length_months?: number | null
          created_at?: string | null
          customer_type?: string | null
          dealer_customer_id?: string | null
          dealer_id?: number | null
          detailed_panel_version?: string | null
          email?: string | null
          facility?: string | null
          first_name?: string | null
          id?: number
          is_demo?: boolean | null
          is_enrolled_in_maintenance?: boolean | null
          is_terminated?: boolean | null
          join_date?: string | null
          last_name?: string | null
          last_synced_at?: string | null
          latitude?: number | null
          login_name?: string | null
          longitude?: number | null
          name?: string | null
          panel_type?: string | null
          panel_version?: number | null
          pending_termination_date?: string | null
          phone?: string | null
          phone_number?: string | null
          property_type?: number | null
          salesforce_id?: string | null
          service_package?: string | null
          source?: string | null
          source_job_id?: string | null
          state?: string | null
          status?: string | null
          store_code?: string | null
          sub_dealer_id?: number | null
          system_group_id?: number | null
          term_date?: string | null
          unit_description?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          account_name?: string | null
          address?: string | null
          alarm_customer_id?: number | null
          alarm_uuid?: string | null
          billing_address?: string | null
          city?: string | null
          company_name?: string | null
          contract_end_date?: string | null
          contract_length_months?: number | null
          created_at?: string | null
          customer_type?: string | null
          dealer_customer_id?: string | null
          dealer_id?: number | null
          detailed_panel_version?: string | null
          email?: string | null
          facility?: string | null
          first_name?: string | null
          id?: number
          is_demo?: boolean | null
          is_enrolled_in_maintenance?: boolean | null
          is_terminated?: boolean | null
          join_date?: string | null
          last_name?: string | null
          last_synced_at?: string | null
          latitude?: number | null
          login_name?: string | null
          longitude?: number | null
          name?: string | null
          panel_type?: string | null
          panel_version?: number | null
          pending_termination_date?: string | null
          phone?: string | null
          phone_number?: string | null
          property_type?: number | null
          salesforce_id?: string | null
          service_package?: string | null
          source?: string | null
          source_job_id?: string | null
          state?: string | null
          status?: string | null
          store_code?: string | null
          sub_dealer_id?: number | null
          system_group_id?: number | null
          term_date?: string | null
          unit_description?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      depots: {
        Row: {
          id: string
          lat: number | null
          lng: number | null
          name: string | null
          site_id: string | null
        }
        Insert: {
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string | null
          site_id?: string | null
        }
        Update: {
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string | null
          site_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "depots_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      device_access_control: {
        Row: {
          ac_device_type: string
          anti_passback_enabled: boolean | null
          connection_type: string | null
          created_at: string | null
          credential_capacity: number | null
          device_id: string
          door_number: number | null
          holding_force_lbs: number | null
          id: string
          integration_protocol: string | null
          lock_mode: string | null
          lock_type: string | null
          panel_id: string | null
          power_draw_watts: number | null
          reader_type: string | null
          supports_mobile_credentials: boolean | null
          supports_pin_codes: boolean | null
          updated_at: string | null
          voltage: string | null
          wiegand_bits: number | null
          zone_number: number | null
        }
        Insert: {
          ac_device_type: string
          anti_passback_enabled?: boolean | null
          connection_type?: string | null
          created_at?: string | null
          credential_capacity?: number | null
          device_id: string
          door_number?: number | null
          holding_force_lbs?: number | null
          id?: string
          integration_protocol?: string | null
          lock_mode?: string | null
          lock_type?: string | null
          panel_id?: string | null
          power_draw_watts?: number | null
          reader_type?: string | null
          supports_mobile_credentials?: boolean | null
          supports_pin_codes?: boolean | null
          updated_at?: string | null
          voltage?: string | null
          wiegand_bits?: number | null
          zone_number?: number | null
        }
        Update: {
          ac_device_type?: string
          anti_passback_enabled?: boolean | null
          connection_type?: string | null
          created_at?: string | null
          credential_capacity?: number | null
          device_id?: string
          door_number?: number | null
          holding_force_lbs?: number | null
          id?: string
          integration_protocol?: string | null
          lock_mode?: string | null
          lock_type?: string | null
          panel_id?: string | null
          power_draw_watts?: number | null
          reader_type?: string | null
          supports_mobile_credentials?: boolean | null
          supports_pin_codes?: boolean | null
          updated_at?: string | null
          voltage?: string | null
          wiegand_bits?: number | null
          zone_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "device_access_control_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_access_control_panel_id_fkey"
            columns: ["panel_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      device_cable_runs: {
        Row: {
          cable_id: string
          cable_type: string
          conduit_size: string | null
          created_at: string
          destination_device_id: string | null
          destination_port: string | null
          id: string
          in_conduit: boolean | null
          is_outdoor: boolean | null
          is_plenum: boolean | null
          length_ft: number | null
          location_id: string
          path_description: string | null
          project_id: string
          source_device_id: string | null
          source_port: string | null
          test_result: string | null
          tested_at: string | null
          tested_by: string | null
          updated_at: string
        }
        Insert: {
          cable_id: string
          cable_type: string
          conduit_size?: string | null
          created_at?: string
          destination_device_id?: string | null
          destination_port?: string | null
          id?: string
          in_conduit?: boolean | null
          is_outdoor?: boolean | null
          is_plenum?: boolean | null
          length_ft?: number | null
          location_id: string
          path_description?: string | null
          project_id: string
          source_device_id?: string | null
          source_port?: string | null
          test_result?: string | null
          tested_at?: string | null
          tested_by?: string | null
          updated_at?: string
        }
        Update: {
          cable_id?: string
          cable_type?: string
          conduit_size?: string | null
          created_at?: string
          destination_device_id?: string | null
          destination_port?: string | null
          id?: string
          in_conduit?: boolean | null
          is_outdoor?: boolean | null
          is_plenum?: boolean | null
          length_ft?: number | null
          location_id?: string
          path_description?: string | null
          project_id?: string
          source_device_id?: string | null
          source_port?: string | null
          test_result?: string | null
          tested_at?: string | null
          tested_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_cable_runs_destination_device_id_fkey"
            columns: ["destination_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_cable_runs_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_cable_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "device_cable_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "device_cable_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_cable_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_cable_runs_source_device_id_fkey"
            columns: ["source_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      device_cameras: {
        Row: {
          coverage_area: string | null
          created_at: string
          device_id: string
          field_of_view: number | null
          has_analytics: boolean | null
          has_people_counting: boolean | null
          head_in_location: string | null
          id: string
          is_360: boolean | null
          is_ptz: boolean | null
          lens_size: string | null
          lens_type: string | null
          mounting_height_ft: number | null
          mounting_type: string | null
          network_switch_id: string | null
          orientation_angle: number | null
          poe_switch_port: string | null
          recording_server_id: string | null
          resolution_mp: number | null
          updated_at: string
        }
        Insert: {
          coverage_area?: string | null
          created_at?: string
          device_id: string
          field_of_view?: number | null
          has_analytics?: boolean | null
          has_people_counting?: boolean | null
          head_in_location?: string | null
          id?: string
          is_360?: boolean | null
          is_ptz?: boolean | null
          lens_size?: string | null
          lens_type?: string | null
          mounting_height_ft?: number | null
          mounting_type?: string | null
          network_switch_id?: string | null
          orientation_angle?: number | null
          poe_switch_port?: string | null
          recording_server_id?: string | null
          resolution_mp?: number | null
          updated_at?: string
        }
        Update: {
          coverage_area?: string | null
          created_at?: string
          device_id?: string
          field_of_view?: number | null
          has_analytics?: boolean | null
          has_people_counting?: boolean | null
          head_in_location?: string | null
          id?: string
          is_360?: boolean | null
          is_ptz?: boolean | null
          lens_size?: string | null
          lens_type?: string | null
          mounting_height_ft?: number | null
          mounting_type?: string | null
          network_switch_id?: string | null
          orientation_angle?: number | null
          poe_switch_port?: string | null
          recording_server_id?: string | null
          resolution_mp?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_cameras_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: true
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_cameras_network_switch_id_fkey"
            columns: ["network_switch_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_cameras_recording_server_id_fkey"
            columns: ["recording_server_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      device_light_switches: {
        Row: {
          connection_type: string | null
          created_at: string
          device_id: string
          device_identifier: string | null
          id: string
          installation_location: string | null
          light_type: string | null
          switch_type: string | null
          updated_at: string
        }
        Insert: {
          connection_type?: string | null
          created_at?: string
          device_id: string
          device_identifier?: string | null
          id?: string
          installation_location?: string | null
          light_type?: string | null
          switch_type?: string | null
          updated_at?: string
        }
        Update: {
          connection_type?: string | null
          created_at?: string
          device_id?: string
          device_identifier?: string | null
          id?: string
          installation_location?: string | null
          light_type?: string | null
          switch_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_light_switches_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      device_lineage: {
        Row: {
          created_at: string | null
          id: string
          project_device_id: string | null
          salesforce_equipment_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_device_id?: string | null
          salesforce_equipment_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          project_device_id?: string | null
          salesforce_equipment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_lineage_project_device_id_fkey"
            columns: ["project_device_id"]
            isOneToOne: false
            referencedRelation: "project_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_lineage_salesforce_equipment_id_fkey"
            columns: ["salesforce_equipment_id"]
            isOneToOne: false
            referencedRelation: "salesforce_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      device_photos: {
        Row: {
          created_at: string | null
          device_id: string | null
          id: string
          notes: string | null
          photo_type: string
          photo_url: string
          project_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          id?: string
          notes?: string | null
          photo_type: string
          photo_url: string
          project_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          id?: string
          notes?: string | null
          photo_type?: string
          photo_url?: string
          project_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_photos_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "project_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "device_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "device_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      device_sensors: {
        Row: {
          created_at: string
          device_id: string
          id: string
          is_normally_open: boolean | null
          is_supervised: boolean | null
          loop_number: number | null
          resistance_ohms: number | null
          response_time_ms: number | null
          sensor_id: string | null
          sensor_type: string
          termination_panel_id: string | null
          termination_point: string | null
          updated_at: string
          zone_name: string | null
          zone_number: number | null
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          is_normally_open?: boolean | null
          is_supervised?: boolean | null
          loop_number?: number | null
          resistance_ohms?: number | null
          response_time_ms?: number | null
          sensor_id?: string | null
          sensor_type: string
          termination_panel_id?: string | null
          termination_point?: string | null
          updated_at?: string
          zone_name?: string | null
          zone_number?: number | null
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          is_normally_open?: boolean | null
          is_supervised?: boolean | null
          loop_number?: number | null
          resistance_ohms?: number | null
          response_time_ms?: number | null
          sensor_id?: string | null
          sensor_type?: string
          termination_panel_id?: string | null
          termination_point?: string | null
          updated_at?: string
          zone_name?: string | null
          zone_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "device_sensors_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: true
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_sensors_termination_panel_id_fkey"
            columns: ["termination_panel_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      device_thermostats: {
        Row: {
          brand: string
          connection_type: string
          created_at: string
          device_id: string
          id: string
          installation_location: string | null
          updated_at: string
          wiring_photo_url: string | null
        }
        Insert: {
          brand: string
          connection_type: string
          created_at?: string
          device_id: string
          id?: string
          installation_location?: string | null
          updated_at?: string
          wiring_photo_url?: string | null
        }
        Update: {
          brand?: string
          connection_type?: string
          created_at?: string
          device_id?: string
          id?: string
          installation_location?: string | null
          updated_at?: string
          wiring_photo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_thermostats_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          asset_tag: string | null
          created_at: string
          device_type: string
          id: string
          installation_date: string | null
          installation_duration_hours: number | null
          installation_labor_cost: number | null
          installation_notes: string | null
          installed_by: string | null
          ip_address: unknown
          location_id: string | null
          mac_address: unknown
          manufacturer: string | null
          metadata: Json | null
          model: string | null
          project_id: string
          serial_number: string | null
          status: Database["public"]["Enums"]["device_status"]
          tested_by: string | null
          updated_at: string
          warranty_expiration: string | null
        }
        Insert: {
          asset_tag?: string | null
          created_at?: string
          device_type: string
          id?: string
          installation_date?: string | null
          installation_duration_hours?: number | null
          installation_labor_cost?: number | null
          installation_notes?: string | null
          installed_by?: string | null
          ip_address?: unknown
          location_id?: string | null
          mac_address?: unknown
          manufacturer?: string | null
          metadata?: Json | null
          model?: string | null
          project_id: string
          serial_number?: string | null
          status?: Database["public"]["Enums"]["device_status"]
          tested_by?: string | null
          updated_at?: string
          warranty_expiration?: string | null
        }
        Update: {
          asset_tag?: string | null
          created_at?: string
          device_type?: string
          id?: string
          installation_date?: string | null
          installation_duration_hours?: number | null
          installation_labor_cost?: number | null
          installation_notes?: string | null
          installed_by?: string | null
          ip_address?: unknown
          location_id?: string | null
          mac_address?: unknown
          manufacturer?: string | null
          metadata?: Json | null
          model?: string | null
          project_id?: string
          serial_number?: string | null
          status?: Database["public"]["Enums"]["device_status"]
          tested_by?: string | null
          updated_at?: string
          warranty_expiration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "devices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "devices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      doc_classify_rules: {
        Row: {
          confidence: number | null
          default_category_code: string | null
          force_kind: Database["public"]["Enums"]["doc_kind"] | null
          id: string
          match_text: string | null
          match_vendor: string | null
        }
        Insert: {
          confidence?: number | null
          default_category_code?: string | null
          force_kind?: Database["public"]["Enums"]["doc_kind"] | null
          id?: string
          match_text?: string | null
          match_vendor?: string | null
        }
        Update: {
          confidence?: number | null
          default_category_code?: string | null
          force_kind?: Database["public"]["Enums"]["doc_kind"] | null
          id?: string
          match_text?: string | null
          match_vendor?: string | null
        }
        Relationships: []
      }
      doc_uploads: {
        Row: {
          created_at: string
          error: string | null
          file_path: string
          id: string
          job_id: string | null
          kind: Database["public"]["Enums"]["doc_kind"] | null
          mime_type: string | null
          ocr_provider: string | null
          ocr_text: string | null
          original_filename: string | null
          parse_json: Json | null
          status: string
          technician_profile_id: string | null
          updated_at: string
          vehicle_id: string | null
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          file_path: string
          id?: string
          job_id?: string | null
          kind?: Database["public"]["Enums"]["doc_kind"] | null
          mime_type?: string | null
          ocr_provider?: string | null
          ocr_text?: string | null
          original_filename?: string | null
          parse_json?: Json | null
          status?: string
          technician_profile_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          file_path?: string
          id?: string
          job_id?: string | null
          kind?: Database["public"]["Enums"]["doc_kind"] | null
          mime_type?: string | null
          ocr_provider?: string | null
          ocr_text?: string | null
          original_filename?: string | null
          parse_json?: Json | null
          status?: string
          technician_profile_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doc_uploads_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "doc_uploads_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "doc_uploads_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "doc_uploads_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doc_uploads_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "doc_uploads_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "doc_uploads_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "doc_uploads_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "doc_uploads_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "doc_uploads_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doc_uploads_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "doc_uploads_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "doc_uploads_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "doc_uploads_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doc_uploads_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
        ]
      }
      document_processing_queue: {
        Row: {
          chunk_index: number
          chunk_text: string
          created_at: string | null
          document_id: string | null
          error_message: string | null
          id: string
          processed_at: string | null
          retry_count: number | null
          status: string | null
        }
        Insert: {
          chunk_index: number
          chunk_text: string
          created_at?: string | null
          document_id?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          retry_count?: number | null
          status?: string | null
        }
        Update: {
          chunk_index?: number
          chunk_text?: string
          created_at?: string | null
          document_id?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          retry_count?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_processing_queue_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      dvr_incidents: {
        Row: {
          camera_status: string | null
          created_at: string
          date_offline: string
          date_online: string | null
          downtime_days: number | null
          id: string
          issue_type: string
          network_issue: boolean | null
          network_team_confirmed: boolean | null
          power_cycle_completed: boolean | null
          resolution: string | null
          responsible_party: string | null
          state: string | null
          store_code: string | null
          store_name: string
          ticket_number: string | null
          updated_at: string
        }
        Insert: {
          camera_status?: string | null
          created_at?: string
          date_offline: string
          date_online?: string | null
          downtime_days?: number | null
          id?: string
          issue_type: string
          network_issue?: boolean | null
          network_team_confirmed?: boolean | null
          power_cycle_completed?: boolean | null
          resolution?: string | null
          responsible_party?: string | null
          state?: string | null
          store_code?: string | null
          store_name: string
          ticket_number?: string | null
          updated_at?: string
        }
        Update: {
          camera_status?: string | null
          created_at?: string
          date_offline?: string
          date_online?: string | null
          downtime_days?: number | null
          id?: string
          issue_type?: string
          network_issue?: boolean | null
          network_team_confirmed?: boolean | null
          power_cycle_completed?: boolean | null
          resolution?: string | null
          responsible_party?: string | null
          state?: string | null
          store_code?: string | null
          store_name?: string
          ticket_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      equipment_required_skills: {
        Row: {
          created_at: string
          equipment_id: string
          id: string
          minimum_level: number
          product_id: string | null
          skill_id: string
        }
        Insert: {
          created_at?: string
          equipment_id: string
          id?: string
          minimum_level?: number
          product_id?: string | null
          skill_id: string
        }
        Update: {
          created_at?: string
          equipment_id?: string
          id?: string
          minimum_level?: number
          product_id?: string | null
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_required_skills_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_required_skills_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_popular_survey_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_required_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          action: string | null
          actor_user_id: string | null
          at: string | null
          entity: string | null
          entity_id: string | null
          id: string
          payload: Json | null
        }
        Insert: {
          action?: string | null
          actor_user_id?: string | null
          at?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          payload?: Json | null
        }
        Update: {
          action?: string | null
          actor_user_id?: string | null
          at?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          payload?: Json | null
        }
        Relationships: []
      }
      events_archive: {
        Row: {
          action: string | null
          actor_user_id: string | null
          at: string | null
          entity: string | null
          entity_id: string | null
          id: string
          payload: Json | null
        }
        Insert: {
          action?: string | null
          actor_user_id?: string | null
          at?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          payload?: Json | null
        }
        Update: {
          action?: string | null
          actor_user_id?: string | null
          at?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          payload?: Json | null
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          active: boolean | null
          code: string
          doc_kind: Database["public"]["Enums"]["doc_kind"] | null
          gl_account: string | null
          id: string
        }
        Insert: {
          active?: boolean | null
          code: string
          doc_kind?: Database["public"]["Enums"]["doc_kind"] | null
          gl_account?: string | null
          id?: string
        }
        Update: {
          active?: boolean | null
          code?: string
          doc_kind?: Database["public"]["Enums"]["doc_kind"] | null
          gl_account?: string | null
          id?: string
        }
        Relationships: []
      }
      expense_line_items: {
        Row: {
          category: string | null
          created_at: string | null
          description: string
          expense_id: string | null
          id: string
          quantity: number | null
          total_amount: number
          unit_price: number
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description: string
          expense_id?: string | null
          id?: string
          quantity?: number | null
          total_amount: number
          unit_price: number
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string
          expense_id?: string | null
          id?: string
          quantity?: number | null
          total_amount?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "expense_line_items_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          allocation_percentage: number | null
          amount: number
          approved_at: string | null
          approved_by: string | null
          billing_markup_pct: number | null
          category: string
          check_in_date: string | null
          check_out_date: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          doc_upload_id: string | null
          expense_date: string
          fuel_gallons: number | null
          fuel_price_per_gallon: number | null
          id: string
          is_billable: boolean | null
          job_id: string | null
          location_address: string | null
          location_city: string | null
          location_state: string | null
          location_zip: string | null
          maintenance_mileage: number | null
          maintenance_type: string | null
          next_service_due: number | null
          nights_stayed: number | null
          notes: string | null
          odometer_reading: number | null
          payment_method: string | null
          project_id: string | null
          receipt_number: string | null
          status: string | null
          subcategory: string | null
          tax_amount: number | null
          technician_id: string | null
          technician_name: string | null
          updated_at: string | null
          vehicle_id: string | null
          vendor_id: string | null
          vendor_name: string | null
        }
        Insert: {
          allocation_percentage?: number | null
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          billing_markup_pct?: number | null
          category: string
          check_in_date?: string | null
          check_out_date?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          doc_upload_id?: string | null
          expense_date: string
          fuel_gallons?: number | null
          fuel_price_per_gallon?: number | null
          id?: string
          is_billable?: boolean | null
          job_id?: string | null
          location_address?: string | null
          location_city?: string | null
          location_state?: string | null
          location_zip?: string | null
          maintenance_mileage?: number | null
          maintenance_type?: string | null
          next_service_due?: number | null
          nights_stayed?: number | null
          notes?: string | null
          odometer_reading?: number | null
          payment_method?: string | null
          project_id?: string | null
          receipt_number?: string | null
          status?: string | null
          subcategory?: string | null
          tax_amount?: number | null
          technician_id?: string | null
          technician_name?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
        }
        Update: {
          allocation_percentage?: number | null
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          billing_markup_pct?: number | null
          category?: string
          check_in_date?: string | null
          check_out_date?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          doc_upload_id?: string | null
          expense_date?: string
          fuel_gallons?: number | null
          fuel_price_per_gallon?: number | null
          id?: string
          is_billable?: boolean | null
          job_id?: string | null
          location_address?: string | null
          location_city?: string | null
          location_state?: string | null
          location_zip?: string | null
          maintenance_mileage?: number | null
          maintenance_type?: string | null
          next_service_due?: number | null
          nights_stayed?: number | null
          notes?: string | null
          odometer_reading?: number | null
          payment_method?: string | null
          project_id?: string | null
          receipt_number?: string | null
          status?: string | null
          subcategory?: string | null
          tax_amount?: number | null
          technician_id?: string | null
          technician_name?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "expenses_doc_upload_id_fkey"
            columns: ["doc_upload_id"]
            isOneToOne: false
            referencedRelation: "doc_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "expenses_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "expenses_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "expenses_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "expenses_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      external_files: {
        Row: {
          bucket: string
          created_at: string
          file_size: number | null
          id: string
          mime_type: string | null
          object_key: string
          provider: string
          updated_at: string
        }
        Insert: {
          bucket: string
          created_at?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          object_key: string
          provider: string
          updated_at?: string
        }
        Update: {
          bucket?: string
          created_at?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          object_key?: string
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          allowed_roles: string[]
          allowed_users: string[]
          created_at: string
          description: string | null
          enabled: boolean
          flag_key: string
          id: string
          updated_at: string
        }
        Insert: {
          allowed_roles?: string[]
          allowed_users?: string[]
          created_at?: string
          description?: string | null
          enabled?: boolean
          flag_key: string
          id?: string
          updated_at?: string
        }
        Update: {
          allowed_roles?: string[]
          allowed_users?: string[]
          created_at?: string
          description?: string | null
          enabled?: boolean
          flag_key?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      field_installation_photos: {
        Row: {
          ai_extracted_text: string | null
          ai_keywords: Json | null
          caption: string | null
          checklist_response_id: string | null
          created_at: string
          device_id: string | null
          file_path: string
          id: string
          job_id: string | null
          latitude: number | null
          longitude: number | null
          photo_category: string | null
          photo_type: string | null
          project_id: string
          qc_comment: string | null
          qc_flagged_at: string | null
          qc_flagged_by: string | null
          qc_note: string | null
          qc_status: string | null
          qc_verified_at: string | null
          qc_verified_by: string | null
          taken_at: string
          uploaded_by: string | null
          user_id: string | null
        }
        Insert: {
          ai_extracted_text?: string | null
          ai_keywords?: Json | null
          caption?: string | null
          checklist_response_id?: string | null
          created_at?: string
          device_id?: string | null
          file_path: string
          id?: string
          job_id?: string | null
          latitude?: number | null
          longitude?: number | null
          photo_category?: string | null
          photo_type?: string | null
          project_id: string
          qc_comment?: string | null
          qc_flagged_at?: string | null
          qc_flagged_by?: string | null
          qc_note?: string | null
          qc_status?: string | null
          qc_verified_at?: string | null
          qc_verified_by?: string | null
          taken_at?: string
          uploaded_by?: string | null
          user_id?: string | null
        }
        Update: {
          ai_extracted_text?: string | null
          ai_keywords?: Json | null
          caption?: string | null
          checklist_response_id?: string | null
          created_at?: string
          device_id?: string | null
          file_path?: string
          id?: string
          job_id?: string | null
          latitude?: number | null
          longitude?: number | null
          photo_category?: string | null
          photo_type?: string | null
          project_id?: string
          qc_comment?: string | null
          qc_flagged_at?: string | null
          qc_flagged_by?: string | null
          qc_note?: string | null
          qc_status?: string | null
          qc_verified_at?: string | null
          qc_verified_by?: string | null
          taken_at?: string
          uploaded_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_installation_photos_checklist_response_id_fkey"
            columns: ["checklist_response_id"]
            isOneToOne: false
            referencedRelation: "checklist_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_installation_photos_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_installation_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "field_installation_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "field_installation_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "field_installation_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_installation_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "field_installation_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "field_installation_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "field_installation_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "field_installation_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "field_installation_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "field_installation_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_installation_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_installation_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "field_installation_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_installation_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "field_installation_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "field_installation_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
        ]
      }
      field_installation_time_entries: {
        Row: {
          created_at: string
          id: string
          latitude_in: number | null
          latitude_out: number | null
          longitude_in: number | null
          longitude_out: number | null
          notes: string | null
          project_id: string
          sign_in_time: string
          sign_out_time: string | null
          technician_id: string
          total_hours: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          latitude_in?: number | null
          latitude_out?: number | null
          longitude_in?: number | null
          longitude_out?: number | null
          notes?: string | null
          project_id: string
          sign_in_time?: string
          sign_out_time?: string | null
          technician_id: string
          total_hours?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          latitude_in?: number | null
          latitude_out?: number | null
          longitude_in?: number | null
          longitude_out?: number | null
          notes?: string | null
          project_id?: string
          sign_in_time?: string
          sign_out_time?: string | null
          technician_id?: string
          total_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_installation_time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "field_installation_time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "field_installation_time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_installation_time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      form_field_types: {
        Row: {
          component: string
          help_text: string | null
          id: string
          label: string
          placeholder: string | null
          validation_pattern: string | null
        }
        Insert: {
          component: string
          help_text?: string | null
          id: string
          label: string
          placeholder?: string | null
          validation_pattern?: string | null
        }
        Update: {
          component?: string
          help_text?: string | null
          id?: string
          label?: string
          placeholder?: string | null
          validation_pattern?: string | null
        }
        Relationships: []
      }
      head_end_capacity_rules: {
        Row: {
          created_at: string | null
          device_category: string
          id: string
          max_devices: number | null
          min_devices: number
          notes: string | null
          quantity_per_threshold: number
          required_equipment_code: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_category: string
          id?: string
          max_devices?: number | null
          min_devices: number
          notes?: string | null
          quantity_per_threshold?: number
          required_equipment_code: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_category?: string
          id?: string
          max_devices?: number | null
          min_devices?: number
          notes?: string | null
          quantity_per_threshold?: number
          required_equipment_code?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "head_end_capacity_rules_required_equipment_code_fkey"
            columns: ["required_equipment_code"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_code"]
          },
          {
            foreignKeyName: "head_end_capacity_rules_required_equipment_code_fkey"
            columns: ["required_equipment_code"]
            isOneToOne: false
            referencedRelation: "v_popular_survey_equipment"
            referencedColumns: ["sku"]
          },
        ]
      }
      head_end_equipment: {
        Row: {
          created_at: string | null
          equipment_type: string
          head_end_location: string
          id: string
          item_count: number
          required_product_code: string
          site_survey_id: string | null
        }
        Insert: {
          created_at?: string | null
          equipment_type: string
          head_end_location: string
          id?: string
          item_count: number
          required_product_code: string
          site_survey_id?: string | null
        }
        Update: {
          created_at?: string | null
          equipment_type?: string
          head_end_location?: string
          id?: string
          item_count?: number
          required_product_code?: string
          site_survey_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "head_end_equipment_site_survey_id_fkey"
            columns: ["site_survey_id"]
            isOneToOne: false
            referencedRelation: "site_surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "head_end_equipment_site_survey_id_fkey"
            columns: ["site_survey_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_matching_stats"
            referencedColumns: ["survey_id"]
          },
        ]
      }
      hotel_expenses: {
        Row: {
          address: string | null
          allocation_percentage: number | null
          approved_at: string | null
          approved_by: string | null
          billing_markup_pct: number | null
          booked_by: string | null
          booked_for: string | null
          booking_itinerary: string | null
          booking_source: string | null
          brand: string | null
          card_last_four: string | null
          check_in_date: string
          check_out_date: string
          city: string | null
          client: string | null
          confirmation_number: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          discount_applied: number | null
          doc_upload_id: string | null
          elite_night_credit: boolean | null
          folio_number: string | null
          folio_url: string | null
          grand_total: number
          hotel_name: string
          id: string
          incidentals: number | null
          is_billable: boolean | null
          job_id: string | null
          loyalty_number: string | null
          loyalty_program: string | null
          nights: number | null
          notes: string | null
          paid_by: string | null
          payment_method: string | null
          per_diem_eligible: boolean | null
          per_diem_rate: number | null
          points_earned: number | null
          project_id: string | null
          reason: string | null
          receipt_url: string | null
          reimbursement_amount: number | null
          reimbursement_date: string | null
          reimbursement_status: string | null
          room_rate: number | null
          room_total: number | null
          room_type: string | null
          roommate_id: string | null
          shared_room: boolean | null
          state: string | null
          status: string | null
          taxes_fees: number | null
          technician_id: string | null
          territory: string | null
          updated_at: string | null
          vehicle_id: string | null
          vendor_id: string | null
          within_policy: boolean | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          allocation_percentage?: number | null
          approved_at?: string | null
          approved_by?: string | null
          billing_markup_pct?: number | null
          booked_by?: string | null
          booked_for?: string | null
          booking_itinerary?: string | null
          booking_source?: string | null
          brand?: string | null
          card_last_four?: string | null
          check_in_date: string
          check_out_date: string
          city?: string | null
          client?: string | null
          confirmation_number?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          discount_applied?: number | null
          doc_upload_id?: string | null
          elite_night_credit?: boolean | null
          folio_number?: string | null
          folio_url?: string | null
          grand_total: number
          hotel_name: string
          id?: string
          incidentals?: number | null
          is_billable?: boolean | null
          job_id?: string | null
          loyalty_number?: string | null
          loyalty_program?: string | null
          nights?: number | null
          notes?: string | null
          paid_by?: string | null
          payment_method?: string | null
          per_diem_eligible?: boolean | null
          per_diem_rate?: number | null
          points_earned?: number | null
          project_id?: string | null
          reason?: string | null
          receipt_url?: string | null
          reimbursement_amount?: number | null
          reimbursement_date?: string | null
          reimbursement_status?: string | null
          room_rate?: number | null
          room_total?: number | null
          room_type?: string | null
          roommate_id?: string | null
          shared_room?: boolean | null
          state?: string | null
          status?: string | null
          taxes_fees?: number | null
          technician_id?: string | null
          territory?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
          vendor_id?: string | null
          within_policy?: boolean | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          allocation_percentage?: number | null
          approved_at?: string | null
          approved_by?: string | null
          billing_markup_pct?: number | null
          booked_by?: string | null
          booked_for?: string | null
          booking_itinerary?: string | null
          booking_source?: string | null
          brand?: string | null
          card_last_four?: string | null
          check_in_date?: string
          check_out_date?: string
          city?: string | null
          client?: string | null
          confirmation_number?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          discount_applied?: number | null
          doc_upload_id?: string | null
          elite_night_credit?: boolean | null
          folio_number?: string | null
          folio_url?: string | null
          grand_total?: number
          hotel_name?: string
          id?: string
          incidentals?: number | null
          is_billable?: boolean | null
          job_id?: string | null
          loyalty_number?: string | null
          loyalty_program?: string | null
          nights?: number | null
          notes?: string | null
          paid_by?: string | null
          payment_method?: string | null
          per_diem_eligible?: boolean | null
          per_diem_rate?: number | null
          points_earned?: number | null
          project_id?: string | null
          reason?: string | null
          receipt_url?: string | null
          reimbursement_amount?: number | null
          reimbursement_date?: string | null
          reimbursement_status?: string | null
          room_rate?: number | null
          room_total?: number | null
          room_type?: string | null
          roommate_id?: string | null
          shared_room?: boolean | null
          state?: string | null
          status?: string | null
          taxes_fees?: number | null
          technician_id?: string | null
          territory?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
          vendor_id?: string | null
          within_policy?: boolean | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotel_expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "hotel_expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "hotel_expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "hotel_expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "hotel_expenses_doc_upload_id_fkey"
            columns: ["doc_upload_id"]
            isOneToOne: false
            referencedRelation: "doc_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "hotel_expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "hotel_expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "hotel_expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "hotel_expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "hotel_expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "hotel_expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "hotel_expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "hotel_expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "hotel_expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_expenses_roommate_id_fkey"
            columns: ["roommate_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_expenses_roommate_id_fkey"
            columns: ["roommate_id"]
            isOneToOne: false
            referencedRelation: "vw_tech_capacity_daily"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "hotel_expenses_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_expenses_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_tech_capacity_daily"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "hotel_expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_expenses_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      import_logs: {
        Row: {
          created_at: string | null
          errors: string[] | null
          filename: string
          id: string
          rows_inserted: number | null
          rows_updated: number | null
          sheet_name: string
          updated_at: string | null
          upload_date: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          errors?: string[] | null
          filename: string
          id?: string
          rows_inserted?: number | null
          rows_updated?: number | null
          sheet_name: string
          updated_at?: string | null
          upload_date?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          errors?: string[] | null
          filename?: string
          id?: string
          rows_inserted?: number | null
          rows_updated?: number | null
          sheet_name?: string
          updated_at?: string | null
          upload_date?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      incidents: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          job_id: string | null
          photo_url: string | null
          salesforce_case_id: string | null
          technician_id: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          job_id?: string | null
          photo_url?: string | null
          salesforce_case_id?: string | null
          technician_id?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          job_id?: string | null
          photo_url?: string | null
          salesforce_case_id?: string | null
          technician_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "incidents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "incidents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "incidents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "incidents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "incidents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "incidents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "incidents_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_tech_capacity_daily"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      integration_state: {
        Row: {
          integration_name: string
          last_asset_sync: string | null
          last_case_sync: string | null
          last_opportunity_sync: string | null
          last_sync_at: string | null
          updated_at: string | null
        }
        Insert: {
          integration_name: string
          last_asset_sync?: string | null
          last_case_sync?: string | null
          last_opportunity_sync?: string | null
          last_sync_at?: string | null
          updated_at?: string | null
        }
        Update: {
          integration_name?: string
          last_asset_sync?: string | null
          last_case_sync?: string | null
          last_opportunity_sync?: string | null
          last_sync_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      integrations_config: {
        Row: {
          id: string
          provider: string
          settings: Json
        }
        Insert: {
          id?: string
          provider: string
          settings: Json
        }
        Update: {
          id?: string
          provider?: string
          settings?: Json
        }
        Relationships: []
      }
      irregularities: {
        Row: {
          affected_records: Json | null
          created_at: string | null
          description: string
          detected_at: string | null
          employee_email: string | null
          employee_name: string | null
          id: string
          issue_type: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          store_name: string | null
        }
        Insert: {
          affected_records?: Json | null
          created_at?: string | null
          description: string
          detected_at?: string | null
          employee_email?: string | null
          employee_name?: string | null
          id?: string
          issue_type: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          store_name?: string | null
        }
        Update: {
          affected_records?: Json | null
          created_at?: string | null
          description?: string
          detected_at?: string | null
          employee_email?: string | null
          employee_name?: string | null
          id?: string
          issue_type?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          store_name?: string | null
        }
        Relationships: []
      }
      issue_activity_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          id: string
          issue_id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          id?: string
          issue_id: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          id?: string
          issue_id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_activity_log_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          issue_id: string
          uploader_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          issue_id: string
          uploader_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          issue_id?: string
          uploader_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_attachments_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          issue_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          issue_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          issue_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_comments_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_label_links: {
        Row: {
          issue_id: string
          label_id: string
        }
        Insert: {
          issue_id: string
          label_id: string
        }
        Update: {
          issue_id?: string
          label_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_label_links_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_label_links_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "issue_labels"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_labels: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      issue_types: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      issue_votes: {
        Row: {
          created_at: string | null
          issue_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          issue_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          issue_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_votes_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          assignee_id: string | null
          browser_info: Json | null
          created_at: string | null
          description: string | null
          id: string
          path: string | null
          priority: Database["public"]["Enums"]["issue_priority"]
          reporter_id: string | null
          status: Database["public"]["Enums"]["issue_status"]
          title: string
          type: Database["public"]["Enums"]["issue_type"]
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          browser_info?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          path?: string | null
          priority?: Database["public"]["Enums"]["issue_priority"]
          reporter_id?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
          title: string
          type?: Database["public"]["Enums"]["issue_type"]
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          browser_info?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          path?: string | null
          priority?: Database["public"]["Enums"]["issue_priority"]
          reporter_id?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
          title?: string
          type?: Database["public"]["Enums"]["issue_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      job_attachments: {
        Row: {
          created_at: string
          customer_id: number | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          job_id: string
          mime_type: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: number | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          job_id: string
          mime_type?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: number | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          job_id?: string
          mime_type?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_attachments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_overview"
            referencedColumns: ["alarm_customer_id"]
          },
          {
            foreignKeyName: "job_attachments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["alarm_customer_id"]
          },
          {
            foreignKeyName: "job_attachments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["legacy_id"]
          },
          {
            foreignKeyName: "job_attachments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_attachments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_attachments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_attachments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_attachments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_attachments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_attachments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_attachments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
        ]
      }
      job_costs: {
        Row: {
          allocated_expenses: number | null
          change_order_revenue: number | null
          contract_revenue: number | null
          created_at: string | null
          direct_expenses: number | null
          gross_margin_pct: number | null
          gross_profit: number | null
          id: string
          job_id: string
          labor_overtime_cost: number | null
          labor_overtime_hours: number | null
          labor_regular_cost: number | null
          labor_regular_hours: number | null
          last_calculated_at: string | null
          overhead_allocation: number | null
          parts_cost: number | null
          parts_margin: number | null
          project_id: string
          total_cost: number | null
          total_revenue: number | null
          travel_mileage_cost: number | null
          travel_mileage_km: number | null
          travel_time_cost: number | null
          travel_time_hours: number | null
          updated_at: string | null
        }
        Insert: {
          allocated_expenses?: number | null
          change_order_revenue?: number | null
          contract_revenue?: number | null
          created_at?: string | null
          direct_expenses?: number | null
          gross_margin_pct?: number | null
          gross_profit?: number | null
          id?: string
          job_id: string
          labor_overtime_cost?: number | null
          labor_overtime_hours?: number | null
          labor_regular_cost?: number | null
          labor_regular_hours?: number | null
          last_calculated_at?: string | null
          overhead_allocation?: number | null
          parts_cost?: number | null
          parts_margin?: number | null
          project_id: string
          total_cost?: number | null
          total_revenue?: number | null
          travel_mileage_cost?: number | null
          travel_mileage_km?: number | null
          travel_time_cost?: number | null
          travel_time_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          allocated_expenses?: number | null
          change_order_revenue?: number | null
          contract_revenue?: number | null
          created_at?: string | null
          direct_expenses?: number | null
          gross_margin_pct?: number | null
          gross_profit?: number | null
          id?: string
          job_id?: string
          labor_overtime_cost?: number | null
          labor_overtime_hours?: number | null
          labor_regular_cost?: number | null
          labor_regular_hours?: number | null
          last_calculated_at?: string | null
          overhead_allocation?: number | null
          parts_cost?: number | null
          parts_margin?: number | null
          project_id?: string
          total_cost?: number | null
          total_revenue?: number | null
          travel_mileage_cost?: number | null
          travel_mileage_km?: number | null
          travel_time_cost?: number | null
          travel_time_hours?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_costs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_costs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_costs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_costs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_costs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_costs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_costs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_costs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "job_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "job_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      job_documents: {
        Row: {
          created_at: string | null
          document_type: string | null
          file_name: string
          file_size_bytes: number | null
          file_type: string | null
          id: string
          job_id: string
          salesforce_content_document_id: string | null
          salesforce_content_version_id: string | null
          storage_bucket: string | null
          storage_path: string
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_type?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          job_id: string
          salesforce_content_document_id?: string | null
          salesforce_content_version_id?: string | null
          storage_bucket?: string | null
          storage_path: string
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          job_id?: string
          salesforce_content_document_id?: string | null
          salesforce_content_version_id?: string | null
          storage_bucket?: string | null
          storage_path?: string
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
        ]
      }
      job_estimates: {
        Row: {
          base_days: number | null
          cable_run_count: number | null
          calculated_at: string | null
          calculated_by: string | null
          camera_count: number | null
          complexity_multiplier: number | null
          created_at: string | null
          door_count: number | null
          id: string
          notes: string | null
          patch_count: number | null
          project_id: string
          sensor_count: number | null
          total_estimated_days: number | null
          total_estimated_hours: number | null
          travel_days: number | null
          updated_at: string | null
        }
        Insert: {
          base_days?: number | null
          cable_run_count?: number | null
          calculated_at?: string | null
          calculated_by?: string | null
          camera_count?: number | null
          complexity_multiplier?: number | null
          created_at?: string | null
          door_count?: number | null
          id?: string
          notes?: string | null
          patch_count?: number | null
          project_id: string
          sensor_count?: number | null
          total_estimated_days?: number | null
          total_estimated_hours?: number | null
          travel_days?: number | null
          updated_at?: string | null
        }
        Update: {
          base_days?: number | null
          cable_run_count?: number | null
          calculated_at?: string | null
          calculated_by?: string | null
          camera_count?: number | null
          complexity_multiplier?: number | null
          created_at?: string | null
          door_count?: number | null
          id?: string
          notes?: string | null
          patch_count?: number | null
          project_id?: string
          sensor_count?: number | null
          total_estimated_days?: number | null
          total_estimated_hours?: number | null
          travel_days?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_estimates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "job_estimates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "job_estimates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_estimates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      job_files: {
        Row: {
          id: string
          job_id: string | null
          kind: string | null
          name: string | null
          uploaded_at: string | null
          uploaded_by: string | null
          url: string
        }
        Insert: {
          id?: string
          job_id?: string | null
          kind?: string | null
          name?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          url: string
        }
        Update: {
          id?: string
          job_id?: string | null
          kind?: string | null
          name?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_files_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_files_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_files_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_files_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_files_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_files_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_files_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_files_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "vw_tech_capacity_daily"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      job_line_items: {
        Row: {
          created_at: string | null
          id: string
          is_installed: boolean | null
          job_id: string | null
          product_code: string | null
          product_name: string
          quantity: number
          salesforce_line_item_id: string | null
          sku: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_installed?: boolean | null
          job_id?: string | null
          product_code?: string | null
          product_name: string
          quantity: number
          salesforce_line_item_id?: string | null
          sku?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_installed?: boolean | null
          job_id?: string | null
          product_code?: string | null
          product_name?: string
          quantity?: number
          salesforce_line_item_id?: string | null
          sku?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_line_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_line_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_line_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_line_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_line_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_line_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_line_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_line_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
        ]
      }
      job_notes: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: number | null
          id: string
          job_id: string
          note_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id?: number | null
          id?: string
          job_id: string
          note_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: number | null
          id?: string
          job_id?: string
          note_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_overview"
            referencedColumns: ["alarm_customer_id"]
          },
          {
            foreignKeyName: "job_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["alarm_customer_id"]
          },
          {
            foreignKeyName: "job_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["legacy_id"]
          },
          {
            foreignKeyName: "job_notes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_notes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_notes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_notes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_notes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_notes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_notes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_notes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
        ]
      }
      job_photos: {
        Row: {
          caption: string | null
          id: string
          job_id: string | null
          taken_at: string | null
          technician_id: string | null
          type: string | null
          url: string
        }
        Insert: {
          caption?: string | null
          id?: string
          job_id?: string | null
          taken_at?: string | null
          technician_id?: string | null
          type?: string | null
          url: string
        }
        Update: {
          caption?: string | null
          id?: string
          job_id?: string | null
          taken_at?: string | null
          technician_id?: string | null
          type?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_photos_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_photos_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_tech_capacity_daily"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      job_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          created_at: string
          id: string
          job_id: string
          new_status: string
          old_status: string | null
          reason: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          job_id: string
          new_status: string
          old_status?: string | null
          reason?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          job_id?: string
          new_status?: string
          old_status?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "job_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "job_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "job_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
        ]
      }
      job_timecards: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          break_minutes: number | null
          clock_in_lat: number | null
          clock_in_long: number | null
          clock_out_lat: number | null
          clock_out_long: number | null
          created_at: string | null
          end_time: string
          has_drive_time: boolean | null
          has_hotel: boolean | null
          has_per_diem: boolean | null
          id: string
          notes: string | null
          project_id: string
          start_time: string
          status: string | null
          total_minutes: number | null
          updated_at: string | null
          user_id: string
          work_date: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          break_minutes?: number | null
          clock_in_lat?: number | null
          clock_in_long?: number | null
          clock_out_lat?: number | null
          clock_out_long?: number | null
          created_at?: string | null
          end_time: string
          has_drive_time?: boolean | null
          has_hotel?: boolean | null
          has_per_diem?: boolean | null
          id?: string
          notes?: string | null
          project_id: string
          start_time: string
          status?: string | null
          total_minutes?: number | null
          updated_at?: string | null
          user_id: string
          work_date: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          break_minutes?: number | null
          clock_in_lat?: number | null
          clock_in_long?: number | null
          clock_out_lat?: number | null
          clock_out_long?: number | null
          created_at?: string | null
          end_time?: string
          has_drive_time?: boolean | null
          has_hotel?: boolean | null
          has_per_diem?: boolean | null
          id?: string
          notes?: string | null
          project_id?: string
          start_time?: string
          status?: string | null
          total_minutes?: number | null
          updated_at?: string | null
          user_id?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_timecards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "job_timecards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "job_timecards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_timecards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          checklist_template_id: string | null
          completed_at: string | null
          contract_value: number | null
          created_at: string
          customer_email: string | null
          customer_id: number | null
          customer_name: string | null
          customer_phone: string | null
          description: string | null
          due_by: string | null
          earliest_start: string | null
          estimated_duration_mins: number | null
          estimated_hours: number | null
          evidence_requirements: Json | null
          facility_name: string | null
          id: string
          installation_address: string | null
          installation_city: string | null
          installation_state: string | null
          installation_zip: string | null
          instructions_md: string | null
          is_project_related: boolean | null
          job_code: string | null
          job_number: string | null
          job_status: string | null
          job_title: string | null
          job_type: string | null
          min_crew_size: number | null
          on_hold_reason: string | null
          opportunity_close_date: string | null
          opportunity_name: string | null
          prerequisites: Json | null
          priority: number | null
          project_id: string | null
          projected_revenue: number | null
          required_cert_codes: string[] | null
          required_skill_codes: string[] | null
          requires_skills: string[] | null
          salesforce_account_id: string | null
          salesforce_id: string | null
          salesforce_opportunity_id: string | null
          salesforce_sync_status: string | null
          salesforce_work_order_id: string | null
          scheduled_date: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          scope_summary: string | null
          site_contact_email: string | null
          site_contact_name: string | null
          site_contact_phone: string | null
          site_id: string | null
          site_latitude: number | null
          site_longitude: number | null
          site_survey_id: string | null
          sla_due: string | null
          sla_level: string | null
          source: string | null
          source_id: string | null
          source_type: string
          special_project_id: string | null
          special_project_store_id: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          store_code: string | null
          technician_id: string | null
          territory_id: string | null
          total_expenses: number | null
          updated_at: string
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          checklist_template_id?: string | null
          completed_at?: string | null
          contract_value?: number | null
          created_at?: string
          customer_email?: string | null
          customer_id?: number | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          due_by?: string | null
          earliest_start?: string | null
          estimated_duration_mins?: number | null
          estimated_hours?: number | null
          evidence_requirements?: Json | null
          facility_name?: string | null
          id?: string
          installation_address?: string | null
          installation_city?: string | null
          installation_state?: string | null
          installation_zip?: string | null
          instructions_md?: string | null
          is_project_related?: boolean | null
          job_code?: string | null
          job_number?: string | null
          job_status?: string | null
          job_title?: string | null
          job_type?: string | null
          min_crew_size?: number | null
          on_hold_reason?: string | null
          opportunity_close_date?: string | null
          opportunity_name?: string | null
          prerequisites?: Json | null
          priority?: number | null
          project_id?: string | null
          projected_revenue?: number | null
          required_cert_codes?: string[] | null
          required_skill_codes?: string[] | null
          requires_skills?: string[] | null
          salesforce_account_id?: string | null
          salesforce_id?: string | null
          salesforce_opportunity_id?: string | null
          salesforce_sync_status?: string | null
          salesforce_work_order_id?: string | null
          scheduled_date?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          scope_summary?: string | null
          site_contact_email?: string | null
          site_contact_name?: string | null
          site_contact_phone?: string | null
          site_id?: string | null
          site_latitude?: number | null
          site_longitude?: number | null
          site_survey_id?: string | null
          sla_due?: string | null
          sla_level?: string | null
          source?: string | null
          source_id?: string | null
          source_type?: string
          special_project_id?: string | null
          special_project_store_id?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          store_code?: string | null
          technician_id?: string | null
          territory_id?: string | null
          total_expenses?: number | null
          updated_at?: string
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          checklist_template_id?: string | null
          completed_at?: string | null
          contract_value?: number | null
          created_at?: string
          customer_email?: string | null
          customer_id?: number | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          due_by?: string | null
          earliest_start?: string | null
          estimated_duration_mins?: number | null
          estimated_hours?: number | null
          evidence_requirements?: Json | null
          facility_name?: string | null
          id?: string
          installation_address?: string | null
          installation_city?: string | null
          installation_state?: string | null
          installation_zip?: string | null
          instructions_md?: string | null
          is_project_related?: boolean | null
          job_code?: string | null
          job_number?: string | null
          job_status?: string | null
          job_title?: string | null
          job_type?: string | null
          min_crew_size?: number | null
          on_hold_reason?: string | null
          opportunity_close_date?: string | null
          opportunity_name?: string | null
          prerequisites?: Json | null
          priority?: number | null
          project_id?: string | null
          projected_revenue?: number | null
          required_cert_codes?: string[] | null
          required_skill_codes?: string[] | null
          requires_skills?: string[] | null
          salesforce_account_id?: string | null
          salesforce_id?: string | null
          salesforce_opportunity_id?: string | null
          salesforce_sync_status?: string | null
          salesforce_work_order_id?: string | null
          scheduled_date?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          scope_summary?: string | null
          site_contact_email?: string | null
          site_contact_name?: string | null
          site_contact_phone?: string | null
          site_id?: string | null
          site_latitude?: number | null
          site_longitude?: number | null
          site_survey_id?: string | null
          sla_due?: string | null
          sla_level?: string | null
          source?: string | null
          source_id?: string | null
          source_type?: string
          special_project_id?: string | null
          special_project_store_id?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          store_code?: string | null
          technician_id?: string | null
          territory_id?: string | null
          total_expenses?: number | null
          updated_at?: string
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_site_survey_id_fkey"
            columns: ["site_survey_id"]
            isOneToOne: false
            referencedRelation: "site_surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_site_survey_id_fkey"
            columns: ["site_survey_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_matching_stats"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "jobs_special_project_id_fkey"
            columns: ["special_project_id"]
            isOneToOne: false
            referencedRelation: "special_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_special_project_store_id_fkey"
            columns: ["special_project_store_id"]
            isOneToOne: false
            referencedRelation: "special_project_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_special_project_store_id_fkey"
            columns: ["special_project_store_id"]
            isOneToOne: false
            referencedRelation: "view_project_map_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_territory_id_fkey"
            columns: ["territory_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_api_keys: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          last_used_at: string | null
          name: string
          permissions: string[] | null
          rate_limit_per_minute: number | null
          upload_count: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          last_used_at?: string | null
          name: string
          permissions?: string[] | null
          rate_limit_per_minute?: number | null
          upload_count?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          last_used_at?: string | null
          name?: string
          permissions?: string[] | null
          rate_limit_per_minute?: number | null
          upload_count?: number | null
        }
        Relationships: []
      }
      knowledge_base_documents: {
        Row: {
          api_key_id: string | null
          callback_url: string | null
          category: string
          content_hash: string | null
          content_text: string | null
          created_at: string | null
          customer_id: number | null
          description: string | null
          file_path: string | null
          file_size: number | null
          file_type: string
          id: string
          ingestion_source: string | null
          pages_processed: number | null
          processed_at: string | null
          processing_error: string | null
          processing_mode: string | null
          processing_status: string | null
          product_id: string | null
          source_type: string | null
          title: string
          total_pages: number | null
          updated_at: string | null
          uploaded_by: string | null
          vision_cost_cents: number | null
        }
        Insert: {
          api_key_id?: string | null
          callback_url?: string | null
          category?: string
          content_hash?: string | null
          content_text?: string | null
          created_at?: string | null
          customer_id?: number | null
          description?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type: string
          id?: string
          ingestion_source?: string | null
          pages_processed?: number | null
          processed_at?: string | null
          processing_error?: string | null
          processing_mode?: string | null
          processing_status?: string | null
          product_id?: string | null
          source_type?: string | null
          title: string
          total_pages?: number | null
          updated_at?: string | null
          uploaded_by?: string | null
          vision_cost_cents?: number | null
        }
        Update: {
          api_key_id?: string | null
          callback_url?: string | null
          category?: string
          content_hash?: string | null
          content_text?: string | null
          created_at?: string | null
          customer_id?: number | null
          description?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string
          id?: string
          ingestion_source?: string | null
          pages_processed?: number | null
          processed_at?: string | null
          processing_error?: string | null
          processing_mode?: string | null
          processing_status?: string | null
          product_id?: string | null
          source_type?: string | null
          title?: string
          total_pages?: number | null
          updated_at?: string | null
          uploaded_by?: string | null
          vision_cost_cents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_documents_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "kb_api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_documents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_documents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_popular_survey_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_chunks: {
        Row: {
          content: string | null
          document_id: string | null
          embedding: string | null
          id: string
        }
        Insert: {
          content?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
        }
        Update: {
          content?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_document_categories: {
        Row: {
          category: string
          document_id: string
        }
        Insert: {
          category: string
          document_id: string
        }
        Update: {
          category?: string
          document_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_document_categories_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_document_keywords: {
        Row: {
          document_id: string
          keyword_id: string
        }
        Insert: {
          document_id: string
          keyword_id: string
        }
        Update: {
          document_id?: string
          keyword_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_document_keywords_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_document_keywords_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "knowledge_keywords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_document_keywords_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "popular_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_documents: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          file_path: string | null
          file_type: string | null
          id: string
          related_customer_id: string | null
          related_product_code: string | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string
          related_customer_id?: string | null
          related_product_code?: string | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string
          related_customer_id?: string | null
          related_product_code?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_documents_related_customer_id_fkey"
            columns: ["related_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["alarm_uuid"]
          },
        ]
      }
      knowledge_item_chunks: {
        Row: {
          content: string
          document_id: string | null
          embedding: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          content: string
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          content?: string
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_item_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_keywords: {
        Row: {
          created_at: string | null
          id: string
          keyword: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          keyword: string
        }
        Update: {
          created_at?: string | null
          id?: string
          keyword?: string
        }
        Relationships: []
      }
      learning_recommendations: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          current_module_id: string
          id: string
          priority: number | null
          reason: string | null
          recommended_module_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          current_module_id: string
          id?: string
          priority?: number | null
          reason?: string | null
          recommended_module_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          current_module_id?: string
          id?: string
          priority?: number | null
          reason?: string | null
          recommended_module_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          address: string | null
          area_sqft: number | null
          city: string | null
          code: string | null
          created_at: string | null
          customer_id: number | null
          description: string | null
          floor_number: number | null
          id: string
          is_active: boolean | null
          location_type: string | null
          metadata: Json | null
          name: string | null
          parent_location_id: string | null
          project_id: string | null
          salesforce_id: string | null
          sort_order: number | null
          state: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          area_sqft?: number | null
          city?: string | null
          code?: string | null
          created_at?: string | null
          customer_id?: number | null
          description?: string | null
          floor_number?: number | null
          id?: string
          is_active?: boolean | null
          location_type?: string | null
          metadata?: Json | null
          name?: string | null
          parent_location_id?: string | null
          project_id?: string | null
          salesforce_id?: string | null
          sort_order?: number | null
          state?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          area_sqft?: number | null
          city?: string | null
          code?: string | null
          created_at?: string | null
          customer_id?: number | null
          description?: string | null
          floor_number?: number | null
          id?: string
          is_active?: boolean | null
          location_type?: string | null
          metadata?: Json | null
          name?: string | null
          parent_location_id?: string | null
          project_id?: string | null
          salesforce_id?: string | null
          sort_order?: number | null
          state?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "locations_parent_location_id_fkey"
            columns: ["parent_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      log_retention_config: {
        Row: {
          archive_table: string
          created_at: string
          enabled: boolean
          id: string
          last_cleanup_at: string | null
          retention_days: number
          table_name: string
          updated_at: string
        }
        Insert: {
          archive_table: string
          created_at?: string
          enabled?: boolean
          id?: string
          last_cleanup_at?: string | null
          retention_days?: number
          table_name: string
          updated_at?: string
        }
        Update: {
          archive_table?: string
          created_at?: string
          enabled?: boolean
          id?: string
          last_cleanup_at?: string | null
          retention_days?: number
          table_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      maintenance_alert_logs: {
        Row: {
          alert_rule_id: string | null
          error_message: string | null
          id: string
          notification_channels: string[]
          sent_at: string
          status: string
          trigger_data: Json
          vehicle_id: string | null
        }
        Insert: {
          alert_rule_id?: string | null
          error_message?: string | null
          id?: string
          notification_channels?: string[]
          sent_at?: string
          status?: string
          trigger_data?: Json
          vehicle_id?: string | null
        }
        Update: {
          alert_rule_id?: string | null
          error_message?: string | null
          id?: string
          notification_channels?: string[]
          sent_at?: string
          status?: string
          trigger_data?: Json
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_alert_logs_alert_rule_id_fkey"
            columns: ["alert_rule_id"]
            isOneToOne: false
            referencedRelation: "maintenance_alert_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_alert_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_master"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_alert_rules: {
        Row: {
          active: boolean
          alert_type: string
          created_at: string
          description: string | null
          id: string
          name: string
          notification_channels: string[]
          recipients: string[]
          trigger_condition: Json
          updated_at: string
          vehicle_id: string | null
          vehicle_specific: boolean
        }
        Insert: {
          active?: boolean
          alert_type: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          notification_channels?: string[]
          recipients?: string[]
          trigger_condition?: Json
          updated_at?: string
          vehicle_id?: string | null
          vehicle_specific?: boolean
        }
        Update: {
          active?: boolean
          alert_type?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          notification_channels?: string[]
          recipients?: string[]
          trigger_condition?: Json
          updated_at?: string
          vehicle_id?: string | null
          vehicle_specific?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_alert_rules_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_master"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_notification_settings: {
        Row: {
          created_at: string
          id: string
          settings: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          settings?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          settings?: Json
          updated_at?: string
        }
        Relationships: []
      }
      media: {
        Row: {
          checklist_response_id: string | null
          created_at: string | null
          description: string | null
          device_id: string | null
          file_name: string
          file_size_bytes: number | null
          id: string
          is_cover_photo: boolean | null
          location_id: string | null
          media_type: string
          metadata: Json | null
          mime_type: string | null
          project_id: string
          storage_bucket: string | null
          storage_path: string
          tags: string[] | null
          thumbnail_path: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          checklist_response_id?: string | null
          created_at?: string | null
          description?: string | null
          device_id?: string | null
          file_name: string
          file_size_bytes?: number | null
          id?: string
          is_cover_photo?: boolean | null
          location_id?: string | null
          media_type: string
          metadata?: Json | null
          mime_type?: string | null
          project_id: string
          storage_bucket?: string | null
          storage_path: string
          tags?: string[] | null
          thumbnail_path?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          checklist_response_id?: string | null
          created_at?: string | null
          description?: string | null
          device_id?: string | null
          file_name?: string
          file_size_bytes?: number | null
          id?: string
          is_cover_photo?: boolean | null
          location_id?: string | null
          media_type?: string
          metadata?: Json | null
          mime_type?: string | null
          project_id?: string
          storage_bucket?: string | null
          storage_path?: string
          tags?: string[] | null
          thumbnail_path?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_checklist_response_id_fkey"
            columns: ["checklist_response_id"]
            isOneToOne: false
            referencedRelation: "checklist_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      modem_info: {
        Row: {
          created_at: string | null
          customer_id: number | null
          firmware_version: number | null
          id: number
          imei: string | null
          modem_phone_number: string | null
          modem_serial: string | null
          network: number | null
          radio_network_type: number | null
          two_way_voice_capable: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: number | null
          firmware_version?: number | null
          id?: number
          imei?: string | null
          modem_phone_number?: string | null
          modem_serial?: string | null
          network?: number | null
          radio_network_type?: number | null
          two_way_voice_capable?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: number | null
          firmware_version?: number | null
          id?: number
          imei?: string | null
          modem_phone_number?: string | null
          modem_serial?: string | null
          network?: number | null
          radio_network_type?: number | null
          two_way_voice_capable?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modem_info_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modem_info_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modem_info_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      module_comments: {
        Row: {
          comment_text: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          module_id: string
          parent_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          module_id: string
          parent_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          module_id?: string
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "module_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      new_hire: {
        Row: {
          abbreviation: string | null
          alarm_pin: string | null
          alarm_pin_status: string | null
          alarm_provider: string | null
          created_at: string | null
          eligible_for_code: boolean | null
          employee_email: string | null
          employee_name: string | null
          employee_status: string | null
          file_date: string | null
          hire_date: string | null
          id: string
          job_title: string | null
          sheet_type: string | null
          source_filename: string | null
          store_name: string | null
          updated_at: string | null
        }
        Insert: {
          abbreviation?: string | null
          alarm_pin?: string | null
          alarm_pin_status?: string | null
          alarm_provider?: string | null
          created_at?: string | null
          eligible_for_code?: boolean | null
          employee_email?: string | null
          employee_name?: string | null
          employee_status?: string | null
          file_date?: string | null
          hire_date?: string | null
          id?: string
          job_title?: string | null
          sheet_type?: string | null
          source_filename?: string | null
          store_name?: string | null
          updated_at?: string | null
        }
        Update: {
          abbreviation?: string | null
          alarm_pin?: string | null
          alarm_pin_status?: string | null
          alarm_provider?: string | null
          created_at?: string | null
          eligible_for_code?: boolean | null
          employee_email?: string | null
          employee_name?: string | null
          employee_status?: string | null
          file_date?: string | null
          hire_date?: string | null
          id?: string
          job_title?: string | null
          sheet_type?: string | null
          source_filename?: string | null
          store_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_inbox: {
        Row: {
          actor_profile_id: string | null
          archived_at: string | null
          body: string | null
          created_at: string
          data: Json
          dedupe_key: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          read_at: string | null
          recipient_profile_id: string
          title: string
          type: string
        }
        Insert: {
          actor_profile_id?: string | null
          archived_at?: string | null
          body?: string | null
          created_at?: string
          data?: Json
          dedupe_key?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read_at?: string | null
          recipient_profile_id: string
          title: string
          type: string
        }
        Update: {
          actor_profile_id?: string | null
          archived_at?: string | null
          body?: string | null
          created_at?: string
          data?: Json
          dedupe_key?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read_at?: string | null
          recipient_profile_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_inbox_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "notification_inbox_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_inbox_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "notification_inbox_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "notification_inbox_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notification_inbox_recipient_profile_id_fkey"
            columns: ["recipient_profile_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "notification_inbox_recipient_profile_id_fkey"
            columns: ["recipient_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_inbox_recipient_profile_id_fkey"
            columns: ["recipient_profile_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "notification_inbox_recipient_profile_id_fkey"
            columns: ["recipient_profile_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "notification_inbox_recipient_profile_id_fkey"
            columns: ["recipient_profile_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_reports: boolean | null
          frequency: string | null
          id: string
          module_id: string | null
          recipients: string[] | null
          threshold_avg_score: number | null
          threshold_pass_rate: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_reports?: boolean | null
          frequency?: string | null
          id?: string
          module_id?: string | null
          recipients?: string[] | null
          threshold_avg_score?: number | null
          threshold_pass_rate?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_reports?: boolean | null
          frequency?: string | null
          id?: string
          module_id?: string | null
          recipients?: string[] | null
          threshold_avg_score?: number | null
          threshold_pass_rate?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          channel: string
          error: string | null
          id: string
          payload: Json | null
          recipient: string
          sent_at: string | null
          status: string | null
          template: string | null
        }
        Insert: {
          channel: string
          error?: string | null
          id?: string
          payload?: Json | null
          recipient: string
          sent_at?: string | null
          status?: string | null
          template?: string | null
        }
        Update: {
          channel?: string
          error?: string | null
          id?: string
          payload?: Json | null
          recipient?: string
          sent_at?: string | null
          status?: string | null
          template?: string | null
        }
        Relationships: []
      }
      ocr_results: {
        Row: {
          confidence: number | null
          created_at: string
          doc_upload_id: string
          error_message: string | null
          extracted_text: string | null
          id: string
          processing_status: string
          provider: string
          structured_data: Json | null
          updated_at: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          doc_upload_id: string
          error_message?: string | null
          extracted_text?: string | null
          id?: string
          processing_status?: string
          provider: string
          structured_data?: Json | null
          updated_at?: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          doc_upload_id?: string
          error_message?: string | null
          extracted_text?: string | null
          id?: string
          processing_status?: string
          provider?: string
          structured_data?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocr_results_doc_upload_id_fkey"
            columns: ["doc_upload_id"]
            isOneToOne: false
            referencedRelation: "doc_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      on_call_shifts: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string
          end_time: string
          id: string
          notes: string | null
          pm_avatar: string | null
          pm_color: string | null
          pm_id: string
          pm_name: string
          start_time: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date: string
          end_time: string
          id?: string
          notes?: string | null
          pm_avatar?: string | null
          pm_color?: string | null
          pm_id: string
          pm_name: string
          start_time: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          end_time?: string
          id?: string
          notes?: string | null
          pm_avatar?: string | null
          pm_color?: string | null
          pm_id?: string
          pm_name?: string
          start_time?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "on_call_shifts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "on_call_shifts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "on_call_shifts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "on_call_shifts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "on_call_shifts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "on_call_shifts_pm_id_fkey"
            columns: ["pm_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "on_call_shifts_pm_id_fkey"
            columns: ["pm_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "on_call_shifts_pm_id_fkey"
            columns: ["pm_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "on_call_shifts_pm_id_fkey"
            columns: ["pm_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "on_call_shifts_pm_id_fkey"
            columns: ["pm_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "on_call_shifts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "on_call_shifts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "on_call_shifts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "on_call_shifts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "on_call_shifts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
        ]
      }
      openeye_alert_subscriptions: {
        Row: {
          active: boolean | null
          created_at: string | null
          delivery_window: string | null
          email: string
          id: string
          scope: string
          scope_values: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          delivery_window?: string | null
          email: string
          id?: string
          scope?: string
          scope_values?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          delivery_window?: string | null
          email?: string
          id?: string
          scope?: string
          scope_values?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      openeye_daily_metrics: {
        Row: {
          avg_offline_minutes: number | null
          came_online_count: number | null
          created_at: string | null
          date: string
          id: string
          total_locations: number | null
          went_offline_count: number | null
        }
        Insert: {
          avg_offline_minutes?: number | null
          came_online_count?: number | null
          created_at?: string | null
          date: string
          id?: string
          total_locations?: number | null
          went_offline_count?: number | null
        }
        Update: {
          avg_offline_minutes?: number | null
          came_online_count?: number | null
          created_at?: string | null
          date?: string
          id?: string
          total_locations?: number | null
          went_offline_count?: number | null
        }
        Relationships: []
      }
      openeye_file_uploads: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_url: string | null
          id: string
          metadata: Json | null
          mime_type: string | null
          storage_path: string
          uploaded_at: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          storage_path: string
          uploaded_at?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          storage_path?: string
          uploaded_at?: string | null
        }
        Relationships: []
      }
      openeye_locations: {
        Row: {
          created_at: string | null
          id: string
          location_code: string | null
          location_name: string
          metadata: Json | null
          region: string | null
          store_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          location_code?: string | null
          location_name: string
          metadata?: Json | null
          region?: string | null
          store_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          location_code?: string | null
          location_name?: string
          metadata?: Json | null
          region?: string | null
          store_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      openeye_outage_events: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          event_time: string
          event_type: string
          id: string
          location_id: string
          raw_data: Json | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          event_time: string
          event_type: string
          id?: string
          location_id: string
          raw_data?: Json | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          event_time?: string
          event_type?: string
          id?: string
          location_id?: string
          raw_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "openeye_outage_events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "openeye_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "openeye_outage_events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "openeye_offline_recorders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "openeye_outage_events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "openeye_recorder_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      openeye_recorder_status: {
        Row: {
          came_online_at: string | null
          created_at: string | null
          id: string
          last_seen: string | null
          location_id: string
          status: string
          updated_at: string | null
          went_offline_at: string | null
        }
        Insert: {
          came_online_at?: string | null
          created_at?: string | null
          id?: string
          last_seen?: string | null
          location_id: string
          status?: string
          updated_at?: string | null
          went_offline_at?: string | null
        }
        Update: {
          came_online_at?: string | null
          created_at?: string | null
          id?: string
          last_seen?: string | null
          location_id?: string
          status?: string
          updated_at?: string | null
          went_offline_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "openeye_recorder_status_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: true
            referencedRelation: "openeye_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "openeye_recorder_status_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: true
            referencedRelation: "openeye_offline_recorders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "openeye_recorder_status_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: true
            referencedRelation: "openeye_recorder_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      optimizer_runs: {
        Row: {
          finished_at: string | null
          goal_weights: Json | null
          id: string
          scope: Json | null
          started_at: string | null
          status: string | null
          summary: Json | null
        }
        Insert: {
          finished_at?: string | null
          goal_weights?: Json | null
          id?: string
          scope?: Json | null
          started_at?: string | null
          status?: string | null
          summary?: Json | null
        }
        Update: {
          finished_at?: string | null
          goal_weights?: Json | null
          id?: string
          scope?: Json | null
          started_at?: string | null
          status?: string | null
          summary?: Json | null
        }
        Relationships: []
      }
      overlap_reports: {
        Row: {
          created_at: string | null
          file_names: string[]
          id: string
          name: string
          stats: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_names: string[]
          id?: string
          name: string
          stats: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_names?: string[]
          id?: string
          name?: string
          stats?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      parts: {
        Row: {
          id: string
          location: string | null
          managed: boolean | null
          name: string
          on_hand: number | null
          reorder_point: number | null
          salesforce_product_id: string | null
          serial_required: boolean | null
          sku: string
          uom: string | null
        }
        Insert: {
          id?: string
          location?: string | null
          managed?: boolean | null
          name: string
          on_hand?: number | null
          reorder_point?: number | null
          salesforce_product_id?: string | null
          serial_required?: boolean | null
          sku: string
          uom?: string | null
        }
        Update: {
          id?: string
          location?: string | null
          managed?: boolean | null
          name?: string
          on_hand?: number | null
          reorder_point?: number | null
          salesforce_product_id?: string | null
          serial_required?: boolean | null
          sku?: string
          uom?: string | null
        }
        Relationships: []
      }
      parts_usage: {
        Row: {
          id: string
          job_id: string | null
          notes: string | null
          part_id: string | null
          qty: number
          serials: string[] | null
          technician_id: string | null
          used_at: string | null
        }
        Insert: {
          id?: string
          job_id?: string | null
          notes?: string | null
          part_id?: string | null
          qty: number
          serials?: string[] | null
          technician_id?: string | null
          used_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string | null
          notes?: string | null
          part_id?: string | null
          qty?: number
          serials?: string[] | null
          technician_id?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_usage_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "parts_usage_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "parts_usage_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "parts_usage_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_usage_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "parts_usage_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "parts_usage_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "parts_usage_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "parts_usage_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_usage_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_usage_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_tech_capacity_daily"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          active: boolean
          created_at: string
          id: string
          label: string
          updated_at: string
          value: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          label: string
          updated_at?: string
          value: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          label?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      pending_technician_skills: {
        Row: {
          certified_date: string | null
          expires_at: string | null
          id: string
          level: number
          notes: string | null
          rejection_reason: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          skill_id: string
          status: string
          technician_id: string
        }
        Insert: {
          certified_date?: string | null
          expires_at?: string | null
          id?: string
          level: number
          notes?: string | null
          rejection_reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          skill_id: string
          status?: string
          technician_id: string
        }
        Update: {
          certified_date?: string | null
          expires_at?: string | null
          id?: string
          level?: number
          notes?: string | null
          rejection_reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          skill_id?: string
          status?: string
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_technician_skills_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "pending_technician_skills_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_technician_skills_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "pending_technician_skills_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "pending_technician_skills_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pending_technician_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_technician_skills_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "pending_technician_skills_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_technician_skills_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "pending_technician_skills_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "pending_technician_skills_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
        ]
      }
      people_counts_hourly: {
        Row: {
          camera_id: string
          count_in: number
          count_out: number
          hour_start: string
          store_id: string
        }
        Insert: {
          camera_id: string
          count_in: number
          count_out?: number
          hour_start: string
          store_id: string
        }
        Update: {
          camera_id?: string
          count_in?: number
          count_out?: number
          hour_start?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "people_counts_hourly_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "cameras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_counts_hourly_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_predictions: {
        Row: {
          actual_attempts: number | null
          actual_avg_score: number | null
          actual_pass_rate: number | null
          confidence_interval_lower: number | null
          confidence_interval_upper: number | null
          created_at: string | null
          id: string
          module_id: string
          predicted_attempts: number | null
          predicted_avg_score: number | null
          predicted_pass_rate: number | null
          prediction_date: string
        }
        Insert: {
          actual_attempts?: number | null
          actual_avg_score?: number | null
          actual_pass_rate?: number | null
          confidence_interval_lower?: number | null
          confidence_interval_upper?: number | null
          created_at?: string | null
          id?: string
          module_id: string
          predicted_attempts?: number | null
          predicted_avg_score?: number | null
          predicted_pass_rate?: number | null
          prediction_date: string
        }
        Update: {
          actual_attempts?: number | null
          actual_avg_score?: number | null
          actual_pass_rate?: number | null
          confidence_interval_lower?: number | null
          confidence_interval_upper?: number | null
          created_at?: string | null
          id?: string
          module_id?: string
          predicted_attempts?: number | null
          predicted_avg_score?: number | null
          predicted_pass_rate?: number | null
          prediction_date?: string
        }
        Relationships: []
      }
      permit_cron_log: {
        Row: {
          details: Json | null
          executed_at: string | null
          id: string
          job_name: string
          status: string | null
        }
        Insert: {
          details?: Json | null
          executed_at?: string | null
          id?: string
          job_name: string
          status?: string | null
        }
        Update: {
          details?: Json | null
          executed_at?: string | null
          id?: string
          job_name?: string
          status?: string | null
        }
        Relationships: []
      }
      permit_false_alarms: {
        Row: {
          alarm_date: string
          alarm_type: string | null
          appeal_notes: string | null
          appeal_status: string | null
          appealed: boolean | null
          created_at: string | null
          fine_amount: number | null
          fine_paid: boolean | null
          fine_paid_date: string | null
          id: string
          permit_id: string | null
          responding_agency: string | null
          response_notes: string | null
        }
        Insert: {
          alarm_date: string
          alarm_type?: string | null
          appeal_notes?: string | null
          appeal_status?: string | null
          appealed?: boolean | null
          created_at?: string | null
          fine_amount?: number | null
          fine_paid?: boolean | null
          fine_paid_date?: string | null
          id?: string
          permit_id?: string | null
          responding_agency?: string | null
          response_notes?: string | null
        }
        Update: {
          alarm_date?: string
          alarm_type?: string | null
          appeal_notes?: string | null
          appeal_status?: string | null
          appealed?: boolean | null
          created_at?: string | null
          fine_amount?: number | null
          fine_paid?: boolean | null
          fine_paid_date?: string | null
          id?: string
          permit_id?: string | null
          responding_agency?: string | null
          response_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permit_false_alarms_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "customer_permits"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_inspections: {
        Row: {
          corrective_actions: string | null
          created_at: string | null
          document_url: string | null
          findings: string | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          inspection_date: string
          inspection_type: string | null
          inspector_agency: string | null
          inspector_name: string | null
          permit_id: string | null
          result: string | null
        }
        Insert: {
          corrective_actions?: string | null
          created_at?: string | null
          document_url?: string | null
          findings?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          inspection_date: string
          inspection_type?: string | null
          inspector_agency?: string | null
          inspector_name?: string | null
          permit_id?: string | null
          result?: string | null
        }
        Update: {
          corrective_actions?: string | null
          created_at?: string | null
          document_url?: string | null
          findings?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          inspection_date?: string
          inspection_type?: string | null
          inspector_agency?: string | null
          inspector_name?: string | null
          permit_id?: string | null
          result?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permit_inspections_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "customer_permits"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_renewal_history: {
        Row: {
          created_at: string | null
          id: string
          new_expiration: string | null
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          permit_id: string | null
          previous_expiration: string | null
          processed_by: string | null
          receipt_number: string | null
          renewal_date: string
          renewal_fee_paid: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          new_expiration?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          permit_id?: string | null
          previous_expiration?: string | null
          processed_by?: string | null
          receipt_number?: string | null
          renewal_date: string
          renewal_fee_paid?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          new_expiration?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          permit_id?: string | null
          previous_expiration?: string | null
          processed_by?: string | null
          receipt_number?: string | null
          renewal_date?: string
          renewal_fee_paid?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "permit_renewal_history_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "customer_permits"
            referencedColumns: ["id"]
          },
        ]
      }
      product_choice_dependencies: {
        Row: {
          choice_option_id: string
          created_at: string | null
          id: string
          notes: string | null
          quantity_multiplier: number | null
          required_product_code: string
        }
        Insert: {
          choice_option_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          quantity_multiplier?: number | null
          required_product_code: string
        }
        Update: {
          choice_option_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          quantity_multiplier?: number | null
          required_product_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_choice_dependencies_choice_option_id_fkey"
            columns: ["choice_option_id"]
            isOneToOne: false
            referencedRelation: "product_choice_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_choice_dependencies_required_product_code_fkey"
            columns: ["required_product_code"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_code"]
          },
          {
            foreignKeyName: "product_choice_dependencies_required_product_code_fkey"
            columns: ["required_product_code"]
            isOneToOne: false
            referencedRelation: "v_popular_survey_equipment"
            referencedColumns: ["sku"]
          },
        ]
      }
      product_choice_groups: {
        Row: {
          choice_group_name: string
          created_at: string | null
          id: string
          is_required: boolean | null
          parent_product_code: string
        }
        Insert: {
          choice_group_name: string
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          parent_product_code: string
        }
        Update: {
          choice_group_name?: string
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          parent_product_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_choice_groups_parent_product_code_fkey"
            columns: ["parent_product_code"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_code"]
          },
          {
            foreignKeyName: "product_choice_groups_parent_product_code_fkey"
            columns: ["parent_product_code"]
            isOneToOne: false
            referencedRelation: "v_popular_survey_equipment"
            referencedColumns: ["sku"]
          },
        ]
      }
      product_choice_options: {
        Row: {
          choice_group_id: string
          created_at: string | null
          id: string
          is_default: boolean | null
          option_label: string
          option_product_code: string
          sort_order: number | null
        }
        Insert: {
          choice_group_id: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          option_label: string
          option_product_code: string
          sort_order?: number | null
        }
        Update: {
          choice_group_id?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          option_label?: string
          option_product_code?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_choice_options_choice_group_id_fkey"
            columns: ["choice_group_id"]
            isOneToOne: false
            referencedRelation: "product_choice_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_choice_options_option_product_code_fkey"
            columns: ["option_product_code"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_code"]
          },
          {
            foreignKeyName: "product_choice_options_option_product_code_fkey"
            columns: ["option_product_code"]
            isOneToOne: false
            referencedRelation: "v_popular_survey_equipment"
            referencedColumns: ["sku"]
          },
        ]
      }
      product_dependencies: {
        Row: {
          condition_rule: Json | null
          created_at: string | null
          dependency_type: string
          id: string
          notes: string | null
          parent_product_code: string
          quantity_multiplier: number | null
          required_product_code: string
          updated_at: string | null
        }
        Insert: {
          condition_rule?: Json | null
          created_at?: string | null
          dependency_type: string
          id?: string
          notes?: string | null
          parent_product_code: string
          quantity_multiplier?: number | null
          required_product_code: string
          updated_at?: string | null
        }
        Update: {
          condition_rule?: Json | null
          created_at?: string | null
          dependency_type?: string
          id?: string
          notes?: string | null
          parent_product_code?: string
          quantity_multiplier?: number | null
          required_product_code?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_dependencies_parent_product_code_fkey"
            columns: ["parent_product_code"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_code"]
          },
          {
            foreignKeyName: "product_dependencies_parent_product_code_fkey"
            columns: ["parent_product_code"]
            isOneToOne: false
            referencedRelation: "v_popular_survey_equipment"
            referencedColumns: ["sku"]
          },
          {
            foreignKeyName: "product_dependencies_required_product_code_fkey"
            columns: ["required_product_code"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_code"]
          },
          {
            foreignKeyName: "product_dependencies_required_product_code_fkey"
            columns: ["required_product_code"]
            isOneToOne: false
            referencedRelation: "v_popular_survey_equipment"
            referencedColumns: ["sku"]
          },
        ]
      }
      product_installation_fields: {
        Row: {
          created_at: string | null
          display_order: number | null
          field_label: string
          field_name: string
          field_type: string | null
          id: string
          is_required: boolean | null
          options: Json | null
          placeholder: string | null
          product_id: string | null
          updated_at: string | null
          validation_pattern: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          field_label: string
          field_name: string
          field_type?: string | null
          id?: string
          is_required?: boolean | null
          options?: Json | null
          placeholder?: string | null
          product_id?: string | null
          updated_at?: string | null
          validation_pattern?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          field_label?: string
          field_name?: string
          field_type?: string | null
          id?: string
          is_required?: boolean | null
          options?: Json | null
          placeholder?: string | null
          product_id?: string | null
          updated_at?: string | null
          validation_pattern?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_installation_fields_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_installation_fields_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_popular_survey_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      product_master_links: {
        Row: {
          created_at: string | null
          id: string
          master_product_id: string
          product_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          master_product_id: string
          product_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          master_product_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_master_links_master_product_id_fkey"
            columns: ["master_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_master_links_master_product_id_fkey"
            columns: ["master_product_id"]
            isOneToOne: false
            referencedRelation: "v_popular_survey_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_master_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_master_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_popular_survey_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          alternate_names: string[] | null
          available_birmingham_market: boolean | null
          available_mobile_market: boolean | null
          available_other_market: boolean | null
          available_victra_market: boolean | null
          barcode_ean: string | null
          barcode_qr: string | null
          barcode_upc: string | null
          cost_mrc: number | null
          cost_nrc: number | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          estimated_install_minutes: number | null
          form_schema: Json | null
          id: string
          installation_time_minutes: number | null
          is_active: boolean | null
          is_standalone: boolean
          labor_multiplier: number | null
          list_price_mrc: number | null
          list_price_nrc: number | null
          manufacturer: string | null
          manufacturer_sku: string | null
          master_product_id: string | null
          model_patterns: string[] | null
          notes: string | null
          product_category: string
          product_code: string
          product_name: string
          product_type: string
          required_fields: string[] | null
          required_photos: string[] | null
          requires_specialist: boolean | null
          retail_price_mrc: number | null
          retail_price_nrc: number | null
          salesforce_product_id: string | null
          search_keywords: string[] | null
          search_vector: unknown
          unit_price: number | null
          updated_at: string | null
          validation_rules: Json | null
        }
        Insert: {
          alternate_names?: string[] | null
          available_birmingham_market?: boolean | null
          available_mobile_market?: boolean | null
          available_other_market?: boolean | null
          available_victra_market?: boolean | null
          barcode_ean?: string | null
          barcode_qr?: string | null
          barcode_upc?: string | null
          cost_mrc?: number | null
          cost_nrc?: number | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          estimated_install_minutes?: number | null
          form_schema?: Json | null
          id?: string
          installation_time_minutes?: number | null
          is_active?: boolean | null
          is_standalone?: boolean
          labor_multiplier?: number | null
          list_price_mrc?: number | null
          list_price_nrc?: number | null
          manufacturer?: string | null
          manufacturer_sku?: string | null
          master_product_id?: string | null
          model_patterns?: string[] | null
          notes?: string | null
          product_category: string
          product_code: string
          product_name: string
          product_type: string
          required_fields?: string[] | null
          required_photos?: string[] | null
          requires_specialist?: boolean | null
          retail_price_mrc?: number | null
          retail_price_nrc?: number | null
          salesforce_product_id?: string | null
          search_keywords?: string[] | null
          search_vector?: unknown
          unit_price?: number | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Update: {
          alternate_names?: string[] | null
          available_birmingham_market?: boolean | null
          available_mobile_market?: boolean | null
          available_other_market?: boolean | null
          available_victra_market?: boolean | null
          barcode_ean?: string | null
          barcode_qr?: string | null
          barcode_upc?: string | null
          cost_mrc?: number | null
          cost_nrc?: number | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          estimated_install_minutes?: number | null
          form_schema?: Json | null
          id?: string
          installation_time_minutes?: number | null
          is_active?: boolean | null
          is_standalone?: boolean
          labor_multiplier?: number | null
          list_price_mrc?: number | null
          list_price_nrc?: number | null
          manufacturer?: string | null
          manufacturer_sku?: string | null
          master_product_id?: string | null
          model_patterns?: string[] | null
          notes?: string | null
          product_category?: string
          product_code?: string
          product_name?: string
          product_type?: string
          required_fields?: string[] | null
          required_photos?: string[] | null
          requires_specialist?: boolean | null
          retail_price_mrc?: number | null
          retail_price_nrc?: number | null
          salesforce_product_id?: string | null
          search_keywords?: string[] | null
          search_vector?: unknown
          unit_price?: number | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "products_master_product_id_fkey"
            columns: ["master_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_master_product_id_fkey"
            columns: ["master_product_id"]
            isOneToOne: false
            referencedRelation: "v_popular_survey_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean | null
          app_role: string | null
          approval_notes: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          department: string | null
          drivers_license_number: string | null
          drivers_license_state: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          employment_type: string | null
          full_name: string | null
          home_address: string | null
          home_base_zip: string | null
          hourly_rate: number | null
          id: string
          job_title: string | null
          license_expiration: string | null
          onboarding_complete: boolean | null
          phone: string | null
          photo_url: string | null
          region_id: string | null
          shirt_size: string | null
          start_date: string | null
          state: string | null
          supervisor: string | null
          timezone: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          active?: boolean | null
          app_role?: string | null
          approval_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          department?: string | null
          drivers_license_number?: string | null
          drivers_license_state?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employment_type?: string | null
          full_name?: string | null
          home_address?: string | null
          home_base_zip?: string | null
          hourly_rate?: number | null
          id: string
          job_title?: string | null
          license_expiration?: string | null
          onboarding_complete?: boolean | null
          phone?: string | null
          photo_url?: string | null
          region_id?: string | null
          shirt_size?: string | null
          start_date?: string | null
          state?: string | null
          supervisor?: string | null
          timezone?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          active?: boolean | null
          app_role?: string | null
          approval_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          department?: string | null
          drivers_license_number?: string | null
          drivers_license_state?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employment_type?: string | null
          full_name?: string | null
          home_address?: string | null
          home_base_zip?: string | null
          hourly_rate?: number | null
          id?: string
          job_title?: string | null
          license_expiration?: string | null
          onboarding_complete?: boolean | null
          phone?: string | null
          photo_url?: string | null
          region_id?: string | null
          shirt_size?: string | null
          start_date?: string | null
          state?: string | null
          supervisor?: string | null
          timezone?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: []
      }
      project_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          is_active: boolean | null
          project_id: string
          role: string | null
          unassigned_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          project_id: string
          role?: string | null
          unassigned_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          project_id?: string
          role?: string | null
          unassigned_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_device_requirements: {
        Row: {
          change_order_reference: string | null
          created_at: string | null
          description: string | null
          device_category: string
          device_type: string | null
          exceeded_at: string | null
          exceeded_by: string | null
          exceeded_reason: string | null
          id: string
          is_individual_tracking: boolean | null
          parent_category: string | null
          project_id: string
          quantity_installed: number
          quantity_required: number
          updated_at: string | null
        }
        Insert: {
          change_order_reference?: string | null
          created_at?: string | null
          description?: string | null
          device_category: string
          device_type?: string | null
          exceeded_at?: string | null
          exceeded_by?: string | null
          exceeded_reason?: string | null
          id?: string
          is_individual_tracking?: boolean | null
          parent_category?: string | null
          project_id: string
          quantity_installed?: number
          quantity_required?: number
          updated_at?: string | null
        }
        Update: {
          change_order_reference?: string | null
          created_at?: string | null
          description?: string | null
          device_category?: string
          device_type?: string | null
          exceeded_at?: string | null
          exceeded_by?: string | null
          exceeded_reason?: string | null
          id?: string
          is_individual_tracking?: boolean | null
          parent_category?: string | null
          project_id?: string
          quantity_installed?: number
          quantity_required?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_device_requirements_exceeded_by_fkey"
            columns: ["exceeded_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "project_device_requirements_exceeded_by_fkey"
            columns: ["exceeded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_device_requirements_exceeded_by_fkey"
            columns: ["exceeded_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "project_device_requirements_exceeded_by_fkey"
            columns: ["exceeded_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "project_device_requirements_exceeded_by_fkey"
            columns: ["exceeded_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_device_requirements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_device_requirements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_device_requirements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_device_requirements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_devices: {
        Row: {
          coverage_description: string | null
          created_at: string | null
          device_category: string | null
          device_identifier: string | null
          device_metadata: Json | null
          device_number: number | null
          device_type: string | null
          feasibility_status: string | null
          id: string
          installation_duration_hours: number | null
          installation_labor_cost: number | null
          installation_notes: string | null
          installed_at: string | null
          installed_by: string | null
          ip_address: unknown
          is_auto_generated: boolean | null
          is_installed: boolean | null
          location: string | null
          location_id: string | null
          location_number: string | null
          mac_address: unknown
          manufacturer: string | null
          model: string | null
          notes: string | null
          parent_device_id: string | null
          photo_urls: string[] | null
          photos_complete: boolean | null
          product_id: string | null
          project_id: string
          quantity: number | null
          requirement_id: string | null
          serial_number: string | null
          status: string | null
          survey_item_id: string | null
          survey_location: string | null
          survey_notes: string | null
          switch_location: string | null
          test_result: string | null
          tested_at: string | null
          tested_by: string | null
          updated_at: string | null
        }
        Insert: {
          coverage_description?: string | null
          created_at?: string | null
          device_category?: string | null
          device_identifier?: string | null
          device_metadata?: Json | null
          device_number?: number | null
          device_type?: string | null
          feasibility_status?: string | null
          id?: string
          installation_duration_hours?: number | null
          installation_labor_cost?: number | null
          installation_notes?: string | null
          installed_at?: string | null
          installed_by?: string | null
          ip_address?: unknown
          is_auto_generated?: boolean | null
          is_installed?: boolean | null
          location?: string | null
          location_id?: string | null
          location_number?: string | null
          mac_address?: unknown
          manufacturer?: string | null
          model?: string | null
          notes?: string | null
          parent_device_id?: string | null
          photo_urls?: string[] | null
          photos_complete?: boolean | null
          product_id?: string | null
          project_id: string
          quantity?: number | null
          requirement_id?: string | null
          serial_number?: string | null
          status?: string | null
          survey_item_id?: string | null
          survey_location?: string | null
          survey_notes?: string | null
          switch_location?: string | null
          test_result?: string | null
          tested_at?: string | null
          tested_by?: string | null
          updated_at?: string | null
        }
        Update: {
          coverage_description?: string | null
          created_at?: string | null
          device_category?: string | null
          device_identifier?: string | null
          device_metadata?: Json | null
          device_number?: number | null
          device_type?: string | null
          feasibility_status?: string | null
          id?: string
          installation_duration_hours?: number | null
          installation_labor_cost?: number | null
          installation_notes?: string | null
          installed_at?: string | null
          installed_by?: string | null
          ip_address?: unknown
          is_auto_generated?: boolean | null
          is_installed?: boolean | null
          location?: string | null
          location_id?: string | null
          location_number?: string | null
          mac_address?: unknown
          manufacturer?: string | null
          model?: string | null
          notes?: string | null
          parent_device_id?: string | null
          photo_urls?: string[] | null
          photos_complete?: boolean | null
          product_id?: string | null
          project_id?: string
          quantity?: number | null
          requirement_id?: string | null
          serial_number?: string | null
          status?: string | null
          survey_item_id?: string | null
          survey_location?: string | null
          survey_notes?: string | null
          switch_location?: string | null
          test_result?: string | null
          tested_at?: string | null
          tested_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_devices_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "project_devices_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_devices_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "project_devices_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "project_devices_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_devices_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "project_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_devices_parent_device_id_fkey"
            columns: ["parent_device_id"]
            isOneToOne: false
            referencedRelation: "project_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_devices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_devices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_popular_survey_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_devices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_devices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_devices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_devices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_devices_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "project_device_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_devices_survey_item_id_fkey"
            columns: ["survey_item_id"]
            isOneToOne: false
            referencedRelation: "site_survey_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_devices_tested_by_fkey"
            columns: ["tested_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "project_devices_tested_by_fkey"
            columns: ["tested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_devices_tested_by_fkey"
            columns: ["tested_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "project_devices_tested_by_fkey"
            columns: ["tested_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "project_devices_tested_by_fkey"
            columns: ["tested_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
        ]
      }
      project_expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          expense_date: string
          expense_type: string
          id: string
          job_id: string | null
          receipt_uploaded: boolean | null
          receipt_url: string | null
          special_project_id: string | null
          special_project_store_id: string | null
          status: string | null
          technician_id: string | null
          technician_name: string | null
          updated_at: string | null
          vendor: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expense_date: string
          expense_type: string
          id?: string
          job_id?: string | null
          receipt_uploaded?: boolean | null
          receipt_url?: string | null
          special_project_id?: string | null
          special_project_store_id?: string | null
          status?: string | null
          technician_id?: string | null
          technician_name?: string | null
          updated_at?: string | null
          vendor?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expense_date?: string
          expense_type?: string
          id?: string
          job_id?: string | null
          receipt_uploaded?: boolean | null
          receipt_url?: string | null
          special_project_id?: string | null
          special_project_store_id?: string | null
          status?: string | null
          technician_id?: string | null
          technician_name?: string | null
          updated_at?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "project_expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "project_expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "project_expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "project_expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "project_expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "project_expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "project_expenses_special_project_id_fkey"
            columns: ["special_project_id"]
            isOneToOne: false
            referencedRelation: "special_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_expenses_special_project_store_id_fkey"
            columns: ["special_project_store_id"]
            isOneToOne: false
            referencedRelation: "special_project_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_expenses_special_project_store_id_fkey"
            columns: ["special_project_store_id"]
            isOneToOne: false
            referencedRelation: "view_project_map_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_expenses_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "project_expenses_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_expenses_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "project_expenses_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "project_expenses_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
        ]
      }
      project_line_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          project_id: string
          quantity: number
          service_name: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          project_id: string
          quantity?: number
          service_name: string
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          project_id?: string
          quantity?: number
          service_name?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_line_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_line_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_line_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_line_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_locations: {
        Row: {
          building: string | null
          created_at: string
          created_by: string | null
          description: string | null
          floor: string | null
          id: string
          name: string
          project_id: string
          updated_at: string
        }
        Insert: {
          building?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          floor?: string | null
          id?: string
          name: string
          project_id: string
          updated_at?: string
        }
        Update: {
          building?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          floor?: string | null
          id?: string
          name?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_ocr_corrections: {
        Row: {
          confidence: number | null
          corrected_by: string | null
          corrected_value: string
          correction_type: string | null
          created_at: string | null
          device_category: string | null
          field_name: string
          id: string
          notes: string | null
          ocr_result_id: string | null
          ocr_value: string | null
          project_id: string
        }
        Insert: {
          confidence?: number | null
          corrected_by?: string | null
          corrected_value: string
          correction_type?: string | null
          created_at?: string | null
          device_category?: string | null
          field_name: string
          id?: string
          notes?: string | null
          ocr_result_id?: string | null
          ocr_value?: string | null
          project_id: string
        }
        Update: {
          confidence?: number | null
          corrected_by?: string | null
          corrected_value?: string
          correction_type?: string | null
          created_at?: string | null
          device_category?: string | null
          field_name?: string
          id?: string
          notes?: string | null
          ocr_result_id?: string | null
          ocr_value?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_ocr_corrections_ocr_result_id_fkey"
            columns: ["ocr_result_id"]
            isOneToOne: false
            referencedRelation: "ocr_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_ocr_corrections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_ocr_corrections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_ocr_corrections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_ocr_corrections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_return_trip_status: {
        Row: {
          checked_at: string | null
          checked_by: string | null
          checklist_item_id: string
          created_at: string | null
          id: string
          is_checked: boolean | null
          notes: string | null
          photo_url: string | null
          project_id: string
          updated_at: string | null
        }
        Insert: {
          checked_at?: string | null
          checked_by?: string | null
          checklist_item_id: string
          created_at?: string | null
          id?: string
          is_checked?: boolean | null
          notes?: string | null
          photo_url?: string | null
          project_id: string
          updated_at?: string | null
        }
        Update: {
          checked_at?: string | null
          checked_by?: string | null
          checklist_item_id?: string
          created_at?: string | null
          id?: string
          is_checked?: boolean | null
          notes?: string | null
          photo_url?: string | null
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_return_trip_status_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "project_return_trip_status_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_return_trip_status_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "project_return_trip_status_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "project_return_trip_status_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_return_trip_status_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "return_trip_checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_return_trip_status_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_return_trip_status_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_return_trip_status_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_return_trip_status_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_signatures: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          ip_address: string | null
          job_id: string | null
          latitude: number | null
          longitude: number | null
          project_id: string | null
          signature_data: string
          signature_type: string
          signed_at: string | null
          signer_email: string | null
          signer_name: string
          signer_title: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          ip_address?: string | null
          job_id?: string | null
          latitude?: number | null
          longitude?: number | null
          project_id?: string | null
          signature_data: string
          signature_type: string
          signed_at?: string | null
          signer_email?: string | null
          signer_name: string
          signer_title?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          ip_address?: string | null
          job_id?: string | null
          latitude?: number | null
          longitude?: number | null
          project_id?: string | null
          signature_data?: string
          signature_type?: string
          signed_at?: string | null
          signer_email?: string | null
          signer_name?: string
          signer_title?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_signatures_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "project_signatures_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "project_signatures_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "project_signatures_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_signatures_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "project_signatures_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "project_signatures_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "project_signatures_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "project_signatures_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_signatures_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_signatures_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_signatures_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_end_date: string | null
          actual_install_cost: number | null
          actual_start_date: string | null
          alarm_customer_id: number | null
          city: string | null
          client_contact_email: string | null
          client_contact_name: string | null
          client_contact_phone: string | null
          client_name: string | null
          completion_percentage: number | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contract_start_date: string | null
          contract_term_months: number | null
          created_at: string
          created_by: string | null
          description: string | null
          discount_percentage: number | null
          discounted_mrr: number | null
          end_date: string | null
          estimated_end_date: string | null
          estimated_install_cost: number | null
          estimated_start_date: string | null
          id: string
          installation_complete: boolean | null
          job_code: string | null
          job_id: string | null
          latitude: number | null
          longitude: number | null
          metadata: Json | null
          monthly_recurring_revenue: number | null
          name: string
          notes: string | null
          pm_user_id: string | null
          project_code: string | null
          project_manager: string | null
          sales_rep_id: string | null
          service_agreement_path: string | null
          service_agreement_uploaded_at: string | null
          service_agreement_uploaded_by: string | null
          signed_off_at: string | null
          signed_off_by: string | null
          site_address: string | null
          site_city: string | null
          site_state: string | null
          site_survey_id: string | null
          site_zip: string | null
          start_date: string | null
          state: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          technical_contact_name: string | null
          technical_contact_phone: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          actual_end_date?: string | null
          actual_install_cost?: number | null
          actual_start_date?: string | null
          alarm_customer_id?: number | null
          city?: string | null
          client_contact_email?: string | null
          client_contact_name?: string | null
          client_contact_phone?: string | null
          client_name?: string | null
          completion_percentage?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_start_date?: string | null
          contract_term_months?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_percentage?: number | null
          discounted_mrr?: number | null
          end_date?: string | null
          estimated_end_date?: string | null
          estimated_install_cost?: number | null
          estimated_start_date?: string | null
          id?: string
          installation_complete?: boolean | null
          job_code?: string | null
          job_id?: string | null
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          monthly_recurring_revenue?: number | null
          name: string
          notes?: string | null
          pm_user_id?: string | null
          project_code?: string | null
          project_manager?: string | null
          sales_rep_id?: string | null
          service_agreement_path?: string | null
          service_agreement_uploaded_at?: string | null
          service_agreement_uploaded_by?: string | null
          signed_off_at?: string | null
          signed_off_by?: string | null
          site_address?: string | null
          site_city?: string | null
          site_state?: string | null
          site_survey_id?: string | null
          site_zip?: string | null
          start_date?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          technical_contact_name?: string | null
          technical_contact_phone?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          actual_end_date?: string | null
          actual_install_cost?: number | null
          actual_start_date?: string | null
          alarm_customer_id?: number | null
          city?: string | null
          client_contact_email?: string | null
          client_contact_name?: string | null
          client_contact_phone?: string | null
          client_name?: string | null
          completion_percentage?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_start_date?: string | null
          contract_term_months?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_percentage?: number | null
          discounted_mrr?: number | null
          end_date?: string | null
          estimated_end_date?: string | null
          estimated_install_cost?: number | null
          estimated_start_date?: string | null
          id?: string
          installation_complete?: boolean | null
          job_code?: string | null
          job_id?: string | null
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          monthly_recurring_revenue?: number | null
          name?: string
          notes?: string | null
          pm_user_id?: string | null
          project_code?: string | null
          project_manager?: string | null
          sales_rep_id?: string | null
          service_agreement_path?: string | null
          service_agreement_uploaded_at?: string | null
          service_agreement_uploaded_by?: string | null
          signed_off_at?: string | null
          signed_off_by?: string | null
          site_address?: string | null
          site_city?: string | null
          site_state?: string | null
          site_survey_id?: string | null
          site_zip?: string | null
          start_date?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          technical_contact_name?: string | null
          technical_contact_phone?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "projects_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "projects_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "projects_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "projects_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "projects_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "projects_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "projects_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "projects_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "projects_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "projects_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "projects_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "projects_signed_off_by_fkey"
            columns: ["signed_off_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "projects_signed_off_by_fkey"
            columns: ["signed_off_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_signed_off_by_fkey"
            columns: ["signed_off_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "projects_signed_off_by_fkey"
            columns: ["signed_off_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "projects_signed_off_by_fkey"
            columns: ["signed_off_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "projects_site_survey_id_fkey"
            columns: ["site_survey_id"]
            isOneToOne: false
            referencedRelation: "site_surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_site_survey_id_fkey"
            columns: ["site_survey_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_matching_stats"
            referencedColumns: ["survey_id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          account_name: string | null
          address: string | null
          city: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          line_items: Json | null
          pdf_url: string | null
          po_number: string
          scheduled_date: string | null
          state: string | null
          survey_id: string | null
          technician_name: string | null
          total_amount: number | null
          version: number
          zip: string | null
        }
        Insert: {
          account_name?: string | null
          address?: string | null
          city?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          line_items?: Json | null
          pdf_url?: string | null
          po_number: string
          scheduled_date?: string | null
          state?: string | null
          survey_id?: string | null
          technician_name?: string | null
          total_amount?: number | null
          version?: number
          zip?: string | null
        }
        Update: {
          account_name?: string | null
          address?: string | null
          city?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          line_items?: Json | null
          pdf_url?: string | null
          po_number?: string
          scheduled_date?: string | null
          state?: string | null
          survey_id?: string | null
          technician_name?: string | null
          total_amount?: number | null
          version?: number
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "site_surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_matching_stats"
            referencedColumns: ["survey_id"]
          },
        ]
      }
      qc_notifications: {
        Row: {
          comment: string
          created_at: string | null
          flagged_by: string
          id: string
          photo_id: string
          read: boolean | null
          technician_id: string
        }
        Insert: {
          comment: string
          created_at?: string | null
          flagged_by: string
          id?: string
          photo_id: string
          read?: boolean | null
          technician_id: string
        }
        Update: {
          comment?: string
          created_at?: string | null
          flagged_by?: string
          id?: string
          photo_id?: string
          read?: boolean | null
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qc_notifications_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "field_installation_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qc_notifications_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photo_keywords_search"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          center_lat: number | null
          center_lng: number | null
          default_mileage_rate: number | null
          id: string
          name: string
          radius_km: number | null
          territory_code: string | null
        }
        Insert: {
          center_lat?: number | null
          center_lng?: number | null
          default_mileage_rate?: number | null
          id?: string
          name: string
          radius_km?: number | null
          territory_code?: string | null
        }
        Update: {
          center_lat?: number | null
          center_lng?: number | null
          default_mileage_rate?: number | null
          id?: string
          name?: string
          radius_km?: number | null
          territory_code?: string | null
        }
        Relationships: []
      }
      return_trip_checklist_items: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          display_order: number
          id: string
          is_active: boolean | null
          item_name: string
          requires_photo: boolean | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          display_order: number
          id?: string
          is_active?: boolean | null
          item_name: string
          requires_photo?: boolean | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          item_name?: string
          requires_photo?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      return_trip_checkouts: {
        Row: {
          alarm_customer_id: number | null
          arrival_time: string | null
          created_at: string | null
          created_by: string | null
          customer_signature_date: string | null
          customer_signature_url: string | null
          departure_time: string | null
          device_zone_name: string | null
          device_zone_number: number | null
          follow_up_notes: string | null
          follow_up_required: boolean | null
          id: string
          installation_items: string[] | null
          is_scheduled_service: boolean | null
          is_warranty_work: boolean | null
          labor_hours: number | null
          lead_technician_id: string | null
          materials_cost: number | null
          notes: string | null
          project_id: string | null
          project_manager: string | null
          project_manager_id: string | null
          return_reason: string
          service_ticket_id: string | null
          site_id: string | null
          status: string
          store_number: string | null
          team_member_ids: string[] | null
          technician_signature_date: string | null
          technician_signature_url: string | null
          ticket_age_days: number | null
          total_cost: number | null
          travel_time_hours: number | null
          trip_date: string
          trip_duration_minutes: number | null
          trouble_condition: string | null
          trouble_ticket_id: string | null
          updated_at: string | null
          work_completed: boolean | null
          work_performed: string[] | null
        }
        Insert: {
          alarm_customer_id?: number | null
          arrival_time?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_signature_date?: string | null
          customer_signature_url?: string | null
          departure_time?: string | null
          device_zone_name?: string | null
          device_zone_number?: number | null
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: string
          installation_items?: string[] | null
          is_scheduled_service?: boolean | null
          is_warranty_work?: boolean | null
          labor_hours?: number | null
          lead_technician_id?: string | null
          materials_cost?: number | null
          notes?: string | null
          project_id?: string | null
          project_manager?: string | null
          project_manager_id?: string | null
          return_reason: string
          service_ticket_id?: string | null
          site_id?: string | null
          status?: string
          store_number?: string | null
          team_member_ids?: string[] | null
          technician_signature_date?: string | null
          technician_signature_url?: string | null
          ticket_age_days?: number | null
          total_cost?: number | null
          travel_time_hours?: number | null
          trip_date: string
          trip_duration_minutes?: number | null
          trouble_condition?: string | null
          trouble_ticket_id?: string | null
          updated_at?: string | null
          work_completed?: boolean | null
          work_performed?: string[] | null
        }
        Update: {
          alarm_customer_id?: number | null
          arrival_time?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_signature_date?: string | null
          customer_signature_url?: string | null
          departure_time?: string | null
          device_zone_name?: string | null
          device_zone_number?: number | null
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: string
          installation_items?: string[] | null
          is_scheduled_service?: boolean | null
          is_warranty_work?: boolean | null
          labor_hours?: number | null
          lead_technician_id?: string | null
          materials_cost?: number | null
          notes?: string | null
          project_id?: string | null
          project_manager?: string | null
          project_manager_id?: string | null
          return_reason?: string
          service_ticket_id?: string | null
          site_id?: string | null
          status?: string
          store_number?: string | null
          team_member_ids?: string[] | null
          technician_signature_date?: string | null
          technician_signature_url?: string | null
          ticket_age_days?: number | null
          total_cost?: number | null
          travel_time_hours?: number | null
          trip_date?: string
          trip_duration_minutes?: number | null
          trouble_condition?: string | null
          trouble_ticket_id?: string | null
          updated_at?: string | null
          work_completed?: boolean | null
          work_performed?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "return_trip_checkouts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "return_trip_checkouts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_trip_checkouts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "return_trip_checkouts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "return_trip_checkouts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "return_trip_checkouts_lead_technician_id_fkey"
            columns: ["lead_technician_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "return_trip_checkouts_lead_technician_id_fkey"
            columns: ["lead_technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_trip_checkouts_lead_technician_id_fkey"
            columns: ["lead_technician_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "return_trip_checkouts_lead_technician_id_fkey"
            columns: ["lead_technician_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "return_trip_checkouts_lead_technician_id_fkey"
            columns: ["lead_technician_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "return_trip_checkouts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "return_trip_checkouts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "return_trip_checkouts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_trip_checkouts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_trip_checkouts_project_manager_id_fkey"
            columns: ["project_manager_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "return_trip_checkouts_project_manager_id_fkey"
            columns: ["project_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_trip_checkouts_project_manager_id_fkey"
            columns: ["project_manager_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "return_trip_checkouts_project_manager_id_fkey"
            columns: ["project_manager_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "return_trip_checkouts_project_manager_id_fkey"
            columns: ["project_manager_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "return_trip_checkouts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      return_trip_equipment: {
        Row: {
          action: string
          checkout_id: string
          created_at: string | null
          equipment_name: string
          id: string
          notes: string | null
          product_id: string | null
          quantity: number
          serial_number: string | null
        }
        Insert: {
          action: string
          checkout_id: string
          created_at?: string | null
          equipment_name: string
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          serial_number?: string | null
        }
        Update: {
          action?: string
          checkout_id?: string
          created_at?: string | null
          equipment_name?: string
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          serial_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "return_trip_equipment_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "return_trip_checkouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_trip_equipment_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_trip_equipment_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_popular_survey_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      return_trip_issues: {
        Row: {
          checkout_id: string
          created_at: string | null
          description: string
          id: string
          photo_ids: string[] | null
          resolution_notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          updated_at: string | null
        }
        Insert: {
          checkout_id: string
          created_at?: string | null
          description: string
          id?: string
          photo_ids?: string[] | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          updated_at?: string | null
        }
        Update: {
          checkout_id?: string
          created_at?: string | null
          description?: string
          id?: string
          photo_ids?: string[] | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "return_trip_issues_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "return_trip_checkouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_trip_issues_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "return_trip_issues_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_trip_issues_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "return_trip_issues_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "return_trip_issues_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
        ]
      }
      return_trip_materials: {
        Row: {
          checkout_id: string
          created_at: string | null
          id: string
          material_name: string
          product_id: string | null
          quantity: number
          sku: string | null
          total_cost: number | null
          unit_cost: number | null
        }
        Insert: {
          checkout_id: string
          created_at?: string | null
          id?: string
          material_name: string
          product_id?: string | null
          quantity?: number
          sku?: string | null
          total_cost?: number | null
          unit_cost?: number | null
        }
        Update: {
          checkout_id?: string
          created_at?: string | null
          id?: string
          material_name?: string
          product_id?: string | null
          quantity?: number
          sku?: string | null
          total_cost?: number | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "return_trip_materials_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "return_trip_checkouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_trip_materials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_trip_materials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_popular_survey_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      return_trip_photos: {
        Row: {
          captured_at: string | null
          category: string
          checkout_id: string
          created_at: string | null
          description: string | null
          id: string
          latitude: number | null
          longitude: number | null
          storage_path: string
          thumbnail_path: string | null
          uploaded_by: string | null
        }
        Insert: {
          captured_at?: string | null
          category: string
          checkout_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          storage_path: string
          thumbnail_path?: string | null
          uploaded_by?: string | null
        }
        Update: {
          captured_at?: string | null
          category?: string
          checkout_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          storage_path?: string
          thumbnail_path?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "return_trip_photos_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "return_trip_checkouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_trip_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "return_trip_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_trip_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "return_trip_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "return_trip_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
        ]
      }
      roadmap_phases: {
        Row: {
          completion_percentage: number | null
          created_at: string | null
          goal: string | null
          id: string
          phase_name: string
          phase_number: number
          sort_order: number
          status: string
          timeline: string | null
          updated_at: string | null
        }
        Insert: {
          completion_percentage?: number | null
          created_at?: string | null
          goal?: string | null
          id?: string
          phase_name: string
          phase_number: number
          sort_order: number
          status: string
          timeline?: string | null
          updated_at?: string | null
        }
        Update: {
          completion_percentage?: number | null
          created_at?: string | null
          goal?: string | null
          id?: string
          phase_name?: string
          phase_number?: number
          sort_order?: number
          status?: string
          timeline?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      roadmap_tasks: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          phase_id: string
          route: string | null
          sort_order: number
          task_description: string | null
          task_name: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          phase_id: string
          route?: string | null
          sort_order: number
          task_description?: string | null
          task_name: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          phase_id?: string
          route?: string | null
          sort_order?: number
          task_description?: string | null
          task_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_tasks_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "roadmap_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          module_id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          module_id: string
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          module_id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      route_opt_distance_cache: {
        Row: {
          calculated_at: string | null
          distance_miles: number | null
          drive_time_hours: number | null
          from_city: string
          from_lat: number | null
          from_lng: number | null
          from_state: string
          id: string
          to_city: string
          to_lat: number | null
          to_lng: number | null
          to_state: string
        }
        Insert: {
          calculated_at?: string | null
          distance_miles?: number | null
          drive_time_hours?: number | null
          from_city: string
          from_lat?: number | null
          from_lng?: number | null
          from_state: string
          id?: string
          to_city: string
          to_lat?: number | null
          to_lng?: number | null
          to_state: string
        }
        Update: {
          calculated_at?: string | null
          distance_miles?: number | null
          drive_time_hours?: number | null
          from_city?: string
          from_lat?: number | null
          from_lng?: number | null
          from_state?: string
          id?: string
          to_city?: string
          to_lat?: number | null
          to_lng?: number | null
          to_state?: string
        }
        Relationships: []
      }
      route_opt_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          log_level: string | null
          message: string
          project_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          log_level?: string | null
          message: string
          project_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          log_level?: string | null
          message?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "route_opt_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "route_opt_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      route_opt_project_techs: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          start_city: string
          start_date: string | null
          start_state: string
          tech_name: string | null
          tech_number: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          start_city: string
          start_date?: string | null
          start_state: string
          tech_name?: string | null
          tech_number: number
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          start_city?: string
          start_date?: string | null
          start_state?: string
          tech_name?: string | null
          tech_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "route_opt_project_techs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "route_opt_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      route_opt_projects: {
        Row: {
          created_at: string | null
          created_by: string | null
          daily_hours_limit: number | null
          description: string | null
          id: string
          name: string
          start_date: string | null
          status: string | null
          tech1_start_city: string | null
          tech1_start_state: string | null
          tech2_start_city: string | null
          tech2_start_state: string | null
          total_stores: number | null
          updated_at: string | null
          weeks_off: number | null
          weeks_on: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          daily_hours_limit?: number | null
          description?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string | null
          tech1_start_city?: string | null
          tech1_start_state?: string | null
          tech2_start_city?: string | null
          tech2_start_state?: string | null
          total_stores?: number | null
          updated_at?: string | null
          weeks_off?: number | null
          weeks_on?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          daily_hours_limit?: number | null
          description?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string | null
          tech1_start_city?: string | null
          tech1_start_state?: string | null
          tech2_start_city?: string | null
          tech2_start_state?: string | null
          total_stores?: number | null
          updated_at?: string | null
          weeks_off?: number | null
          weeks_on?: number | null
        }
        Relationships: []
      }
      route_opt_routes: {
        Row: {
          created_at: string | null
          cumulative_daily_hours: number | null
          day_of_week: string
          drive_distance_miles: number | null
          drive_time_hours: number | null
          id: string
          is_end_of_day: boolean | null
          onsite_hours: number | null
          previous_location_city: string | null
          previous_location_state: string | null
          project_id: string | null
          project_types_this_stop: string | null
          scheduled_date: string
          sequence_number: number
          store_city: string | null
          store_id: string | null
          store_state: string | null
          tech_id: number
        }
        Insert: {
          created_at?: string | null
          cumulative_daily_hours?: number | null
          day_of_week: string
          drive_distance_miles?: number | null
          drive_time_hours?: number | null
          id?: string
          is_end_of_day?: boolean | null
          onsite_hours?: number | null
          previous_location_city?: string | null
          previous_location_state?: string | null
          project_id?: string | null
          project_types_this_stop?: string | null
          scheduled_date: string
          sequence_number: number
          store_city?: string | null
          store_id?: string | null
          store_state?: string | null
          tech_id: number
        }
        Update: {
          created_at?: string | null
          cumulative_daily_hours?: number | null
          day_of_week?: string
          drive_distance_miles?: number | null
          drive_time_hours?: number | null
          id?: string
          is_end_of_day?: boolean | null
          onsite_hours?: number | null
          previous_location_city?: string | null
          previous_location_state?: string | null
          project_id?: string | null
          project_types_this_stop?: string | null
          scheduled_date?: string
          sequence_number?: number
          store_city?: string | null
          store_id?: string | null
          store_state?: string | null
          tech_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "route_opt_routes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "route_opt_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_opt_routes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "route_opt_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      route_opt_stores: {
        Row: {
          access_control_hours: number | null
          access_control_in_use: string | null
          assigned_tech: number | null
          city: string | null
          comment: string | null
          created_at: string | null
          data_sources: string | null
          full_address: string | null
          gate_work_hours: number | null
          geocoded: boolean | null
          id: string
          is_mall_location: boolean | null
          key_required: string | null
          latitude: number | null
          longitude: number | null
          mall_chime_cost: number | null
          number_of_projects: number | null
          project_id: string | null
          project_types: string | null
          roll_up_gate_cost: number | null
          scissor_gate_cost: number | null
          sensor_hours: number | null
          state: string
          store_id: string
          store_name: string
          store_status: string | null
          total_onsite_hours: number | null
          total_project_cost: number | null
          training_door_cost: number | null
          type_of_gate: string | null
          updated_at: string | null
          visit_sequence: number | null
          zip_code: string | null
        }
        Insert: {
          access_control_hours?: number | null
          access_control_in_use?: string | null
          assigned_tech?: number | null
          city?: string | null
          comment?: string | null
          created_at?: string | null
          data_sources?: string | null
          full_address?: string | null
          gate_work_hours?: number | null
          geocoded?: boolean | null
          id?: string
          is_mall_location?: boolean | null
          key_required?: string | null
          latitude?: number | null
          longitude?: number | null
          mall_chime_cost?: number | null
          number_of_projects?: number | null
          project_id?: string | null
          project_types?: string | null
          roll_up_gate_cost?: number | null
          scissor_gate_cost?: number | null
          sensor_hours?: number | null
          state: string
          store_id: string
          store_name: string
          store_status?: string | null
          total_onsite_hours?: number | null
          total_project_cost?: number | null
          training_door_cost?: number | null
          type_of_gate?: string | null
          updated_at?: string | null
          visit_sequence?: number | null
          zip_code?: string | null
        }
        Update: {
          access_control_hours?: number | null
          access_control_in_use?: string | null
          assigned_tech?: number | null
          city?: string | null
          comment?: string | null
          created_at?: string | null
          data_sources?: string | null
          full_address?: string | null
          gate_work_hours?: number | null
          geocoded?: boolean | null
          id?: string
          is_mall_location?: boolean | null
          key_required?: string | null
          latitude?: number | null
          longitude?: number | null
          mall_chime_cost?: number | null
          number_of_projects?: number | null
          project_id?: string | null
          project_types?: string | null
          roll_up_gate_cost?: number | null
          scissor_gate_cost?: number | null
          sensor_hours?: number | null
          state?: string
          store_id?: string
          store_name?: string
          store_status?: string | null
          total_onsite_hours?: number | null
          total_project_cost?: number | null
          training_door_cost?: number | null
          type_of_gate?: string | null
          updated_at?: string | null
          visit_sequence?: number | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "route_opt_stores_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "route_opt_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      route_opt_tech_summaries: {
        Row: {
          created_at: string | null
          ending_city: string | null
          ending_state: string | null
          first_work_date: string | null
          id: string
          last_work_date: string | null
          off_weeks_used: number | null
          project_id: string | null
          starting_city: string | null
          starting_state: string | null
          tech_id: number
          total_calendar_days: number | null
          total_drive_hours: number | null
          total_drive_miles: number | null
          total_installation_hours: number | null
          total_stores: number | null
          total_workdays: number | null
          work_weeks_used: number | null
        }
        Insert: {
          created_at?: string | null
          ending_city?: string | null
          ending_state?: string | null
          first_work_date?: string | null
          id?: string
          last_work_date?: string | null
          off_weeks_used?: number | null
          project_id?: string | null
          starting_city?: string | null
          starting_state?: string | null
          tech_id: number
          total_calendar_days?: number | null
          total_drive_hours?: number | null
          total_drive_miles?: number | null
          total_installation_hours?: number | null
          total_stores?: number | null
          total_workdays?: number | null
          work_weeks_used?: number | null
        }
        Update: {
          created_at?: string | null
          ending_city?: string | null
          ending_state?: string | null
          first_work_date?: string | null
          id?: string
          last_work_date?: string | null
          off_weeks_used?: number | null
          project_id?: string | null
          starting_city?: string | null
          starting_state?: string | null
          tech_id?: number
          total_calendar_days?: number | null
          total_drive_hours?: number | null
          total_drive_miles?: number | null
          total_installation_hours?: number | null
          total_stores?: number | null
          total_workdays?: number | null
          work_weeks_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "route_opt_tech_summaries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "route_opt_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          created_at: string | null
          id: string
          metrics: Json | null
          service_date: string
          stops: Json | null
          technician_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metrics?: Json | null
          service_date: string
          stops?: Json | null
          technician_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metrics?: Json | null
          service_date?: string
          stops?: Json | null
          technician_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_tech_capacity_daily"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      salesforce_equipment: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          item_name: string | null
          job_id: string | null
          product_code: string | null
          quantity: number | null
          salesforce_id: string | null
          total_price: number | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          item_name?: string | null
          job_id?: string | null
          product_code?: string | null
          quantity?: number | null
          salesforce_id?: string | null
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          item_name?: string | null
          job_id?: string | null
          product_code?: string | null
          quantity?: number | null
          salesforce_id?: string | null
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salesforce_equipment_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "salesforce_equipment_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "salesforce_equipment_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "salesforce_equipment_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salesforce_equipment_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "salesforce_equipment_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "salesforce_equipment_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "salesforce_equipment_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
        ]
      }
      salesforce_sync_queue: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          error_message: string | null
          id: string
          max_retries: number | null
          payload: Json
          priority: number | null
          processed_at: string | null
          retry_count: number | null
          salesforce_id: string | null
          scheduled_for: string | null
          status: string | null
          sync_action: string
          sync_direction: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          error_message?: string | null
          id?: string
          max_retries?: number | null
          payload: Json
          priority?: number | null
          processed_at?: string | null
          retry_count?: number | null
          salesforce_id?: string | null
          scheduled_for?: string | null
          status?: string | null
          sync_action: string
          sync_direction: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          id?: string
          max_retries?: number | null
          payload?: Json
          priority?: number | null
          processed_at?: string | null
          retry_count?: number | null
          salesforce_id?: string | null
          scheduled_for?: string | null
          status?: string | null
          sync_action?: string
          sync_direction?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      salesforce_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string | null
          id: string
          instance_url: string
          refresh_token: string | null
          token_type: string | null
          updated_at: string | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          instance_url: string
          refresh_token?: string | null
          token_type?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          instance_url?: string
          refresh_token?: string | null
          token_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      schedule_change_logs: {
        Row: {
          change_type: string
          created_at: string | null
          id: string
          jobs_affected: Json | null
          performed_by: string | null
          project_filter: string | null
          reason: string | null
          shift_days: number | null
          skip_weekends: boolean | null
          technician_id: string | null
        }
        Insert: {
          change_type: string
          created_at?: string | null
          id?: string
          jobs_affected?: Json | null
          performed_by?: string | null
          project_filter?: string | null
          reason?: string | null
          shift_days?: number | null
          skip_weekends?: boolean | null
          technician_id?: string | null
        }
        Update: {
          change_type?: string
          created_at?: string | null
          id?: string
          jobs_affected?: Json | null
          performed_by?: string | null
          project_filter?: string | null
          reason?: string | null
          shift_days?: number | null
          skip_weekends?: boolean | null
          technician_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_change_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "schedule_change_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_change_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "schedule_change_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "schedule_change_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "schedule_change_logs_project_filter_fkey"
            columns: ["project_filter"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "schedule_change_logs_project_filter_fkey"
            columns: ["project_filter"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "schedule_change_logs_project_filter_fkey"
            columns: ["project_filter"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_change_logs_project_filter_fkey"
            columns: ["project_filter"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_change_logs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "schedule_change_logs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_change_logs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "schedule_change_logs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "schedule_change_logs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
        ]
      }
      scheduled_reports_log: {
        Row: {
          error_message: string | null
          id: string
          module_id: string
          preference_id: string | null
          recipients: string[]
          report_data: Json | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          error_message?: string | null
          id?: string
          module_id: string
          preference_id?: string | null
          recipients: string[]
          report_data?: Json | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          error_message?: string | null
          id?: string
          module_id?: string
          preference_id?: string | null
          recipients?: string[]
          report_data?: Json | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reports_log_preference_id_fkey"
            columns: ["preference_id"]
            isOneToOne: false
            referencedRelation: "notification_preferences"
            referencedColumns: ["id"]
          },
        ]
      }
      service_plans: {
        Row: {
          addons: Json | null
          created_at: string | null
          customer_id: number | null
          id: number
          package_description: string | null
          package_id: number | null
          plan_type: number | null
          total_service_price: number | null
          updated_at: string | null
        }
        Insert: {
          addons?: Json | null
          created_at?: string | null
          customer_id?: number | null
          id?: number
          package_description?: string | null
          package_id?: number | null
          plan_type?: number | null
          total_service_price?: number | null
          updated_at?: string | null
        }
        Update: {
          addons?: Json | null
          created_at?: string | null
          customer_id?: number | null
          id?: number
          package_description?: string | null
          package_id?: number | null
          plan_type?: number | null
          total_service_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_plans_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_plans_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_plans_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      sf_accounts: {
        Row: {
          annual_revenue: number | null
          billing_city: string | null
          billing_country: string | null
          billing_state: string | null
          created_at: string | null
          created_date: string | null
          description: string | null
          health_score: number | null
          id: string
          industry: string | null
          last_activity_date: string | null
          last_sync_at: string | null
          name: string
          number_of_employees: number | null
          owner_name: string | null
          phone: string | null
          region: string | null
          risk_level: string | null
          salesforce_id: string
          tier: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          annual_revenue?: number | null
          billing_city?: string | null
          billing_country?: string | null
          billing_state?: string | null
          created_at?: string | null
          created_date?: string | null
          description?: string | null
          health_score?: number | null
          id?: string
          industry?: string | null
          last_activity_date?: string | null
          last_sync_at?: string | null
          name: string
          number_of_employees?: number | null
          owner_name?: string | null
          phone?: string | null
          region?: string | null
          risk_level?: string | null
          salesforce_id: string
          tier?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          annual_revenue?: number | null
          billing_city?: string | null
          billing_country?: string | null
          billing_state?: string | null
          created_at?: string | null
          created_date?: string | null
          description?: string | null
          health_score?: number | null
          id?: string
          industry?: string | null
          last_activity_date?: string | null
          last_sync_at?: string | null
          name?: string
          number_of_employees?: number | null
          owner_name?: string | null
          phone?: string | null
          region?: string | null
          risk_level?: string | null
          salesforce_id?: string
          tier?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      sf_activities: {
        Row: {
          account_id: string | null
          activity_date: string | null
          activity_type: string | null
          created_at: string | null
          created_date: string | null
          description: string | null
          due_date: string | null
          id: string
          last_modified_date: string | null
          last_sync_at: string | null
          owner_name: string | null
          priority: string | null
          salesforce_id: string
          sf_account_id: string | null
          status: string | null
          subject: string | null
          updated_at: string | null
          what_id: string | null
          who_id: string | null
        }
        Insert: {
          account_id?: string | null
          activity_date?: string | null
          activity_type?: string | null
          created_at?: string | null
          created_date?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          last_modified_date?: string | null
          last_sync_at?: string | null
          owner_name?: string | null
          priority?: string | null
          salesforce_id: string
          sf_account_id?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
          what_id?: string | null
          who_id?: string | null
        }
        Update: {
          account_id?: string | null
          activity_date?: string | null
          activity_type?: string | null
          created_at?: string | null
          created_date?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          last_modified_date?: string | null
          last_sync_at?: string | null
          owner_name?: string | null
          priority?: string | null
          salesforce_id?: string
          sf_account_id?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
          what_id?: string | null
          who_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sf_activities_sf_account_id_fkey"
            columns: ["sf_account_id"]
            isOneToOne: false
            referencedRelation: "sf_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      sf_cases: {
        Row: {
          account_id: string | null
          case_number: string | null
          closed_date: string | null
          contact_id: string | null
          created_at: string | null
          created_date: string | null
          description: string | null
          id: string
          last_modified_date: string | null
          last_sync_at: string | null
          origin: string | null
          owner_name: string | null
          priority: string | null
          reason: string | null
          salesforce_id: string
          sf_account_id: string | null
          status: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          case_number?: string | null
          closed_date?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_date?: string | null
          description?: string | null
          id?: string
          last_modified_date?: string | null
          last_sync_at?: string | null
          origin?: string | null
          owner_name?: string | null
          priority?: string | null
          reason?: string | null
          salesforce_id: string
          sf_account_id?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          case_number?: string | null
          closed_date?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_date?: string | null
          description?: string | null
          id?: string
          last_modified_date?: string | null
          last_sync_at?: string | null
          origin?: string | null
          owner_name?: string | null
          priority?: string | null
          reason?: string | null
          salesforce_id?: string
          sf_account_id?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sf_cases_sf_account_id_fkey"
            columns: ["sf_account_id"]
            isOneToOne: false
            referencedRelation: "sf_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      sf_contracts: {
        Row: {
          account_id: string | null
          annual_contract_value: number | null
          auto_renewal: boolean | null
          contract_number: string | null
          contract_term: number | null
          created_at: string | null
          created_date: string | null
          end_date: string | null
          id: string
          last_modified_date: string | null
          last_sync_at: string | null
          monthly_recurring_revenue: number | null
          renewal_date: string | null
          salesforce_id: string
          sf_account_id: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          annual_contract_value?: number | null
          auto_renewal?: boolean | null
          contract_number?: string | null
          contract_term?: number | null
          created_at?: string | null
          created_date?: string | null
          end_date?: string | null
          id?: string
          last_modified_date?: string | null
          last_sync_at?: string | null
          monthly_recurring_revenue?: number | null
          renewal_date?: string | null
          salesforce_id: string
          sf_account_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          annual_contract_value?: number | null
          auto_renewal?: boolean | null
          contract_number?: string | null
          contract_term?: number | null
          created_at?: string | null
          created_date?: string | null
          end_date?: string | null
          id?: string
          last_modified_date?: string | null
          last_sync_at?: string | null
          monthly_recurring_revenue?: number | null
          renewal_date?: string | null
          salesforce_id?: string
          sf_account_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sf_contracts_sf_account_id_fkey"
            columns: ["sf_account_id"]
            isOneToOne: false
            referencedRelation: "sf_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      sf_opportunities: {
        Row: {
          account_id: string | null
          amount: number | null
          close_date: string | null
          created_at: string | null
          created_date: string | null
          description: string | null
          id: string
          last_modified_date: string | null
          last_sync_at: string | null
          lead_source: string | null
          name: string
          opportunity_type: string | null
          probability: number | null
          salesforce_id: string
          sf_account_id: string | null
          stage_name: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          amount?: number | null
          close_date?: string | null
          created_at?: string | null
          created_date?: string | null
          description?: string | null
          id?: string
          last_modified_date?: string | null
          last_sync_at?: string | null
          lead_source?: string | null
          name: string
          opportunity_type?: string | null
          probability?: number | null
          salesforce_id: string
          sf_account_id?: string | null
          stage_name?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number | null
          close_date?: string | null
          created_at?: string | null
          created_date?: string | null
          description?: string | null
          id?: string
          last_modified_date?: string | null
          last_sync_at?: string | null
          lead_source?: string | null
          name?: string
          opportunity_type?: string | null
          probability?: number | null
          salesforce_id?: string
          sf_account_id?: string | null
          stage_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sf_opportunities_sf_account_id_fkey"
            columns: ["sf_account_id"]
            isOneToOne: false
            referencedRelation: "sf_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      sf_opportunity_products: {
        Row: {
          created_at: string | null
          created_date: string | null
          id: string
          last_modified_date: string | null
          last_sync_at: string | null
          opportunity_id: string | null
          product_id: string | null
          quantity: number | null
          salesforce_id: string
          sf_opportunity_id: string | null
          sf_product_id: string | null
          total_price: number | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_date?: string | null
          id?: string
          last_modified_date?: string | null
          last_sync_at?: string | null
          opportunity_id?: string | null
          product_id?: string | null
          quantity?: number | null
          salesforce_id: string
          sf_opportunity_id?: string | null
          sf_product_id?: string | null
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_date?: string | null
          id?: string
          last_modified_date?: string | null
          last_sync_at?: string | null
          opportunity_id?: string | null
          product_id?: string | null
          quantity?: number | null
          salesforce_id?: string
          sf_opportunity_id?: string | null
          sf_product_id?: string | null
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sf_opportunity_products_sf_opportunity_id_fkey"
            columns: ["sf_opportunity_id"]
            isOneToOne: false
            referencedRelation: "sf_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sf_opportunity_products_sf_product_id_fkey"
            columns: ["sf_product_id"]
            isOneToOne: false
            referencedRelation: "sf_products"
            referencedColumns: ["id"]
          },
        ]
      }
      sf_products: {
        Row: {
          created_at: string | null
          created_date: string | null
          description: string | null
          family: string | null
          id: string
          is_active: boolean | null
          last_modified_date: string | null
          last_sync_at: string | null
          name: string
          product_code: string | null
          salesforce_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_date?: string | null
          description?: string | null
          family?: string | null
          id?: string
          is_active?: boolean | null
          last_modified_date?: string | null
          last_sync_at?: string | null
          name: string
          product_code?: string | null
          salesforce_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_date?: string | null
          description?: string | null
          family?: string | null
          id?: string
          is_active?: boolean | null
          last_modified_date?: string | null
          last_sync_at?: string | null
          name?: string
          product_code?: string | null
          salesforce_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sf_sync_status: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          last_sync_at: string | null
          object_type: string
          records_synced: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          object_type: string
          records_synced?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          object_type?: string
          records_synced?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      shifts: {
        Row: {
          days_of_week: number[]
          end_local: string
          id: string
          name: string
          start_local: string
          timezone: string
        }
        Insert: {
          days_of_week: number[]
          end_local: string
          id?: string
          name: string
          start_local: string
          timezone: string
        }
        Update: {
          days_of_week?: number[]
          end_local?: string
          id?: string
          name?: string
          start_local?: string
          timezone?: string
        }
        Relationships: []
      }
      signoffs: {
        Row: {
          checklist_run_id: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          location_id: string | null
          notes: string | null
          project_id: string
          signature_media_id: string | null
          signed_at: string | null
          signed_by_company: string | null
          signed_by_name: string
          signed_by_title: string | null
          signed_by_user_id: string | null
          signoff_type: Database["public"]["Enums"]["signoff_type"]
        }
        Insert: {
          checklist_run_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          location_id?: string | null
          notes?: string | null
          project_id: string
          signature_media_id?: string | null
          signed_at?: string | null
          signed_by_company?: string | null
          signed_by_name: string
          signed_by_title?: string | null
          signed_by_user_id?: string | null
          signoff_type: Database["public"]["Enums"]["signoff_type"]
        }
        Update: {
          checklist_run_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          location_id?: string | null
          notes?: string | null
          project_id?: string
          signature_media_id?: string | null
          signed_at?: string | null
          signed_by_company?: string | null
          signed_by_name?: string
          signed_by_title?: string | null
          signed_by_user_id?: string | null
          signoff_type?: Database["public"]["Enums"]["signoff_type"]
        }
        Relationships: [
          {
            foreignKeyName: "signoffs_checklist_run_id_fkey"
            columns: ["checklist_run_id"]
            isOneToOne: false
            referencedRelation: "checklist_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signoffs_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signoffs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "signoffs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "signoffs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signoffs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signoffs_signature_media_id_fkey"
            columns: ["signature_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      site_assets: {
        Row: {
          customer_id: number | null
          id: string
          install_date: string | null
          location_id: string | null
          salesforce_asset_id: string | null
          serial_number: string | null
          status: string | null
          warranty_end_date: string | null
        }
        Insert: {
          customer_id?: number | null
          id?: string
          install_date?: string | null
          location_id?: string | null
          salesforce_asset_id?: string | null
          serial_number?: string | null
          status?: string | null
          warranty_end_date?: string | null
        }
        Update: {
          customer_id?: number | null
          id?: string
          install_date?: string | null
          location_id?: string | null
          salesforce_asset_id?: string | null
          serial_number?: string | null
          status?: string | null
          warranty_end_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_assets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_assets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_assets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "site_assets_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      site_survey_device_details: {
        Row: {
          created_at: string | null
          field_name: string
          field_value: string | null
          id: string
          survey_item_id: string
        }
        Insert: {
          created_at?: string | null
          field_name: string
          field_value?: string | null
          id?: string
          survey_item_id: string
        }
        Update: {
          created_at?: string | null
          field_name?: string
          field_value?: string | null
          id?: string
          survey_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_survey_device_details_survey_item_id_fkey"
            columns: ["survey_item_id"]
            isOneToOne: false
            referencedRelation: "site_survey_items"
            referencedColumns: ["id"]
          },
        ]
      }
      site_survey_estimates: {
        Row: {
          created_at: string
          created_by: string | null
          estimated_crew_size: number
          estimated_days: number
          id: string
          labor_rate_per_hour: number | null
          margin_percentage: number | null
          notes: string | null
          survey_id: string
          total_equipment_cost: number
          total_installation_minutes: number
          total_labor_cost: number | null
          total_project_cost: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          estimated_crew_size?: number
          estimated_days?: number
          id?: string
          labor_rate_per_hour?: number | null
          margin_percentage?: number | null
          notes?: string | null
          survey_id: string
          total_equipment_cost?: number
          total_installation_minutes?: number
          total_labor_cost?: number | null
          total_project_cost?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          estimated_crew_size?: number
          estimated_days?: number
          id?: string
          labor_rate_per_hour?: number | null
          margin_percentage?: number | null
          notes?: string | null
          survey_id?: string
          total_equipment_cost?: number
          total_installation_minutes?: number
          total_labor_cost?: number | null
          total_project_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_survey_estimates_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "site_surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_survey_estimates_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_matching_stats"
            referencedColumns: ["survey_id"]
          },
        ]
      }
      site_survey_executive_briefs: {
        Row: {
          generated_at: string | null
          generated_by: string | null
          id: string
          summary_data: Json
          survey_id: string
        }
        Insert: {
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          summary_data?: Json
          survey_id: string
        }
        Update: {
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          summary_data?: Json
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_survey_executive_briefs_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "site_survey_executive_briefs_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_survey_executive_briefs_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "site_survey_executive_briefs_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "site_survey_executive_briefs_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "site_survey_executive_briefs_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "site_surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_survey_executive_briefs_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_matching_stats"
            referencedColumns: ["survey_id"]
          },
        ]
      }
      site_survey_item_equipment: {
        Row: {
          created_at: string
          custom_price: number | null
          id: string
          product_id: string | null
          quantity: number
          survey_item_id: string
        }
        Insert: {
          created_at?: string
          custom_price?: number | null
          id?: string
          product_id?: string | null
          quantity?: number
          survey_item_id: string
        }
        Update: {
          created_at?: string
          custom_price?: number | null
          id?: string
          product_id?: string | null
          quantity?: number
          survey_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_survey_item_equipment_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_survey_item_equipment_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_popular_survey_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_survey_item_equipment_survey_item_id_fkey"
            columns: ["survey_item_id"]
            isOneToOne: false
            referencedRelation: "site_survey_items"
            referencedColumns: ["id"]
          },
        ]
      }
      site_survey_items: {
        Row: {
          catalog_match_confidence: number | null
          created_at: string | null
          custom_price: number | null
          device_category: string
          device_type: string
          estimated_install_minutes: number | null
          generation_source: string | null
          head_end_location: string | null
          id: string
          is_auto_generated: boolean | null
          item_number: string
          labor_notes: string | null
          location_name: string | null
          location_number: string | null
          notes: string | null
          parent_item_id: string | null
          product_id: string | null
          quantity: number | null
          salesforce_equipment_id: string | null
          spoken_device_text: string | null
          survey_id: string
          termination_location: string | null
          updated_at: string | null
        }
        Insert: {
          catalog_match_confidence?: number | null
          created_at?: string | null
          custom_price?: number | null
          device_category: string
          device_type: string
          estimated_install_minutes?: number | null
          generation_source?: string | null
          head_end_location?: string | null
          id?: string
          is_auto_generated?: boolean | null
          item_number: string
          labor_notes?: string | null
          location_name?: string | null
          location_number?: string | null
          notes?: string | null
          parent_item_id?: string | null
          product_id?: string | null
          quantity?: number | null
          salesforce_equipment_id?: string | null
          spoken_device_text?: string | null
          survey_id: string
          termination_location?: string | null
          updated_at?: string | null
        }
        Update: {
          catalog_match_confidence?: number | null
          created_at?: string | null
          custom_price?: number | null
          device_category?: string
          device_type?: string
          estimated_install_minutes?: number | null
          generation_source?: string | null
          head_end_location?: string | null
          id?: string
          is_auto_generated?: boolean | null
          item_number?: string
          labor_notes?: string | null
          location_name?: string | null
          location_number?: string | null
          notes?: string | null
          parent_item_id?: string | null
          product_id?: string | null
          quantity?: number | null
          salesforce_equipment_id?: string | null
          spoken_device_text?: string | null
          survey_id?: string
          termination_location?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_survey_items_parent_item_id_fkey"
            columns: ["parent_item_id"]
            isOneToOne: false
            referencedRelation: "site_survey_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_survey_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_survey_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_popular_survey_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_survey_items_salesforce_equipment_id_fkey"
            columns: ["salesforce_equipment_id"]
            isOneToOne: false
            referencedRelation: "salesforce_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_survey_items_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "site_surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_survey_items_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_matching_stats"
            referencedColumns: ["survey_id"]
          },
        ]
      }
      site_survey_photos: {
        Row: {
          annotations: Json | null
          caption: string | null
          created_at: string | null
          file_path: string
          id: string
          latitude: number | null
          longitude: number | null
          survey_item_id: string
          taken_at: string | null
          taken_by: string | null
        }
        Insert: {
          annotations?: Json | null
          caption?: string | null
          created_at?: string | null
          file_path: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          survey_item_id: string
          taken_at?: string | null
          taken_by?: string | null
        }
        Update: {
          annotations?: Json | null
          caption?: string | null
          created_at?: string | null
          file_path?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          survey_item_id?: string
          taken_at?: string | null
          taken_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_survey_photos_survey_item_id_fkey"
            columns: ["survey_item_id"]
            isOneToOne: false
            referencedRelation: "site_survey_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_survey_photos_taken_by_fkey"
            columns: ["taken_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "site_survey_photos_taken_by_fkey"
            columns: ["taken_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_survey_photos_taken_by_fkey"
            columns: ["taken_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "site_survey_photos_taken_by_fkey"
            columns: ["taken_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "site_survey_photos_taken_by_fkey"
            columns: ["taken_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
        ]
      }
      site_surveys: {
        Row: {
          city: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          customer_name: string
          data_quality_score: number | null
          estimated_crew_size: number | null
          estimated_equipment_cost: number | null
          estimated_install_days: number | null
          estimated_labor_cost: number | null
          facility_name: string | null
          id: string
          job_id: string | null
          metrics_last_calculated_at: string | null
          notes: string | null
          service_agreement_path: string | null
          service_agreement_uploaded_at: string | null
          service_agreement_uploaded_by: string | null
          share_token: string | null
          site_address: string | null
          state: string | null
          status: Database["public"]["Enums"]["survey_status"]
          survey_date: string
          total_install_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name: string
          data_quality_score?: number | null
          estimated_crew_size?: number | null
          estimated_equipment_cost?: number | null
          estimated_install_days?: number | null
          estimated_labor_cost?: number | null
          facility_name?: string | null
          id?: string
          job_id?: string | null
          metrics_last_calculated_at?: string | null
          notes?: string | null
          service_agreement_path?: string | null
          service_agreement_uploaded_at?: string | null
          service_agreement_uploaded_by?: string | null
          share_token?: string | null
          site_address?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["survey_status"]
          survey_date?: string
          total_install_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string
          data_quality_score?: number | null
          estimated_crew_size?: number | null
          estimated_equipment_cost?: number | null
          estimated_install_days?: number | null
          estimated_labor_cost?: number | null
          facility_name?: string | null
          id?: string
          job_id?: string | null
          metrics_last_calculated_at?: string | null
          notes?: string | null
          service_agreement_path?: string | null
          service_agreement_uploaded_at?: string | null
          service_agreement_uploaded_by?: string | null
          share_token?: string | null
          site_address?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["survey_status"]
          survey_date?: string
          total_install_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_surveys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "site_surveys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_surveys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "site_surveys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "site_surveys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "site_surveys_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["alarm_uuid"]
          },
          {
            foreignKeyName: "site_surveys_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "site_surveys_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "site_surveys_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "site_surveys_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_surveys_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "site_surveys_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "site_surveys_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "site_surveys_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "site_surveys_service_agreement_uploaded_by_fkey"
            columns: ["service_agreement_uploaded_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "site_surveys_service_agreement_uploaded_by_fkey"
            columns: ["service_agreement_uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_surveys_service_agreement_uploaded_by_fkey"
            columns: ["service_agreement_uploaded_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "site_surveys_service_agreement_uploaded_by_fkey"
            columns: ["service_agreement_uploaded_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "site_surveys_service_agreement_uploaded_by_fkey"
            columns: ["service_agreement_uploaded_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
        ]
      }
      sites: {
        Row: {
          address1: string | null
          alarm_customer_id: number | null
          city: string | null
          created_at: string
          has_toll: boolean | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          parking_fee: number | null
          project_id: string | null
          state: string | null
          timezone: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          address1?: string | null
          alarm_customer_id?: number | null
          city?: string | null
          created_at?: string
          has_toll?: boolean | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          parking_fee?: number | null
          project_id?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address1?: string | null
          alarm_customer_id?: number | null
          city?: string | null
          created_at?: string
          has_toll?: boolean | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          parking_fee?: number | null
          project_id?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "sites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "sites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_assessments: {
        Row: {
          correct_answer: Json
          created_at: string
          difficulty_level: string | null
          explanation: string | null
          id: string
          options: Json | null
          points: number | null
          question_order: number | null
          question_text: string
          question_type: string
          skill_code: string
        }
        Insert: {
          correct_answer: Json
          created_at?: string
          difficulty_level?: string | null
          explanation?: string | null
          id?: string
          options?: Json | null
          points?: number | null
          question_order?: number | null
          question_text: string
          question_type: string
          skill_code: string
        }
        Update: {
          correct_answer?: Json
          created_at?: string
          difficulty_level?: string | null
          explanation?: string | null
          id?: string
          options?: Json | null
          points?: number | null
          question_order?: number | null
          question_text?: string
          question_type?: string
          skill_code?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          id: string
          level_scale: string | null
          name: string
          prerequisite_skill_codes: string[] | null
          skill_code: string
        }
        Insert: {
          id?: string
          level_scale?: string | null
          name: string
          prerequisite_skill_codes?: string[] | null
          skill_code: string
        }
        Update: {
          id?: string
          level_scale?: string | null
          name?: string
          prerequisite_skill_codes?: string[] | null
          skill_code?: string
        }
        Relationships: []
      }
      sla_policies: {
        Row: {
          id: string
          policy_code: string
          priority: number
          resolve_minutes: number
          response_minutes: number
        }
        Insert: {
          id?: string
          policy_code: string
          priority: number
          resolve_minutes: number
          response_minutes: number
        }
        Update: {
          id?: string
          policy_code?: string
          priority?: number
          resolve_minutes?: number
          response_minutes?: number
        }
        Relationships: []
      }
      spec_quick_searches: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          label: string
          query: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          query: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          query?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      special_project_documents: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size_bytes: number | null
          file_type: string
          id: string
          mime_type: string | null
          notes: string | null
          special_project_id: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size_bytes?: number | null
          file_type: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          special_project_id: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size_bytes?: number | null
          file_type?: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          special_project_id?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "special_project_documents_special_project_id_fkey"
            columns: ["special_project_id"]
            isOneToOne: false
            referencedRelation: "special_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      special_project_store_items: {
        Row: {
          actual_quantity: number | null
          cost_nrc: number | null
          created_at: string | null
          id: string
          installed_at: string | null
          installed_by: string | null
          is_auto_generated: boolean | null
          is_unplanned: boolean | null
          product_code: string | null
          product_name: string | null
          project_device_id: string | null
          quantity: number | null
          revenue_nrc: number | null
          special_project_store_id: string | null
          status: string | null
          store_need: string
          survey_item_id: string | null
          unit_cost: number | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          actual_quantity?: number | null
          cost_nrc?: number | null
          created_at?: string | null
          id?: string
          installed_at?: string | null
          installed_by?: string | null
          is_auto_generated?: boolean | null
          is_unplanned?: boolean | null
          product_code?: string | null
          product_name?: string | null
          project_device_id?: string | null
          quantity?: number | null
          revenue_nrc?: number | null
          special_project_store_id?: string | null
          status?: string | null
          store_need: string
          survey_item_id?: string | null
          unit_cost?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_quantity?: number | null
          cost_nrc?: number | null
          created_at?: string | null
          id?: string
          installed_at?: string | null
          installed_by?: string | null
          is_auto_generated?: boolean | null
          is_unplanned?: boolean | null
          product_code?: string | null
          product_name?: string | null
          project_device_id?: string | null
          quantity?: number | null
          revenue_nrc?: number | null
          special_project_store_id?: string | null
          status?: string | null
          store_need?: string
          survey_item_id?: string | null
          unit_cost?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "special_project_store_items_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "special_project_store_items_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "special_project_store_items_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "special_project_store_items_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "special_project_store_items_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "special_project_store_items_project_device_id_fkey"
            columns: ["project_device_id"]
            isOneToOne: false
            referencedRelation: "project_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "special_project_store_items_special_project_store_id_fkey"
            columns: ["special_project_store_id"]
            isOneToOne: false
            referencedRelation: "special_project_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "special_project_store_items_special_project_store_id_fkey"
            columns: ["special_project_store_id"]
            isOneToOne: false
            referencedRelation: "view_project_map_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "special_project_store_items_survey_item_id_fkey"
            columns: ["survey_item_id"]
            isOneToOne: false
            referencedRelation: "site_survey_items"
            referencedColumns: ["id"]
          },
        ]
      }
      special_project_stores: {
        Row: {
          access_control_in_use: string | null
          account_name: string
          actual_cost: number | null
          actual_expenses: number | null
          actual_labor_cost: number | null
          actual_material_cost: number | null
          actual_revenue: number | null
          address: string | null
          alarm_customer_id: string | null
          assigned_tech_id: string | null
          assigned_tech_number: number | null
          city: string | null
          comment: string | null
          created_at: string | null
          estimated_cost: number | null
          estimated_revenue: number | null
          id: string
          is_mall: boolean | null
          job_id: string | null
          latitude: number | null
          longitude: number | null
          products: string | null
          scheduled_date: string | null
          special_project_id: string | null
          state: string | null
          status: string | null
          store_id: string | null
          store_name: string | null
          store_needs: string | null
          type_of_gate: string | null
          updated_at: string | null
          visit_sequence: number | null
          zip: string | null
        }
        Insert: {
          access_control_in_use?: string | null
          account_name: string
          actual_cost?: number | null
          actual_expenses?: number | null
          actual_labor_cost?: number | null
          actual_material_cost?: number | null
          actual_revenue?: number | null
          address?: string | null
          alarm_customer_id?: string | null
          assigned_tech_id?: string | null
          assigned_tech_number?: number | null
          city?: string | null
          comment?: string | null
          created_at?: string | null
          estimated_cost?: number | null
          estimated_revenue?: number | null
          id?: string
          is_mall?: boolean | null
          job_id?: string | null
          latitude?: number | null
          longitude?: number | null
          products?: string | null
          scheduled_date?: string | null
          special_project_id?: string | null
          state?: string | null
          status?: string | null
          store_id?: string | null
          store_name?: string | null
          store_needs?: string | null
          type_of_gate?: string | null
          updated_at?: string | null
          visit_sequence?: number | null
          zip?: string | null
        }
        Update: {
          access_control_in_use?: string | null
          account_name?: string
          actual_cost?: number | null
          actual_expenses?: number | null
          actual_labor_cost?: number | null
          actual_material_cost?: number | null
          actual_revenue?: number | null
          address?: string | null
          alarm_customer_id?: string | null
          assigned_tech_id?: string | null
          assigned_tech_number?: number | null
          city?: string | null
          comment?: string | null
          created_at?: string | null
          estimated_cost?: number | null
          estimated_revenue?: number | null
          id?: string
          is_mall?: boolean | null
          job_id?: string | null
          latitude?: number | null
          longitude?: number | null
          products?: string | null
          scheduled_date?: string | null
          special_project_id?: string | null
          state?: string | null
          status?: string | null
          store_id?: string | null
          store_name?: string | null
          store_needs?: string | null
          type_of_gate?: string | null
          updated_at?: string | null
          visit_sequence?: number | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "special_project_stores_alarm_customer_id_fkey"
            columns: ["alarm_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["alarm_uuid"]
          },
          {
            foreignKeyName: "special_project_stores_assigned_tech_id_fkey"
            columns: ["assigned_tech_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "special_project_stores_assigned_tech_id_fkey"
            columns: ["assigned_tech_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "special_project_stores_assigned_tech_id_fkey"
            columns: ["assigned_tech_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "special_project_stores_assigned_tech_id_fkey"
            columns: ["assigned_tech_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "special_project_stores_assigned_tech_id_fkey"
            columns: ["assigned_tech_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "special_project_stores_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "special_project_stores_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "special_project_stores_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "special_project_stores_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "special_project_stores_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "special_project_stores_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "special_project_stores_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "special_project_stores_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "special_project_stores_special_project_id_fkey"
            columns: ["special_project_id"]
            isOneToOne: false
            referencedRelation: "special_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      special_projects: {
        Row: {
          actual_end_date: string | null
          actual_labor_cost: number | null
          actual_material_cost: number | null
          actual_revenue: number | null
          budget_cap: number | null
          client_name: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          start_date: string | null
          status: string | null
          target_end_date: string | null
          total_expenses: number | null
          total_jobs: number | null
          total_profit: number | null
          total_revenue: number | null
          total_stores: number | null
          updated_at: string | null
        }
        Insert: {
          actual_end_date?: string | null
          actual_labor_cost?: number | null
          actual_material_cost?: number | null
          actual_revenue?: number | null
          budget_cap?: number | null
          client_name?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string | null
          target_end_date?: string | null
          total_expenses?: number | null
          total_jobs?: number | null
          total_profit?: number | null
          total_revenue?: number | null
          total_stores?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_end_date?: string | null
          actual_labor_cost?: number | null
          actual_material_cost?: number | null
          actual_revenue?: number | null
          budget_cap?: number | null
          client_name?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string | null
          target_end_date?: string | null
          total_expenses?: number | null
          total_jobs?: number | null
          total_profit?: number | null
          total_revenue?: number | null
          total_stores?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stores: {
        Row: {
          id: string
          name: string
          ows_company_id: string | null
          timezone: string
        }
        Insert: {
          id?: string
          name: string
          ows_company_id?: string | null
          timezone?: string
        }
        Update: {
          id?: string
          name?: string
          ows_company_id?: string | null
          timezone?: string
        }
        Relationships: []
      }
      support_ticket_notes: {
        Row: {
          created_at: string
          created_by: string
          id: string
          note_text: string
          note_type: string
          ticket_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          note_text: string
          note_type?: string
          ticket_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          note_text?: string
          note_type?: string
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "support_ticket_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "support_ticket_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "support_ticket_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_ticket_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_time_entries: {
        Row: {
          created_at: string
          description: string | null
          hours: number
          id: string
          technician_id: string
          ticket_id: string
          updated_at: string
          work_date: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hours: number
          id?: string
          technician_id: string
          ticket_id: string
          updated_at?: string
          work_date: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hours?: number
          id?: string
          technician_id?: string
          ticket_id?: string
          updated_at?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_time_entries_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "support_ticket_time_entries_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_time_entries_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "support_ticket_time_entries_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "support_ticket_time_entries_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_ticket_time_entries_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          actual_hours: number | null
          assigned_at: string | null
          assigned_to: string | null
          case_origin: string | null
          case_type: string | null
          closed_at: string | null
          created_at: string
          created_by: string | null
          created_via: string
          customer_id: string
          estimated_hours: number | null
          id: string
          is_part_of_project: boolean | null
          issue_description: string
          issue_title: string
          issue_type: string
          job_id: string | null
          location_id: string | null
          priority: string
          resolved_at: string | null
          resolved_by: string | null
          salesforce_case_id: string | null
          salesforce_sync_status: string | null
          site_id: string | null
          special_project_id: string | null
          status: string
          technician_id: string | null
          ticket_number: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_at?: string | null
          assigned_to?: string | null
          case_origin?: string | null
          case_type?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_via?: string
          customer_id: string
          estimated_hours?: number | null
          id?: string
          is_part_of_project?: boolean | null
          issue_description: string
          issue_title: string
          issue_type?: string
          job_id?: string | null
          location_id?: string | null
          priority?: string
          resolved_at?: string | null
          resolved_by?: string | null
          salesforce_case_id?: string | null
          salesforce_sync_status?: string | null
          site_id?: string | null
          special_project_id?: string | null
          status?: string
          technician_id?: string | null
          ticket_number: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assigned_at?: string | null
          assigned_to?: string | null
          case_origin?: string | null
          case_type?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_via?: string
          customer_id?: string
          estimated_hours?: number | null
          id?: string
          is_part_of_project?: boolean | null
          issue_description?: string
          issue_title?: string
          issue_type?: string
          job_id?: string | null
          location_id?: string | null
          priority?: string
          resolved_at?: string | null
          resolved_by?: string | null
          salesforce_case_id?: string | null
          salesforce_sync_status?: string | null
          site_id?: string | null
          special_project_id?: string | null
          status?: string
          technician_id?: string | null
          ticket_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "support_tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "support_tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "support_tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["alarm_uuid"]
          },
          {
            foreignKeyName: "support_tickets_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "support_tickets_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "support_tickets_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "support_tickets_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "support_tickets_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "support_tickets_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "support_tickets_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "support_tickets_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "support_tickets_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "support_tickets_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "support_tickets_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_tickets_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_special_project_id_fkey"
            columns: ["special_project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "support_tickets_special_project_id_fkey"
            columns: ["special_project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "support_tickets_special_project_id_fkey"
            columns: ["special_project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_special_project_id_fkey"
            columns: ["special_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_item_match_history: {
        Row: {
          alternatives: Json | null
          confidence_score: number | null
          created_at: string | null
          created_by: string | null
          id: string
          original_text: string
          product_id: string | null
          selected_by_user: boolean | null
          survey_item_id: string
        }
        Insert: {
          alternatives?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          original_text: string
          product_id?: string | null
          selected_by_user?: boolean | null
          survey_item_id: string
        }
        Update: {
          alternatives?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          original_text?: string
          product_id?: string | null
          selected_by_user?: boolean | null
          survey_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_item_match_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_item_match_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_popular_survey_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_item_match_history_survey_item_id_fkey"
            columns: ["survey_item_id"]
            isOneToOne: false
            referencedRelation: "site_survey_items"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_log: {
        Row: {
          completed_at: string | null
          created_at: string | null
          details: Json | null
          error_message: string | null
          id: number
          records_synced: number | null
          started_at: string
          status: string
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: number
          records_synced?: number | null
          started_at: string
          status: string
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: number
          records_synced?: number | null
          started_at?: string
          status?: string
          sync_type?: string
        }
        Relationships: []
      }
      sync_queue: {
        Row: {
          client_timestamp: string | null
          created_at: string | null
          error_message: string | null
          id: string
          operation_type: string
          payload: Json
          record_id: string | null
          retry_count: number | null
          server_timestamp: string | null
          sync_status: string | null
          synced_at: string | null
          table_name: string
          user_id: string
        }
        Insert: {
          client_timestamp?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          operation_type: string
          payload: Json
          record_id?: string | null
          retry_count?: number | null
          server_timestamp?: string | null
          sync_status?: string | null
          synced_at?: string | null
          table_name: string
          user_id: string
        }
        Update: {
          client_timestamp?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          operation_type?: string
          payload?: Json
          record_id?: string | null
          retry_count?: number | null
          server_timestamp?: string | null
          sync_status?: string | null
          synced_at?: string | null
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: string
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      tech_blackouts: {
        Row: {
          end_at: string
          id: string
          reason: string | null
          start_at: string
          technician_id: string | null
        }
        Insert: {
          end_at: string
          id?: string
          reason?: string | null
          start_at: string
          technician_id?: string | null
        }
        Update: {
          end_at?: string
          id?: string
          reason?: string | null
          start_at?: string
          technician_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tech_blackouts_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tech_blackouts_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_tech_capacity_daily"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      tech_daily_overrides: {
        Row: {
          created_at: string | null
          end_local: string | null
          id: string
          reason: string | null
          service_date: string
          start_local: string | null
          technician_profile_id: string
          timezone: string
          type: string
        }
        Insert: {
          created_at?: string | null
          end_local?: string | null
          id?: string
          reason?: string | null
          service_date: string
          start_local?: string | null
          technician_profile_id: string
          timezone: string
          type: string
        }
        Update: {
          created_at?: string | null
          end_local?: string | null
          id?: string
          reason?: string | null
          service_date?: string
          start_local?: string | null
          technician_profile_id?: string
          timezone?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_daily_overrides_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "tech_daily_overrides_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tech_daily_overrides_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "tech_daily_overrides_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "tech_daily_overrides_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tech_pto: {
        Row: {
          end_at: string
          id: string
          reason: string | null
          start_at: string
          technician_id: string | null
        }
        Insert: {
          end_at: string
          id?: string
          reason?: string | null
          start_at: string
          technician_id?: string | null
        }
        Update: {
          end_at?: string
          id?: string
          reason?: string | null
          start_at?: string
          technician_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tech_pto_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tech_pto_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_tech_capacity_daily"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      tech_shift_assignments: {
        Row: {
          effective_from: string
          effective_to: string | null
          id: string
          shift_id: string | null
          technician_id: string | null
        }
        Insert: {
          effective_from?: string
          effective_to?: string | null
          id?: string
          shift_id?: string | null
          technician_id?: string | null
        }
        Update: {
          effective_from?: string
          effective_to?: string | null
          id?: string
          shift_id?: string | null
          technician_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tech_shift_assignments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tech_shift_assignments_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tech_shift_assignments_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_tech_capacity_daily"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      tech_weekly_availability: {
        Row: {
          active: boolean | null
          day_of_week: number
          effective_from: string
          effective_to: string | null
          end_local: string
          id: string
          start_local: string
          technician_profile_id: string
          timezone: string
        }
        Insert: {
          active?: boolean | null
          day_of_week: number
          effective_from?: string
          effective_to?: string | null
          end_local: string
          id?: string
          start_local: string
          technician_profile_id: string
          timezone: string
        }
        Update: {
          active?: boolean | null
          day_of_week?: number
          effective_from?: string
          effective_to?: string | null
          end_local?: string
          id?: string
          start_local?: string
          technician_profile_id?: string
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_weekly_availability_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "tech_weekly_availability_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tech_weekly_availability_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "tech_weekly_availability_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "tech_weekly_availability_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
        ]
      }
      technician_certs: {
        Row: {
          cert_id: string | null
          expires_at: string | null
          id: string
          issued_at: string | null
          license_no: string | null
          state: string | null
          technician_id: string | null
        }
        Insert: {
          cert_id?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          license_no?: string | null
          state?: string | null
          technician_id?: string | null
        }
        Update: {
          cert_id?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          license_no?: string | null
          state?: string | null
          technician_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technician_certs_cert_id_fkey"
            columns: ["cert_id"]
            isOneToOne: false
            referencedRelation: "certifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_certs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_certs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_tech_capacity_daily"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      technician_skills: {
        Row: {
          certified_date: string | null
          created_at: string | null
          expires_at: string | null
          level: number | null
          skill_id: string
          technician_id: string
          updated_at: string | null
        }
        Insert: {
          certified_date?: string | null
          created_at?: string | null
          expires_at?: string | null
          level?: number | null
          skill_id: string
          technician_id: string
          updated_at?: string | null
        }
        Update: {
          certified_date?: string | null
          created_at?: string | null
          expires_at?: string | null
          level?: number | null
          skill_id?: string
          technician_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technician_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_skills_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "technician_skills_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_skills_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "technician_skills_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "technician_skills_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
        ]
      }
      technicians: {
        Row: {
          compliance_profile_id: string | null
          created_at: string
          email: string
          full_name: string
          home_base_lat: number | null
          home_base_lng: number | null
          home_base_zip: string | null
          hourly_cost: number | null
          id: string
          max_daily_hours: number | null
          phone: string | null
          skills: string[] | null
          status: string | null
          travel_radius_km: number | null
          union_flag: boolean | null
          updated_at: string
        }
        Insert: {
          compliance_profile_id?: string | null
          created_at?: string
          email: string
          full_name: string
          home_base_lat?: number | null
          home_base_lng?: number | null
          home_base_zip?: string | null
          hourly_cost?: number | null
          id?: string
          max_daily_hours?: number | null
          phone?: string | null
          skills?: string[] | null
          status?: string | null
          travel_radius_km?: number | null
          union_flag?: boolean | null
          updated_at?: string
        }
        Update: {
          compliance_profile_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          home_base_lat?: number | null
          home_base_lng?: number | null
          home_base_zip?: string | null
          hourly_cost?: number | null
          id?: string
          max_daily_hours?: number | null
          phone?: string | null
          skills?: string[] | null
          status?: string | null
          travel_radius_km?: number | null
          union_flag?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "technicians_compliance_profile_id_fkey"
            columns: ["compliance_profile_id"]
            isOneToOne: false
            referencedRelation: "compliance_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      terminated: {
        Row: {
          abbreviation: string | null
          alarm_pin: string | null
          alarm_pin_status: string | null
          alarm_provider: string | null
          created_at: string | null
          employee_email: string | null
          employee_name: string | null
          employee_status: string | null
          file_date: string | null
          id: string
          job_title: string | null
          sheet_type: string | null
          source_filename: string | null
          store_name: string | null
          updated_at: string | null
        }
        Insert: {
          abbreviation?: string | null
          alarm_pin?: string | null
          alarm_pin_status?: string | null
          alarm_provider?: string | null
          created_at?: string | null
          employee_email?: string | null
          employee_name?: string | null
          employee_status?: string | null
          file_date?: string | null
          id?: string
          job_title?: string | null
          sheet_type?: string | null
          source_filename?: string | null
          store_name?: string | null
          updated_at?: string | null
        }
        Update: {
          abbreviation?: string | null
          alarm_pin?: string | null
          alarm_pin_status?: string | null
          alarm_provider?: string | null
          created_at?: string | null
          employee_email?: string | null
          employee_name?: string | null
          employee_status?: string | null
          file_date?: string | null
          id?: string
          job_title?: string | null
          sheet_type?: string | null
          source_filename?: string | null
          store_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      termination_points: {
        Row: {
          cable_run_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          location_id: string
          panel_name: string
          patch_panel_port: string | null
          project_id: string
          rack_unit: number | null
          room_number: string | null
          termination_type: string | null
          updated_at: string | null
          wall_plate_id: string | null
        }
        Insert: {
          cable_run_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location_id: string
          panel_name: string
          patch_panel_port?: string | null
          project_id: string
          rack_unit?: number | null
          room_number?: string | null
          termination_type?: string | null
          updated_at?: string | null
          wall_plate_id?: string | null
        }
        Update: {
          cable_run_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string
          panel_name?: string
          patch_panel_port?: string | null
          project_id?: string
          rack_unit?: number | null
          room_number?: string | null
          termination_type?: string | null
          updated_at?: string | null
          wall_plate_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "termination_points_cable_run_id_fkey"
            columns: ["cable_run_id"]
            isOneToOne: false
            referencedRelation: "device_cable_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termination_points_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termination_points_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "termination_points_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "termination_points_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termination_points_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      territories: {
        Row: {
          center_lat: number | null
          center_lng: number | null
          depot_site_id: string | null
          id: string
          name: string
          radius_km: number | null
          territory_code: string
        }
        Insert: {
          center_lat?: number | null
          center_lng?: number | null
          depot_site_id?: string | null
          id?: string
          name: string
          radius_km?: number | null
          territory_code: string
        }
        Update: {
          center_lat?: number | null
          center_lng?: number | null
          depot_site_id?: string | null
          id?: string
          name?: string
          radius_km?: number | null
          territory_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "territories_depot_site_id_fkey"
            columns: ["depot_site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          end_at: string | null
          id: string
          job_id: string | null
          notes: string | null
          start_at: string
          technician_id: string | null
          type: Database["public"]["Enums"]["time_type"] | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          end_at?: string | null
          id?: string
          job_id?: string | null
          notes?: string | null
          start_at: string
          technician_id?: string | null
          type?: Database["public"]["Enums"]["time_type"] | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          end_at?: string | null
          id?: string
          job_id?: string | null
          notes?: string | null
          start_at?: string
          technician_id?: string | null
          type?: Database["public"]["Enums"]["time_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "time_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "time_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "time_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "time_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "time_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "time_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "time_entries_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_tech_capacity_daily"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      tools: {
        Row: {
          category: string | null
          cost: number | null
          created_at: string
          default_sku: string | null
          description: string | null
          id: string
          name: string
          purchase_date: string | null
          purchased_from: string | null
          receipt_file_url: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          cost?: number | null
          created_at?: string
          default_sku?: string | null
          description?: string | null
          id?: string
          name: string
          purchase_date?: string | null
          purchased_from?: string | null
          receipt_file_url?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          cost?: number | null
          created_at?: string
          default_sku?: string | null
          description?: string | null
          id?: string
          name?: string
          purchase_date?: string | null
          purchased_from?: string | null
          receipt_file_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      training_modules: {
        Row: {
          content_data: Json | null
          content_text: string | null
          content_type: string
          content_url: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          minimum_interaction_time: number | null
          module_order: number
          module_title: string
          passing_score: number | null
          simulation_type: string | null
          skill_code: string
          updated_at: string
        }
        Insert: {
          content_data?: Json | null
          content_text?: string | null
          content_type: string
          content_url?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          minimum_interaction_time?: number | null
          module_order?: number
          module_title: string
          passing_score?: number | null
          simulation_type?: string | null
          skill_code: string
          updated_at?: string
        }
        Update: {
          content_data?: Json | null
          content_text?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          minimum_interaction_time?: number | null
          module_order?: number
          module_title?: string
          passing_score?: number | null
          simulation_type?: string | null
          skill_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_modules_skill_code_fkey"
            columns: ["skill_code"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["skill_code"]
          },
        ]
      }
      transfered: {
        Row: {
          abbreviation: string | null
          alarm_pin: string | null
          alarm_pin_status: string | null
          alarm_provider: string | null
          created_at: string | null
          eligible_for_code: boolean | null
          employee_email: string | null
          employee_name: string | null
          employee_status: string | null
          file_date: string | null
          hire_date: string | null
          id: string
          job_title: string | null
          sheet_type: string | null
          source_filename: string | null
          store_name: string | null
          updated_at: string | null
        }
        Insert: {
          abbreviation?: string | null
          alarm_pin?: string | null
          alarm_pin_status?: string | null
          alarm_provider?: string | null
          created_at?: string | null
          eligible_for_code?: boolean | null
          employee_email?: string | null
          employee_name?: string | null
          employee_status?: string | null
          file_date?: string | null
          hire_date?: string | null
          id?: string
          job_title?: string | null
          sheet_type?: string | null
          source_filename?: string | null
          store_name?: string | null
          updated_at?: string | null
        }
        Update: {
          abbreviation?: string | null
          alarm_pin?: string | null
          alarm_pin_status?: string | null
          alarm_provider?: string | null
          created_at?: string | null
          eligible_for_code?: boolean | null
          employee_email?: string | null
          employee_name?: string | null
          employee_status?: string | null
          file_date?: string | null
          hire_date?: string | null
          id?: string
          job_title?: string | null
          sheet_type?: string | null
          source_filename?: string | null
          store_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trouble_ticket_notes: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_id: number
          id: string
          notes: string
          trouble_ticket_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_id: number
          id?: string
          notes: string
          trouble_ticket_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: number
          id?: string
          notes?: string
          trouble_ticket_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trouble_ticket_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "trouble_ticket_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trouble_ticket_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "trouble_ticket_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "trouble_ticket_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
        ]
      }
      trouble_uploads: {
        Row: {
          created_at: string | null
          error_message: string | null
          file_path: string | null
          filename: string | null
          id: string
          row_count: number | null
          upload_status: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          file_path?: string | null
          filename?: string | null
          id?: string
          row_count?: number | null
          upload_status?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          file_path?: string | null
          filename?: string | null
          id?: string
          row_count?: number | null
          upload_status?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      troubles_current: {
        Row: {
          assigned_to: string | null
          company_name: string | null
          created_at: string | null
          cs_account_number: number | null
          cs_account_prefix: number | null
          cs_phone_number_key: string | null
          customer_id: number | null
          dealer_customer_id: number | null
          device_type: string | null
          first_name: string | null
          id: string
          install_city: string | null
          install_state: string | null
          job_id: string | null
          join_date: string | null
          last_name: string | null
          panel_type: string | null
          primary_email: string | null
          primary_phone: string | null
          receiver_phone_number: string | null
          resolution_status: string | null
          resolved_at: string | null
          resolved_by: string | null
          return_trip_id: string | null
          subdealer_name: string | null
          system_description: string | null
          trouble_condition: string | null
          trouble_condition_start_date: string | null
          updated_at: string | null
          upload_date: string | null
          zone_name: string | null
          zone_number: number | null
        }
        Insert: {
          assigned_to?: string | null
          company_name?: string | null
          created_at?: string | null
          cs_account_number?: number | null
          cs_account_prefix?: number | null
          cs_phone_number_key?: string | null
          customer_id?: number | null
          dealer_customer_id?: number | null
          device_type?: string | null
          first_name?: string | null
          id?: string
          install_city?: string | null
          install_state?: string | null
          job_id?: string | null
          join_date?: string | null
          last_name?: string | null
          panel_type?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          receiver_phone_number?: string | null
          resolution_status?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          return_trip_id?: string | null
          subdealer_name?: string | null
          system_description?: string | null
          trouble_condition?: string | null
          trouble_condition_start_date?: string | null
          updated_at?: string | null
          upload_date?: string | null
          zone_name?: string | null
          zone_number?: number | null
        }
        Update: {
          assigned_to?: string | null
          company_name?: string | null
          created_at?: string | null
          cs_account_number?: number | null
          cs_account_prefix?: number | null
          cs_phone_number_key?: string | null
          customer_id?: number | null
          dealer_customer_id?: number | null
          device_type?: string | null
          first_name?: string | null
          id?: string
          install_city?: string | null
          install_state?: string | null
          job_id?: string | null
          join_date?: string | null
          last_name?: string | null
          panel_type?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          receiver_phone_number?: string | null
          resolution_status?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          return_trip_id?: string | null
          subdealer_name?: string | null
          system_description?: string | null
          trouble_condition?: string | null
          trouble_condition_start_date?: string | null
          updated_at?: string | null
          upload_date?: string | null
          zone_name?: string | null
          zone_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "troubles_current_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "troubles_current_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "troubles_current_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "troubles_current_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "troubles_current_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "troubles_current_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "troubles_current_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "troubles_current_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "troubles_current_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "troubles_current_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "troubles_current_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "troubles_current_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "troubles_current_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "troubles_current_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "troubles_current_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "troubles_current_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "troubles_current_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "troubles_current_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "troubles_current_return_trip_id_fkey"
            columns: ["return_trip_id"]
            isOneToOne: false
            referencedRelation: "return_trip_checkouts"
            referencedColumns: ["id"]
          },
        ]
      }
      troubles_historical: {
        Row: {
          avg_ticket_age: number | null
          created_at: string | null
          id: string
          raw_data: Json | null
          snapshot_date: string
          tickets_by_condition: Json | null
          tickets_by_device_type: Json | null
          tickets_by_panel_type: Json | null
          tickets_by_state: Json | null
          tickets_by_zone: Json | null
          total_tickets: number | null
        }
        Insert: {
          avg_ticket_age?: number | null
          created_at?: string | null
          id?: string
          raw_data?: Json | null
          snapshot_date: string
          tickets_by_condition?: Json | null
          tickets_by_device_type?: Json | null
          tickets_by_panel_type?: Json | null
          tickets_by_state?: Json | null
          tickets_by_zone?: Json | null
          total_tickets?: number | null
        }
        Update: {
          avg_ticket_age?: number | null
          created_at?: string | null
          id?: string
          raw_data?: Json | null
          snapshot_date?: string
          tickets_by_condition?: Json | null
          tickets_by_device_type?: Json | null
          tickets_by_panel_type?: Json | null
          tickets_by_state?: Json | null
          tickets_by_zone?: Json | null
          total_tickets?: number | null
        }
        Relationships: []
      }
      user_certifications: {
        Row: {
          assessment_score: number | null
          certificate_url: string | null
          certification_level: string
          certified_date: string
          expiry_date: string | null
          id: string
          is_active: boolean | null
          skill_code: string
          user_id: string
        }
        Insert: {
          assessment_score?: number | null
          certificate_url?: string | null
          certification_level?: string
          certified_date?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          skill_code: string
          user_id: string
        }
        Update: {
          assessment_score?: number | null
          certificate_url?: string | null
          certification_level?: string
          certified_date?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          skill_code?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_training_progress: {
        Row: {
          completion_percentage: number
          created_at: string | null
          id: string
          module_id: string
          notes: string | null
          skill_code: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completion_percentage?: number
          created_at?: string | null
          id?: string
          module_id: string
          notes?: string | null
          skill_code: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completion_percentage?: number
          created_at?: string | null
          id?: string
          module_id?: string
          notes?: string | null
          skill_code?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_training_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_module_metrics"
            referencedColumns: ["module_id"]
          },
          {
            foreignKeyName: "user_training_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_training_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "user_training_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_training_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "user_training_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "user_training_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vehicle_assignments: {
        Row: {
          access_codes: Json | null
          assignment_type: string | null
          created_at: string | null
          device_mounts: Json | null
          effective_from: string
          effective_to: string | null
          home_base_lat: number | null
          home_base_lng: number | null
          id: string
          key_location: string | null
          technician_id: string | null
          territory_id: string | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          access_codes?: Json | null
          assignment_type?: string | null
          created_at?: string | null
          device_mounts?: Json | null
          effective_from?: string
          effective_to?: string | null
          home_base_lat?: number | null
          home_base_lng?: number | null
          id?: string
          key_location?: string | null
          technician_id?: string | null
          territory_id?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          access_codes?: Json | null
          assignment_type?: string | null
          created_at?: string | null
          device_mounts?: Json | null
          effective_from?: string
          effective_to?: string | null
          home_base_lat?: number | null
          home_base_lng?: number | null
          id?: string
          key_location?: string | null
          technician_id?: string | null
          territory_id?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_assignments_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "vehicle_assignments_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_assignments_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "vehicle_assignments_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "vehicle_assignments_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vehicle_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_master"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_bin_inventory: {
        Row: {
          bin_location: string
          created_at: string | null
          current_qty: number
          id: string
          last_counted_at: string | null
          last_counted_by: string | null
          max_par_level: number
          min_par_level: number
          part_id: string | null
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          bin_location: string
          created_at?: string | null
          current_qty?: number
          id?: string
          last_counted_at?: string | null
          last_counted_by?: string | null
          max_par_level?: number
          min_par_level?: number
          part_id?: string | null
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          bin_location?: string
          created_at?: string | null
          current_qty?: number
          id?: string
          last_counted_at?: string | null
          last_counted_by?: string | null
          max_par_level?: number
          min_par_level?: number
          part_id?: string | null
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_bin_inventory_last_counted_by_fkey"
            columns: ["last_counted_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "vehicle_bin_inventory_last_counted_by_fkey"
            columns: ["last_counted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_bin_inventory_last_counted_by_fkey"
            columns: ["last_counted_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "vehicle_bin_inventory_last_counted_by_fkey"
            columns: ["last_counted_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "vehicle_bin_inventory_last_counted_by_fkey"
            columns: ["last_counted_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vehicle_bin_inventory_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_bin_inventory_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_master"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_documents: {
        Row: {
          created_at: string | null
          document_name: string
          document_type: string
          expiry_date: string | null
          file_url: string | null
          id: string
          issue_date: string | null
          reminder_days: number | null
          source_upload_id: string | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          document_name: string
          document_type: string
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          reminder_days?: number | null
          source_upload_id?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          document_name?: string
          document_type?: string
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          reminder_days?: number | null
          source_upload_id?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_documents_source_upload_id_fkey"
            columns: ["source_upload_id"]
            isOneToOne: false
            referencedRelation: "doc_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_master"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_expenses: {
        Row: {
          amount: number
          category: string | null
          category_id: string | null
          category_kind: Database["public"]["Enums"]["doc_kind"] | null
          created_at: string
          currency: string | null
          description: string | null
          doc_id: string | null
          expense_date: string
          expense_type: string
          external_file_id: string | null
          id: string
          job_id: string | null
          notes: string | null
          odometer_reading: number | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          receipt_photo_url: string | null
          status: Database["public"]["Enums"]["expense_status"] | null
          tax_amount: number | null
          technician_id: string
          updated_at: string
          vehicle_id: string
          vendor: string | null
          vendor_id: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          category_id?: string | null
          category_kind?: Database["public"]["Enums"]["doc_kind"] | null
          created_at?: string
          currency?: string | null
          description?: string | null
          doc_id?: string | null
          expense_date?: string
          expense_type: string
          external_file_id?: string | null
          id?: string
          job_id?: string | null
          notes?: string | null
          odometer_reading?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          receipt_photo_url?: string | null
          status?: Database["public"]["Enums"]["expense_status"] | null
          tax_amount?: number | null
          technician_id: string
          updated_at?: string
          vehicle_id: string
          vendor?: string | null
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          category_id?: string | null
          category_kind?: Database["public"]["Enums"]["doc_kind"] | null
          created_at?: string
          currency?: string | null
          description?: string | null
          doc_id?: string | null
          expense_date?: string
          expense_type?: string
          external_file_id?: string | null
          id?: string
          job_id?: string | null
          notes?: string | null
          odometer_reading?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          receipt_photo_url?: string | null
          status?: Database["public"]["Enums"]["expense_status"] | null
          tax_amount?: number | null
          technician_id?: string
          updated_at?: string
          vehicle_id?: string
          vendor?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_expenses_doc_id_fkey"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "doc_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_expenses_external_file_id_fkey"
            columns: ["external_file_id"]
            isOneToOne: false
            referencedRelation: "external_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "vehicle_expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "vehicle_expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "vehicle_expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "vehicle_expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "vehicle_expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "vehicle_expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "vehicle_expenses_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "vehicle_expenses_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_expenses_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "vehicle_expenses_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "vehicle_expenses_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vehicle_expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_expenses_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_fuel_logs: {
        Row: {
          cost_per_gallon: number | null
          cost_total: number | null
          created_at: string | null
          fuel_date: string
          fuel_station: string | null
          gallons_added: number
          id: string
          notes: string | null
          odometer_reading: number
          receipt_photo_url: string | null
          technician_id: string
          vehicle_id: string
        }
        Insert: {
          cost_per_gallon?: number | null
          cost_total?: number | null
          created_at?: string | null
          fuel_date?: string
          fuel_station?: string | null
          gallons_added: number
          id?: string
          notes?: string | null
          odometer_reading: number
          receipt_photo_url?: string | null
          technician_id: string
          vehicle_id: string
        }
        Update: {
          cost_per_gallon?: number | null
          cost_total?: number | null
          created_at?: string | null
          fuel_date?: string
          fuel_station?: string | null
          gallons_added?: number
          id?: string
          notes?: string | null
          odometer_reading?: number
          receipt_photo_url?: string | null
          technician_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_fuel_logs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "vehicle_fuel_logs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_fuel_logs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "vehicle_fuel_logs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "vehicle_fuel_logs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vehicle_fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_master"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_inspections: {
        Row: {
          created_at: string | null
          defects_found: Json | null
          id: string
          inspection_date: string
          inspection_type: string
          inspector_id: string
          next_inspection_due: string | null
          notes: string | null
          odometer_reading: number | null
          pass_status: boolean
          photos_urls: string[] | null
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          defects_found?: Json | null
          id?: string
          inspection_date?: string
          inspection_type?: string
          inspector_id: string
          next_inspection_due?: string | null
          notes?: string | null
          odometer_reading?: number | null
          pass_status?: boolean
          photos_urls?: string[] | null
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          defects_found?: Json | null
          id?: string
          inspection_date?: string
          inspection_type?: string
          inspector_id?: string
          next_inspection_due?: string | null
          notes?: string | null
          odometer_reading?: number | null
          pass_status?: boolean
          photos_urls?: string[] | null
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_inspections_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "vehicle_inspections_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_inspections_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "vehicle_inspections_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "vehicle_inspections_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vehicle_inspections_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_master"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_maintenance: {
        Row: {
          cost: number | null
          created_at: string | null
          current_odometer: number | null
          id: string
          notes: string | null
          receipt_url: string | null
          service_date: string
          service_odometer: number | null
          service_provider: string | null
          service_report_url: string | null
          service_type: string
          vehicle_id: string | null
          warranty_expiry_date: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          current_odometer?: number | null
          id?: string
          notes?: string | null
          receipt_url?: string | null
          service_date?: string
          service_odometer?: number | null
          service_provider?: string | null
          service_report_url?: string | null
          service_type: string
          vehicle_id?: string | null
          warranty_expiry_date?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          current_odometer?: number | null
          id?: string
          notes?: string | null
          receipt_url?: string | null
          service_date?: string
          service_odometer?: number | null
          service_provider?: string | null
          service_report_url?: string | null
          service_type?: string
          vehicle_id?: string | null
          warranty_expiry_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_maintenance_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_master"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_maintenance_records: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          labor_cost: number | null
          notes: string | null
          odometer_reading: number | null
          parts_cost: number | null
          receipt_url: string | null
          schedule_id: string | null
          service_date: string
          service_provider: string | null
          service_type: string
          status: string | null
          technician_id: string | null
          total_cost: number | null
          updated_at: string | null
          vehicle_id: string | null
          warranty_expires: string | null
          work_order_number: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          labor_cost?: number | null
          notes?: string | null
          odometer_reading?: number | null
          parts_cost?: number | null
          receipt_url?: string | null
          schedule_id?: string | null
          service_date: string
          service_provider?: string | null
          service_type: string
          status?: string | null
          technician_id?: string | null
          total_cost?: number | null
          updated_at?: string | null
          vehicle_id?: string | null
          warranty_expires?: string | null
          work_order_number?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          labor_cost?: number | null
          notes?: string | null
          odometer_reading?: number | null
          parts_cost?: number | null
          receipt_url?: string | null
          schedule_id?: string | null
          service_date?: string
          service_provider?: string | null
          service_type?: string
          status?: string | null
          technician_id?: string | null
          total_cost?: number | null
          updated_at?: string | null
          vehicle_id?: string | null
          warranty_expires?: string | null
          work_order_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_maintenance_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "vehicle_maintenance_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_maintenance_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "vehicle_maintenance_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "vehicle_maintenance_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vehicle_maintenance_records_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "vehicle_maintenance_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_maintenance_records_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "vehicle_maintenance_records_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_maintenance_records_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "vehicle_maintenance_records_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "vehicle_maintenance_records_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vehicle_maintenance_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_master"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_maintenance_schedules: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          interval_miles: number | null
          interval_months: number | null
          interval_type: string
          last_service_date: string | null
          last_service_mileage: number | null
          next_due_date: string | null
          next_due_mileage: number | null
          notes: string | null
          service_type: string
          status: string | null
          updated_at: string | null
          vehicle_id: string | null
          warning_threshold_days: number | null
          warning_threshold_miles: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          interval_miles?: number | null
          interval_months?: number | null
          interval_type?: string
          last_service_date?: string | null
          last_service_mileage?: number | null
          next_due_date?: string | null
          next_due_mileage?: number | null
          notes?: string | null
          service_type: string
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
          warning_threshold_days?: number | null
          warning_threshold_miles?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          interval_miles?: number | null
          interval_months?: number | null
          interval_type?: string
          last_service_date?: string | null
          last_service_mileage?: number | null
          next_due_date?: string | null
          next_due_mileage?: number | null
          notes?: string | null
          service_type?: string
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
          warning_threshold_days?: number | null
          warning_threshold_miles?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_maintenance_schedules_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_master"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_master: {
        Row: {
          battery_size_kwh: number | null
          cargo_volume_cuft: number | null
          cargo_weight_lbs: number | null
          color: string | null
          created_at: string | null
          current_odometer: number | null
          fuel_type: string | null
          has_roof_rack: boolean | null
          id: string
          last_odometer_update: string | null
          lease_end_date: string | null
          lease_start_date: string | null
          license_plate: string
          lienholder: string | null
          maintenance_alerts: Json | null
          make: string
          model: string
          mpg_city: number | null
          mpg_highway: number | null
          mpge: number | null
          next_service_due: string | null
          ownership_type: string | null
          safety_equipment: Json | null
          status: string | null
          tank_size_gallons: number | null
          tow_rating_lbs: number | null
          trim: string | null
          updated_at: string | null
          vehicle_code: string
          vin: string | null
          year: number | null
        }
        Insert: {
          battery_size_kwh?: number | null
          cargo_volume_cuft?: number | null
          cargo_weight_lbs?: number | null
          color?: string | null
          created_at?: string | null
          current_odometer?: number | null
          fuel_type?: string | null
          has_roof_rack?: boolean | null
          id?: string
          last_odometer_update?: string | null
          lease_end_date?: string | null
          lease_start_date?: string | null
          license_plate: string
          lienholder?: string | null
          maintenance_alerts?: Json | null
          make: string
          model: string
          mpg_city?: number | null
          mpg_highway?: number | null
          mpge?: number | null
          next_service_due?: string | null
          ownership_type?: string | null
          safety_equipment?: Json | null
          status?: string | null
          tank_size_gallons?: number | null
          tow_rating_lbs?: number | null
          trim?: string | null
          updated_at?: string | null
          vehicle_code: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          battery_size_kwh?: number | null
          cargo_volume_cuft?: number | null
          cargo_weight_lbs?: number | null
          color?: string | null
          created_at?: string | null
          current_odometer?: number | null
          fuel_type?: string | null
          has_roof_rack?: boolean | null
          id?: string
          last_odometer_update?: string | null
          lease_end_date?: string | null
          lease_start_date?: string | null
          license_plate?: string
          lienholder?: string | null
          maintenance_alerts?: Json | null
          make?: string
          model?: string
          mpg_city?: number | null
          mpg_highway?: number | null
          mpge?: number | null
          next_service_due?: string | null
          ownership_type?: string | null
          safety_equipment?: Json | null
          status?: string | null
          tank_size_gallons?: number | null
          tow_rating_lbs?: number | null
          trim?: string | null
          updated_at?: string | null
          vehicle_code?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: []
      }
      vehicle_odometer_readings: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          reading: number
          reading_date: string | null
          reading_source: string | null
          recorded_by: string | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          reading: number
          reading_date?: string | null
          reading_source?: string | null
          recorded_by?: string | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          reading?: number
          reading_date?: string | null
          reading_source?: string | null
          recorded_by?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_odometer_readings_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "vehicle_odometer_readings_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_odometer_readings_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "vehicle_odometer_readings_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "vehicle_odometer_readings_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vehicle_odometer_readings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_master"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_recalls: {
        Row: {
          campaign_number: string | null
          completed_by: string | null
          completed_date: string | null
          created_at: string | null
          dealer_service_number: string | null
          description: string | null
          id: string
          notes: string | null
          recall_date: string | null
          recall_number: string
          remedy_description: string | null
          severity: string | null
          status: string | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          campaign_number?: string | null
          completed_by?: string | null
          completed_date?: string | null
          created_at?: string | null
          dealer_service_number?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          recall_date?: string | null
          recall_number: string
          remedy_description?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          campaign_number?: string | null
          completed_by?: string | null
          completed_date?: string | null
          created_at?: string | null
          dealer_service_number?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          recall_date?: string | null
          recall_number?: string
          remedy_description?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_recalls_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "vehicle_recalls_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_recalls_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "vehicle_recalls_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "vehicle_recalls_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vehicle_recalls_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_master"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_restock_tasks: {
        Row: {
          assigned_to: string | null
          bin_location: string
          completed_at: string | null
          created_at: string | null
          current_qty: number
          id: string
          part_id: string | null
          priority: string
          status: string
          target_qty: number
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          assigned_to?: string | null
          bin_location: string
          completed_at?: string | null
          created_at?: string | null
          current_qty: number
          id?: string
          part_id?: string | null
          priority?: string
          status?: string
          target_qty: number
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          assigned_to?: string | null
          bin_location?: string
          completed_at?: string | null
          created_at?: string | null
          current_qty?: number
          id?: string
          part_id?: string | null
          priority?: string
          status?: string
          target_qty?: number
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_restock_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "vehicle_restock_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_restock_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "vehicle_restock_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "vehicle_restock_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vehicle_restock_tasks_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_restock_tasks_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_master"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_tools: {
        Row: {
          assigned_at: string
          cost: number | null
          created_at: string
          id: string
          notes: string | null
          purchase_date: string | null
          purchased_from: string | null
          quantity: number
          receipt_file_url: string | null
          sku_number: string | null
          tool_id: string
          type_number: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          assigned_at?: string
          cost?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          purchase_date?: string | null
          purchased_from?: string | null
          quantity?: number
          receipt_file_url?: string | null
          sku_number?: string | null
          tool_id: string
          type_number?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          assigned_at?: string
          cost?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          purchase_date?: string | null
          purchased_from?: string | null
          quantity?: number
          receipt_file_url?: string | null
          sku_number?: string | null
          tool_id?: string
          type_number?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_tools_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_warranties: {
        Row: {
          active: boolean | null
          coverage_description: string | null
          created_at: string | null
          deductible: number | null
          expiry_date: string | null
          id: string
          max_mileage: number | null
          provider: string
          start_date: string | null
          terms_url: string | null
          updated_at: string | null
          vehicle_id: string | null
          warranty_type: string
        }
        Insert: {
          active?: boolean | null
          coverage_description?: string | null
          created_at?: string | null
          deductible?: number | null
          expiry_date?: string | null
          id?: string
          max_mileage?: number | null
          provider: string
          start_date?: string | null
          terms_url?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
          warranty_type: string
        }
        Update: {
          active?: boolean | null
          coverage_description?: string | null
          created_at?: string | null
          deductible?: number | null
          expiry_date?: string | null
          id?: string
          max_mileage?: number | null
          provider?: string
          start_date?: string | null
          terms_url?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
          warranty_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_warranties_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_master"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          account_no: string | null
          category_hint: Database["public"]["Enums"]["doc_kind"] | null
          created_at: string | null
          id: string
          name: string
          phone: string | null
          website: string | null
        }
        Insert: {
          account_no?: string | null
          category_hint?: Database["public"]["Enums"]["doc_kind"] | null
          created_at?: string | null
          id?: string
          name: string
          phone?: string | null
          website?: string | null
        }
        Update: {
          account_no?: string | null
          category_hint?: Database["public"]["Enums"]["doc_kind"] | null
          created_at?: string | null
          id?: string
          name?: string
          phone?: string | null
          website?: string | null
        }
        Relationships: []
      }
      zip_geocode: {
        Row: {
          city: string | null
          lat: number
          lng: number
          state: string | null
          updated_at: string | null
          zip: string
        }
        Insert: {
          city?: string | null
          lat: number
          lng: number
          state?: string | null
          updated_at?: string | null
          zip: string
        }
        Update: {
          city?: string | null
          lat?: number
          lng?: number
          state?: string | null
          updated_at?: string | null
          zip?: string
        }
        Relationships: []
      }
    }
    Views: {
      activity_log_complete: {
        Row: {
          action: string | null
          created_at: string | null
          device_id: string | null
          entity_id: string | null
          entity_type: string | null
          id: string | null
          ip_address: unknown
          is_archived: boolean | null
          location_id: string | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          project_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Relationships: []
      }
      analytics_inventory_variance: {
        Row: {
          completed_at: string | null
          customer: string | null
          job_code: string | null
          job_id: string | null
          qty_installed: number | null
          qty_sold: number | null
          technician: string | null
          variance_qty: number | null
        }
        Relationships: []
      }
      analytics_job_profitability: {
        Row: {
          customer_name: string | null
          gross_profit: number | null
          job_id: string | null
          job_title: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          total_equipment_cost: number | null
          total_equipment_value: number | null
        }
        Relationships: []
      }
      analytics_sla_status: {
        Row: {
          assigned_tech: string | null
          customer_name: string | null
          deadline: string | null
          hours_remaining: number | null
          job_code: string | null
          job_id: string | null
          sla_level: string | null
          sla_status: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["job_status"] | null
        }
        Relationships: []
      }
      analytics_workforce_performance: {
        Row: {
          actual_hours: number | null
          app_role: string | null
          burnout_risk: boolean | null
          efficiency_ratio: number | null
          estimated_hours: number | null
          full_name: string | null
          jobs_completed: number | null
          tech_id: string | null
        }
        Relationships: []
      }
      assessment_question_analytics: {
        Row: {
          correct_rate: number | null
          correct_responses: number | null
          question_id: string | null
          question_text: string | null
          skill_code: string | null
          total_responses: number | null
        }
        Relationships: []
      }
      audit_log_complete: {
        Row: {
          action: string | null
          actor_email: string | null
          after: Json | null
          before: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string | null
          is_archived: boolean | null
          occurred_at: string | null
          reason: string | null
        }
        Relationships: []
      }
      customer_overview: {
        Row: {
          alarm_customer_id: number | null
          city: string | null
          company_name: string | null
          contract_end_date: string | null
          dealer_customer_id: string | null
          email: string | null
          full_name: string | null
          id: number | null
          is_demo: boolean | null
          is_terminated: boolean | null
          join_date: string | null
          last_synced_at: string | null
          package_description: string | null
          phone_number: string | null
          state: string | null
          total_service_price: number | null
          zip: string | null
        }
        Relationships: []
      }
      hotel_expenses_summary: {
        Row: {
          avg_nightly_rate: number | null
          pending_approvals: number | null
          pending_reimbursements: number | null
          this_month_total: number | null
          total_expenses: number | null
          total_records: number | null
        }
        Relationships: []
      }
      openeye_offline_recorders: {
        Row: {
          id: string | null
          is_stale: boolean | null
          last_seen: string | null
          location_code: string | null
          location_name: string | null
          offline_minutes: number | null
          region: string | null
          status: string | null
          store_id: string | null
          went_offline_at: string | null
        }
        Relationships: []
      }
      openeye_recorder_summary: {
        Row: {
          came_online_at: string | null
          id: string | null
          is_stale: boolean | null
          last_seen: string | null
          location_code: string | null
          location_name: string | null
          offline_minutes: number | null
          region: string | null
          status: string | null
          went_offline_at: string | null
        }
        Relationships: []
      }
      orphaned_assignments: {
        Row: {
          end_at: string | null
          id: string | null
          job_id: string | null
          planned_hours: number | null
          role: string | null
          start_at: string | null
          status: Database["public"]["Enums"]["assign_status"] | null
          technician_id: string | null
          technician_profile_id: string | null
          travel_from_site_id: string | null
          travel_minutes_est: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignments_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_tech_capacity_daily"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "assignments_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "assignments_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "assignments_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "assignments_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "assignments_travel_from_site_id_fkey"
            columns: ["travel_from_site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_keywords_search: {
        Row: {
          ai_extracted_text: string | null
          created_at: string | null
          customer_name: string | null
          device_category: string | null
          device_id: string | null
          file_path: string | null
          id: string | null
          latitude: number | null
          location_clues: Json | null
          longitude: number | null
          manufacturer: string | null
          model: string | null
          photo_type: string | null
          project_id: string | null
          project_name: string | null
          serial_visible: string | null
          text_detected: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "field_installation_photos_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_installation_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_dashboard"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "field_installation_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_installation_costs"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "field_installation_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_installation_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      popular_keywords: {
        Row: {
          id: string | null
          keyword: string | null
          usage_count: number | null
        }
        Relationships: []
      }
      project_dashboard: {
        Row: {
          camera_count: number | null
          client_name: string | null
          completed_checklists: number | null
          completion_percentage: number | null
          estimated_end_date: string | null
          estimated_start_date: string | null
          installed_devices: number | null
          last_activity: string | null
          location_count: number | null
          photo_count: number | null
          project_code: string | null
          project_id: string | null
          project_name: string | null
          sensor_count: number | null
          signoff_count: number | null
          status: Database["public"]["Enums"]["project_status"] | null
          tested_devices: number | null
          total_checklists: number | null
          total_devices: number | null
        }
        Relationships: []
      }
      project_handoff_ready: {
        Row: {
          contract_value: number | null
          customer_name: string | null
          customer_sf_id: string | null
          description: string | null
          fulfilled_count: number | null
          job_code: string | null
          job_id: string | null
          line_item_count: number | null
          opportunity_name: string | null
          pending_count: number | null
          salesforce_opportunity_id: string | null
          scheduled_date: string | null
          status: Database["public"]["Enums"]["job_status"] | null
        }
        Relationships: []
      }
      project_installation_costs: {
        Row: {
          installed_devices: number | null
          project_code: string | null
          project_id: string | null
          total_devices: number | null
          total_installation_cost: number | null
          total_labor_cost: number | null
          total_labor_hours: number | null
          total_parts_cost: number | null
        }
        Relationships: []
      }
      project_profitability: {
        Row: {
          avg_margin_pct: number | null
          best_job_margin: number | null
          client_name: string | null
          gross_profit: number | null
          id: string | null
          monthly_recurring_revenue: number | null
          name: string | null
          total_cost: number | null
          total_jobs: number | null
          total_revenue: number | null
          worst_job_margin: number | null
        }
        Relationships: []
      }
      survey_catalog_match_metrics: {
        Row: {
          match_rate: number | null
          matched_items: number | null
          total_items: number | null
          unmatched_items: number | null
        }
        Relationships: []
      }
      sync_statistics: {
        Row: {
          active_customers: number | null
          customers_needing_sync: number | null
          demo_customers: number | null
          failed_syncs_last_week: number | null
          last_sync_date: string | null
          successful_syncs_last_week: number | null
          terminated_customers: number | null
          total_customers: number | null
        }
        Relationships: []
      }
      training_module_metrics: {
        Row: {
          avg_completion_time: number | null
          avg_score_pct: number | null
          content_type: string | null
          duration_minutes: number | null
          failed_users: number | null
          last_attempt_date: string | null
          module_id: string | null
          module_title: string | null
          pass_rate: number | null
          passed_users: number | null
          skill_code: string | null
          total_assessment_attempts: number | null
          total_attempts: number | null
        }
        Relationships: [
          {
            foreignKeyName: "training_modules_skill_code_fkey"
            columns: ["skill_code"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["skill_code"]
          },
        ]
      }
      v_assign_busy: {
        Row: {
          busy_end: string | null
          busy_start: string | null
          busy_type: string | null
          job_id: string | null
          technician_profile_id: string | null
        }
        Insert: {
          busy_end?: string | null
          busy_start?: string | null
          busy_type?: never
          job_id?: string | null
          technician_profile_id?: string | null
        }
        Update: {
          busy_end?: string | null
          busy_start?: string | null
          busy_type?: never
          job_id?: string | null
          technician_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "assignments_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "assignments_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "assignments_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "assignments_technician_profile_id_fkey"
            columns: ["technician_profile_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_blackout_busy: {
        Row: {
          busy_end: string | null
          busy_start: string | null
          busy_type: string | null
          job_id: string | null
          technician_profile_id: string | null
        }
        Relationships: []
      }
      v_catalog_matching_stats: {
        Row: {
          match_percentage: number | null
          matched_items: number | null
          survey_id: string | null
          total_items: number | null
        }
        Relationships: []
      }
      v_fleet_expense_kpis_monthly: {
        Row: {
          count: number | null
          kind: string | null
          month: string | null
          total_amount: number | null
        }
        Relationships: []
      }
      v_fleet_expense_summary: {
        Row: {
          amount: number | null
          category_code: string | null
          currency: string | null
          doc_id: string | null
          expense_date: string | null
          expense_id: string | null
          gl_account: string | null
          kind: string | null
          status: string | null
          tax_amount: number | null
          vehicle_id: string | null
          vendor_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_expenses_doc_id_fkey"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "doc_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_expenses_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      v_popular_survey_equipment: {
        Row: {
          category: string | null
          id: string | null
          name: string | null
          sku: string | null
          unit_price: number | null
          usage_count: number | null
        }
        Relationships: []
      }
      v_pto_busy: {
        Row: {
          busy_end: string | null
          busy_start: string | null
          busy_type: string | null
          job_id: string | null
          technician_profile_id: string | null
        }
        Relationships: []
      }
      v_reconciliation_dashboard: {
        Row: {
          installed_qty: number | null
          job_id: string | null
          planned_devices: number | null
          quoted_item: string | null
          quoted_qty: number | null
          reconciliation_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salesforce_equipment_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_variance"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "salesforce_equipment_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_job_profitability"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "salesforce_equipment_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analytics_sla_status"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "salesforce_equipment_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salesforce_equipment_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "project_handoff_ready"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "salesforce_equipment_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_map_pins"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "salesforce_equipment_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_dispatch_queue"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "salesforce_equipment_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "view_job_profitability"
            referencedColumns: ["job_id"]
          },
        ]
      }
      v_tech_busy: {
        Row: {
          busy_end: string | null
          busy_start: string | null
          busy_type: string | null
          job_id: string | null
          technician_profile_id: string | null
        }
        Relationships: []
      }
      view_ai_analytics: {
        Row: {
          date: string | null
          negative_ratings: number | null
          positive_ratings: number | null
          total_queries: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      view_available_technicians: {
        Row: {
          avatar_url: string | null
          email: string | null
          full_name: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          email?: string | null
          full_name?: never
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          email?: string | null
          full_name?: never
          user_id?: string | null
        }
        Relationships: []
      }
      view_dashboard_expiring_contracts: {
        Row: {
          contract_end_date: string | null
          customer_id: string | null
          customer_name: string | null
          days_remaining: number | null
          mrr: number | null
          plan_name: string | null
        }
        Relationships: []
      }
      view_dashboard_revenue_leakage: {
        Row: {
          customer_id: string | null
          customer_name: string | null
          customer_type: number | null
          email: string | null
          join_date: string | null
        }
        Relationships: []
      }
      view_dispatch_map_pins: {
        Row: {
          duration: number | null
          email: string | null
          installation_address: string | null
          job_code: string | null
          job_id: string | null
          lat: number | null
          lng: number | null
          phone_number: string | null
          pin_color: string | null
          priority: number | null
          title: string | null
        }
        Relationships: []
      }
      view_dispatch_queue: {
        Row: {
          account_name: string | null
          assignment_count: number | null
          customer_email: string | null
          customer_id: number | null
          customer_name: string | null
          customer_phone: string | null
          due_by: string | null
          earliest_start: string | null
          installation_address: string | null
          installation_city: string | null
          installation_state: string | null
          installation_zip: string | null
          job_code: string | null
          job_created_at: string | null
          job_id: string | null
          job_status: Database["public"]["Enums"]["job_status"] | null
          legacy_id: number | null
          priority: number | null
          readiness_score: number | null
          scope_summary: string | null
          site_latitude: number | null
          site_longitude: number | null
        }
        Relationships: []
      }
      view_job_profitability: {
        Row: {
          completed_at: string | null
          customer_name: string | null
          gross_margin_dollar: number | null
          gross_margin_percent: number | null
          job_code: string | null
          job_id: string | null
          labor_cost: number | null
          material_cost: number | null
          sold_revenue: number | null
          status: Database["public"]["Enums"]["job_status"] | null
          total_cost: number | null
        }
        Relationships: []
      }
      view_project_map_stores: {
        Row: {
          account_name: string | null
          address: string | null
          assigned_tech_id: string | null
          assigned_tech_name: string | null
          city: string | null
          id: string | null
          latitude: number | null
          longitude: number | null
          special_project_id: string | null
          state: string | null
          status: string | null
          store_name: string | null
          zip: string | null
        }
        Relationships: [
          {
            foreignKeyName: "special_project_stores_assigned_tech_id_fkey"
            columns: ["assigned_tech_id"]
            isOneToOne: false
            referencedRelation: "analytics_workforce_performance"
            referencedColumns: ["tech_id"]
          },
          {
            foreignKeyName: "special_project_stores_assigned_tech_id_fkey"
            columns: ["assigned_tech_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "special_project_stores_assigned_tech_id_fkey"
            columns: ["assigned_tech_id"]
            isOneToOne: false
            referencedRelation: "v_blackout_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "special_project_stores_assigned_tech_id_fkey"
            columns: ["assigned_tech_id"]
            isOneToOne: false
            referencedRelation: "v_pto_busy"
            referencedColumns: ["technician_profile_id"]
          },
          {
            foreignKeyName: "special_project_stores_assigned_tech_id_fkey"
            columns: ["assigned_tech_id"]
            isOneToOne: false
            referencedRelation: "view_available_technicians"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "special_project_stores_special_project_id_fkey"
            columns: ["special_project_id"]
            isOneToOne: false
            referencedRelation: "special_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_tech_capacity_daily: {
        Row: {
          assignments_count: number | null
          full_name: string | null
          planned_hours: number | null
          status: string | null
          technician_id: string | null
          work_date: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_run_assignment_cleanup: {
        Args: { p_dry_run?: boolean }
        Returns: Json
      }
      apply_optimized_route_to_project: {
        Args: { route_opt_proj_id: string }
        Returns: Json
      }
      approve_user_role: {
        Args: {
          p_approver_id: string
          p_new_role: string
          p_notes?: string
          p_user_id: string
        }
        Returns: undefined
      }
      assign_tech_to_job_v2: {
        Args: {
          start_time: string
          target_job_id: string
          tech_user_id: string
        }
        Returns: Json
      }
      auto_link_survey_items_to_equipment: { Args: never; Returns: undefined }
      bridge_project_to_route_opt:
        | {
            Args: {
              project_name_input: string
              target_special_project_id: string
              tech_config: Json
            }
            Returns: Json
          }
        | {
            Args: {
              project_name_input: string
              start_date_input?: string
              target_special_project_id: string
              tech_config: Json
            }
            Returns: Json
          }
      bulk_shift_technician_schedule: {
        Args: {
          p_from_date?: string
          p_performed_by?: string
          p_project_filter?: string
          p_reason?: string
          p_shift_days: number
          p_skip_weekends?: boolean
          p_technician_id: string
        }
        Returns: {
          jobs_updated: number
          log_id: string
        }[]
      }
      calculate_head_end_equipment: {
        Args: { p_survey_id: string }
        Returns: {
          device_category_out: string
          device_count_out: number
          head_end_location_out: string
          quantity_out: number
          required_equipment_code_out: string
          required_equipment_name_out: string
        }[]
      }
      calculate_job_estimate: {
        Args: {
          p_cable_run_count: number
          p_camera_count: number
          p_door_count: number
          p_project_id: string
          p_sensor_count: number
        }
        Returns: {
          base_days: number
          total_days: number
          travel_days: number
        }[]
      }
      calculate_project_actuals: {
        Args: { target_project_id: string }
        Returns: undefined
      }
      calculate_project_completion: {
        Args: { project_uuid: string }
        Returns: number
      }
      calculate_project_labor_cost: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      calculate_store_actuals: {
        Args: { target_store_id: string }
        Returns: undefined
      }
      cleanup_old_logs: {
        Args: {
          archive_table: string
          retention_days?: number
          table_name: string
        }
        Returns: {
          archived_count: number
          deleted_count: number
        }[]
      }
      create_assignment_with_project: {
        Args: {
          p_actor_email: string
          p_end_at: string
          p_job_id: string
          p_reason?: string
          p_start_at: string
          p_technician_id: string
        }
        Returns: Json
      }
      delete_device_cascade: {
        Args: { p_device_id: string; p_project_id: string }
        Returns: Json
      }
      find_best_equipment_match: {
        Args: { device_category?: string; spoken_text: string }
        Returns: {
          confidence: number
          equipment_id: string
          equipment_name: string
        }[]
      }
      generate_po_number: { Args: never; Returns: string }
      generate_special_project_jobs: {
        Args: { target_project_id: string }
        Returns: Json
      }
      generate_ticket_number: { Args: never; Returns: string }
      get_ai_schema: { Args: never; Returns: Json }
      get_catalog_match_stats: {
        Args: { days_back?: number }
        Returns: {
          category: string
          device_count: number
          match_rate: number
          matched_items: number
          most_common_device: string
          total_items: number
        }[]
      }
      get_customer_id_from_alarm: {
        Args: { p_alarm_customer_id: number }
        Returns: number
      }
      get_included_skills: {
        Args: { skill_code_param: string }
        Returns: string[]
      }
      get_next_location_number: {
        Args: { p_category: string; p_project_id: string }
        Returns: string
      }
      get_project_installation_stats: {
        Args: { p_project_id: string }
        Returns: {
          completion_percentage: number
          installed_devices: number
          photos_complete: number
          return_trip_complete: boolean
          tested_devices: number
          total_devices: number
        }[]
      }
      get_required_products: {
        Args: { p_product_code: string; p_selected_choices?: Json }
        Returns: {
          dependency_source: string
          notes: string
          quantity: number
          required_product_code: string
          required_product_name: string
        }[]
      }
      get_unmapped_devices: {
        Args: { limit_count?: number }
        Returns: {
          device_category: string
          device_type: string
          last_used: string
          occurrence_count: number
          sample_notes: string
        }[]
      }
      get_unread_notification_count: { Args: never; Returns: number }
      get_user_projects: {
        Args: { p_user_id: string }
        Returns: {
          assigned_at: string
          project_code: string
          project_id: string
          project_name: string
          role: string
        }[]
      }
      get_user_role: { Args: never; Returns: string }
      get_user_training_status: {
        Args: { user_id_param: string }
        Returns: string
      }
      get_utilization_metrics: {
        Args: { end_date: string; start_date: string }
        Returns: Json
      }
      has_any_role: { Args: { roles: string[] }; Returns: boolean }
      has_min_role_combined: {
        Args: {
          _min_role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role:
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
        | { Args: { check_role: string }; Returns: boolean }
      initialize_return_trip_checklist: {
        Args: { p_project_id: string }
        Returns: number
      }
      is_admin: { Args: never; Returns: boolean }
      is_return_trip_complete: {
        Args: { p_project_id: string }
        Returns: boolean
      }
      is_staff: { Args: never; Returns: boolean }
      jwt_email: { Args: never; Returns: string }
      link_ticket_to_job: {
        Args: { p_job_id: string; p_ticket_id: string }
        Returns: undefined
      }
      lookup_product_by_barcode: {
        Args: { p_barcode: string }
        Returns: {
          barcode_ean: string
          barcode_qr: string
          barcode_upc: string
          id: string
          manufacturer_sku: string
          match_type: string
          product_category: string
          product_code: string
          product_name: string
          unit_cost: number
          unit_price: number
        }[]
      }
      map_device_category: { Args: { input_category: string }; Returns: string }
      map_product_to_device_category: {
        Args: { p_category: string }
        Returns: string
      }
      mark_all_notifications_read: { Args: never; Returns: number }
      match_knowledge: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          chunk_text: string
          document_id: string
          document_name: string
          id: string
          similarity: number
        }[]
      }
      match_knowledge_hybrid: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
          query_text: string
        }
        Returns: {
          chunk_text: string
          document_id: string
          document_name: string
          similarity: number
        }[]
      }
      match_scanned_device: {
        Args: {
          p_category?: string
          p_manufacturer?: string
          p_product_id?: string
          p_product_name: string
          p_project_id: string
        }
        Returns: {
          confidence_score: number
          device_category: string
          device_id: string
          device_type: string
          is_installed: boolean
          match_reason: string
          product_id: string
          serial_number: string
          survey_location: string
        }[]
      }
      migrate_survey_locations_to_project_locations: {
        Args: { p_project_id: string }
        Returns: number
      }
      preview_shift_technician_schedule: {
        Args: {
          p_from_date?: string
          p_project_filter?: string
          p_shift_days: number
          p_skip_weekends?: boolean
          p_technician_id: string
        }
        Returns: {
          conflict_details: string
          current_scheduled_end: string
          current_scheduled_start: string
          duration_mins: number
          has_conflict: boolean
          job_code: string
          job_id: string
          new_scheduled_end: string
          new_scheduled_start: string
          project_name: string
          site_name: string
        }[]
      }
      process_embedding_queue_batch: { Args: never; Returns: undefined }
      process_sync_queue: {
        Args: never
        Returns: {
          failed_count: number
          processed_count: number
        }[]
      }
      recalculate_job_costs: { Args: { p_job_id: string }; Returns: undefined }
      recalculate_project_financials: {
        Args: { target_project_id: string }
        Returns: Json
      }
      refresh_project_dashboard: { Args: never; Returns: undefined }
      reject_user_role: {
        Args: { p_approver_id: string; p_notes?: string; p_user_id: string }
        Returns: undefined
      }
      release_job_to_field: {
        Args: { p_job_id: string; p_selected_equipment_ids: string[] }
        Returns: undefined
      }
      rename_project_location: {
        Args: { p_location_id: string; p_new_name: string }
        Returns: boolean
      }
      reset_special_project: {
        Args: { target_project_id: string }
        Returns: Json
      }
      reset_special_project_jobs: {
        Args: { target_project_id: string }
        Returns: Json
      }
      run_assignment_cleanup: { Args: { p_dry_run?: boolean }; Returns: Json }
      run_safe_query: {
        Args: { params?: Json; query_type: string; search_term?: string }
        Returns: Json
      }
      safe_assignment_lookup: {
        Args: { user_uuid: string }
        Returns: {
          assignment_id: string
          assignment_status: Database["public"]["Enums"]["assign_status"]
          end_time: string
          job_id: string
          start_time: string
          tech_id: string
        }[]
      }
      search_equipment_catalog_simple: {
        Args: {
          category_filter?: string
          limit_results?: number
          search_query: string
        }
        Returns: {
          category: string
          id: string
          manufacturer: string
          name: string
          relevance_score: number
          sku: string
          unit_price: number
        }[]
      }
      search_photos_by_keywords: {
        Args: {
          p_device_category?: string
          p_limit?: number
          p_manufacturer?: string
          p_project_id?: string
          p_search_term: string
        }
        Returns: {
          ai_keywords: Json
          created_at: string
          device_id: string
          file_path: string
          match_type: string
          photo_id: string
          photo_type: string
          project_id: string
          relevance_score: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      sync_store_address_from_customer: {
        Args: { store_id_param: string }
        Returns: undefined
      }
      update_api_key_usage: { Args: { p_key_id: string }; Returns: undefined }
      update_survey_metrics: {
        Args: {
          p_crew_size: number
          p_equipment_cost: number
          p_install_days: number
          p_install_minutes: number
          p_labor_cost: number
          p_quality_score: number
          p_survey_id: string
        }
        Returns: undefined
      }
      upsert_notification: {
        Args: {
          p_actor_profile_id: string
          p_body: string
          p_data: Json
          p_dedupe_key: string
          p_entity_id: string
          p_entity_type: string
          p_recipient_profile_id: string
          p_title: string
          p_type: string
        }
        Returns: string
      }
      user_can_access_project: {
        Args: { p_project_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "tech"
        | "dispatch"
        | "management"
        | "sales"
        | "admin"
        | "pm"
        | "admin_technician"
        | "service"
      assign_status: "scheduled" | "in_progress" | "complete" | "cancelled"
      checklist_item_type:
        | "boolean"
        | "text"
        | "number"
        | "photo"
        | "signature"
        | "multi_photo"
      device_category:
        | "access_control"
        | "camera"
        | "sensor"
        | "network_headend"
      device_status:
        | "planned"
        | "installed"
        | "tested"
        | "commissioned"
        | "failed"
      doc_kind:
        | "fuel_receipt"
        | "maintenance_invoice"
        | "parking_receipt"
        | "toll_receipt"
        | "insurance_premium"
        | "registration_fee"
        | "tag_fee"
        | "license_renewal"
        | "inspection_report"
        | "emissions_test"
        | "roadside_membership"
        | "roadside_callout"
        | "tires"
        | "tire_service"
        | "windshield"
        | "glass_repair"
        | "wipers"
        | "fluids"
        | "breakdown_cost"
        | "tow"
        | "mobile_mechanic"
        | "overtime_labor"
        | "other"
      expense_status:
        | "draft"
        | "needs_review"
        | "approved"
        | "rejected"
        | "posted"
      issue_priority: "critical" | "high" | "medium" | "low"
      issue_status:
        | "new"
        | "investigating"
        | "in_progress"
        | "testing"
        | "resolved"
        | "closed"
      issue_type:
        | "bug"
        | "feature_request"
        | "ui_ux_issue"
        | "performance"
        | "security"
      job_status:
        | "planned"
        | "scheduled"
        | "in_progress"
        | "complete"
        | "blocked"
        | "on_hold"
        | "Planning"
        | "Completed"
        | "survey_assigned"
        | "survey_complete"
        | "project_created"
        | "installation_in_progress"
        | "installation_complete"
        | "customer_converted"
        | "cancelled"
      payment_method:
        | "fuel_card"
        | "corp_card"
        | "cash"
        | "invoice"
        | "ach"
        | "other"
      project_status:
        | "planning"
        | "active"
        | "on_hold"
        | "completed"
        | "cancelled"
        | "in_progress"
      signoff_type: "technician" | "pm" | "client"
      survey_status:
        | "draft"
        | "in_progress"
        | "completed"
        | "reviewed"
        | "pending"
        | "complete"
      time_type: "regular" | "overtime" | "travel" | "break"
      user_role: "technician" | "pm" | "ops" | "admin" | "service"
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
  public: {
    Enums: {
      app_role: [
        "tech",
        "dispatch",
        "management",
        "sales",
        "admin",
        "pm",
        "admin_technician",
        "service",
      ],
      assign_status: ["scheduled", "in_progress", "complete", "cancelled"],
      checklist_item_type: [
        "boolean",
        "text",
        "number",
        "photo",
        "signature",
        "multi_photo",
      ],
      device_category: [
        "access_control",
        "camera",
        "sensor",
        "network_headend",
      ],
      device_status: [
        "planned",
        "installed",
        "tested",
        "commissioned",
        "failed",
      ],
      doc_kind: [
        "fuel_receipt",
        "maintenance_invoice",
        "parking_receipt",
        "toll_receipt",
        "insurance_premium",
        "registration_fee",
        "tag_fee",
        "license_renewal",
        "inspection_report",
        "emissions_test",
        "roadside_membership",
        "roadside_callout",
        "tires",
        "tire_service",
        "windshield",
        "glass_repair",
        "wipers",
        "fluids",
        "breakdown_cost",
        "tow",
        "mobile_mechanic",
        "overtime_labor",
        "other",
      ],
      expense_status: [
        "draft",
        "needs_review",
        "approved",
        "rejected",
        "posted",
      ],
      issue_priority: ["critical", "high", "medium", "low"],
      issue_status: [
        "new",
        "investigating",
        "in_progress",
        "testing",
        "resolved",
        "closed",
      ],
      issue_type: [
        "bug",
        "feature_request",
        "ui_ux_issue",
        "performance",
        "security",
      ],
      job_status: [
        "planned",
        "scheduled",
        "in_progress",
        "complete",
        "blocked",
        "on_hold",
        "Planning",
        "Completed",
        "survey_assigned",
        "survey_complete",
        "project_created",
        "installation_in_progress",
        "installation_complete",
        "customer_converted",
        "cancelled",
      ],
      payment_method: [
        "fuel_card",
        "corp_card",
        "cash",
        "invoice",
        "ach",
        "other",
      ],
      project_status: [
        "planning",
        "active",
        "on_hold",
        "completed",
        "cancelled",
        "in_progress",
      ],
      signoff_type: ["technician", "pm", "client"],
      survey_status: [
        "draft",
        "in_progress",
        "completed",
        "reviewed",
        "pending",
        "complete",
      ],
      time_type: ["regular", "overtime", "travel", "break"],
      user_role: ["technician", "pm", "ops", "admin", "service"],
    },
  },
} as const
