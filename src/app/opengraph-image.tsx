import { ImageResponse } from "next/og";

export const alt = "90 — W杯の意味を、90秒で。";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          background:
            "linear-gradient(135deg, #07080c 0%, #1a0f1a 50%, #2b1108 100%)",
          color: "white",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Logo + Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "60px",
          }}
        >
          <div
            style={{
              width: "96px",
              height: "96px",
              borderRadius: "24px",
              background: "linear-gradient(135deg, #ff3b30 0%, #ffb020 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 16px 48px rgba(255,59,48,0.5)",
              fontSize: "48px",
              fontWeight: 900,
              color: "white",
              letterSpacing: "-2px",
            }}
          >
            90
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "44px",
              fontWeight: 700,
              letterSpacing: "-1px",
            }}
          >
            90 / W杯
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            fontSize: "92px",
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: "-3px",
            color: "#ffb020",
            marginBottom: "32px",
          }}
        >
          W杯の意味を、90秒で。
        </div>

        {/* Subline */}
        <div
          style={{
            display: "flex",
            fontSize: "32px",
            color: "rgba(255,255,255,0.75)",
            fontWeight: 500,
            lineHeight: 1.4,
            maxWidth: "900px",
          }}
        >
          推しチームの試合だけ通知 ・ 結果ネタバレなし
        </div>

        {/* Footer flags */}
        <div
          style={{
            position: "absolute",
            bottom: "60px",
            right: "80px",
            display: "flex",
            gap: "12px",
            fontSize: "48px",
          }}
        >
          🇯🇵 🇦🇷 🇧🇷 🇫🇷 🇪🇸 🇩🇪
        </div>
      </div>
    ),
    { ...size },
  );
}
