import { ImageResponse } from "next/og";

export const alt = "Story Machine";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
          background: "linear-gradient(160deg, #242d68, #0f1536)",
          color: "#f4f1ff",
        }}
      >
        <div
          style={{
            width: 160,
            height: 160,
            borderRadius: 80,
            background: "#ffe08a",
            marginBottom: 40,
            display: "flex",
          }}
        />
        <div style={{ fontSize: 96, fontWeight: 800, display: "flex" }}>Story Machine</div>
        <div style={{ fontSize: 40, color: "#c9c2f5", marginTop: 16, display: "flex" }}>
          Bedtime stories starring your child
        </div>
      </div>
    ),
    size,
  );
}
