import { useRef, useEffect, useState, useCallback, type FC } from "react";
import { createPortal } from "react-dom";
import { useStream } from "@langchain/langgraph-sdk/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getTextContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content))
    return content
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text)
      .join("");
  return "";
}

function extOf(path: string): string {
  return path.split(".").pop()?.toLowerCase() ?? "";
}

// ── File Viewer Dialog ───────────────────────────────────────────────────────

const FileViewDialog: FC<{
  fileName: string;
  content: unknown;
  onClose: () => void;
}> = ({ fileName, content: rawContent, onClose }) => {
  // Coerce content to string — state may hold non-string values
  const content = typeof rawContent === "string"
    ? rawContent
    : rawContent != null
      ? JSON.stringify(rawContent, null, 2)
      : "";

  const isMarkdown = ["md", "markdown"].includes(extOf(fileName));

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content);
  }, [content]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.split("/").pop() ?? "file";
    a.click();
    URL.revokeObjectURL(url);
  }, [content, fileName]);

  // Render into a portal so errors don't blank the whole app
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <svg className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
            <span className="truncate text-sm font-medium">{String(fileName)}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button onClick={handleCopy} className="rounded-md p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)]" title="Copy">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            </button>
            <button onClick={handleDownload} className="rounded-md p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)]" title="Download">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </button>
            <button onClick={onClose} className="rounded-md p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)]" title="Close">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          {content ? (
            isMarkdown ? (
              <div className="markdown-body text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--foreground)]">
                {content}
              </pre>
            )
          ) : (
            <p className="text-center text-sm text-[var(--muted-foreground)]">File is empty</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

// ── Files Panel ──────────────────────────────────────────────────────────────

const FilesPanel: FC<{ files: Record<string, string> }> = ({ files }) => {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const fileNames = Object.keys(files);

  // Auto-open when files first appear
  useEffect(() => {
    if (fileNames.length > 0) setOpen(true);
  }, [fileNames.length > 0]);

  if (fileNames.length === 0) return null;

  return (
    <>
      <div className="border-t border-[var(--border)]">
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-semibold tracking-wide text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
          FILES
          <span className="rounded-full bg-[var(--primary)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--primary-foreground)]">
            {fileNames.length}
          </span>
          <svg
            className={`ml-auto h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {open && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 px-4 pb-3">
            {fileNames.map((name) => (
              <button
                key={name}
                onClick={() => setSelectedFile(name)}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-3 py-3 text-center transition-colors hover:bg-[var(--muted)]"
              >
                <svg className="h-6 w-6 text-[var(--muted-foreground)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
                <span className="w-full truncate text-xs font-medium">{name.split("/").pop()}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedFile && (
        <FileViewDialog
          fileName={selectedFile}
          content={files[selectedFile] ?? ""}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </>
  );
};

// ── Todos Panel ──────────────────────────────────────────────────────────────

const TodosPanel: FC<{ todos: any[] }> = ({ todos }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (todos.length > 0) setOpen(true);
  }, [todos.length > 0]);

  if (todos.length === 0) return null;

  const inProgress = todos.filter((t: any) => t.status === "in_progress");
  const completed = todos.filter((t: any) => t.status === "completed");
  const pending = todos.filter((t: any) => t.status === "pending");

  return (
    <div className="border-t border-[var(--border)]">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-semibold tracking-wide text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838.838-2.872a2 2 0 0 1 .506-.855z"/></svg>
        AGENT TASKS
        <span className="rounded-full bg-[var(--primary)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--primary-foreground)]">
          {todos.length}
        </span>
        <svg
          className={`ml-auto h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="space-y-1 px-4 pb-3">
          {[...inProgress, ...pending, ...completed].map((todo: any, i: number) => (
            <div key={todo.id ?? i} className="flex items-start gap-2 rounded-md px-2 py-1.5 text-xs">
              {todo.status === "completed" ? (
                <span className="mt-0.5 text-emerald-600">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
              ) : todo.status === "in_progress" ? (
                <span className="mt-0.5 animate-spin text-blue-600">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                </span>
              ) : (
                <span className="mt-0.5 text-[var(--muted-foreground)]">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
                </span>
              )}
              <span className={todo.status === "completed" ? "text-[var(--muted-foreground)] line-through" : ""}>
                {todo.content}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Thread Picker ────────────────────────────────────────────────────────────

const ThreadPicker: FC<{
  currentThreadId: string | null;
  onSelect: (id: string | null) => void;
}> = ({ currentThreadId, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<any[]>([]);

  const loadThreads = useCallback(async () => {
    try {
      const { Client } = await import("@langchain/langgraph-sdk");
      const client = new Client({ apiUrl: window.location.origin });
      const result = await client.threads.search({ limit: 20 });
      setThreads(result);
    } catch (e) {
      console.error("Failed to load threads:", e);
    }
  }, []);

  useEffect(() => {
    if (open) loadThreads();
  }, [open, loadThreads]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        {currentThreadId ? `${currentThreadId.slice(0, 8)}...` : "Threads"}
        <svg className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-xl border border-[var(--border)] bg-white shadow-lg">
            <div className="border-b border-[var(--border)] px-3 py-2">
              <button
                onClick={() => { onSelect(null); setOpen(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                New Thread
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              {threads.length === 0 && (
                <p className="px-3 py-4 text-center text-xs text-[var(--muted-foreground)]">No threads yet</p>
              )}
              {threads.map((t: any) => (
                <button
                  key={t.thread_id}
                  onClick={() => { onSelect(t.thread_id); setOpen(false); }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[var(--muted)] ${t.thread_id === currentThreadId ? "bg-[var(--muted)] font-medium" : ""}`}
                >
                  <span className="truncate font-mono">{t.thread_id.slice(0, 12)}...</span>
                  <span className="ml-auto shrink-0 text-[var(--muted-foreground)]">
                    {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const stream = useStream<{
    messages: any[];
    files?: Record<string, string>;
    todos?: any[];
  }>({
    apiUrl: window.location.origin,
    assistantId: "agent",
    messagesKey: "messages",
    threadId,
    onThreadId: (id) => setThreadId(id),
  });

  const { messages, isLoading, error, values } = stream;
  const files = values?.files ?? {};
  const todos = values?.todos ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    stream.submit({ messages: [{ type: "human", content: text }] });
  };

  return (
    <div className="flex h-dvh flex-col bg-[var(--background)]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">LangSmith Custom Route Chat</h1>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
            Online
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setThreadId(null)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            New
          </button>
          <ThreadPicker currentThreadId={threadId} onSelect={setThreadId} />
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-3">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <h2 className="text-2xl font-semibold">Hello there!</h2>
              <p className="mt-2 text-[var(--muted-foreground)]">How can I help you today?</p>
            </div>
          )}

          {messages.map((msg, idx) => {
            const m = msg as any;
            const msgType: string = m.type ?? "unknown";
            const content = getTextContent(m.content);

            // Human messages
            if (msgType === "human") {
              return (
                <div key={msg.id ?? idx} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl bg-[var(--primary)] px-4 py-2.5 text-sm leading-relaxed text-[var(--primary-foreground)]">
                    {content}
                  </div>
                </div>
              );
            }

            // AI messages — render text + tool calls via getToolCalls()
            if (msgType === "ai") {
              const toolCalls = (stream as any).getToolCalls(msg) as any[];

              return (
                <div key={msg.id ?? idx} className="flex flex-col items-start gap-2">
                  {/* AI text content */}
                  {content ? (
                    <div className="max-w-[80%] rounded-2xl bg-[var(--muted)] px-4 py-2.5 text-sm leading-relaxed">
                      <div className="markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                      </div>
                    </div>
                  ) : !toolCalls.length ? (
                    <div className="rounded-2xl bg-[var(--muted)] px-4 py-2.5 text-sm text-[var(--muted-foreground)]">
                      <span className="inline-flex items-center gap-1">
                        <span className="animate-pulse">●</span>
                        <span className="animate-pulse" style={{ animationDelay: "150ms" }}>●</span>
                        <span className="animate-pulse" style={{ animationDelay: "300ms" }}>●</span>
                      </span>
                    </div>
                  ) : null}

                  {/* Tool calls from this AI message */}
                  {toolCalls.map((tc: any) => {
                    const call = tc.call ?? tc;
                    const isPending = tc.state === "pending";
                    const isError = tc.state === "error";
                    const resultStr = tc.result != null
                      ? typeof tc.result === "string" ? tc.result : JSON.stringify(tc.result, null, 2)
                      : null;
                    const argsStr = call.args
                      ? typeof call.args === "string" ? call.args : JSON.stringify(call.args, null, 2)
                      : null;

                    return (
                      <div key={tc.id ?? call.id} className="max-w-[80%] rounded-xl border border-[var(--border)] bg-white text-xs">
                        {/* Header: icon + name + status */}
                        <div className="flex items-center gap-2 px-3 py-2 text-[var(--muted-foreground)]">
                          {isPending ? (
                            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-amber-100 text-amber-700">
                              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                            </span>
                          ) : isError ? (
                            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-red-100 text-red-700">
                              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>
                            </span>
                          ) : (
                            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-100 text-emerald-700">
                              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                            </span>
                          )}
                          <span className="font-medium text-[var(--foreground)]">{call.name ?? tc.name}</span>
                          <span className="ml-auto">{isPending ? "running..." : isError ? "error" : ""}</span>
                        </div>

                        {/* Args (shown while pending so user sees what's happening) */}
                        {isPending && argsStr && argsStr !== "{}" && (
                          <pre className="border-t border-[var(--border)] px-3 py-2 max-h-24 overflow-auto whitespace-pre-wrap text-[var(--muted-foreground)]">
                            {argsStr.slice(0, 300)}{argsStr.length > 300 ? "..." : ""}
                          </pre>
                        )}

                        {/* Result (shown when completed) */}
                        {resultStr && (
                          <pre className="border-t border-[var(--border)] px-3 py-2 max-h-32 overflow-auto whitespace-pre-wrap text-[var(--muted-foreground)]">
                            {resultStr.slice(0, 500)}{resultStr.length > 500 ? "..." : ""}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            }

            // Any other message type — show it
            if (content) {
              return (
                <div key={msg.id ?? idx} className="flex justify-start">
                  <div className="max-w-[80%] rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs text-[var(--muted-foreground)]">
                    <span className="font-mono">[{msgType}]</span> {content.slice(0, 300)}
                  </div>
                </div>
              );
            }

            return null;
          })}

          {error != null && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Error: {String((error as any)?.message ?? error)}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Todos + Files panels */}
      <TodosPanel todos={todos} />
      <FilesPanel files={files} />

      {/* Input */}
      <footer className="border-t border-[var(--border)] bg-[var(--background)] px-4 py-4">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-2xl items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Send a message..."
            rows={1}
            autoFocus
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-[var(--input-border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--input-focus)] focus:ring-1 focus:ring-[var(--input-focus)]"
          />
          <button
            type={isLoading ? "button" : "submit"}
            onClick={isLoading ? () => stream.stop() : undefined}
            disabled={!isLoading && !input.trim()}
            className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] transition-opacity disabled:opacity-40"
          >
            {isLoading ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></svg>
            )}
          </button>
        </form>
      </footer>
    </div>
  );
}
