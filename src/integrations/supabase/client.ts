
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ijttplfascbdxhjujxnx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqdHRwbGZhc2NiZHhoanVqeG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0MzEzMTUsImV4cCI6MjA1ODAwNzMxNX0.rRaHBeG6k7pm6b9KYMAwRWBvNN0RNp9AtJ5QOWqBOIo";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false // Disable session persistence to prevent caching
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Cache-Control': 'no-cache' // Prevent caching at the HTTP level
    }
  }
});
