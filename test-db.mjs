import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTasks() {
  console.log("Fetching ALL tasks in the entire database:");
  
  const { data: tasks, error } = await supabaseAdmin
    .from('tasks')
    .select('*, assignee:profiles(full_name, avatar_url), project:projects(*)');

  if (error) {
    console.error("ADMIN FETCH ERROR:", error);
  } else {
    for (const t of tasks) {
       console.log(`Task: ${t.title} | Project: ${t.project?.name} (${t.project_id}) | Assignee: ${t.assignee?.full_name}`);
    }
  }
}

checkTasks();
