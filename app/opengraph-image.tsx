import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Presh.Me — link in bio, portfolio, digital card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
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
          background: "#F7F4EF",
          color: "#141414",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: "-0.04em" }}>Presh.Me</div>
        <div
          style={{
            marginTop: 20,
            width: 120,
            height: 3,
            background: "#C45C3E",
          }}
        />
        <div style={{ marginTop: 28, fontSize: 28, color: "#5C5A56" }}>
          Link in bio · portfolio · digital card
        </div>
      </div>
    ),
    { ...size },
  );
}
