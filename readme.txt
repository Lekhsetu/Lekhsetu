LEKHSETU — CODEBASE GUIDE
=========================

Lekhsetu is a multi-language story-publishing platform where people write and
read real-life experiences across categories like career, life, knowledge,
tech, finance, and wellbeing.

STACK
-----
- Next.js 16 (App Router, Turbopack)
- React 19
- Tailwind CSS 3
- Framer Motion (animations)
- Supabase (auth + Postgres database)
- Lucide React (icons)

GETTING STARTED
---------------
1. Copy .env.local.example to .env.local and fill in:
     NEXT_PUBLIC_SUPABASE_URL=...
     NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   (Get these from your Supabase project's Settings -> API. Without them the
   app still runs, but shows "Backend not connected" instead of real data —
   see src/lib/supabase.ts.)
2. Run the database setup: open supabase/schema.sql in the Supabase SQL
   Editor and run it. This creates the profiles, stories, and story_likes
   tables plus the auto-create-profile trigger.
3. npm install
4. npm run dev      -> start the dev server at http://localhost:3000
   npm run build    -> production build
   npm run start    -> run the production build
   npm run lint     -> run ESLint

FOLDER STRUCTURE
----------------

src/app/            Routes (Next.js App Router — one folder per URL path)
  page.tsx            Homepage (hero, categories, featured stories, etc.)
  layout.tsx          Root layout — wraps every page (fonts, providers)
  auth/page.tsx       Sign in / sign up
  explore/page.tsx    Browse + search + filter published stories
  write/page.tsx      Story editor and publish flow
  story/[id]/page.tsx Single story view (reading, liking, related stories)
  not-found.tsx       404 page

src/components/     Reusable UI building blocks used across pages
  Navbar, Footer, Hero, Categories, FeaturedStories, StoryCard,
  CTA, HowItWorks, Testimonials, WriterMarquee, CustomCursor

src/contexts/       React context providers
  AuthContext.tsx     Exposes the signed-in user, profile, signOut(),
                      refreshProfile() via the useAuth() hook

src/services/       Functions that talk to Supabase (the data-access layer).
                    Pages call these instead of writing queries inline.
  stories.ts          fetchPublishedStories, fetchStoryById,
                      fetchRelatedStories, incrementStoryView, publishStory
  likes.ts            hasLiked, likeStory, unlikeStory
  profiles.ts         fetchProfile

src/hooks/          Custom React hooks with reusable stateful logic
  useReadProgress.ts        Tracks scroll position as a 0-100 read progress %
  useAutoResizeTextarea.ts  Grows a <textarea> to fit its content as you type

src/lib/            Thin wrappers around third-party libraries
  supabase.ts         Creates the Supabase browser client (null if env vars
                      are missing, so the app degrades gracefully)

src/types/          Shared TypeScript types
  index.ts            Story, Profile

src/constants/      Static reference data
  index.ts            CATEGORIES (story categories + colors/emoji),
                      LANGUAGES (supported languages, 20 total)

src/utils/          Small, generic, framework-free helper functions
  time.ts             timeAgo() — formats a timestamp as "3h ago" etc.

public/             Static assets served as-is (icons, svgs)

DATABASE (supabase/)
--------------------
schema.sql              Baseline schema — run this first in a fresh project.
                        Creates profiles, stories, story_likes tables, RLS
                        policies, and the handle_new_user trigger that
                        auto-creates a profile row on signup.
migrations/             Incremental changes layered on top of schema.sql,
                        numbered in the order they should be applied.
  0002_follows.sql        Pending — schema for the "follow writers" feature
  0003_comments.sql       Pending — schema for story comments

HOW DATA FLOWS
--------------
A page (e.g. explore/page.tsx) calls a function from src/services/
(e.g. fetchPublishedStories), which uses the Supabase client from
src/lib/supabase.ts to query the database and returns typed data
(types from src/types/). The page then renders that data using
shared UI from src/components/, static labels/colors from
src/constants/, and shared logic from src/hooks/ and src/utils/.

Authentication state flows from src/contexts/AuthContext.tsx, which any
component can read via the useAuth() hook.
