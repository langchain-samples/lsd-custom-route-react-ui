import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { APP_DESCRIPTION, APP_NAME } from "./constants";
import MessageList from "./components/MessageList";
import FilesPanel from "./components/FilePanels";
import ThreadPicker from "./components/ThreadPicker";
import TodosPanel from "./components/TodosPanel";
import { useAgentStream, getErrorMessage } from "./lib/stream";
import Auth from "./Auth";
import SettingsModal from "./components/SettingsModal";
import { supabase, supabaseConfigError } from "./supabaseClient";

function AppHeader({
  session,
  threadId,
  onResetThread,
  onSelectThread,
  onOpenSettings,
  onSignOut,
}: {
  session: Session;
  threadId: string | null;
  onResetThread: () => void;
  onSelectThread: (threadId: string | null) => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
}) {
  return (
    <header className="header-blur sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-3 py-2 sm:px-6 sm:py-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
          <path d="M12 2L2 12l10 10 10-10L12 2z" />
          <path d="M12 8L8 12l4 4 4-4-4-4z" />
        </svg>
        <div>
          <h1 className="text-sm font-semibold sm:text-lg">{APP_NAME}</h1>
          <p className="hidden text-xs text-[var(--muted-foreground)] sm:block">{APP_DESCRIPTION}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="hidden max-w-[160px] truncate text-xs text-[var(--muted-foreground)] md:inline">
          {session.user.email}
        </span>
        <button
          onClick={onOpenSettings}
          className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent-bg)]"
          title="Settings"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        <button
          onClick={onSignOut}
          className="hidden rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent-bg)] sm:block"
        >
          Sign Out
        </button>
        <button
          onClick={onSignOut}
          className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent-bg)] sm:hidden"
          title="Sign Out"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
        </button>
        <button
          onClick={onResetThread}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] p-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent-bg)] sm:px-3 sm:py-1.5"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          <span className="hidden sm:inline">New</span>
        </button>
        <ThreadPicker
          currentThreadId={threadId}
          onSelect={onSelectThread}
          accessToken={session.access_token}
        />
      </div>
    </header>
  );
}

function AuthenticatedApp({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [assistantId, setAssistantId] = useState<string>(
    () => localStorage.getItem("settings:assistantId") || "agent",
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const isNearBottom = useRef(true);
  const rafId = useRef(0);

  const handleAssistantIdChange = useCallback(
    (id: string) => {
      setAssistantId(id);
      localStorage.setItem("settings:assistantId", id);
      setThreadId(null);
    },
    [],
  );

  const defaultHeaders = useMemo(
    () => ({ Authorization: `Bearer ${session.access_token}` }),
    [session.access_token],
  );

  const stream = useAgentStream({
    apiUrl: window.location.origin,
    assistantId,
    messagesKey: "messages",
    threadId,
    onThreadId: setThreadId,
    filterSubagentMessages: true,
    defaultHeaders,
  });

  const { messages, isLoading, error, values } = stream;
  const files = values.files ?? {};
  const todos = values.todos ?? [];
  const [showTodos, setShowTodos] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const todoCount = todos.length;
  const fileCount = Object.keys(files).length;

  const handleScroll = useCallback(() => {
    const element = mainRef.current;
    if (!element) return;
    isNearBottom.current =
      element.scrollHeight - element.scrollTop - element.clientHeight < 80;
  }, []);

  useEffect(() => {
    if (!isNearBottom.current) return;

    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      const element = mainRef.current;
      if (element) element.scrollTop = element.scrollHeight;
    });
  }, [messages]);

  useEffect(() => () => cancelAnimationFrame(rafId.current), []);

  const submitInput = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    await stream.submit(
      { messages: [{ type: "human", content: text }] },
      { streamSubgraphs: true },
    );
  }, [input, isLoading, stream]);

  return (
    <div className="flex h-dvh flex-col bg-[var(--background)]">
      <AppHeader
        session={session}
        threadId={threadId}
        onResetThread={() => setThreadId(null)}
        onSelectThread={setThreadId}
        onOpenSettings={() => setSettingsOpen(true)}
        onSignOut={onSignOut}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        assistantId={assistantId}
        onAssistantIdChange={handleAssistantIdChange}
      />

      <MessageList
        bottomRef={bottomRef}
        error={error}
        isLoading={isLoading}
        mainRef={mainRef}
        messages={messages}
        onScroll={handleScroll}
        onSuggestionSelect={setInput}
        stream={stream}
      />

      {showTodos && todoCount > 0 && (
        <div className="border-t border-[var(--border)]">
          <TodosPanel todos={todos} />
        </div>
      )}
      {showFiles && fileCount > 0 && (
        <div className="border-t border-[var(--border)]">
          <FilesPanel files={files} />
        </div>
      )}

      <footer className="bg-[var(--background)] px-2 py-3 sm:px-4 sm:py-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submitInput();
          }}
          className="mx-auto max-w-4xl"
        >
          <div className="composer">
            <textarea
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                event.target.style.height = "auto";
                event.target.style.height = `${Math.min(event.target.scrollHeight, 200)}px`;
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submitInput();
                }
              }}
              placeholder="Send a message..."
              rows={1}
              autoFocus
              className="min-h-[44px] max-h-[200px] w-full resize-none bg-transparent px-4 pt-3 pb-1 text-sm outline-none placeholder:text-[var(--muted-foreground)]"
            />
            <div className="flex items-center justify-between px-4 pb-3">
              <div className="flex items-center gap-1.5">
                {todoCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowTodos((v) => !v)}
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                      showTodos
                        ? "bg-[var(--accent-bg)] text-[var(--foreground)]"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                    }`}
                  >
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9" />
                      <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838.838-2.872a2 2 0 0 1 .506-.855z" />
                    </svg>
                    Tasks
                    <span className="rounded-full bg-[var(--primary)] px-1.5 py-0.5 text-[9px] font-medium text-[var(--primary-foreground)]">
                      {todoCount}
                    </span>
                  </button>
                )}
                {fileCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowFiles((v) => !v)}
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                      showFiles
                        ? "bg-[var(--accent-bg)] text-[var(--foreground)]"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                    }`}
                  >
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                    </svg>
                    Files
                    <span className="rounded-full bg-[var(--primary)] px-1.5 py-0.5 text-[9px] font-medium text-[var(--primary-foreground)]">
                      {fileCount}
                    </span>
                  </button>
                )}
              </div>
              <button
                type={isLoading ? "button" : "submit"}
                onClick={isLoading ? () => void stream.stop() : undefined}
                disabled={!isLoading && !input.trim()}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all disabled:opacity-30 ${
                  isLoading
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)]"
                }`}
              >
                {isLoading ? (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="1" />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12 7-7 7 7" />
                    <path d="M12 19V5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </form>
      </footer>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let isActive = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isActive) return;
        setSession(data.session);
        setAuthLoading(false);
      })
      .catch((error) => {
        if (!isActive) return;
        setAuthError(getErrorMessage(error, "Failed to load authentication state."));
        setAuthLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isActive) return;
      setSession(nextSession);
      setAuthLoading(false);
      setAuthError(null);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = useCallback(() => {
    void supabase?.auth.signOut();
  }, []);

  if (supabaseConfigError) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[var(--background)]">
        <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-md sm:p-8 text-center">
          <h2 className="text-lg font-semibold">Missing configuration</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Copy <code>frontend/.env.example</code> to <code>frontend/.env</code> and set your Supabase credentials.
          </p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[var(--background)]">
        <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-md sm:p-8 text-center">
          <h2 className="text-lg font-semibold">Authentication unavailable</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">{authError}</p>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return <AuthenticatedApp session={session} onSignOut={handleSignOut} />;
}
