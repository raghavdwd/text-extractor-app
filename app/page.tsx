"use client";

import { useState, useRef, useCallback, DragEvent } from "react";

type Stage = "idle" | "loading" | "success" | "error";
type Mode = "file" | "url";

const ACCEPTED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  "text/csv", // .csv
]);

function fmtSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 ** 2).toFixed(1)} MB`;
}

function FileTypeTag({ type }: { type: string }) {
  let label = "IMG";
  if (type === "application/pdf") label = "PDF";
  else if (type === "text/csv") label = "CSV";
  return (
    <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0D111C] border border-[#1E2535] text-[10px] font-mono font-bold tracking-widest text-[#00E5A0]">
      {label}
    </span>
  );
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("file");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [extractedText, setExtractedText] = useState<string>("");
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (
      f.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      f.type === "application/vnd.ms-excel"
    ) {
      setError(
        "Native Excel files (.xlsx and .xls) are not supported by Gemini file input. Export the sheet as CSV or PDF, then upload that file instead.",
      );
      return;
    }

    if (!ACCEPTED.has(f.type)) {
      setError(
        "Unsupported file type. Please upload a PDF, image (JPEG, PNG, GIF, WEBP, HEIC), or CSV file.",
      );
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10 MB.");
      return;
    }
    setFile(f);
    setError("");
    setExtractedText("");
    setStage("idle");
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile],
  );

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const handleExtract = async () => {
    setStage("loading");
    setError("");
    setExtractedText("");

    if (mode === "file") {
      if (!file) return;
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/extract", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Extraction failed");
        setExtractedText(data.text);
        setStage("success");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setStage("error");
      }
    } else {
      if (!url.trim()) return;
      try {
        const res = await fetch("/api/extract-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Extraction failed");
        setExtractedText(data.text);
        setStage("success");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setStage("error");
      }
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setFile(null);
    setUrl("");
    setExtractedText("");
    setStage("idle");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    reset();
  };

  const canExtract =
    stage !== "loading" && (mode === "file" ? !!file : url.trim().length > 0);

  return (
    <div className="min-h-screen bg-[#07080F] text-[#EEF0F7]">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-175 h-125 rounded-full bg-[#00E5A0] opacity-[0.035] blur-[130px]" />
        <div className="absolute bottom-0 right-0 w-100 h-100 rounded-full bg-[#6B7FFF] opacity-[0.025] blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-5 py-20 md:py-28">
        {/* ── Header ───────────────────────────────────────────── */}
        <header className="mb-14 text-center">
          <div className="inline-flex items-center gap-2 mb-8 px-3.5 py-1.5 rounded-full border border-[#1E2535] bg-[#0D111C]">
            <span className="status-dot w-1.5 h-1.5 rounded-full bg-[#00E5A0]" />
            <span className="text-[11px] font-mono tracking-[0.18em] text-[#7B85A0] uppercase">
              Gemini 2.5 Flash · AI Extraction
            </span>
          </div>

          <h1 className="font-serif italic text-5xl md:text-6xl text-[#EEF0F7] leading-[1.1] mb-5">
            Extract Text
            <br />
            <span className="text-[#00E5A0]">From Anything</span>
          </h1>

          <p className="text-[#7B85A0] text-base md:text-lg max-w-sm mx-auto leading-relaxed">
            Upload a file or paste any URL — Gemini AI reads every sentence,
            table, and note.
          </p>
        </header>

        {/* ── Mode tabs ────────────────────────────────────────── */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0D111C] border border-[#1E2535] mb-4">
          {(["file", "url"] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={[
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                mode === m
                  ? "bg-[#161B2C] text-[#EEF0F7] shadow-sm"
                  : "text-[#7B85A0] hover:text-[#C8D0E0]",
              ].join(" ")}
            >
              {m === "file" ? (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.75}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                  </svg>
                  File
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.75}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                    />
                  </svg>
                  URL
                </>
              )}
            </button>
          ))}
        </div>

        {/* ── Upload zone ──────────────────────────────────────── */}
        {mode === "file" && (
          <div className="mb-4">
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => !file && inputRef.current?.click()}
              className={[
                "relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300",
                isDragging
                  ? "border-[#00E5A0] bg-[#00E5A0]/5 scale-[1.015]"
                  : file
                    ? "border-[#1E2535] bg-[#0D111C] cursor-default"
                    : "border-[#1E2535] bg-[#0D111C] cursor-pointer hover:border-[#2D3A4F] hover:bg-[#101420]",
              ].join(" ")}
            >
              {/* Scan-line overlay while loading */}
              {stage === "loading" && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="scan-line" />
                  <div className="absolute inset-0 bg-[#00E5A0]/3" />
                </div>
              )}

              <div className="px-8 py-10">
                {!file ? (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-[#0A0D17] border border-[#1E2535]">
                      <svg
                        className="w-6 h-6 text-[#4A5270]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[#C8D0E0] font-medium">
                        {isDragging ? "Drop it here" : "Drag & drop your file"}
                      </p>
                      <p className="text-[#4A5270] text-sm mt-1">
                        or{" "}
                        <span className="text-[#6B7FFF] hover:text-[#8B9FFF] transition-colors cursor-pointer underline underline-offset-2">
                          browse to upload
                        </span>
                      </p>
                    </div>
                    <p className="text-[#2D3A4F] text-xs font-mono tracking-wider mt-1">
                      PDF · PNG · JPG · WEBP · GIF · HEIC · CSV · max 10 MB
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <FileTypeTag type={file.type} />
                      <div className="min-w-0">
                        <p className="text-[#EEF0F7] font-medium text-sm truncate">
                          {file.name}
                        </p>
                        <p className="text-[#7B85A0] text-xs mt-0.5 font-mono">
                          {fmtSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        reset();
                      }}
                      className="shrink-0 p-2 rounded-lg hover:bg-[#1A1E2E] transition-colors text-[#4A5270] hover:text-[#EEF0F7]"
                      aria-label="Remove file"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif,.csv"
                onChange={(e) =>
                  e.target.files?.[0] && handleFile(e.target.files[0])
                }
              />
            </div>
          </div>
        )}

        {/* ── URL input zone ───────────────────────────────────── */}
        {mode === "url" && (
          <div className="mb-4">
            <div
              className={[
                "relative overflow-hidden rounded-2xl border-2 bg-[#0D111C] transition-all duration-300",
                stage === "loading"
                  ? "border-[#00E5A0]/40"
                  : url.trim()
                    ? "border-[#2D3A4F]"
                    : "border-[#1E2535]",
              ].join(" ")}
            >
              {stage === "loading" && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="scan-line" />
                  <div className="absolute inset-0 bg-[#00E5A0]/3" />
                </div>
              )}
              <div className="px-6 py-5">
                <label className="block text-[#4A5270] text-[10px] font-mono tracking-[0.18em] uppercase mb-3">
                  Web URL
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#0A0D17] border border-[#1E2535] shrink-0">
                    <svg
                      className="w-4 h-4 text-[#4A5270]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.75}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                      />
                    </svg>
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError("");
                      if (stage !== "idle") {
                        setStage("idle");
                        setExtractedText("");
                      }
                    }}
                    onKeyDown={(e) =>
                      e.key === "Enter" && canExtract && handleExtract()
                    }
                    placeholder="https://example.com/article"
                    className="flex-1 bg-transparent text-[#EEF0F7] placeholder-[#2D3A4F] text-sm outline-none font-mono"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {url && (
                    <button
                      onClick={() => {
                        setUrl("");
                        setError("");
                        setStage("idle");
                        setExtractedText("");
                      }}
                      className="p-1.5 rounded-lg text-[#4A5270] hover:text-[#EEF0F7] hover:bg-[#1A1E2E] transition-colors"
                      aria-label="Clear URL"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="mt-3 text-[#2D3A4F] text-xs font-mono tracking-wider">
                  Articles · Docs · Blogs · Any public webpage
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Error banner ─────────────────────────────────────── */}
        {error && (
          <div className="mb-4 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <svg
              className="w-4 h-4 mt-0.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            {error}
          </div>
        )}

        {/* ── Extract button ───────────────────────────────────── */}
        <button
          onClick={handleExtract}
          disabled={!canExtract}
          className={[
            "w-full py-4 rounded-xl font-medium text-sm tracking-wide transition-all duration-200",
            !canExtract
              ? "bg-[#0D111C] border border-[#1E2535] text-[#3A4260] cursor-not-allowed"
              : "bg-[#00E5A0] text-[#07080F] hover:bg-[#00D494] active:scale-[0.99] shadow-[0_0_40px_rgba(0,229,160,0.18)] hover:shadow-[0_0_55px_rgba(0,229,160,0.28)]",
          ].join(" ")}
        >
          {stage === "loading" ? (
            <span className="flex items-center justify-center gap-2.5">
              <span className="w-4 h-4 rounded-full border-2 border-[#2D3A4F] border-t-[#7B85A0] animate-spin" />
              Extracting text…
            </span>
          ) : (
            "Extract Text →"
          )}
        </button>

        {/* ── Result panel ─────────────────────────────────────── */}
        {stage === "success" && extractedText && (
          <div className="mt-8 fade-up">
            {/* Result header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#00E5A0]" />
                <h2 className="text-[#EEF0F7] font-medium text-sm">
                  Extracted Text
                </h2>
                <span className="text-[#3A4260] text-xs font-mono">
                  {extractedText.length.toLocaleString()} chars
                </span>
              </div>
              <button
                onClick={copyToClipboard}
                className={[
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                  copied
                    ? "bg-[#00E5A0]/15 text-[#00E5A0] border border-[#00E5A0]/30"
                    : "bg-[#0D111C] border border-[#1E2535] text-[#7B85A0] hover:border-[#2D3A4F] hover:text-[#EEF0F7]",
                ].join(" ")}
              >
                {copied ? (
                  <>
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                      />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>

            {/* Extracted text block */}
            <div className="relative rounded-2xl bg-[#0D111C] border border-[#1E2535] overflow-hidden">
              {/* Top shimmer line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[#00E5A0]/25 to-transparent" />
              <pre className="result-scroll p-6 text-[#C8D0E0] font-mono text-sm leading-relaxed whitespace-pre-wrap wrap-break-word max-h-130 overflow-y-auto">
                {extractedText}
              </pre>
            </div>
          </div>
        )}

        {/* ── Footer ───────────────────────────────────────────── */}
        <p className="mt-16 text-center text-[#2D3A4F] text-xs font-mono tracking-wider">
          Powered by Gemini 2.5 Flash
        </p>
      </div>
    </div>
  );
}
