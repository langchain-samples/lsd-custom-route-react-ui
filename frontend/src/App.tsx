import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { APP_DESCRIPTION, APP_NAME } from "./constants";
import { getErrorMessage } from "./lib/format";
import Auth from "./Auth";
import SettingsModal from "./components/SettingsModal";
import { Composer, ThreadView } from "./components/Thread";
import ThreadPicker from "./components/ThreadPicker";
import TodosPanel from "./components/TodosPanel";
import FilesPanel from "./components/FilePanels";
import {
  RuntimeProvider,
  useGraphValues,
  useThreadActions,
} from "./RuntimeProvider";
import { supabase, supabaseConfigError } from "./supabaseClient";

function AppHeader({
  session,
  currentThreadId,
  onSelectThread,
  onNewThread,
  onOpenSettings,
  onSignOut,
}: {
  session: Session;
  currentThreadId: string | null;
  onSelectThread: (id: string | null) => void;
  onNewThread: () => void;
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
          onClick={onNewThread}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] p-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent-bg)] sm:px-3 sm:py-1.5"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          <span className="hidden sm:inline">New</span>
        </button>
        <ThreadPicker
          accessToken={session.access_token}
          currentThreadId={currentThreadId}
          onSelect={onSelectThread}
        />
      </div>
    </header>
  );
}

function ChatLayout({
  session,
  onOpenSettings,
  onSignOut,
}: {
  session: Session;
  onOpenSettings: () => void;
  onSignOut: () => void;
}) {
  const { todos, files } = useGraphValues();
  const { currentExternalId, switchToExistingThread, newThread } =
    useThreadActions();
  const [showTodos, setShowTodos] = useState(false);
  const [showFiles, setShowFiles] = useState(false);

  const handleSelectThread = useCallback(
    (id: string | null) => {
      if (id === null) newThread();
      else switchToExistingThread(id);
    },
    [newThread, switchToExistingThread],
  );

  const fileCount = useMemo(() => Object.keys(files).length, [files]);

  return (
    <div className="flex h-dvh flex-col bg-[var(--background)]">
      <AppHeader
        session={session}
        currentThreadId={currentExternalId}
        onSelectThread={handleSelectThread}
        onNewThread={newThread}
        onOpenSettings={onOpenSettings}
        onSignOut={onSignOut}
      />
      <ThreadView />
      {showTodos && todos.length > 0 && (
        <div className="border-t border-[var(--border)]">
          <TodosPanel todos={todos} />
        </div>
      )}
      {showFiles && fileCount > 0 && (
        <div className="border-t border-[var(--border)]">
          <FilesPanel files={files} />
        </div>
      )}
      <Composer
        todoCount={todos.length}
        fileCount={fileCount}
        showTodos={showTodos}
        showFiles={showFiles}
        onToggleTodos={() => setShowTodos((v) => !v)}
        onToggleFiles={() => setShowFiles((v) => !v)}
      />
    </div>
  );
}

function AuthenticatedApp({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  const [assistantId, setAssistantId] = useState<string>(
    () => localStorage.getItem("settings:assistantId") || "agent",
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleAssistantIdChange = useCallback((id: string) => {
    setAssistantId(id);
    localStorage.setItem("settings:assistantId", id);
  }, []);

  return (
    <RuntimeProvider session={session} assistantId={assistantId}>
      <ChatLayout
        session={session}
        onOpenSettings={() => setSettingsOpen(true)}
        onSignOut={onSignOut}
      />
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        assistantId={assistantId}
        onAssistantIdChange={handleAssistantIdChange}
      />
    </RuntimeProvider>
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
