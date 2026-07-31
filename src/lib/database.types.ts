export type ListingStatus = 'open' | 'matched' | 'closed'
export type OfferStatus = 'pending' | 'accepted' | 'rejected'
export type ReportTargetType = 'listing' | 'offer'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          created_at: string
        }
        Insert: {
          id: string
          display_name: string
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          created_at?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          amount: number
          category: string
          location: string
          lat: number | null
          lng: number | null
          status: ListingStatus
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string
          amount: number
          category?: string
          location?: string
          lat?: number | null
          lng?: number | null
          status?: ListingStatus
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          amount?: number
          category?: string
          location?: string
          lat?: number | null
          lng?: number | null
          status?: ListingStatus
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'listings_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      offers: {
        Row: {
          id: string
          listing_id: string
          user_id: string
          title: string
          description: string
          image_urls: string[]
          status: OfferStatus
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          user_id: string
          title: string
          description?: string
          image_urls?: string[]
          status?: OfferStatus
          created_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          user_id?: string
          title?: string
          description?: string
          image_urls?: string[]
          status?: OfferStatus
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'offers_listing_id_fkey'
            columns: ['listing_id']
            referencedRelation: 'listings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'offers_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      ratings: {
        Row: {
          id: string
          listing_id: string
          rater_id: string
          ratee_id: string
          stars: number
          comment: string
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          rater_id: string
          ratee_id: string
          stars: number
          comment?: string
          created_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          rater_id?: string
          ratee_id?: string
          stars?: number
          comment?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ratings_listing_id_fkey'
            columns: ['listing_id']
            referencedRelation: 'listings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ratings_rater_id_fkey'
            columns: ['rater_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ratings_ratee_id_fkey'
            columns: ['ratee_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          target_type: ReportTargetType
          target_id: string
          reason: string
          comment: string
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          target_type: ReportTargetType
          target_id: string
          reason: string
          comment?: string
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          target_type?: ReportTargetType
          target_id?: string
          reason?: string
          comment?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reports_reporter_id_fkey'
            columns: ['reporter_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      user_rating_summary: {
        Row: {
          user_id: string
          avg_stars: number
          rating_count: number
        }
        Relationships: []
      }
    }
    Functions: Record<string, never>
  }
}
