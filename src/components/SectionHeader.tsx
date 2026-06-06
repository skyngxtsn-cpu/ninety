type Props = {
  kicker?: string;
  title: string;
  action?: { label: string; href: string };
};

export function SectionHeader({ kicker, title, action }: Props) {
  return (
    <div className="flex items-end justify-between px-4 pt-7 pb-3">
      <div>
        {kicker && (
          <p className="text-[10px] tracking-[0.18em] uppercase text-[var(--text-dim)] mb-1">
            {kicker}
          </p>
        )}
        <h2 className="text-[19px] font-semibold tracking-tight text-gradient">
          {title}
        </h2>
      </div>
      {action && (
        <a
          href={action.href}
          className="text-xs text-[var(--text-muted)] hover:text-white transition"
        >
          {action.label} ›
        </a>
      )}
    </div>
  );
}
