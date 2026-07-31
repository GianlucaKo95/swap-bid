export type ListingStatus = 'open' | 'matched' | 'closed'
export type OfferStatus = 'pending' | 'accepted' | 'rejected'

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
          image_url: string | null
          status: OfferStatus
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          user_id: string
          title: string
          description?: string
          image_url?: string | null
          status?: OfferStatus
          created_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          user_id?: string
          title?: string
          description?: string
          image_url?: string | null
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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
