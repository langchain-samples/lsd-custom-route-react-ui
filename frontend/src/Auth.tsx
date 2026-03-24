import { useState } from "react";
import { APP_NAME } from "./constants";
import { getErrorMessage } from "./lib/stream";

type Mode = "login" | "signup";

export interface AuthSession {
  token: string;
  user: { id: string; email: string };
}

export default function Auth({ onAuth }: { onAuth: (session: AuthSession) => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === "signup" ? "/auth/signup" : "/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      onAuth(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-dvh items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-white p-5 shadow-md sm:p-8">
        <div className="flex justify-center mb-4">
          <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
            <path d="M12 2L2 12l10 10 10-10L12 2z" />
            <path d="M12 8L8 12l4 4 4-4-4-4z" />
          </svg>
        </div>
        <h1 className="text-center text-xl font-semibold">{APP_NAME}</h1>
        <p className="mt-1 text-center text-sm text-[var(--muted-foreground)]">
          {mode === "login" ? "Sign in to continue" : "Create an account"}
        </p>

        <div className="mt-6 flex rounded-lg border border-[var(--border)] p-0.5">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "login"
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "signup"
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-[var(--foreground)]">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--input-border)] px-3 py-2 text-sm outline-none focus:border-[var(--input-focus)] focus:ring-1 focus:ring-[var(--input-focus)]"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-[var(--foreground)]">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--input-border)] px-3 py-2 text-sm outline-none focus:border-[var(--input-focus)] focus:ring-1 focus:ring-[var(--input-focus)]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
