import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uvcwmvnapuivacarkdbd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2Y3dtdm5hcHVpdmFjYXJrZGJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzY3NTAsImV4cCI6MjA3MDA1Mjc1MH0.c_2Xp02ONjHk94vpxOM6B2T5f0d166JnVUJDuX0VP68';

export const supabase = createClient(supabaseUrl, supabaseKey); 