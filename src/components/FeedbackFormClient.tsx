"use client";

import { useState } from "react";
import { useUserIdentity } from "../lib/useUserIdentity";

type Category = {
  id: string;
  label: string;
  emoji: string;
};

const CATEGORIES: Category[] = [
  { id: "bug", label: "バグ報告", emoji: "🐛" },
  { id: "feature", label: "改善提案・機能リクエスト", emoji: "💡" },
  { id: "question", label: "質問・使い方相談", emoji: "❓" },
  { id: "thanks", label: "ありがとう", emoji: "❤️" },
  { id: "other", label: "その他", emoji: "📝" },
];

export function FeedbackFormClient() {
  const { userId, ensureIdentity } = useUserIdentity();
  const [category, setCategory] = useState<string>("bug");
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!body.trim()) {
      setError("本文を入力してください");
      return;
    }
    setSubmitting(true);
    try {
      // ensure UUID（無ければ生成して匿名トラッキング用に付ける）
      const ident = ensureIdentity();
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          body: body.trim(),
          email: email.trim() || undefined,
          userId: ident.userId,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "送信に失敗しました");
        return;
      }
      setDone(true);
      setBody("");
      setEmail("");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mx-4 mt-4 glass rounded-2xl p-6 text-center">
        <p className="text-[40px] mb-2">🙏</p>
        <p className="text-[14px] font-semibold mb-1">
          フィードバックを送信しました
        </p>
        <p className="text-[12px] text-white/65 leading-relaxed mb-4">
          ご協力ありがとうございます。
          <br />
          頂いた声は今後の改善に活用させていただきます。
        </p>
        <button
          onClick={() => setDone(false)}
          className="text-[12px] text-blue-300 hover:text-blue-200 underline-offset-2 hover:underline"
        >
          もう一件送る
        </button>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-4 glass rounded-2xl p-4 space-y-4">
      {/* カテゴリ */}
      <div>
        <p className="text-[11px] uppercase tracking-wider text-white/55 mb-2">
          カテゴリ
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`px-2.5 py-2 rounded-lg text-[12px] text-left transition border ${
                category === c.id
                  ? "bg-blue-500/20 border-blue-400/60 text-white"
                  : "bg-white/[0.04] border-white/8 text-white/75 hover:bg-white/[0.08]"
              }`}
            >
              <span className="mr-1.5">{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* 本文 */}
      <div>
        <p className="text-[11px] uppercase tracking-wider text-white/55 mb-1.5">
          内容
        </p>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          rows={6}
          placeholder="気になること、改善案、感想など自由にどうぞ"
          className="w-full bg-white/[0.04] border border-white/15 rounded-lg px-3 py-2.5 text-[16px] text-white placeholder:text-white/35 focus:outline-none focus:border-blue-400/60 resize-none"
        />
        <p className="text-[10px] text-white/45 mt-1 text-right">
          {body.length}/2000
        </p>
      </div>

      {/* メアド（任意） */}
      <div>
        <p className="text-[11px] uppercase tracking-wider text-white/55 mb-1.5">
          返信用メアド <span className="text-white/40">(任意)</span>
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="返信ほしい場合のみ。空でもOK"
          className="w-full bg-white/[0.04] border border-white/15 rounded-lg px-3 py-2 text-[16px] text-white placeholder:text-white/35 focus:outline-none focus:border-blue-400/60"
        />
      </div>

      {error && (
        <p className="text-[12px] text-rose-300 px-1">{error}</p>
      )}

      <button
        onClick={submit}
        disabled={submitting || !body.trim()}
        className="w-full py-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 text-[14px] font-semibold text-white disabled:opacity-40 shadow-lg"
      >
        {submitting ? "送信中…" : "送信"}
      </button>

      <p className="text-[10px] text-white/45 leading-relaxed text-center">
        匿名のデバイスIDが添付されます（個人を特定するものではありません）。<br />
        90日後に自動削除されます。
      </p>
    </div>
  );
}
