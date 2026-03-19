import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkVisibility() {
  console.log("Fetching all project_members:");
  const { data: pm, error } = await supabaseAdmin
    .from('project_members')
    .select('user_id, project_id, role, projects(*, project_members(user_id))');

  if (error) {
    console.error("ADMIN FETCH PM ERROR:", error);
  } else {
    console.log("MEMBERS WITH PROJECTS:", JSON.stringify(pm, null, 2));
  }
}

checkVisibility();
