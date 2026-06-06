"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "ホーム", icon: HomeIcon },
  { href: "/standings", label: "順位", icon: TableIcon },
  { href: "/tournament", label: "T表", icon: BracketIcon },
  { href: "/my", label: "マイ", icon: HeartIcon },
  { href: "/settings", label: "設定", icon: GearIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-safe z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto mx-3 mb-3 flex w-full max-w-[460px] items-center justify-around rounded-2xl glass-strong px-2 py-1.5 shadow-[0_18px_50px_-15px_rgba(0,0,0,0.7)]">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 transition-colors ${
                active ? "text-white" : "text-[var(--text-dim)] hover:text-white"
              }`}
            >
              <Icon active={!!active} />
              <span className="text-[10px] font-medium tracking-wide">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M3.5 11.5L12 4l8.5 7.5V20a1 1 0 0 1-1 1h-4.5v-6h-6v6H4.5a1 1 0 0 1-1-1v-8.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        fill={active ? "rgba(255,255,255,0.10)" : "none"}
      />
    </svg>
  );
}

function TableIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect
        x="3.5"
        y="4.5"
        width="17"
        height="15"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
        fill={active ? "rgba(255,255,255,0.10)" : "none"}
      />
      <path d="M3.5 9.5h17M3.5 14.5h17M9 4.5v15" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function HeartIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill={active ? "rgba(255,59,48,0.85)" : "none"}
      />
    </svg>
  );
}

function BracketIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="4"
        width="6"
        height="3"
        rx="0.8"
        stroke="currentColor"
        strokeWidth="1.5"
        fill={active ? "rgba(255,255,255,0.10)" : "none"}
      />
      <rect
        x="3"
        y="9.5"
        width="6"
        height="3"
        rx="0.8"
        stroke="currentColor"
        strokeWidth="1.5"
        fill={active ? "rgba(255,255,255,0.10)" : "none"}
      />
      <rect
        x="3"
        y="15"
        width="6"
        height="3"
        rx="0.8"
        stroke="currentColor"
        strokeWidth="1.5"
        fill={active ? "rgba(255,255,255,0.10)" : "none"}
      />
      <path
        d="M9 6h3v4.5h3M9 11.5h3v5.5h3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <rect
        x="15"
        y="9.5"
        width="6"
        height="5"
        rx="0.8"
        stroke="currentColor"
        strokeWidth="1.5"
        fill={active ? "rgba(255,255,255,0.10)" : "none"}
      />
    </svg>
  );
}

function GearIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.6"
        fill={active ? "rgba(255,255,255,0.10)" : "none"}
      />
      <path
        d="M19.4 12a7.4 7.4 0 0 0-.1-1l2-1.5-2-3.4-2.3.9a7.5 7.5 0 0 0-1.7-1L15 3.5h-4l-.3 2.5a7.5 7.5 0 0 0-1.7 1l-2.3-.9-2 3.4 2 1.5a7.4 7.4 0 0 0 0 2l-2 1.5 2 3.4 2.3-.9c.5.4 1.1.8 1.7 1l.3 2.5h4l.3-2.5c.6-.2 1.2-.5 1.7-1l2.3.9 2-3.4-2-1.5c.1-.3.1-.7.1-1Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}
