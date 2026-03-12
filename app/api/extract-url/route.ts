import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { lookup } from "dns/promises";
import { isIPv4 } from "net";

const MAX_HTML_SIZE = 10 * 1024 * 1024; // 10 MB
const FETCH_TIMEOUT_MS = 15_000; // 15 s
const UNSUPPORTED_EXCEL_CONTENT_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

function isPrivateIP(ip: string): boolean {
  if (isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254)
    );
  }
  const lower = ip.toLowerCase();
  return (
    lower === "::1" ||
    lower === "0:0:0:0:0:0:0:1" ||
    lower.startsWith("fe80:") ||
    lower.startsWith("fc") ||
    lower.startsWith("fd")
  );
}

export async function POST(request: NextRequest) {
  try {
    let body: { url?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const rawUrl = (body?.url ?? "").trim();
    if (!rawUrl) {
      return NextResponse.json({ error: "No URL provided." }, { status: 400 });
    }

    // Validate URL format
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format. Please include http:// or https://." },
        { status: 400 }
      );
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return NextResponse.json(
        { error: "Only http and https URLs are supported." },
        { status: 400 }
      );
    }

    // SSRF protection: resolve hostname and block private / loopback IPs
    try {
      const { address } = await lookup(parsed.hostname);
      if (isPrivateIP(address)) {
        return NextResponse.json(
          {
            error:
              "That URL resolves to a private or internal address and cannot be fetched.",
          },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Could not resolve the hostname. Please check the URL." },
        { status: 400 }
      );
    }

    // Fetch the page with a timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let pageResponse: Response;
    try {
      pageResponse = await fetch(rawUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; TextExtractor/1.0)",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "follow",
      });
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === "AbortError") {
        return NextResponse.json(
          { error: "Request timed out. The page took too long to respond." },
          { status: 504 }
        );
      }
      throw err;
    }
    clearTimeout(timer);

    if (!pageResponse.ok) {
      return NextResponse.json(
        {
          error: `The URL returned HTTP ${pageResponse.status} ${pageResponse.statusText}.`,
        },
        { status: 400 }
      );
    }

    const contentType = pageResponse.headers.get("content-type") ?? "";

    if (
      UNSUPPORTED_EXCEL_CONTENT_TYPES.some((type) => contentType.includes(type))
    ) {
      return NextResponse.json(
        {
          error:
            "Native Excel files (.xlsx and .xls) are not supported by Gemini file input. Convert the sheet to CSV or PDF, then use that URL instead.",
        },
        { status: 400 }
      );
    }

    // Read body and enforce size cap
    const buffer = await pageResponse.arrayBuffer();
    if (buffer.byteLength > MAX_HTML_SIZE) {
      return NextResponse.json(
        { error: "Page content is too large to process (max 10 MB)." },
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

    const ai = new GoogleGenAI({ apiKey });

    let geminiResponse;

    if (contentType.includes("application/pdf")) {
      // PDF served directly from URL
      const base64 = Buffer.from(buffer).toString("base64");
      geminiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Extract ALL text from this PDF document exactly as it appears. Preserve structure, tables, and line breaks. Return only the extracted text — no commentary.",
              },
              { inlineData: { mimeType: "application/pdf", data: base64 } },
            ],
          },
        ],
      });
    } else if (contentType.includes("text/csv")) {
      // CSV served directly from URL — inlineData
      const base64 = Buffer.from(buffer).toString("base64");
      geminiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Extract ALL data from this CSV file. Preserve the tabular structure: present headers and rows clearly in plain text. Return only the extracted data — no commentary.",
              },
              { inlineData: { mimeType: "text/csv", data: base64 } },
            ],
          },
        ],
      });
    } else {
      // HTML or plain text page
      const decoder = new TextDecoder("utf-8", { fatal: false });
      const htmlContent = decoder.decode(buffer);

      geminiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Extract all meaningful readable text from the following web page. Remove HTML tags, navigation menus, footers, cookie banners, ads, and boilerplate. Preserve the logical structure: headings, paragraphs, lists, and tables as plain text. Return only the clean extracted text — no explanation, no commentary, no markdown fences.\n\nSource URL: ${rawUrl}\n\n---\n${htmlContent}`,
              },
            ],
          },
        ],
      });
    }

    const text = geminiResponse.text ?? "";
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[extract-url] Error:", err);
    const message =
      err instanceof Error
        ? err.message
        : "Text extraction failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
