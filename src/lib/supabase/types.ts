export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string | null
          name: string
          avatar_url: string | null
          role: 'child' | 'mentor' | 'parent'
          missions_completed: number
          badges: Json
          skills_unlocked: Json
          preferred_voice_id: string | null
          preferred_style: string
          emotional_context: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          avatar_url?: string | null
          role: 'child' | 'mentor' | 'parent'
          missions_completed?: number
          badges?: Json
          skills_unlocked?: Json
          preferred_voice_id?: string | null
          preferred_style?: string
          emotional_context?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          avatar_url?: string | null
          role?: 'child' | 'mentor' | 'parent'
          missions_completed?: number
          badges?: Json
          skills_unlocked?: Json
          preferred_voice_id?: string | null
          preferred_style?: string
          emotional_context?: Json
          created_at?: string
          updated_at?: string
        }
      }
      stories: {
        Row: {
          id: string
          profile_id: string | null
          title: string
          author: string
          cover_image_url: string | null
          status: 'draft' | 'in_progress' | 'completed' | 'published'
          is_public: boolean
          total_pages: number
          current_page: number
          metadata: Json
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          profile_id?: string | null
          title: string
          author: string
          cover_image_url?: string | null
          status?: 'draft' | 'in_progress' | 'completed' | 'published'
          is_public?: boolean
          total_pages?: number
          current_page?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          profile_id?: string | null
          title?: string
          author?: string
          cover_image_url?: string | null
          status?: 'draft' | 'in_progress' | 'completed' | 'published'
          is_public?: boolean
          total_pages?: number
          current_page?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
      story_pages: {
        Row: {
          id: string
          story_id: string | null
          page_number: number
          title: string | null
          background_image_url: string | null
          background_video_url: string | null
          text_blocks: Json
          media_layers: Json
          audio_tracks: Json
          ambiance: string
          light_color: string
          light_intensity: number
          is_sealed: boolean
          sealed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          story_id?: string | null
          page_number: number
          title?: string | null
          background_image_url?: string | null
          background_video_url?: string | null
          text_blocks?: Json
          media_layers?: Json
          audio_tracks?: Json
          ambiance?: string
          light_color?: string
          light_intensity?: number
          is_sealed?: boolean
          sealed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          story_id?: string | null
          page_number?: number
          title?: string | null
          background_image_url?: string | null
          background_video_url?: string | null
          text_blocks?: Json
          media_layers?: Json
          audio_tracks?: Json
          ambiance?: string
          light_color?: string
          light_intensity?: number
          is_sealed?: boolean
          sealed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      assets: {
        Row: {
          id: string
          profile_id: string | null
          story_id: string | null
          type: 'image' | 'audio' | 'video'
          source: 'midjourney' | 'elevenlabs' | 'runway' | 'luma' | 'gemini' | 'upload' | 'dalle'
          url: string
          thumbnail_url: string | null
          prompt_used: string | null
          generation_params: Json
          file_name: string | null
          file_size: number | null
          mime_type: string | null
          duration_seconds: number | null
          tags: string[]
          created_at: string
        }
        Insert: {
          id?: string
          profile_id?: string | null
          story_id?: string | null
          type: 'image' | 'audio' | 'video'
          source: 'midjourney' | 'elevenlabs' | 'runway' | 'luma' | 'gemini' | 'upload' | 'dalle'
          url: string
          thumbnail_url?: string | null
          prompt_used?: string | null
          generation_params?: Json
          file_name?: string | null
          file_size?: number | null
          mime_type?: string | null
          duration_seconds?: number | null
          tags?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string | null
          story_id?: string | null
          type?: 'image' | 'audio' | 'video'
          source?: 'midjourney' | 'elevenlabs' | 'runway' | 'luma' | 'gemini' | 'upload' | 'dalle'
          url?: string
          thumbnail_url?: string | null
          prompt_used?: string | null
          generation_params?: Json
          file_name?: string | null
          file_size?: number | null
          mime_type?: string | null
          duration_seconds?: number | null
          tags?: string[]
          created_at?: string
        }
      }
      diary_entries: {
        Row: {
          id: string
          profile_id: string | null
          content: string
          mood: 'happy' | 'sad' | 'excited' | 'calm' | 'dreamy' | null
          audio_url: string | null
          memory_image_url: string | null
          memory_image_prompt: string | null
          ai_response: string | null
          weather: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id?: string | null
          content: string
          mood?: 'happy' | 'sad' | 'excited' | 'calm' | 'dreamy' | null
          audio_url?: string | null
          memory_image_url?: string | null
          memory_image_prompt?: string | null
          ai_response?: string | null
          weather?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string | null
          content?: string
          mood?: 'happy' | 'sad' | 'excited' | 'calm' | 'dreamy' | null
          audio_url?: string | null
          memory_image_url?: string | null
          memory_image_prompt?: string | null
          ai_response?: string | null
          weather?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          profile_id: string | null
          role: 'user' | 'assistant' | 'system'
          content: string
          context_type: 'diary' | 'book' | 'studio' | 'general'
          related_entity_id: string | null
          model_used: string | null
          tokens_used: number | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id?: string | null
          role: 'user' | 'assistant' | 'system'
          content: string
          context_type?: 'diary' | 'book' | 'studio' | 'general'
          related_entity_id?: string | null
          model_used?: string | null
          tokens_used?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string | null
          role?: 'user' | 'assistant' | 'system'
          content?: string
          context_type?: 'diary' | 'book' | 'studio' | 'general'
          related_entity_id?: string | null
          model_used?: string | null
          tokens_used?: number | null
          created_at?: string
        }
      }
      generation_jobs: {
        Row: {
          id: string
          profile_id: string | null
          job_type: 'image' | 'voice' | 'video' | 'music'
          service: string
          prompt: string
          params: Json
          status: 'pending' | 'processing' | 'completed' | 'failed'
          progress: number
          result_url: string | null
          result_data: Json | null
          error_message: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id?: string | null
          job_type: 'image' | 'voice' | 'video' | 'music'
          service: string
          prompt: string
          params?: Json
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          progress?: number
          result_url?: string | null
          result_data?: Json | null
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string | null
          job_type?: 'image' | 'voice' | 'video' | 'music'
          service?: string
          prompt?: string
          params?: Json
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          progress?: number
          result_url?: string | null
          result_data?: Json | null
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
      }
      mentor_sessions: {
        Row: {
          id: string
          session_code: string
          mentor_id: string | null
          connected_children: string[]
          status: 'active' | 'paused' | 'ended'
          control_active: boolean
          controlled_child_id: string | null
          screen_sharing_active: boolean
          started_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          session_code: string
          mentor_id?: string | null
          connected_children?: string[]
          status?: 'active' | 'paused' | 'ended'
          control_active?: boolean
          controlled_child_id?: string | null
          screen_sharing_active?: boolean
          started_at?: string
          ended_at?: string | null
        }
        Update: {
          id?: string
          session_code?: string
          mentor_id?: string | null
          connected_children?: string[]
          status?: 'active' | 'paused' | 'ended'
          control_active?: boolean
          controlled_child_id?: string | null
          screen_sharing_active?: boolean
          started_at?: string
          ended_at?: string | null
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

