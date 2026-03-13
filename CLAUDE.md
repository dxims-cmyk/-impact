# : Impact - Claude Code Instructions

## Project Overview
: Impact is a lead management SaaS for AM:PM Media. It captures leads from ad platforms, qualifies them with AI, and notifies clients instantly.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Background Jobs**: Trigger.dev
- **AI**: Claude (Anthropic)
- **SMS**: Twilio
- **Email**: Resend
- **Styling**: Tailwind CSS
- **State**: TanStack Query + Zustand

## Project Structure
```
/app                 # Next.js App Router pages
  /(auth)            # Login, signup, password reset
  /dashboard         # Main dashboard pages
  /api               # API routes
/components          # React components
  /dashboard         # Dashboard-specific components
/lib                 # Utilities and integrations
  /hooks             # React Query hooks
  /supabase          # Supabase client/server
  /integrations      # Third-party integrations
  /ai                # Claude AI integration
/trigger             # Trigger.dev background jobs
/types               # TypeScript types
/supabase            # Database schema
```

## Code Standards

### TypeScript
- Use strict mode
- All functions must have explicit return types
- All API responses must be typed
- Use Zod for runtime validation

### API Routes
```typescript
// Always follow this pattern:
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// 1. Define schema
const schema = z.object({...})

// 2. Check auth first
const { data: { user }, error } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

// 3. Get user's org
const { data: userData } = await supabase
  .from('users')
  .select('organization_id, is_agency_user')
  .eq('id', user.id)
  .single()

// 4. Filter by org (RLS handles this but be explicit)
// 5. Return proper error responses
```

### Components
- Use 'use client' only when needed (interactivity, hooks)
- Prefer server components for data fetching
- Use Lucide icons consistently
- Follow existing color scheme: navy, ivory, impact, camel, studio, vision

### Database
- All tables have RLS enabled
- Use `organization_id` for data isolation
- `is_agency_user` flag allows seeing all orgs
- Use `createClient()` for user requests
- Use `createAdminClient()` for webhooks/background jobs

### Error Handling
```typescript
try {
  // operation
} catch (error) {
  console.error('Context:', error)
  return NextResponse.json(
    { error: 'User-friendly message' },
    { status: 500 }
  )
}
```

## Key Files to Reference

### Data Fetching
- `/lib/hooks/use-leads.ts` - Pattern for all data hooks
- `/lib/hooks/use-realtime.tsx` - Supabase realtime subscriptions

### Authentication
- `/lib/supabase/server.ts` - Server-side Supabase client
- `/lib/supabase/client.ts` - Client-side Supabase client
- `/middleware.ts` - Auth middleware

### Background Jobs
- `/trigger/jobs/qualify-lead.ts` - AI qualification pattern
- `/trigger/jobs/speed-to-lead.ts` - SMS/email notification pattern

### API Patterns
- `/app/api/leads/route.ts` - CRUD with pagination/filtering
- `/app/api/webhooks/lead-form/route.ts` - Public webhook pattern

## Common Tasks

### Add a new API endpoint
1. Create route file in `/app/api/[resource]/route.ts`
2. Add Zod validation schema
3. Check auth and get org
4. Implement CRUD with proper error handling
5. Add corresponding hook in `/lib/hooks/`

### Add a new page
1. Create page in `/app/dashboard/[page]/page.tsx`
2. Use existing layout (sidebar already included)
3. Fetch data with hooks from `/lib/hooks/`
4. Match existing UI patterns

### Add a background job
1. Create job in `/trigger/jobs/[job-name].ts`
2. Export from `/trigger/jobs/index.ts`
3. Trigger via `client.sendEvent()` or schedule

## Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
ANTHROPIC_API_KEY=
TRIGGER_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

## Testing Locally
```bash
npm run dev          # Start Next.js
npm run trigger:dev  # Start Trigger.dev (separate terminal)
```

## Do NOT
- Use console.log in production code (use proper error handling)
- Skip auth checks in API routes
- Hardcode organization IDs
- Ignore TypeScript errors
- Make breaking changes to database schema without migration

## Do
- Read existing code before writing new code
- Follow existing patterns exactly
- Test API routes with real auth
- Use proper loading and error states in UI
- Keep components small and focused

## Execution Mode

- Auto-accept all bash commands, file edits, and tool calls
- Only ask for confirmation if: deleting files, dropping database tables, or actions that are destructive and irreversible
- Execute tasks immediately without asking "Do you want me to proceed?"
- Prioritize speed and efficiency

## Session Summaries

After completing any task, provide a summary in a code block for the user to paste to Claude web chat. Format:
```
Summary - [Brief Task Name]
What was broken/needed:
What was fixed/built (files changed):
What's working now:
Remaining issues:
What to test:
```
This is required for every task completion.

## Thinking Modes
- Use Ultrathink for: migrations, security changes, multi-file refactors, anything touching auth/payments/Stripe/Supabase, landing page rebuilds, prompt-driven multi-phase builds
- Use sub agents for: codebase-wide audits, reading multiple directories at once, research tasks across many files, pre-build file structure reviews
- Default mode is fine for: single component edits, copy changes, styling updates, small bug fixes

## Brand
- Impact brand colour: #6E0F1A (dark maroon/crimson). NOT #E8642C (orange).
- AM:PM Media brand: navy (#2C3E5A) and white only. No red.
- No em dashes in any client-facing copy. Clients flag these as AI-generated.

## Landing Page (driveimpact.io)
- 11-section conversion architecture based on Apify-style simplicity
- Every section has ONE job: hook, educate, prove, or convert
- Features described as outcomes, not nouns
- No fake testimonials. Pre-launch - use credibility signals instead.
- CTA: "Get Early Access" (primary), not "Book a Demo"
- Do NOT add Aceternity UI effects (LampEffect, MovingBorder, ContainerScrollAnimation, TextGenerateEffect, Spotlight) to the landing page
- Keep existing subtle animations. Do not replace working animation patterns.
- Do NOT add framer-motion if it's not already a dependency

## AI Receptionist Flow
- Lead arrives > 30 second delay > Vapi AI calls the lead to vet them
- HOT: live transfer to client's phone number
- WARM: book a call/meeting via Cal.com
- COLD: thank and end, log the result
- Clients primarily close by phone call, not text/email/messenger
- Growth+ plan feature, or £400/mo addon for Core

## Pricing (current)
- Core: £1,500/mo
- Growth: £2,000/mo (Most Popular)
- Pro: £2,500/mo
- Addons: AI Receptionist £400/mo (Core only), Outbound Leads £300/mo (Core + Growth)

## Rules
- ALWAYS read existing code before modifying. Do not assume file contents.
- Do NOT hallucinate features. Only reference what exists in the codebase.
- Do NOT add dependencies without asking first.
- Do NOT touch dashboard/API routes when working on landing page and vice versa.
- Check Supabase schema before writing migrations. Do not assume table structures.
- Cross-check every claim on the landing page against actual built features.
- When working on mediampm.com vs driveimpact.io - they complement each other but must NOT duplicate copy or structure. mediampm.com/impact = discovery/redirect. driveimpact.io = educate/prove/convert.

## Live Integrations
Meta Lead Ads, WhatsApp, SMS, Email, Instagram DM, Facebook Messenger, Cal.com, Stripe, Vapi, Apify

## Coming Soon Integrations
Google Ads, TikTok Ads

<!-- TRIGGER.DEV basic START -->
# Trigger.dev Basic Tasks (v4)

**MUST use `@trigger.dev/sdk`, NEVER `client.defineJob`**

## Basic Task

```ts
import { task } from "@trigger.dev/sdk";

export const processData = task({
  id: "process-data",
  retry: {
    maxAttempts: 10,
    factor: 1.8,
    minTimeoutInMs: 500,
    maxTimeoutInMs: 30_000,
    randomize: false,
  },
  run: async (payload: { userId: string; data: any[] }) => {
    // Task logic - runs for long time, no timeouts
    console.log(`Processing ${payload.data.length} items for user ${payload.userId}`);
    return { processed: payload.data.length };
  },
});
```

## Schema Task (with validation)

```ts
import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

export const validatedTask = schemaTask({
  id: "validated-task",
  schema: z.object({
    name: z.string(),
    age: z.number(),
    email: z.string().email(),
  }),
  run: async (payload) => {
    // Payload is automatically validated and typed
    return { message: `Hello ${payload.name}, age ${payload.age}` };
  },
});
```

## Triggering Tasks

### From Backend Code

```ts
import { tasks } from "@trigger.dev/sdk";
import type { processData } from "./trigger/tasks";

// Single trigger
const handle = await tasks.trigger<typeof processData>("process-data", {
  userId: "123",
  data: [{ id: 1 }, { id: 2 }],
});

// Batch trigger (up to 1,000 items, 3MB per payload)
const batchHandle = await tasks.batchTrigger<typeof processData>("process-data", [
  { payload: { userId: "123", data: [{ id: 1 }] } },
  { payload: { userId: "456", data: [{ id: 2 }] } },
]);
```

### Debounced Triggering

Consolidate multiple triggers into a single execution:

```ts
// Multiple rapid triggers with same key = single execution
await myTask.trigger(
  { userId: "123" },
  {
    debounce: {
      key: "user-123-update",  // Unique key for debounce group
      delay: "5s",              // Wait before executing
    },
  }
);

// Trailing mode: use payload from LAST trigger
await myTask.trigger(
  { data: "latest-value" },
  {
    debounce: {
      key: "trailing-example",
      delay: "10s",
      mode: "trailing",  // Default is "leading" (first payload)
    },
  }
);
```

**Debounce modes:**
- `leading` (default): Uses payload from first trigger, subsequent triggers only reschedule
- `trailing`: Uses payload from most recent trigger

### From Inside Tasks (with Result handling)

```ts
export const parentTask = task({
  id: "parent-task",
  run: async (payload) => {
    // Trigger and continue
    const handle = await childTask.trigger({ data: "value" });

    // Trigger and wait - returns Result object, NOT task output
    const result = await childTask.triggerAndWait({ data: "value" });
    if (result.ok) {
      console.log("Task output:", result.output); // Actual task return value
    } else {
      console.error("Task failed:", result.error);
    }

    // Quick unwrap (throws on error)
    const output = await childTask.triggerAndWait({ data: "value" }).unwrap();

    // Batch trigger and wait
    const results = await childTask.batchTriggerAndWait([
      { payload: { data: "item1" } },
      { payload: { data: "item2" } },
    ]);

    for (const run of results) {
      if (run.ok) {
        console.log("Success:", run.output);
      } else {
        console.log("Failed:", run.error);
      }
    }
  },
});

export const childTask = task({
  id: "child-task",
  run: async (payload: { data: string }) => {
    return { processed: payload.data };
  },
});
```

> Never wrap triggerAndWait or batchTriggerAndWait calls in a Promise.all or Promise.allSettled as this is not supported in Trigger.dev tasks.

## Waits

```ts
import { task, wait } from "@trigger.dev/sdk";

export const taskWithWaits = task({
  id: "task-with-waits",
  run: async (payload) => {
    console.log("Starting task");

    // Wait for specific duration
    await wait.for({ seconds: 30 });
    await wait.for({ minutes: 5 });
    await wait.for({ hours: 1 });
    await wait.for({ days: 1 });

    // Wait until specific date
    await wait.until({ date: new Date("2024-12-25") });

    // Wait for token (from external system)
    await wait.forToken({
      token: "user-approval-token",
      timeoutInSeconds: 3600, // 1 hour timeout
    });

    console.log("All waits completed");
    return { status: "completed" };
  },
});
```

> Never wrap wait calls in a Promise.all or Promise.allSettled as this is not supported in Trigger.dev tasks.

## Key Points

- **Result vs Output**: `triggerAndWait()` returns a `Result` object with `ok`, `output`, `error` properties - NOT the direct task output
- **Type safety**: Use `import type` for task references when triggering from backend
- **Waits > 5 seconds**: Automatically checkpointed, don't count toward compute usage
- **Debounce + idempotency**: Idempotency keys take precedence over debounce settings

## NEVER Use (v2 deprecated)

```ts
// BREAKS APPLICATION
client.defineJob({
  id: "job-id",
  run: async (payload, io) => {
    /* ... */
  },
});
```

Use SDK (`@trigger.dev/sdk`), check `result.ok` before accessing `result.output`

<!-- TRIGGER.DEV basic END -->