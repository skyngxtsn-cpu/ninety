import { AppHeader } from "../../components/AppHeader";

export const metadata = {
  title: "利用規約｜90",
  description: "90 アプリの利用規約",
};

export default function TermsPage() {
  return (
    <>
      <AppHeader back="/settings" title="利用規約" />
      <div className="px-4 pt-3 pb-12">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--text-dim)]">
          Terms
        </p>
        <h1 className="pt-1 text-[22px] font-bold tracking-tight leading-tight text-gradient">
          みんなで気持ちよく使うために
        </h1>
        <p className="text-[12px] text-white/55 mt-1">最終更新: 2026-06-07</p>

        <div className="mt-6 space-y-6 text-[13px] leading-relaxed text-white/85">
          <Section title="第1条（適用）">
            <p>
              本規約は、「90」（以下「本アプリ」）の提供者（以下「運営」）と、
              本アプリを利用するすべての方（以下「ユーザー」）との間に適用されます。
              本アプリを利用した時点で、本規約に同意したものとみなします。
            </p>
          </Section>

          <Section title="第2条（提供内容）">
            <p>
              本アプリは、FIFA ワールドカップ 2026 の試合日程・順位・選手情報・
              コメント機能・プッシュ通知などを無料で提供します。
              個人開発のため、提供内容や仕様は予告なく変更される場合があります。
            </p>
          </Section>

          <Section title="第3条（禁止事項）">
            <p>ユーザーは、以下の行為をしてはいけません：</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>誹謗中傷、人格攻撃、差別的発言、ヘイトスピーチ</li>
              <li>個人情報（氏名・住所・電話番号など）を本人の同意なく投稿する行為</li>
              <li>違法な内容、わいせつな内容、暴力的な内容の投稿</li>
              <li>第三者の著作権・肖像権・商標権その他知的財産権を侵害する行為</li>
              <li>他人のなりすまし、虚偽情報の流布</li>
              <li>スパム、宣伝、ステマ、勧誘、広告目的の投稿</li>
              <li>本アプリの運営を妨害する行為、不正アクセス</li>
              <li>API の過剰な呼び出し、ボットによる自動操作</li>
              <li>その他、運営が不適切と判断する行為</li>
            </ul>
          </Section>

          <Section title="第4条（コメントの取り扱い）">
            <p>
              ユーザーが投稿したコメントは、運営の判断により予告なく
              削除・編集することがあります。
              特に第3条の禁止事項に該当する投稿は、即時削除の対象となります。
              削除に関する苦情には応じられない場合があります。
            </p>
          </Section>

          <Section title="第5条（試合データの取り扱い）">
            <p>
              本アプリが提供する試合日程・スコア・選手情報は、
              football-data.org・TheSportsDB・Wikipedia など外部ソースに基づきます。
              情報の正確性・最新性は保証されません。
              重要な観戦判断は公式情報（FIFA など）でご確認ください。
            </p>
          </Section>

          <Section title="第6条（著作権・肖像権）">
            <p>
              本アプリが表示する選手写真・チームロゴ・国旗等は、
              それぞれの権利者に帰属します。
              本アプリでは情報提供目的でのみ利用しています。
              権利侵害のご指摘があれば、フィードバックフォームから
              ご連絡ください。確認のうえ、必要な場合は削除対応します。
            </p>
          </Section>

          <Section title="第7条（プッシュ通知）">
            <p>
              プッシュ通知はユーザーが端末側で許可した場合のみ送信されます。
              通信状況・ブラウザの仕様により、配信が遅延・失敗することがあります。
              通知内容に基づく観戦判断の責任はユーザーが負うものとします。
            </p>
          </Section>

          <Section title="第8条（免責）">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                本アプリの利用により生じた損害について、運営は一切の責任を負いません。
              </li>
              <li>
                本アプリは「現状のまま」提供されます。動作・正確性・有用性等を
                保証するものではありません。
              </li>
              <li>
                本アプリは予告なく停止・終了することがあります。
              </li>
            </ul>
          </Section>

          <Section title="第9条（サービスの変更・終了）">
            <p>
              運営は、本アプリの内容を変更したり、提供を終了したりする権利を有します。
              これによりユーザーに損害が生じても、運営は責任を負いません。
            </p>
          </Section>

          <Section title="第10条（規約の変更）">
            <p>
              本規約は予告なく変更されることがあります。
              変更後の規約は、本アプリに掲示された時点で効力を生じます。
            </p>
          </Section>

          <Section title="第11条（準拠法・管轄）">
            <p>
              本規約は日本法に準拠し、本アプリに関する紛争は東京地方裁判所を
              第一審の専属的合意管轄裁判所とします。
            </p>
          </Section>

          <p className="text-[12px] text-white/55 pt-2">
            ご不明な点は{" "}
            <a href="/feedback" className="text-[var(--accent-2)] underline">
              フィードバックフォーム
            </a>
            までお寄せください。
          </p>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[15px] font-bold text-white mb-2">{title}</h2>
      <div className="text-white/80">{children}</div>
    </section>
  );
}
