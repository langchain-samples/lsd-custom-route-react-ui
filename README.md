# LangSmith Deployments: Custom Routes Demo

A demo showing how to use **custom routes** in [LangSmith Deployments](https://docs.smith.langchain.com/) to serve a full-stack application from a single deployment. The LangSmith agent server gives you standard endpoints for threads, runs, and assistants out of the box — custom routes let you layer your own HTTP endpoints, static file serving, and authentication on top.

This project pairs a React chat UI with a LangGraph deep research agent, all deployed together. Use it as a starting point for building your own custom frontend on LangSmith Deployments.

## What This Demonstrates

- **Custom HTTP routes** — FastAPI app mounted alongside the agent server, serving a frontend at `/app/`
- **Custom auth** — Local SQLite + JWT authentication integrated with LangGraph's auth system to scope resources per user
- **Deep agent with subagents** — streaming research agent that delegates to parallel subagents
- **Frontend consuming the agent server** — the React app talks directly to the same origin's `/threads`, `/runs`, and `/assistants` endpoints

## How Custom Routes Work

LangSmith Deployments run a LangGraph agent server that exposes endpoints for managing threads, runs, and assistants. The `langgraph.json` config lets you extend this server with:

| Config Key | What It Does |
|------------|-------------|
| `graphs` | Register your LangGraph agent(s) |
| `auth.path` | Plug in custom authentication (validates tokens, scopes resources) |
| `http.app` | Mount a FastAPI/Starlette app for your own routes (serve a frontend, add APIs, etc.) |

```json
{
  "graphs": { "agent": "./src/deep_research/agent.py:agent" },
  "auth":   { "path": "./src/auth.py:auth" },
  "http":   { "app": "./src/app.py:app" },
  "env":    ".env"
}
```

In this demo:
- `src/app.py` serves the built React frontend as static files at `/app/` and provides `/auth/signup` and `/auth/login` endpoints
- `src/auth.py` validates local JWT tokens and scopes all LangGraph resources (threads, runs) to the authenticated user
- The frontend calls the standard agent server endpoints (`/threads`, `/runs`, `/assistants`) — no custom API needed for the chat itself

## Prerequisites

- **Python 3.11+**
- **Node.js 24+** (LTS)
- **[uv](https://docs.astral.sh/uv/)** — Python package manager
- **API keys**: [Anthropic](https://console.anthropic.com/)

## Getting Started

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd lsd-react-ui-cr
```

### 2. Set up environment variables

**Backend** (`.env`):

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `JWT_SECRET` | Secret key for signing JWT tokens (change from default in production) |
| `LANGSMITH_API_KEY` | *(optional)* Enable LangSmith tracing |
| `LANGSMITH_PROJECT` | *(optional)* LangSmith project name |
| `LANGSMITH_TRACING` | *(optional)* Set to `true` to enable tracing |

### 3. Install dependencies

```bash
uv sync
cd frontend && npm install && cd ..
```

### 4. Build the frontend

```bash
cd frontend && npm run build && cd ..
```

### 5. Run locally

```bash
uv run langgraph dev --allow-blocking
```

Open **http://localhost:2024/app/**

## Authentication Flow

This demo shows how custom auth integrates with the agent server:

1. User signs up or signs in via the frontend login form
2. The backend creates/validates credentials against a local SQLite database and returns a JWT
3. The frontend sends the JWT as `Authorization: Bearer <token>` with every request
4. `src/auth.py` validates the JWT and extracts the user identity
5. LangGraph resources (threads, runs) are automatically scoped to the authenticated user via metadata filters
6. Users can only access their own conversations

The key insight: you write one auth handler and it applies to **all** agent server endpoints — threads, runs, assistants, and your custom routes.

> **Note:** This demo uses a local SQLite database for user storage, which works for local development and dev deployments (single container, no autoscaling). For production deployments with autoscaling, you should use a proper auth provider like [Supabase](https://supabase.com/), [Auth0](https://auth0.com/), or [Clerk](https://clerk.com/) — the container filesystem is ephemeral and not shared across replicas.

## Customization

### Swapping the Agent

Update the graph path in `langgraph.json`. You can also change which assistant the frontend connects to at runtime via the **Settings** gear icon in the header.

### Theming

Colors are CSS custom properties in `frontend/src/index.css` — change `--accent`, `--background`, `--border`, etc.

## Project Structure

```text
├── langgraph.json                     # Deployment config (graphs, auth, http, env)
├── src/
│   ├── app.py                         # Custom HTTP routes (serves frontend + auth endpoints)
│   ├── auth.py                        # Custom auth (local SQLite + JWT validation)
│   └── deep_research/
│       ├── agent.py                   # Deep research agent definition
│       └── research_agent/
│           ├── prompts.py             # System prompts
│           └── tools.py              # web_search (native), think_tool
│
├── frontend/src/
│   ├── App.tsx                        # Main app with auth + streaming
│   ├── Auth.tsx                       # Local sign in/up
│   └── components/
│       ├── MessageList.tsx            # Chat messages
│       ├── ToolCallCard.tsx           # Tool call display with rich renderers
│       ├── SubagentActivity.tsx       # Subagent pipeline visualization
│       ├── SettingsModal.tsx          # Assistant ID configuration
│       └── toolcalls/                 # Rich renderers for deep agent tools
│
└── .env.example                       # Environment template
```

## Stack

| Layer | Technology |
|-------|-----------|
| Agent | `deepagents`, `langchain-anthropic`, Anthropic native `web_search` |
| Server | LangSmith Deployments agent server, FastAPI (custom routes) |
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS v4 |
| Streaming | `@langchain/react`, `streamdown` |
| Auth | Local SQLite + JWT (frontend + backend validation) |

## License

MIT
