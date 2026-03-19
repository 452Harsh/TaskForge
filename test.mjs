import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignee:profiles(full_name, avatar_url)')
    .limit(1);

  if (error) {
    console.error("FETCH ERROR:", error);
  } else {
    console.log("FETCH SUCCESS:", data);
  }
}

check();
