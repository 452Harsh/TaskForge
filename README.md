# TaskFlow 🌊

TaskFlow is a modern, Jira-like project management application built for speed and aesthetic excellence. It provides teams with a seamless environment to track projects, manage Kanban boards, rapidly create tasks, and discuss them inline using deep persistent threads.

![Screenshot Placeholder](https://via.placeholder.com/1200x800?text=TaskFlow+Dashboard+Screenshot)

## Features

### Role-Based Access & Security
- **Strict Row-Level Security:** Database access policies ensure sensitive project operations are tightly locked down.
- **Granular Visibility:** Assignees only see the tasks assigned explicitly to them on the Kanban board, whereas Project Owners possess a unified omnisight overview of all dependencies.

### Interactive Task Management
- **Live HTML5 Drag & Drop:** Move task cards seamlessly across the Kanban axes instantly. State stays synchronized gracefully.
- **Custom Project Metadata:** Managers can arbitrarily declare custom fields (e.g. "Environment: Prod/Staging") and strict default values, pushing them selectively down to all tasks across an entire project.
- **Dynamic Colored Tags:** Managers map visual taxonomy to tasks for deeper tracking logic without clashing schema.

### Realtime Collaboration
- **Rich Text Editors:** All project descriptions bind flawlessly into a safe, SSR-hydrated TipTap rich text core natively avoiding dangerous raw inner HTML DOM mutations.
- **In-line Threading:** Complete messaging threads attached natively inside Tasks contextually relative to changes in flight.
- **Architectural Audit Log:** A complete chronological history of every edit, status change, and comment, summarized dynamically via `date-fns` for immediate human readability on a beautifully bound Radix `Sheet` slide-over.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + custom HSL Tokens
- **Components:** shadcn/ui (Tailwind v3 Native) + Radix UI Primitives
- **Database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth (@supabase/ssr)
- **Icons:** Lucide React
- **Notifications:** Sonner
- **Editor:** TipTap HTML framework

## Running Locally

1. **Clone and Install:**
```bash
git clone <repository-url>
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
3. Access the *SQL Editor* and copy-paste the queries sequentially from the `supabase/migrations/` directory.
4. This schema automatically enables Row-Level Security (RLS) policies and registers the Postgres authentication trigger necessary to sync authenticated users to the internal application `profiles` table.
5. In *Authentication -> Providers*, ensure Email/Password signin is enabled.
