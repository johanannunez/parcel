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
          onboarding_completed_at: string | null
          phone: string | null
          preferred_name: string | null
          property_count_estimate: string | null
          referral_source: string | null
          role: Database["public"]["Enums"]["user_role"]
          timezone: string | null
          updated_at: string
          years_investing: string | null
        }
        Insert: {
          avatar_url?: string | null
          contact_method?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          onboarding_completed_at?: string | null
          phone?: string | null
          preferred_name?: string | null
          property_count_estimate?: string | null
          referral_source?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          timezone?: string | null
          updated_at?: string
          years_investing?: string | null
        }
        Update: {
          avatar_url?: string | null
          contact_method?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          onboarding_completed_at?: string | null
          phone?: string | null
          preferred_name?: string | null
          property_count_estimate?: string | null
          referral_source?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          timezone?: string | null
          updated_at?: string
          years_investing?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          active: boolean
          address_line1: string
          address_line2: string | null
          bathrooms: number | null
          bedrooms: number | null
          city: string
          country: string
          created_at: string
          currently_rented: boolean | null
          guest_capacity: number | null
          half_bathrooms: number | null
          hospitable_property_id: string | null
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
          postal_code: string
          property_subtype: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          square_feet: number | null
          state: string
          stories: number | null
          timezone: string | null
          updated_at: string
          year_built: number | null
          year_purchased: number | null
        }
        Insert: {
          active?: boolean
          address_line1: string
          address_line2?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city: string
          country?: string
          created_at?: string
          currently_rented?: boolean | null
          guest_capacity?: number | null
          half_bathrooms?: number | null
          hospitable_property_id?: string | null
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
          postal_code: string
          property_subtype?: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          square_feet?: number | null
          state: string
          stories?: number | null
          timezone?: string | null
          updated_at?: string
          year_built?: number | null
          year_purchased?: number | null
        }
        Update: {
          active?: boolean
          address_line1?: string
          address_line2?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string
          country?: string
          created_at?: string
          currently_rented?: boolean | null
          guest_capacity?: number | null
          half_bathrooms?: number | null
          hospitable_property_id?: string | null
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
          postal_code?: string
          property_subtype?: string | null
          property_type?: Database["public"]["Enums"]["property_type"]
          square_feet?: number | null
          state?: string
          stories?: number | null
          timezone?: string | null
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      user_owns_property: { Args: { p_property_id: string }; Returns: boolean }
    }
    Enums: {
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
