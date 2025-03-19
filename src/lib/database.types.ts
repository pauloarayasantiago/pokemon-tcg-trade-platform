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
      cards: {
        Row: {
          id: string
          name: string
          supertype: string | null
          types: string[] | null
          set_id: string
          number: string
          rarity: string | null
          rarity_code: string | null
          card_era: string | null
          language: string
          image_small: string | null
          image_large: string | null
          pokemon_generation: number | null
          tcg_price: number | null
          price_updated_at: string | null
          created_at: string
          updated_at: string
          last_sync_at: string
        }
        Insert: {
          id: string
          name: string
          supertype?: string | null
          types?: string[] | null
          set_id: string
          number: string
          rarity?: string | null
          rarity_code?: string | null
          card_era?: string | null
          language?: string
          image_small?: string | null
          image_large?: string | null
          pokemon_generation?: number | null
          tcg_price?: number | null
          price_updated_at?: string | null
          created_at?: string
          updated_at?: string
          last_sync_at?: string
        }
        Update: {
          id?: string
          name?: string
          supertype?: string | null
          types?: string[] | null
          set_id?: string
          number?: string
          rarity?: string | null
          rarity_code?: string | null
          card_era?: string | null
          language?: string
          image_small?: string | null
          image_large?: string | null
          pokemon_generation?: number | null
          tcg_price?: number | null
          price_updated_at?: string | null
          created_at?: string
          updated_at?: string
          last_sync_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          }
        ]
      }
      card_variations: {
        Row: {
          id: string
          card_id: string
          variation_type: string
          treatment: string | null
          holofoil_pattern: string | null
          is_special_rarity: boolean
          special_rarity_type: string | null
          image_url: string | null
          tcg_api_price_key: string | null
          created_at: string
        }
        Insert: {
          id?: string
          card_id: string
          variation_type: string
          treatment?: string | null
          holofoil_pattern?: string | null
          is_special_rarity?: boolean
          special_rarity_type?: string | null
          image_url?: string | null
          tcg_api_price_key?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          card_id?: string
          variation_type?: string
          treatment?: string | null
          holofoil_pattern?: string | null
          is_special_rarity?: boolean
          special_rarity_type?: string | null
          image_url?: string | null
          tcg_api_price_key?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_variations_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          }
        ]
      }
      collections: {
        Row: {
          id: string
          user_id: string
          card_id: string
          variation_id: string | null
          condition: string
          quantity: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          card_id: string
          variation_id?: string | null
          condition: string
          quantity: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          card_id?: string
          variation_id?: string | null
          condition?: string
          quantity?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "card_variations"
            referencedColumns: ["id"]
          }
        ]
      }
      contact_logs: {
        Row: {
          id: string
          buyer_id: string
          seller_id: string
          inventory_id: string
          created_at: string
        }
        Insert: {
          id?: string
          buyer_id: string
          seller_id: string
          inventory_id: string
          created_at?: string
        }
        Update: {
          id?: string
          buyer_id?: string
          seller_id?: string
          inventory_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_logs_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_logs_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_logs_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      delivery_stores: {
        Row: {
          id: string
          name: string
          location: string
          network: string
          address: string | null
          contact_info: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          location: string
          network: string
          address?: string | null
          contact_info?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string
          network?: string
          address?: string | null
          contact_info?: string | null
          created_at?: string
        }
        Relationships: []
      }
      holofoil_patterns: {
        Row: {
          id: string
          name: string
          era: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          era?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          era?: string | null
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          id: string
          user_id: string
          card_id: string
          variation_id: string | null
          condition: string
          quantity: number
          price: number
          is_tradeable: boolean
          desired_trades: string | null
          delivery_from_id: string | null
          is_visible: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          card_id: string
          variation_id?: string | null
          condition: string
          quantity: number
          price: number
          is_tradeable?: boolean
          desired_trades?: string | null
          delivery_from_id?: string | null
          is_visible?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          card_id?: string
          variation_id?: string | null
          condition?: string
          quantity?: number
          price?: number
          is_tradeable?: boolean
          desired_trades?: string | null
          delivery_from_id?: string | null
          is_visible?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_delivery_from_id_fkey"
            columns: ["delivery_from_id"]
            isOneToOne: false
            referencedRelation: "delivery_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "card_variations"
            referencedColumns: ["id"]
          }
        ]
      }
      rarity_types: {
        Row: {
          id: string
          name: string
          symbol: string | null
          era: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          symbol?: string | null
          era?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          symbol?: string | null
          era?: string | null
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      sets: {
        Row: {
          id: string
          name: string
          series: string | null
          release_date: string | null
          total: number | null
          logo_url: string | null
          symbol_url: string | null
          created_at: string
          updated_at: string
          last_sync_at: string
        }
        Insert: {
          id: string
          name: string
          series?: string | null
          release_date?: string | null
          total?: number | null
          logo_url?: string | null
          symbol_url?: string | null
          created_at?: string
          updated_at?: string
          last_sync_at?: string
        }
        Update: {
          id?: string
          name?: string
          series?: string | null
          release_date?: string | null
          total?: number | null
          logo_url?: string | null
          symbol_url?: string | null
          created_at?: string
          updated_at?: string
          last_sync_at?: string
        }
        Relationships: []
      }
      store_connections: {
        Row: {
          id: string
          from_store_id: string
          to_store_id: string
          created_at: string
        }
        Insert: {
          id?: string
          from_store_id: string
          to_store_id: string
          created_at?: string
        }
        Update: {
          id?: string
          from_store_id?: string
          to_store_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_connections_from_store_id_fkey"
            columns: ["from_store_id"]
            isOneToOne: false
            referencedRelation: "delivery_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_connections_to_store_id_fkey"
            columns: ["to_store_id"]
            isOneToOne: false
            referencedRelation: "delivery_stores"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string | null
          username: string
          profile_slug: string
          profile_image_url: string | null
          bio: string | null
          location: string | null
          whatsapp_number: string
          phone_number: string | null
          phone_verified: boolean
          created_at: string
          updated_at: string
          is_verified: boolean
          last_login: string | null
          is_admin: boolean
        }
        Insert: {
          id?: string
          email?: string | null
          username: string
          profile_slug: string
          profile_image_url?: string | null
          bio?: string | null
          location?: string | null
          whatsapp_number: string
          phone_number?: string | null
          phone_verified?: boolean
          created_at?: string
          updated_at?: string
          is_verified?: boolean
          last_login?: string | null
          is_admin?: boolean
        }
        Update: {
          id?: string
          email?: string | null
          username?: string
          profile_slug?: string
          profile_image_url?: string | null
          bio?: string | null
          location?: string | null
          whatsapp_number?: string
          phone_number?: string | null
          phone_verified?: boolean
          created_at?: string
          updated_at?: string
          is_verified?: boolean
          last_login?: string | null
          is_admin?: boolean
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          id: string
          user_id: string
          card_id: string
          variation_id: string | null
          condition_preference: string[] | null
          max_price: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          card_id: string
          variation_id?: string | null
          condition_preference?: string[] | null
          max_price?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          card_id?: string
          variation_id?: string | null
          condition_preference?: string[] | null
          max_price?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "card_variations"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      enhanced_cards: {
        Row: {
          id: string
          name: string
          supertype: string | null
          types: string[] | null
          set_id: string
          number: string
          rarity: string | null
          rarity_code: string | null
          card_era: string | null
          language: string
          image_small: string | null
          image_large: string | null
          pokemon_generation: number | null
          tcg_price: number | null
          price_updated_at: string | null
          created_at: string
          updated_at: string
          last_sync_at: string
          set_name: string | null
          set_series: string | null
          release_date: string | null
          set_logo_url: string | null
          set_symbol_url: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          }
        ]
      }
      store_delivery_options: {
        Row: {
          from_store_id: string | null
          from_store_name: string | null
          from_location: string | null
          to_store_id: string | null
          to_store_name: string | null
          to_location: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_connections_from_store_id_fkey"
            columns: ["from_store_id"]
            isOneToOne: false
            referencedRelation: "delivery_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_connections_to_store_id_fkey"
            columns: ["to_store_id"]
            isOneToOne: false
            referencedRelation: "delivery_stores"
            referencedColumns: ["id"]
          }
        ]
      }
      user_catalogs: {
        Row: {
          user_id: string | null
          username: string | null
          profile_slug: string | null
          unique_cards: number | null
          total_cards: number | null
          unique_sets: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
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