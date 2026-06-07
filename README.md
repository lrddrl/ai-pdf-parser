# ai-pdf-parser

Next.js 15 chatbot app for processing vendor invoices. Admins upload PDF or image invoices, the app uses an OpenAI or Fireworks LLM to extract structured fields (customer, vendor, invoice number, dates, amounts, line items), stores them in SQLite via Drizzle ORM, and renders an editable / sortable table. A duplicate-invoice detector flags repeat uploads from the same vendor.

## Features

- **PDF + image upload** with drag-and-drop
- **AI field extraction** for customer, vendor, invoice number, invoice date, due date, amount, and line items
- **Document validation** that rejects non-invoice uploads (receipts, account statements)
- **SQLite persistence** via Drizzle ORM (migrations live in `lib/db/`)
- **Editable table** with sort by date / amount / vendor
- **Duplicate-invoice detection** (per vendor)
- **Multi-model support** — OpenAI and Fireworks via the Vercel AI SDK
- **CodeMirror**-powered chat with JavaScript + Python syntax highlighting
- **Auth** via `next-auth` 5 (bcrypt-ts) and Radix-UI primitives
- **Animations** with Framer Motion + Geist font

## Tech Stack

- **Framework**: Next.js 15 (canary) + React 19
- **LLM**: Vercel AI SDK (`@ai-sdk/openai`, `@ai-sdk/fireworks`)
- **DB**: SQLite (`better-sqlite3`) + Drizzle ORM
- **Auth**: `next-auth` 5 + `bcrypt-ts`
- **UI**: Radix UI primitives, Tailwind CSS 4, Framer Motion, Geist, Lucide
- **Editor**: CodeMirror 6
- **Tokenization**: `js-tiktoken`, `@dqbd/tiktoken` (WASM for build step)
- **Language**: TypeScript 5

## Setup

```bash
git clone https://github.com/lrddrl/ai-pdf-parser.git
cd ai-pdf-parser
npm install

# 1. Create the SQLite DB and run migrations
npm run db:push

# 2. Create a .env.local file in the project root (see .env.example):
#    add OPENAI_API_KEY (and optionally FIREWORKS_API_KEY)

# 3. Run
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## License

MIT
