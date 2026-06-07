/**
 * Resend 経由のシンプルなメール送信ユーティリティ。
 *
 * 必要な環境変数:
 *   - RESEND_API_KEY: Resend の API キー
 *   - FEEDBACK_EMAIL_TO: 通知の宛先（shiroshiro さんの Gmail 想定）
 *
 * いずれも未設定の場合は送信せず true を返す（dev/preview で安全に no-op）。
 *
 * 仕様:
 *   - text only（plain）。HTML テンプレは要らないシンプル運用
 *   - 失敗してもユーザー操作はブロックしない（best effort）
 *   - 受信箱で件名フィルタ可能なように [90] プレフィクスを付ける
 */

const FROM = "90 <onboarding@resend.dev>";

export type SendMailArgs = {
  subject: string;
  text: string;
  /** 宛先を上書きしたい場合（通常は env を使う） */
  to?: string;
};

export async function sendMail({
  subject,
  text,
  to,
}: SendMailArgs): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const dest = to ?? process.env.FEEDBACK_EMAIL_TO;
  if (!apiKey || !dest) {
    console.warn(
      `[sendMail] skipped (env missing): apiKey=${!!apiKey}, to=${!!dest}`,
    );
    return { ok: true, skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [dest],
        subject: `[90] ${subject}`,
        text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const errMsg = `resend ${res.status}: ${body.slice(0, 500)}`;
      console.error(`[sendMail] failed: ${errMsg}`);
      return { ok: false, error: errMsg };
    }
    const okBody = await res.json().catch(() => ({}));
    console.log(
      `[sendMail] sent: subject="${subject}" id=${(okBody as { id?: string }).id ?? "?"}`,
    );
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[sendMail] threw: ${msg}`);
    return { ok: false, error: msg };
  }
}
