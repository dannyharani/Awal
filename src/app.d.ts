import type { Session, User, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/database.types';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      paraglide: { lang: string };

      supabase: SupabaseClient<Database>;
      safeGetSession: () => Promise<{
        session: Session | null;
        user: User | null;
        role: 'admin' | 'user' | 'moderator' | 'instructor' | null;
      }>;
      session: Session | null;
      user: User | null;
      role: 'admin' | 'user' | 'moderator' | 'instructor' | null;
    }
    interface PageData {
      session: Session | null;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
