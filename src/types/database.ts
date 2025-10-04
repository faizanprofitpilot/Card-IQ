export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          subscription_status: 'free' | 'pro' | 'cancelled'
          subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_status?: 'free' | 'pro' | 'cancelled'
          subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_status?: 'free' | 'pro' | 'cancelled'
          subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      decks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      flashcards: {
        Row: {
          id: string
          deck_id: string
          question: string
          answer: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          deck_id: string
          question: string
          answer: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          deck_id?: string
          question?: string
          answer?: string
          created_at?: string
          updated_at?: string
        }
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          deck_id: string
          card_id: string
          status: 'known' | 'unknown'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          deck_id: string
          card_id: string
          status: 'known' | 'unknown'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          deck_id?: string
          card_id?: string
          status?: 'known' | 'unknown'
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          user_id: string
          event_type: string
          metadata: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          metadata?: Record<string, unknown> | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_type?: string
          metadata?: Record<string, unknown> | null
          created_at?: string
        }
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
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Deck = Database['public']['Tables']['decks']['Row']
export type Flashcard = Database['public']['Tables']['flashcards']['Row']
export type StudySession = Database['public']['Tables']['study_sessions']['Row']
export type Event = Database['public']['Tables']['events']['Row']
