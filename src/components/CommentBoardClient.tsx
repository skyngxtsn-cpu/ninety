"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  REACTION_EMOJIS,
  type Comment,
  type CommentsResponse,
  type ReactionCounts,
  type ReactionEmoji,
} from "../lib/comments/types";
import {
  useUserIdentity,
  generateDefaultNick,
} from "../lib/useUserIdentity";
import { useSpoilerBlock } from "../lib/preferences";
import { SpoilerWrap } from "./SpoilerWrap";

type Props = {
  matchId: string;
  status: "scheduled" | "live" | "finished";
  defaultFlag?: string;
};

export function CommentBoardClient({ matchId, status, defaultFlag }: Props) {
  const { userId, nick, ensureIdentity, setNick } = useUserIdentity(defaultFlag);
  const { blocked: spoilerBlock } = useSpoilerBlock();
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<ReactionCounts>(
    Object.fromEntries(REACTION_EMOJIS.map((e) => [e, 0])) as ReactionCounts,
  );
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNickEdit, setShowNickEdit] = useState(false);
  const cursorRef = useRef(0);

  const fetchOnce = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/matches/${matchId}/comments?since=${cursorRef.current}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as CommentsResponse;
      if (data.comments.length > 0) {
        setComments((prev) => {
          const ids = new Set(prev.map((c) => c.id));
          const next = [...prev];
          for (const c of data.comments) {
            if (!ids.has(c.id)) next.push(c);
          }
          return next;
        });
      }
      setReactions(data.reactions);
      cursorRef.current = data.cursor || cursorRef.current;
    } catch {
      // ignore
    }
  }, [matchId]);

  useEffect(() => {
    void fetchOnce();
    const interval = status === "live" ? 5000 : 15000;
    const id = window.setInterval(fetchOnce, interval);
    return () => window.clearInterval(id);
  }, [fetchOnce, status]);

  const send = async () => {
    setError(null);
    const t = text.trim();
    if (!t) return;
    const ident = ensureIdentity();
    setPosting(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: ident.userId,
          nick: ident.nick,
          flag: defaultFlag,
          text: t,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "投稿に失敗しました");
        return;
      }
      setText("");
      await fetchOnce();
    } finally {
      setPosting(false);
    }
  };

  const toggleReaction = async (emoji: ReactionEmoji) => {
    const ident = ensureIdentity();
    setReactions((prev) => ({ ...prev, [emoji]: (prev[emoji] ?? 0) + 1 }));
    try {
      const res = await fetch(`/api/matches/${matchId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: ident.userId, emoji }),
      });
      if (res.ok) {
        const j = (await res.json()) as { counts: ReactionCounts };
        setReactions(j.counts);
      }
    } catch {
      void fetchOnce();
    }
  };

  const blockedView = spoilerBlock && status !== "scheduled";

  return (
    <>
      {/* ニック編集 */}
      <div className="mx-4 mt-3 flex items-center justify-between text-[11px]">
        <span className="text-white/55">
          {nick ? (
            <>
              <span className="text-white/40">as</span>{" "}
              <span className="text-white">{nick}</span>
            </>
          ) : (
            "ニック未設定"
          )}
        </span>
        <button
          onClick={() => setShowNickEdit((v) => !v)}
          className="text-white/55 hover:text-white/85 underline-offset-2 hover:underline"
        >
          {showNickEdit ? "閉じる" : "ニック変更"}
        </button>
      </div>

      {showNickEdit && (
        <div className="mx-4 mt-2">
          <NickEditor
            currentNick={nick}
            defaultFlag={defaultFlag}
            onSave={(n) => {
              ensureIdentity(n);
              setNick(n);
              setShowNickEdit(false);
            }}
          />
        </div>
      )}

      {/* リアクションバー */}
      <div className="mx-4 mt-3 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {REACTION_EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => toggleReaction(e)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/8 hover:bg-white/15 transition text-[15px] shrink-0"
          >
            <span>{e}</span>
            <span className="text-[11px] font-mono text-white/65 tabular-nums">
              {reactions[e] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {blockedView && (
        <div className="mx-4 mt-3 text-[10.5px] text-amber-300/90 bg-amber-500/10 border border-amber-400/30 rounded-lg px-3 py-2 leading-relaxed">
          ⚠️ ネタバレ防止モード中：試合進行中・終了後のコメントは隠れます（タップで開く）
        </div>
      )}

      {/* タイムライン */}
      <div className="mt-3 px-4 pb-32 space-y-3">
        {comments.length === 0 ? (
          <p className="text-[12px] text-white/45 text-center py-12">
            まだコメントはありません。
            <br />
            最初の一言を残しましょう。
          </p>
        ) : (
          comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              isMine={c.userId === userId}
              spoilerBlock={blockedView}
              onDeleted={() =>
                setComments((prev) => prev.filter((x) => x.id !== c.id))
              }
            />
          ))
        )}
      </div>

      {/* 下部固定の入力欄 */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pb-safe-input bg-gradient-to-t from-[var(--bg-0)] via-[rgba(7,8,12,0.95)] to-transparent pt-6 px-4">
        <div className="mx-auto max-w-[480px]">
          <div className="flex items-end gap-2 bg-[var(--bg-2)] border border-white/10 rounded-2xl p-2">
            <textarea
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={200}
              placeholder="話しながら見よう…"
              className="flex-1 resize-none bg-transparent text-[16px] text-white placeholder:text-white/40 focus:outline-none px-2 py-1 max-h-24"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button
              onClick={send}
              disabled={posting || !text.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 text-[13px] font-semibold text-white disabled:opacity-40 shrink-0"
            >
              {posting ? "…" : "送信"}
            </button>
          </div>
          {error && (
            <p className="text-[11px] text-rose-300 mt-1.5 px-2">{error}</p>
          )}
          <p className="text-[10px] text-white/40 mt-1 px-2">
            {text.length}/200・5秒に1回まで投稿可
          </p>
        </div>
      </div>
    </>
  );
}

function CommentItem({
  comment,
  isMine,
  spoilerBlock,
  onDeleted,
}: {
  comment: Comment;
  isMine: boolean;
  spoilerBlock: boolean;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const deleteIt = async () => {
    if (!confirm("このコメントを削除しますか？")) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/comments/${comment.id}?userId=${comment.userId}`,
        { method: "DELETE" },
      );
      if (res.ok) onDeleted();
    } finally {
      setBusy(false);
    }
  };
  const report = async () => {
    if (!confirm("このコメントを通報しますか？")) return;
    setBusy(true);
    try {
      await fetch(`/api/comments/${comment.id}`, { method: "POST" });
      alert("通報しました。");
    } finally {
      setBusy(false);
    }
  };

  const timeLabel = formatHHmmJST(comment.createdAt);

  const body = (
    <p className="text-[14px] leading-snug whitespace-pre-wrap break-words text-white/95">
      {comment.text}
    </p>
  );

  return (
    <article className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-white/8 border border-white/15 flex items-center justify-center text-[18px] shrink-0">
        {comment.flag ?? "👤"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-[13px] font-semibold text-white truncate">
            {comment.nick}
          </span>
          <span className="text-[10.5px] text-white/45 font-mono shrink-0">
            {timeLabel}
          </span>
          <span className="ml-auto flex items-center gap-2">
            {isMine ? (
              <button
                onClick={deleteIt}
                disabled={busy}
                className="text-[10px] text-rose-300/80 hover:text-rose-300"
              >
                削除
              </button>
            ) : (
              <button
                onClick={report}
                disabled={busy}
                className="text-[10px] text-white/40 hover:text-white/65"
              >
                通報
              </button>
            )}
          </span>
        </div>
        {spoilerBlock ? (
          <SpoilerWrap size="md" hint="コメントを開く">
            {body}
          </SpoilerWrap>
        ) : (
          body
        )}
      </div>
    </article>
  );
}

function NickEditor({
  currentNick,
  defaultFlag,
  onSave,
}: {
  currentNick: string | null;
  defaultFlag?: string;
  onSave: (next: string) => void;
}) {
  const [value, setValue] = useState(currentNick ?? "");
  return (
    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
      <p className="text-[11px] text-white/65 mb-1.5">ニックネーム（24文字以内）</p>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={24}
          placeholder={generateDefaultNick(defaultFlag)}
          className="flex-1 bg-white/5 border border-white/15 rounded-lg px-2.5 py-1.5 text-[16px] text-white"
        />
        <button
          onClick={() => onSave(value.trim() || generateDefaultNick(defaultFlag))}
          className="px-3 py-1.5 rounded-lg bg-blue-500 text-[12px] font-semibold text-white hover:bg-blue-400"
        >
          保存
        </button>
      </div>
    </div>
  );
}

/** JST の HH:MM を返す。別日なら MM/DD HH:MM */
function formatHHmmJST(ts: number): string {
  const d = new Date(ts);
  const utcMin = d.getUTCHours() * 60 + d.getUTCMinutes();
  const jstMin = (utcMin + 9 * 60) % (24 * 60);
  const hh = String(Math.floor(jstMin / 60)).padStart(2, "0");
  const mm = String(jstMin % 60).padStart(2, "0");
  // 日付チェック（JST）
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const todayJST = jstNow.toISOString().slice(0, 10);
  const dJST = new Date(d.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  if (todayJST === dJST) return `${hh}:${mm}`;
  return `${dJST.slice(5).replace("-", "/")} ${hh}:${mm}`;
}
