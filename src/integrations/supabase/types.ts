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
      approvals: {
        Row: {
          category: string | null
          cost_amount: number | null
          cost_type: string | null
          created_at: string | null
          decided_at: string | null
          decided_by: string | null
          description: string | null
          id: string
          project_id: string | null
          reason: string | null
          requested_by: string | null
          segment_id: string | null
          status: string | null
          title: string
          visible_roles: string[] | null
        }
        Insert: {
          category?: string | null
          cost_amount?: number | null
          cost_type?: string | null
          created_at?: string | null
          decided_at?: string | null
          decided_by?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          reason?: string | null
          requested_by?: string | null
          segment_id?: string | null
          status?: string | null
          title: string
          visible_roles?: string[] | null
        }
        Update: {
          category?: string | null
          cost_amount?: number | null
          cost_type?: string | null
          created_at?: string | null
          decided_at?: string | null
          decided_by?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          reason?: string | null
          requested_by?: string | null
          segment_id?: string | null
          status?: string | null
          title?: string
          visible_roles?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "approvals_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_entries: {
        Row: {
          added_by: string | null
          amount: number
          category: string | null
          created_at: string | null
          description: string
          id: string
          project_id: string | null
          segment_id: string | null
        }
        Insert: {
          added_by?: string | null
          amount: number
          category?: string | null
          created_at?: string | null
          description: string
          id?: string
          project_id?: string | null
          segment_id?: string | null
        }
        Update: {
          added_by?: string | null
          amount?: number
          category?: string | null
          created_at?: string | null
          description?: string
          id?: string
          project_id?: string | null
          segment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_entries_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_entries_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_connections: {
        Row: {
          access_token: string
          created_at: string
          google_account_email: string
          id: string
          refresh_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          google_account_email: string
          id?: string
          refresh_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          google_account_email?: string
          id?: string
          refresh_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          conversation_id: string | null
          id: string
          joined_at: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          project_id: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string | null
          project_id?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          project_id?: string | null
          type?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          approval_status: string | null
          category: string | null
          created_at: string | null
          file_url: string
          id: string
          name: string
          project_id: string | null
          segment_id: string | null
          uploaded_by: string | null
          visible_to: string[] | null
        }
        Insert: {
          approval_status?: string | null
          category?: string | null
          created_at?: string | null
          file_url: string
          id?: string
          name: string
          project_id?: string | null
          segment_id?: string | null
          uploaded_by?: string | null
          visible_to?: string[] | null
        }
        Update: {
          approval_status?: string | null
          category?: string | null
          created_at?: string | null
          file_url?: string
          id?: string
          name?: string
          project_id?: string | null
          segment_id?: string | null
          uploaded_by?: string | null
          visible_to?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      drawing_versions: {
        Row: {
          created_at: string
          drawing_id: string
          file_type: string
          file_url: string
          id: string
          notes: string | null
          uploaded_by: string | null
          version_number: number
        }
        Insert: {
          created_at?: string
          drawing_id: string
          file_type?: string
          file_url: string
          id?: string
          notes?: string | null
          uploaded_by?: string | null
          version_number: number
        }
        Update: {
          created_at?: string
          drawing_id?: string
          file_type?: string
          file_url?: string
          id?: string
          notes?: string | null
          uploaded_by?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "drawing_versions_drawing_id_fkey"
            columns: ["drawing_id"]
            isOneToOne: false
            referencedRelation: "drawings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drawing_versions_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      drawings: {
        Row: {
          created_at: string
          created_by: string | null
          discipline: string
          drawing_number: string | null
          id: string
          project_id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          discipline?: string
          drawing_number?: string | null
          id?: string
          project_id: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          discipline?: string
          drawing_number?: string | null
          id?: string
          project_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "drawings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drawings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      drive_connections: {
        Row: {
          access_token: string
          created_at: string
          google_account_email: string
          id: string
          refresh_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          google_account_email: string
          id?: string
          refresh_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          google_account_email?: string
          id?: string
          refresh_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drive_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      drive_files: {
        Row: {
          created_at: string
          drive_link: string
          google_file_id: string
          id: string
          last_synced_at: string
          metadata_json: Json
          mime_type: string
          name: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          drive_link: string
          google_file_id: string
          id?: string
          last_synced_at?: string
          metadata_json?: Json
          mime_type: string
          name: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          drive_link?: string
          google_file_id?: string
          id?: string
          last_synced_at?: string
          metadata_json?: Json
          mime_type?: string
          name?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drive_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drive_files_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      drive_folder_mappings: {
        Row: {
          created_at: string
          google_folder_id: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          google_folder_id: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          google_folder_id?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drive_folder_mappings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drive_folder_mappings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string | null
          created_at: string | null
          duration: number | null
          file_size: number | null
          file_url: string | null
          id: string
          is_read: boolean | null
          reply_to_id: string | null
          sender_id: string | null
          type: string | null
        }
        Insert: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          duration?: number | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          reply_to_id?: string | null
          sender_id?: string | null
          type?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          duration?: number | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          reply_to_id?: string | null
          sender_id?: string | null
          type?: string | null
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
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          project_id: string | null
          read_at: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          project_id?: string | null
          read_at?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          project_id?: string | null
          read_at?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          currency: string
          description: string
          due_date: string
          id: string
          paid_date: string | null
          payee: string
          project_id: string
          project_name: string
          reference: string | null
          status: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          due_date: string
          id?: string
          paid_date?: string | null
          payee: string
          project_id: string
          project_name?: string
          reference?: string | null
          status?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          due_date?: string
          id?: string
          paid_date?: string | null
          payee?: string
          project_id?: string
          project_name?: string
          reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          id: string
          invited_email: string | null
          project_id: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          invited_email?: string | null
          project_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          invited_email?: string | null
          project_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          budget: number | null
          budget_max: number | null
          budget_min: number | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          geofence_radius: number | null
          id: string
          is_variable_budget: boolean
          latitude: number | null
          location: string | null
          longitude: number | null
          name: string
          owner_id: string | null
          start_date: string | null
          type: string | null
        }
        Insert: {
          address?: string | null
          budget?: number | null
          budget_max?: number | null
          budget_min?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          geofence_radius?: number | null
          id?: string
          is_variable_budget?: boolean
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name: string
          owner_id?: string | null
          start_date?: string | null
          type?: string | null
        }
        Update: {
          address?: string | null
          budget?: number | null
          budget_max?: number | null
          budget_min?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          geofence_radius?: number | null
          id?: string
          is_variable_budget?: boolean
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name?: string
          owner_id?: string | null
          start_date?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          category: string | null
          created_at: string
          currency: string | null
          delivered_at: string | null
          expected_delivery: string | null
          id: string
          item: string
          notes: string | null
          project_id: string
          quantity: number | null
          requested_by: string | null
          segment_id: string | null
          status: string
          supplier_name: string | null
          total_cost: number | null
          unit: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency?: string | null
          delivered_at?: string | null
          expected_delivery?: string | null
          id?: string
          item: string
          notes?: string | null
          project_id: string
          quantity?: number | null
          requested_by?: string | null
          segment_id?: string | null
          status?: string
          supplier_name?: string | null
          total_cost?: number | null
          unit?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          currency?: string | null
          delivered_at?: string | null
          expected_delivery?: string | null
          id?: string
          item?: string
          notes?: string | null
          project_id?: string
          quantity?: number | null
          requested_by?: string | null
          segment_id?: string | null
          status?: string
          supplier_name?: string | null
          total_cost?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
        ]
      }
      reimbursements: {
        Row: {
          amount: number
          client_id: string
          client_name: string
          created_at: string
          currency: string
          date_incurred: string
          decided_at: string | null
          decided_by: string | null
          description: string
          expense_type: string
          id: string
          notes: string | null
          payment_due_date: string
          project_id: string
          project_name: string
          receipt_url: string | null
          rejection_reason: string | null
          status: string
          submission_date: string | null
          submitted_by: string | null
          submitted_by_name: string
          supporting_docs: string[] | null
        }
        Insert: {
          amount?: number
          client_id?: string
          client_name?: string
          created_at?: string
          currency?: string
          date_incurred: string
          decided_at?: string | null
          decided_by?: string | null
          description?: string
          expense_type: string
          id?: string
          notes?: string | null
          payment_due_date: string
          project_id: string
          project_name?: string
          receipt_url?: string | null
          rejection_reason?: string | null
          status?: string
          submission_date?: string | null
          submitted_by?: string | null
          submitted_by_name?: string
          supporting_docs?: string[] | null
        }
        Update: {
          amount?: number
          client_id?: string
          client_name?: string
          created_at?: string
          currency?: string
          date_incurred?: string
          decided_at?: string | null
          decided_by?: string | null
          description?: string
          expense_type?: string
          id?: string
          notes?: string | null
          payment_due_date?: string
          project_id?: string
          project_name?: string
          receipt_url?: string | null
          rejection_reason?: string | null
          status?: string
          submission_date?: string | null
          submitted_by?: string | null
          submitted_by_name?: string
          supporting_docs?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "reimbursements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reimbursements_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      segments: {
        Row: {
          created_at: string | null
          id: string
          name: string
          project_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          project_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "segments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      site_updates: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          media_urls: string[] | null
          posted_by: string | null
          project_id: string | null
          segment_id: string | null
          task_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          media_urls?: string[] | null
          posted_by?: string | null
          project_id?: string | null
          segment_id?: string | null
          task_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          media_urls?: string[] | null
          posted_by?: string | null
          project_id?: string | null
          segment_id?: string | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_updates_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_updates_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_updates_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          project_id: string | null
          segment_id: string | null
          status: string | null
          title: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          segment_id?: string | null
          status?: string | null
          title: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          segment_id?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: string | null
          studio_name: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: string | null
          studio_name?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string | null
          studio_name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
