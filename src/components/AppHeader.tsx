import Link from "next/link";

type Props = {
  title?: string;
  back?: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
};

export function AppHeader({ title, back, subtitle, rightSlot }: Props) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 pt-safe pb-3 backdrop-blur-xl bg-[rgba(7,8,12,0.6)] border-b border-[var(--border)]">
      <div className="flex items-center gap-2 min-w-0">
        {back ? (
          <Link
            href={back}
            aria-label="戻る"
            className="w-9 h-9 -ml-2 flex items-center justify-center rounded-full text-white/85 hover:bg-white/10 transition"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 5l-7 7 7 7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        ) : (
          <Brand />
        )}
        <div className="min-w-0">
          {title && (
            <h1 className="text-[15px] font-semibold tracking-tight truncate">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-[11px] text-[var(--text-muted)] truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {rightSlot}
    </header>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff3b30] to-[#ffb020] flex items-center justify-center shadow-[0_4px_16px_-4px_rgba(255,59,48,0.6)]">
        <span className="text-[12px] font-black text-white tracking-tighter leading-none">90</span>
      </div>
      <span className="text-[16px] font-semibold tracking-tight">
        90<span className="text-[var(--text-muted)] text-[12px] ml-1 font-medium">/W杯</span>
      </span>
    </Link>
  );
}
