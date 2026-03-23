import { useState, type FC } from "react";
import { createPortal } from "react-dom";

const DEFAULT_ASSISTANT_ID = "agent";

const SettingsModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  assistantId: string;
  onAssistantIdChange: (id: string) => void;
}> = ({ isOpen, onClose, assistantId, onAssistantIdChange }) => {
  const [draft, setDraft] = useState(assistantId);

  if (!isOpen) return null;

  const handleSave = () => {
    const value = draft.trim();
    if (!value) return;
    onAssistantIdChange(value);
    onClose();
  };

  return createPortal(
    <div
      className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="dialog-content flex w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <h2 className="text-sm font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            title="Close"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label
              htmlFor="assistant-id"
              className="mb-1 block text-xs font-medium text-[var(--foreground)]"
            >
              Assistant ID
            </label>
            <p className="mb-2 text-[11px] text-[var(--muted-foreground)]">
              The graph name from your <code className="rounded bg-[var(--muted)] px-1 py-0.5">langgraph.json</code> configuration.
              Changing this will start a new conversation.
            </p>
            <div className="flex gap-2">
              <input
                id="assistant-id"
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSave();
                }}
                placeholder={DEFAULT_ASSISTANT_ID}
                className="flex-1 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3">
          <button
            onClick={() => setDraft(DEFAULT_ASSISTANT_ID)}
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            Reset to default
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!draft.trim()}
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--accent-foreground)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default SettingsModal;
