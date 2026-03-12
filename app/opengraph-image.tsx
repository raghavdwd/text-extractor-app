import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Extractor — AI Text Extraction";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#07080F",
        fontFamily: "serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "-120px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "500px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,229,160,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Dot grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Pill badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 20px",
          borderRadius: "999px",
          border: "1px solid rgba(30,37,53,1)",
          background: "#0D111C",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#00E5A0",
          }}
        />
        <span
          style={{
            fontSize: "14px",
            color: "#7B85A0",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontFamily: "monospace",
          }}
        >
          Gemini 2.0 Flash · AI Extraction
        </span>
      </div>

      {/* Main heading */}
      <div
        style={{
          fontSize: "80px",
          fontStyle: "italic",
          color: "#EEF0F7",
          lineHeight: 1.1,
          textAlign: "center",
          marginBottom: "8px",
        }}
      >
        Extract Text
      </div>
      <div
        style={{
          fontSize: "80px",
          fontStyle: "italic",
          color: "#00E5A0",
          lineHeight: 1.1,
          textAlign: "center",
          marginBottom: "32px",
        }}
      >
        From Anything
      </div>

      {/* Sub line */}
      <div
        style={{
          fontSize: "22px",
          color: "#7B85A0",
          textAlign: "center",
          maxWidth: "640px",
          lineHeight: 1.5,
        }}
      >
        Upload a PDF or image — Gemini AI reads every sentence, table, and
        handwritten note.
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
