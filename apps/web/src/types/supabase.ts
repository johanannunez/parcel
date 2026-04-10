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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      block_requests: {
        Row: {
          adults: number
          check_in_time: string | null
          check_out_time: string | null
          children: number
          cleaning_fee: number | null
          confirmed_at: string | null
          created_at: string
          damage_acknowledged: boolean
          end_date: string
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          is_owner_staying: boolean
          needs_lock_code: boolean
          note: string | null
          owner_id: string
          pets: number
          property_id: string
          reason: string | null
          requested_lock_code: string | null
          start_date: string
          status: string
          updated_at: string
          wants_cleaning: boolean
        }
        Insert: {
          adults?: number
          check_in_time?: string | null
          check_out_time?: string | null
          children?: number
          cleaning_fee?: number | null
          confirmed_at?: string | null
          created_at?: string
          damage_acknowledged?: boolean
          end_date: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          is_owner_staying?: boolean
          needs_lock_code?: boolean
          note?: string | null
          owner_id: string
          pets?: number
          property_id: string
          reason?: string | null
          requested_lock_code?: string | null
          start_date: string
          status?: string
          updated_at?: string
          wants_cleaning?: boolean
        }
        Update: {
          adults?: number
          check_in_time?: string | null
          check_out_time?: string | null
          children?: number
          cleaning_fee?: number | null
          confirmed_at?: string | null
          created_at?: string
          damage_acknowledged?: boolean
          end_date?: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          is_owner_staying?: boolean
          needs_lock_code?: boolean
          note?: string | null
          owner_id?: string
          pets?: number
          property_id?: string
          reason?: string | null
          requested_lock_code?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          wants_cleaning?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "block_requests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "block_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          check_in: string
          check_out: string
          created_at: string
          currency: string
          external_id: string | null
          guest_email: string | null
          guest_name: string | null
          id: string
          nights: number | null
          notes: string | null
          property_id: string
          source: Database["public"]["Enums"]["booking_source"]
          status: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          check_in: string
          check_out: string
          created_at?: string
          currency?: string
          external_id?: string | null
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          nights?: number | null
          notes?: string | null
          property_id: string
          source?: Database["public"]["Enums"]["booking_source"]
          status?: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          check_in?: string
          check_out?: string
          created_at?: string
          currency?: string
          external_id?: string | null
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          nights?: number | null
          notes?: string | null
          property_id?: string
          source?: Database["public"]["Enums"]["booking_source"]
          status?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          connected_at: string
          created_at: string
          disconnected_at: string | null
          external_account_id: string | null
          id: string
          metadata: Json
          owner_id: string
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          connected_at?: string
          created_at?: string
          disconnected_at?: string | null
          external_account_id?: string | null
          id?: string
          metadata?: Json
          owner_id: string
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          connected_at?: string
          created_at?: string
          disconnected_at?: string | null
          external_account_id?: string | null
          id?: string
          metadata?: Json
          owner_id?: string
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          assigned_to: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          message: string | null
          phone: string | null
          property_address: string | null
          property_count: number | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          source: string | null
          status: Database["public"]["Enums"]["inquiry_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone?: string | null
          property_address?: string | null
          property_count?: number | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          source?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone?: string | null
          property_address?: string | null
          property_count?: number | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          source?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_drafts: {
        Row: {
          current_section: string | null
          draft: Json
          owner_id: string
          updated_at: string
        }
        Insert: {
          current_section?: string | null
          draft?: Json
          owner_id: string
          updated_at?: string
        }
        Update: {
          current_section?: string | null
          draft?: Json
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_drafts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_kyc: {
        Row: {
          back_photo_url: string | null
          consent_at: string | null
          consent_given: boolean
          created_at: string
          expiration_date: string | null
          front_photo_url: string | null
          id: string
          issuing_state: string | null
          legal_name: string | null
          license_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          back_photo_url?: string | null
          consent_at?: string | null
          consent_given?: boolean
          created_at?: string
          expiration_date?: string | null
          front_photo_url?: string | null
          id?: string
          issuing_state?: string | null
          legal_name?: string | null
          license_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          back_photo_url?: string | null
          consent_at?: string | null
          consent_given?: boolean
          created_at?: string
          expiration_date?: string | null
          front_photo_url?: string | null
          id?: string
          issuing_state?: string | null
          legal_name?: string | null
          license_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_kyc_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_setup_drafts: {
        Row: {
          data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_setup_drafts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          created_at: string
          fees: number
          gross_revenue: number
          id: string
          net_payout: number
          notes: string | null
          paid_at: string | null
          period_end: string
          period_start: string
          property_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fees?: number
          gross_revenue?: number
          id?: string
          net_payout?: number
          notes?: string | null
          paid_at?: string | null
          period_end: string
          period_start: string
          property_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fees?: number
          gross_revenue?: number
          id?: string
          net_payout?: number
          notes?: string | null
          paid_at?: string | null
          period_end?: string
          period_start?: string
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          contact_method: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          mailing_address: Json | null
          onboarding_completed_at: string | null
          phone: string | null
          preferred_name: string | null
          property_count_estimate: string | null
          referral_source: string | null
          role: Database["public"]["Enums"]["user_role"]
          timezone: string | null
          updated_at: string
          deleted_at: string | null
          years_investing: string | null
        }
        Insert: {
          avatar_url?: string | null
          contact_method?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          mailing_address?: Json | null
          onboarding_completed_at?: string | null
          phone?: string | null
          preferred_name?: string | null
          property_count_estimate?: string | null
          referral_source?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          timezone?: string | null
          updated_at?: string
          deleted_at?: string | null
          years_investing?: string | null
        }
        Update: {
          avatar_url?: string | null
          contact_method?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          mailing_address?: Json | null
          onboarding_completed_at?: string | null
          phone?: string | null
          preferred_name?: string | null
          property_count_estimate?: string | null
          referral_source?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          timezone?: string | null
          updated_at?: string
          deleted_at?: string | null
          years_investing?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          active: boolean
          address_line1: string
          address_line2: string | null
          agreement_acknowledged_at: string | null
          agreement_signed_at: string | null
          amenities: Json | null
          bathrooms: number | null
          bed_arrangements: Json | null
          bedrooms: number | null
          city: string
          cleaning_choice: string | null
          cleaning_team: Json | null
          compliance_details: Json | null
          country: string
          created_at: string
          currently_rented: boolean | null
          financial_baseline: Json | null
          guest_capacity: number | null
          guidebook_spots: Json | null
          half_bathrooms: number | null
          hospitable_property_id: string | null
          house_rules: Json | null
          ical_url: string | null
          id: string
          latitude: number | null
          listed_elsewhere: boolean | null
          longitude: number | null
          name: string | null
          neighborhood: string | null
          onboarded_at: string | null
          owner_id: string
          parking_spaces: number | null
          parking_type: string | null
          photos: Json | null
          postal_code: string
          property_subtype: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          setup_status: string
          square_feet: number | null
          state: string
          stories: number | null
          timezone: string | null
          updated_at: string
          wifi_details: Json | null
          year_built: number | null
          year_purchased: number | null
        }
        Insert: {
          active?: boolean
          address_line1: string
          address_line2?: string | null
          agreement_acknowledged_at?: string | null
          agreement_signed_at?: string | null
          amenities?: Json | null
          bathrooms?: number | null
          bed_arrangements?: Json | null
          bedrooms?: number | null
          city: string
          cleaning_choice?: string | null
          cleaning_team?: Json | null
          compliance_details?: Json | null
          country?: string
          created_at?: string
          currently_rented?: boolean | null
          financial_baseline?: Json | null
          guest_capacity?: number | null
          guidebook_spots?: Json | null
          half_bathrooms?: number | null
          hospitable_property_id?: string | null
          house_rules?: Json | null
          ical_url?: string | null
          id?: string
          latitude?: number | null
          listed_elsewhere?: boolean | null
          longitude?: number | null
          name?: string | null
          neighborhood?: string | null
          onboarded_at?: string | null
          owner_id: string
          parking_spaces?: number | null
          parking_type?: string | null
          photos?: Json | null
          postal_code: string
          property_subtype?: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          setup_status?: string
          square_feet?: number | null
          state: string
          stories?: number | null
          timezone?: string | null
          updated_at?: string
          wifi_details?: Json | null
          year_built?: number | null
          year_purchased?: number | null
        }
        Update: {
          active?: boolean
          address_line1?: string
          address_line2?: string | null
          agreement_acknowledged_at?: string | null
          agreement_signed_at?: string | null
          amenities?: Json | null
          bathrooms?: number | null
          bed_arrangements?: Json | null
          bedrooms?: number | null
          city?: string
          cleaning_choice?: string | null
          cleaning_team?: Json | null
          compliance_details?: Json | null
          country?: string
          created_at?: string
          currently_rented?: boolean | null
          financial_baseline?: Json | null
          guest_capacity?: number | null
          guidebook_spots?: Json | null
          half_bathrooms?: number | null
          hospitable_property_id?: string | null
          house_rules?: Json | null
          ical_url?: string | null
          id?: string
          latitude?: number | null
          listed_elsewhere?: boolean | null
          longitude?: number | null
          name?: string | null
          neighborhood?: string | null
          onboarded_at?: string | null
          owner_id?: string
          parking_spaces?: number | null
          parking_type?: string | null
          photos?: Json | null
          postal_code?: string
          property_subtype?: string | null
          property_type?: Database["public"]["Enums"]["property_type"]
          setup_status?: string
          square_feet?: number | null
          state?: string
          stories?: number | null
          timezone?: string | null
          updated_at?: string
          wifi_details?: Json | null
          year_built?: number | null
          year_purchased?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_amenities: {
        Row: {
          amenity_key: string
          created_at: string
          metadata: Json
          property_id: string
        }
        Insert: {
          amenity_key: string
          created_at?: string
          metadata?: Json
          property_id: string
        }
        Update: {
          amenity_key?: string
          created_at?: string
          metadata?: Json
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_amenities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_compliance: {
        Row: {
          created_at: string
          hoa_allows_str: string | null
          hoa_contact: string | null
          hoa_exists: boolean | null
          hoa_fees: number | null
          insurance_carrier: string | null
          insurance_document_url: string | null
          insurance_expires: string | null
          insurance_policy_number: string | null
          mortgage_allows_str: boolean | null
          mortgage_holder: string | null
          permit_document_url: string | null
          permit_expires: string | null
          permit_number: string | null
          permit_required: string | null
          property_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hoa_allows_str?: string | null
          hoa_contact?: string | null
          hoa_exists?: boolean | null
          hoa_fees?: number | null
          insurance_carrier?: string | null
          insurance_document_url?: string | null
          insurance_expires?: string | null
          insurance_policy_number?: string | null
          mortgage_allows_str?: boolean | null
          mortgage_holder?: string | null
          permit_document_url?: string | null
          permit_expires?: string | null
          permit_number?: string | null
          permit_required?: string | null
          property_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hoa_allows_str?: string | null
          hoa_contact?: string | null
          hoa_exists?: boolean | null
          hoa_fees?: number | null
          insurance_carrier?: string | null
          insurance_document_url?: string | null
          insurance_expires?: string | null
          insurance_policy_number?: string | null
          mortgage_allows_str?: boolean | null
          mortgage_holder?: string | null
          permit_document_url?: string | null
          permit_expires?: string | null
          permit_number?: string | null
          permit_required?: string | null
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_compliance_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_rules: {
        Row: {
          cancellation_policy: string | null
          check_in_time: string | null
          check_out_time: string | null
          children_welcome: boolean | null
          cleaning_fee: number | null
          created_at: string
          damage_deposit: number | null
          events_allowed: boolean | null
          extra_guest_fee: number | null
          extra_guest_threshold: number | null
          max_nights: number | null
          min_nights: number | null
          pet_fee: number | null
          pets_allowed: boolean | null
          property_id: string
          quiet_hours: string | null
          smoking_policy: string | null
          updated_at: string
        }
        Insert: {
          cancellation_policy?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          children_welcome?: boolean | null
          cleaning_fee?: number | null
          created_at?: string
          damage_deposit?: number | null
          events_allowed?: boolean | null
          extra_guest_fee?: number | null
          extra_guest_threshold?: number | null
          max_nights?: number | null
          min_nights?: number | null
          pet_fee?: number | null
          pets_allowed?: boolean | null
          property_id: string
          quiet_hours?: string | null
          smoking_policy?: string | null
          updated_at?: string
        }
        Update: {
          cancellation_policy?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          children_welcome?: boolean | null
          cleaning_fee?: number | null
          created_at?: string
          damage_deposit?: number | null
          events_allowed?: boolean | null
          extra_guest_fee?: number | null
          extra_guest_threshold?: number | null
          max_nights?: number | null
          min_nights?: number | null
          pet_fee?: number | null
          pets_allowed?: boolean | null
          property_id?: string
          quiet_hours?: string | null
          smoking_policy?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_rules_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_setup_drafts: {
        Row: {
          data: Json
          id: string
          property_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          data?: Json
          id?: string
          property_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          data?: Json
          id?: string
          property_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_setup_drafts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_setup_drafts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_team: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          notes: string | null
          phone: string | null
          property_id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          property_id: string
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          property_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_team_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      setup_field_versions: {
        Row: {
          data: Json
          id: string
          property_id: string | null
          saved_at: string
          saved_by: string
          step_key: string
          user_id: string
          version_number: number
        }
        Insert: {
          data?: Json
          id?: string
          property_id?: string | null
          saved_at?: string
          saved_by: string
          step_key: string
          user_id: string
          version_number?: number
        }
        Update: {
          data?: Json
          id?: string
          property_id?: string | null
          saved_at?: string
          saved_by?: string
          step_key?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "setup_field_versions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setup_field_versions_saved_by_fkey"
            columns: ["saved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setup_field_versions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      signed_documents: {
        Row: {
          boldsign_document_id: string
          created_at: string
          id: string
          property_id: string | null
          signed_at: string | null
          signed_pdf_url: string | null
          status: string
          template_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          boldsign_document_id: string
          created_at?: string
          id?: string
          property_id?: string | null
          signed_at?: string | null
          signed_pdf_url?: string | null
          status?: string
          template_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          boldsign_document_id?: string
          created_at?: string
          id?: string
          property_id?: string | null
          signed_at?: string | null
          signed_pdf_url?: string | null
          status?: string
          template_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signed_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signed_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session_log: {
        Row: {
          id: string
          user_id: string
          ip_address: string | null
          user_agent: string | null
          browser: string | null
          os: string | null
          device_type: string | null
          country: string | null
          city: string | null
          logged_in_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ip_address?: string | null
          user_agent?: string | null
          browser?: string | null
          os?: string | null
          device_type?: string | null
          country?: string | null
          city?: string | null
          logged_in_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ip_address?: string | null
          user_agent?: string | null
          browser?: string | null
          os?: string | null
          device_type?: string | null
          country?: string | null
          city?: string | null
          logged_in_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          id: string
          owner_id: string | null
          subject: string | null
          type: Database["public"]["Enums"]["conversation_type"]
          last_message_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id?: string | null
          subject?: string | null
          type?: Database["public"]["Enums"]["conversation_type"]
          last_message_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string | null
          subject?: string | null
          type?: Database["public"]["Enums"]["conversation_type"]
          last_message_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          body: string
          is_system: boolean
          delivery_method: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          body?: string
          is_system?: boolean
          delivery_method?: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          body?: string
          is_system?: boolean
          delivery_method?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reads: {
        Row: {
          id: string
          message_id: string
          reader_id: string
          first_read_at: string
          read_count: number
          last_read_at: string
          device_info: string | null
        }
        Insert: {
          id?: string
          message_id: string
          reader_id: string
          first_read_at?: string
          read_count?: number
          last_read_at?: string
          device_info?: string | null
        }
        Update: {
          id?: string
          message_id?: string
          reader_id?: string
          first_read_at?: string
          read_count?: number
          last_read_at?: string
          device_info?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reads_reader_id_fkey"
            columns: ["reader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          owner_id: string
          type: string
          title: string
          body: string
          link: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          type: string
          title: string
          body?: string
          link?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          type?: string
          title?: string
          body?: string
          link?: string | null
          read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_message_read: {
        Args: {
          p_message_id: string
          p_reader_id: string
          p_device_info?: string | null
        }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      user_owns_property: { Args: { p_property_id: string }; Returns: boolean }
    }
    Enums: {
      conversation_type: "direct" | "announcement" | "email_log"
      booking_source:
        | "direct"
        | "airbnb"
        | "vrbo"
        | "booking_com"
        | "furnished_finder"
        | "hospitable"
        | "other"
      inquiry_status: "new" | "contacted" | "qualified" | "won" | "lost"
      property_type: "str" | "ltr" | "arbitrage" | "mtr" | "co-hosting"
      user_role: "owner" | "admin"
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
      conversation_type: ["direct", "announcement", "email_log"],
      booking_source: [
        "direct",
        "airbnb",
        "vrbo",
        "booking_com",
        "furnished_finder",
        "hospitable",
        "other",
      ],
      inquiry_status: ["new", "contacted", "qualified", "won", "lost"],
      property_type: ["str", "ltr", "arbitrage", "mtr", "co-hosting"],
      user_role: ["owner", "admin"],
    },
  },
} as const
