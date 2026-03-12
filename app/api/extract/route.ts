import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const SUPPORTED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const mimeType = file.type || "application/octet-stream";

    if (!SUPPORTED_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          error: `Unsupported file type "${mimeType}". Please upload a PDF, JPEG, PNG, GIF, WEBP, or HEIC file.`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large. Maximum allowed size is 10 MB." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error: Gemini API key is not set." },
        { status: 500 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString("base64");

    // Normalise non-standard image/jpg → image/jpeg
    const normalizedMime = mimeType === "image/jpg" ? "image/jpeg" : mimeType;

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Extract ALL text from this document exactly as it appears. Preserve the original structure, tables, line breaks, and formatting as best as possible. Return only the extracted text — no commentary, no explanation, no markdown code fences.",
            },
            {
              inlineData: {
                mimeType: normalizedMime,
                data: base64Data,
              },
            },
          ],
        },
      ],
    });

    const text = response.text ?? "";
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[extract] Error:", err);
    const message =
      err instanceof Error
        ? err.message
        : "Text extraction failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
