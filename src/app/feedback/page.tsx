import { AppHeader } from "../../components/AppHeader";
import { FeedbackFormClient } from "../../components/FeedbackFormClient";

export default function FeedbackPage() {
  return (
    <>
      <AppHeader
        back="/settings"
        title="フィードバック"
        subtitle="開発者に直接届きます"
      />
      <div className="px-4 pt-3">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--text-dim)]">
          Feedback
        </p>
        <h1 className="pt-1 text-[22px] font-bold tracking-tight leading-tight text-gradient">
          このアプリをもっと良くするために。
        </h1>
        <p className="text-[12px] text-white/65 mt-2 leading-relaxed">
          バグ・改善案・感想、なんでも歓迎です。<br />
          一言だけでも大歓迎。
        </p>
        <p className="text-[11px] text-amber-200/80 mt-2 leading-relaxed">
          ⚠️ 氏名・メール・電話番号など個人情報は本文に書かないでください。
        </p>
      </div>
      <FeedbackFormClient />
      <div className="h-12" />
    </>
  );
}
