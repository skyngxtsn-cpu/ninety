import { AppHeader } from "../../components/AppHeader";

export const metadata = {
  title: "プライバシーポリシー｜90",
  description: "90 アプリのプライバシーポリシー",
};

export default function PrivacyPage() {
  return (
    <>
      <AppHeader back="/settings" title="プライバシーポリシー" />
      <div className="px-4 pt-3 pb-12">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--text-dim)]">
          Privacy
        </p>
        <h1 className="pt-1 text-[22px] font-bold tracking-tight leading-tight text-gradient">
          あなたの情報の扱い方
        </h1>
        <p className="text-[12px] text-white/55 mt-1">最終更新: 2026-06-07</p>

        <div className="mt-6 space-y-6 text-[13px] leading-relaxed text-white/85">
          <Section title="このアプリについて">
            <p>
              「90」（以下「本アプリ」）は、FIFA ワールドカップ 2026 の
              観戦をサポートする個人開発の PWA です。
              個人開発のため、運営体制は限定的です。
            </p>
          </Section>

          <Section title="取得する情報">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <b>匿名のデバイス識別子</b>
                ：localStorage 上に生成される UUID。
                氏名・メール・電話番号などの個人情報は含まれません。
              </li>
              <li>
                <b>プッシュ通知購読情報</b>
                ：通知を有効にした場合のみ、Web Push API が発行する
                エンドポイント URL と暗号鍵を取得します。
              </li>
              <li>
                <b>推しチーム・お気に入り試合・通知設定</b>
                ：通知配信と表示の最適化に使います。
              </li>
              <li>
                <b>コメント本文・ニックネーム</b>
                ：試合掲示板に投稿された内容。本人が任意で入力したものに限ります。
              </li>
              <li>
                <b>フィードバック本文</b>
                ：「フィードバック」フォームから送信された内容。
              </li>
            </ul>
          </Section>

          <Section title="利用目的">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>プッシュ通知の配信</li>
              <li>試合掲示板へのコメント表示</li>
              <li>アプリの動作改善・不具合修正</li>
              <li>不正利用・スパム・誹謗中傷の防止</li>
            </ul>
          </Section>

          <Section title="第三者への提供">
            <p>
              本アプリは取得した情報を、本人の同意なく第三者に販売・提供しません。
              ただし以下のサービスは「処理委託」として利用しています：
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>
                <b>Vercel</b>（ホスティング）
              </li>
              <li>
                <b>Upstash Redis</b>（コメント・通知購読・フィードバックの保存）
              </li>
              <li>
                <b>Discord</b>（フィードバック通知の Webhook 送信先）
              </li>
              <li>
                <b>Web Push サービス</b>（Apple / Google / Mozilla 等、
                利用ブラウザに応じた配信）
              </li>
              <li>
                <b>football-data.org / TheSportsDB / Wikipedia</b>
                （試合・選手・チームデータの取得元）
              </li>
            </ul>
          </Section>

          <Section title="Cookie・追跡技術">
            <p>
              本アプリは広告 Cookie、サードパーティ製のアクセス解析 Cookie を
              使用していません。アプリの動作に必要な localStorage / Cookie のみ
              使用します。
            </p>
          </Section>

          <Section title="データの削除依頼">
            <p>
              投稿したコメントの削除、通知購読の解除、その他データの削除を
              ご希望の場合は、設定画面の「💌 フィードバックを送る」から
              ご連絡ください。可能な範囲で速やかに対応します。
            </p>
            <p className="mt-2">
              ブラウザの localStorage を消去する、または設定画面の
              「設定をリセット」を押すことで、端末上のすべての設定を
              削除できます。
            </p>
          </Section>

          <Section title="未成年の利用">
            <p>
              本アプリは年齢制限を設けていませんが、コメント機能を
              利用する場合は、保護者の方が内容を確認することを推奨します。
            </p>
          </Section>

          <Section title="改定">
            <p>
              本ポリシーは予告なく改定される場合があります。
              重要な変更がある場合はアプリ内で通知します。
            </p>
          </Section>

          <Section title="お問い合わせ">
            <p>
              本ポリシーや個人情報の扱いに関するご質問は、
              <a href="/feedback" className="text-[var(--accent-2)] underline">
                フィードバックフォーム
              </a>
              からお寄せください。
            </p>
          </Section>
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
