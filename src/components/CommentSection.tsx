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
  /** 試合のステータス（live / finished の場合だけスポイラー対応） */
  status: "scheduled" | "live" | "finished";
  /** デフォルトニックに使う旗 */
  defaultFlag?: string;
};

export function CommentSection({ matchId, status, defaultFlag }: Props) {
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
  const listRef = useRef<HTMLDivElement | null>(null);

  // ポーリング
  const fetchOnce = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/matches/${matchId}/comments?since=${cursorRef.current}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as CommentsResponse;
      if (data.comments.length > 0) {
        setComments((prev) => {
          // 既存に追加（重複排除）
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
    // 楽観的更新
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
    <section className="mx-4 mt-5 glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[14px] font-bold">💬 コメント</h3>
        <button
          onClick={() => setShowNickEdit((v) => !v)}
          className="text-[11px] text-white/55 hover:text-white/85"
        >
          {nick ? `as ${nick}` : "ニック設定"}
        </button>
      </div>

      {showNickEdit && (
        <NickEditor
          currentNick={nick}
          defaultFlag={defaultFlag}
          onSave={(n) => {
            ensureIdentity(n);
            setNick(n);
            setShowNickEdit(false);
          }}
        />
      )}

      {/* リアクションバー */}
      <div className="flex items-center gap-1.5 mt-1 mb-3">
        {REACTION_EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => toggleReaction(e)}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/8 hover:bg-white/15 transition text-[14px]"
          >
            <span>{e}</span>
            <span className="text-[11px] font-mono text-white/65 tabular-nums">
              {reactions[e] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {blockedView && (
        <p className="text-[10px] text-amber-300/90 bg-amber-500/10 border border-amber-400/30 rounded-md px-2 py-1.5 leading-relaxed mb-3">
          ⚠️ ネタバレ防止モード中：コメントは「●●●」で隠れます（タップで開く）
        </p>
      )}

      {/* コメントリスト */}
      <div ref={listRef} className="space-y-2.5 max-h-[420px] overflow-y-auto scrollbar-none">
        {comments.length === 0 ? (
          <p className="text-[12px] text-white/45 text-center py-4">
            まだコメントはありません。最初の一言を。
          </p>
        ) : (
          comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              isMine={c.userId === userId}
              spoilerBlock={blockedView}
              matchId={matchId}
              onDeleted={() =>
                setComments((prev) => prev.filter((x) => x.id !== c.id))
              }
            />
          ))
        )}
      </div>

      {/* 入力 */}
      <div className="mt-3 flex items-end gap-2 border-t border-white/8 pt-3">
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={200}
          placeholder="話しながら見よう…"
          className="flex-1 resize-none bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:border-blue-400/60"
        />
        <button
          onClick={send}
          disabled={posting || !text.trim()}
          className="px-4 py-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400 text-[13px] font-semibold text-white disabled:opacity-40 shrink-0"
        >
          {posting ? "…" : "送信"}
        </button>
      </div>
      {error && (
        <p className="text-[11px] text-rose-300 mt-1.5">{error}</p>
      )}
      <p className="text-[10px] text-white/40 mt-1.5">
        {text.length}/200・5秒に1回まで投稿可
      </p>
    </section>
  );
}

function CommentItem({
  comment,
  isMine,
  spoilerBlock,
  matchId,
  onDeleted,
}: {
  comment: Comment;
  isMine: boolean;
  spoilerBlock: boolean;
  matchId: string;
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
      alert("通報しました。確認後に対応します。");
    } finally {
      setBusy(false);
    }
  };
  const timeLabel = relativeTime(comment.createdAt);

  const content = (
    <p className="text-[13px] leading-snug whitespace-pre-wrap break-words">
      {comment.text}
    </p>
  );

  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-full bg-white/8 border border-white/15 flex items-center justify-center text-[14px] shrink-0">
        {comment.flag ?? "👤"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[12px] font-semibold text-white truncate">
            {comment.nick}
          </span>
          <span className="text-[10px] text-white/45 shrink-0">
            {timeLabel}
          </span>
          {isMine && (
            <button
              onClick={deleteIt}
              disabled={busy}
              className="text-[10px] text-rose-300/80 hover:text-rose-300 ml-auto"
            >
              削除
            </button>
          )}
          {!isMine && (
            <button
              onClick={report}
              disabled={busy}
              className="text-[10px] text-white/40 hover:text-white/65 ml-auto"
            >
              通報
            </button>
          )}
        </div>
        {spoilerBlock ? (
          <SpoilerWrap size="sm" hint="コメントを開く">
            {content}
          </SpoilerWrap>
        ) : (
          content
        )}
      </div>
    </div>
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
    <div className="mb-3 p-2.5 rounded-lg bg-white/5 border border-white/10">
      <p className="text-[11px] text-white/65 mb-1.5">ニックネーム（24文字以内）</p>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={24}
          placeholder={generateDefaultNick(defaultFlag)}
          className="flex-1 bg-white/5 border border-white/15 rounded-md px-2 py-1.5 text-[12px] text-white"
        />
        <button
          onClick={() => onSave(value.trim() || generateDefaultNick(defaultFlag))}
          className="px-3 py-1.5 rounded-md bg-white/10 text-[12px] font-semibold text-white/85 hover:bg-white/15"
        >
          保存
        </button>
      </div>
    </div>
  );
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 10) return "たった今";
  if (sec < 60) return `${sec}秒前`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  const day = Math.floor(hr / 24);
  return `${day}日前`;
}
