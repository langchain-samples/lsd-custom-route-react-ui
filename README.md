# LangSmith Deployments: Custom Route + React UI

A demo showcasing **LangSmith Deployments custom routes** — a deep research agent and a React chat UI served from a single deployment. The frontend is built with Vite and uses the `useStream` hook from `@langchain/langgraph-sdk/react` to communicate with the agent. Since both live on the same origin, no proxy or CORS configuration is needed.

## How it works

```
langgraph.json
  ├── graphs.agent  →  src/deep_research/agent.py  (deep agent via create_deep_agent)
  └── http.app      →  src/app.py                   (FastAPI app serving React at /app)
```

The LangGraph server handles the agent API (`/threads`, `/runs`, etc.) while the custom FastAPI app serves the built React frontend as static files at `/app/`. The React app talks to the agent API on the same origin — zero configuration.

## Project structure

```
├── src/
│   ├── app.py                        # FastAPI custom routes (serves frontend + /health)
│   └── deep_research/
│       ├── agent.py                  # Deep agent (create_deep_agent + Claude Sonnet 4.6)
│       ├── utils.py                  # Message formatting utilities
│       └── research_agent/
│           ├── tools.py              # Tavily search + think_tool for reflection
│           └── prompts.py            # System prompts for orchestrator & researcher
├── frontend/
│   ├── src/App.tsx                   # Chat UI (useStream, file viewer, todos, thread picker)
│   ├── src/main.tsx                  # React entry point
│   └── src/index.css                 # Tailwind v4 styles
├── langgraph.json                    # Deployment config
├── pyproject.toml                    # Python dependencies
└── .env.example                      # API keys template
```

## Features

- **Streaming chat** — token-by-token AI responses via `useStream`
- **Tool call visibility** — see tool name + args while running, result when done
- **File system panel** — browse files the agent creates, with viewer/copy/download
- **Agent tasks** — live todo list showing what the agent is working on
- **Thread management** — switch between conversations, start new threads
- **Stop button** — cancel a running stream mid-response

## Quickstart

### 1. Set up environment

```bash
cp .env.example .env
# Add your ANTHROPIC_API_KEY and optionally LANGSMITH_API_KEY
```

### 2. Install Python dependencies

```bash
uv sync
```

### 3. Build the frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

### 4. Run locally

```bash
uv run langgraph dev --allow-blocking
```

Open **http://localhost:2024/app/** in your browser.

## Deploy to LangSmith

This project deploys as-is to LangSmith Deployments. The `langgraph.json` config tells the platform about both the agent graph and the custom HTTP app:

```json
{
  "graphs": {
    "agent": "./src/deep_research/agent.py:agent"
  },
  "http": {
    "app": "./src/app.py:app"
  },
  "env": ".env"
}
```

After deploying, the chat UI is available at `https://<your-deployment>/app/`.

## Frontend tech

- **Vite** + **React 19** + **TypeScript**
- **Tailwind CSS v4** via `@tailwindcss/postcss`
- **`useStream`** from `@langchain/langgraph-sdk/react` — handles thread creation, streaming, messages, tool calls, and state
- **`react-markdown`** + `remark-gfm` for rendering assistant responses
- No framework (Next.js, etc.) — just a static SPA served via FastAPI `StaticFiles`

## Key files

| File | What it does |
|------|-------------|
| `src/deep_research/agent.py` | Creates the deep agent with `create_deep_agent` and Claude Sonnet 4.6 |
| `src/deep_research/research_agent/tools.py` | Tavily web search + think tool for strategic reflection |
| `src/deep_research/research_agent/prompts.py` | System prompts for orchestrator and researcher agents |
| `src/app.py` | FastAPI app: mounts React build at `/app`, adds `/health` |
| `langgraph.json` | Wires the agent + custom routes for deployment |
| `frontend/src/App.tsx` | The entire chat UI in one file |
