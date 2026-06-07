"use client";

type Props = {
  matchId: string;
  text: string;
};

export function XShareButton({ matchId, text }: Props) {
  const handleClick = () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/matches/${matchId}`
        : `/matches/${matchId}`;
    const body = `${text}\n\n#W杯2026 #90app\n${url}`;
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(body)}`;
    window.open(intent, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl bg-black border border-white/15 hover:bg-white/[0.04] transition active:scale-[0.98]"
      aria-label="Xでシェア"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      <span className="text-[14px] font-semibold">Xでシェア</span>
    </button>
  );
}
