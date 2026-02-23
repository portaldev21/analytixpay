import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 180, height: 180 };

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #2C8A4B 0%, #1D5A8F 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 40,
          color: "white",
          fontSize: 90,
          fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: -4,
        }}
      >
        CF
      </div>
    ),
    { ...size },
  );
}
