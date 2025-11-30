import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types para o banco de dados
export type UserRole = 'cook' | 'customer' | 'delivery'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  phone?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Address {
  id: string
  user_id: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
  latitude?: number
  longitude?: number
  is_default: boolean
  created_at: string
}

export interface BankAccount {
  id: string
  user_id: string
  bank_name: string
  account_type: 'checking' | 'savings'
  account_number: string
  agency: string
  holder_name: string
  holder_document: string
  verified: boolean
  created_at: string
}

export interface Dish {
  id: string
  cook_id: string
  name: string
  description: string
  price: number
  photo_url: string
  category: string
  available_days: string[]
  available_hours: string
  accepts_eat_in: boolean
  is_active: boolean
  rating: number
  total_reviews: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  customer_id: string
  cook_id: string
  delivery_id?: string
  dish_id: string
  quantity: number
  total_price: number
  delivery_type: 'delivery' | 'eat_in'
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'in_delivery' | 'delivered' | 'cancelled'
  delivery_address_id?: string
  scheduled_time?: string
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  order_id: string
  reviewer_id: string
  reviewed_id: string
  rating: number
  comment?: string
  created_at: string
}

export interface Gamification {
  id: string
  user_id: string
  points: number
  level: number
  badges: string[]
  total_orders: number
  total_earnings: number
  created_at: string
  updated_at: string
}
