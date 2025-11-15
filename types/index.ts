// Common type definitions for the Toy-for-Toy application

// API Response types
export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}

// User types (will be expanded with database schema)
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Ticket Economy types
export interface Ticket {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface Exchange {
  id: string;
  from_user_id: string;
  to_user_id: string;
  toy_id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Toy {
  id: string;
  user_id: string;
  name: string;
  description: string;
  category: string;
  condition: 'like-new' | 'good' | 'fair' | 'poor';
  created_at: string;
  updated_at: string;
}

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
}
