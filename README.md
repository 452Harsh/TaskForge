# TaskFlow 🌊

TaskFlow is a modern, Jira-like project management application built for speed and aesthetic excellence. It provides teams with a seamless environment to track projects, manage Kanban boards, rapidly create tasks, and discuss them inline using deep persistent threads.

![Screenshot Placeholder](https://via.placeholder.com/1200x800?text=TaskFlow+Dashboard+Screenshot)

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + custom HSL Tokens
- **Components:** shadcn/ui (Tailwind v3 Native) + Radix UI Primitives
- **Database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth (@supabase/ssr)
- **Icons:** Lucide React
- **Notifications:** Sonner

## Running Locally

1. **Clone and Install:**
```bash
cd taskflow
npm install
```

2. **Configure Environment Variables:**
Create a `.env.local` file at the root of the project:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

3. **Run the Development Server:**
```bash
npm run dev
```

## Supabase Setup 

1. Create a new [Supabase Project](https://database.new)
2. Obtain your API keys from the *Project Settings -> API* dashboard.
3. Access the *SQL Editor* and copy-paste the query from `supabase/migrations/00001_initial_schema.sql` completely into the runner. Click **Run**.
4. This schema automatically enables Row-Level Security (RLS) policies and registers the Postgres authentication trigger necessary to sync authenticated users to the internal application `profiles` table.
5. In *Authentication -> Providers*, ensure Email/Password signin is enabled.
