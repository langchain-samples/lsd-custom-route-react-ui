type ConfigNoticeProps = {
  title: string;
  message: string;
  details?: string[];
};

export default function ConfigNotice({
  title,
  message,
  details = [],
}: ConfigNoticeProps) {
  return (
    <div className="flex h-dvh items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-white p-8 shadow-md">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
          {message}
        </p>
        {details.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm text-[var(--foreground)]">
            {details.map((detail) => (
              <li key={detail} className="rounded-lg bg-[var(--muted)] px-3 py-2">
                <code>{detail}</code>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
