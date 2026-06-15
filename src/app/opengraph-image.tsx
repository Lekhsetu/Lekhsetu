import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B0907",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="84" height="84" viewBox="0 0 36 36">
            <path
              d="M5 28 C5 28, 13 7, 18 16 C23 25, 31 7, 31 7"
              stroke="#F5A623"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="18" cy="17" r="2.5" fill="#F5A623" opacity="0.7" />
          </svg>
          <span style={{ fontSize: 96, fontWeight: 800, color: "#F5EFE3" }}>
            Lekhsetu
          </span>
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 32,
            color: "#B8AE98",
            letterSpacing: 1,
          }}
        >
          Where stories bridge lives.
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 24,
            color: "#6B6354",
            fontStyle: "italic",
          }}
        >
          लेख + सेतु
        </div>
      </div>
    ),
    { ...size }
  );
}
