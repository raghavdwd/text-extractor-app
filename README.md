# Extractor — AI Text Extraction

Upload any **PDF or image** and extract all text instantly using **Gemini 2.0 Flash**.

## Features

- Drag-and-drop or click-to-upload (PDF, JPEG, PNG, WEBP, GIF, HEIC)
- Up to 10 MB per file
- Animated scanline UI during processing
- One-click copy of extracted text
- Client + server-side file validation
- Built with Next.js 16, Tailwind CSS v4, and `@google/genai`

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| LLM | Gemini 2.0 Flash via `@google/genai` |
| Styling | Tailwind CSS v4 |
| Fonts | Instrument Serif · DM Sans · JetBrains Mono |
| Runtime | Node.js |

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/your-username/content-extraction.git
cd content-extraction
pnpm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and add your Gemini API key:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

Optionally set the public URL (used for OG meta tags):

```
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

### Vercel (recommended)

1. Push your repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Add `GEMINI_API_KEY` (and optionally `NEXT_PUBLIC_APP_URL`) in the Vercel environment variables panel
4. Deploy

## Project Structure

```
app/
  api/extract/route.ts   # POST handler — Gemini text extraction
  icon.svg               # Favicon
  opengraph-image.tsx    # Dynamic OG image (1200×630)
  layout.tsx             # Root layout + SEO metadata
  page.tsx               # Main upload UI
  globals.css            # Custom animations & scrollbar
.env.local.example       # Environment variable template
```

## License

MIT

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
