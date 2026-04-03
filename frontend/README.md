# Frontend

This is a **demo frontend** built for a YouTube video showing how to add custom auth and serve a React SPA from a LangSmith Deployment.

It's a minimal chat UI to demonstrate the deployment pattern.

## What it does

- Supabase email/password auth (login + signup)
- Streams responses from a Deep Agent deep research agent
- Displays subagent activity, tool calls, todos, and files
- Scopes threads per authenticated user

## Setup

```bash
cp .env.example .env
# Fill in your Supabase URL and publishable key
npm install
npm run build
```

The built output in `dist/` is served by the backend via a custom route at `/app`.

## For production use cases

If you're adapting this for production, here are some things you'd want to add:

- Error boundaries to prevent white-screen crashes
- Token refresh handling for long-lived sessions
- Accessibility (keyboard navigation, screen reader support, ARIA)
- Loading skeletons and optimistic UI
- Tests (unit, integration, e2e)
- Proper state management (React Query, Zustand, etc.)
- Code splitting and bundle optimization
- Offline/retry handling for network failures