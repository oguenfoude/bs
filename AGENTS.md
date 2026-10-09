# bsmonters — Next.js E-commerce Landing Page

## Project Type
Next.js 15.4.10 (React 19) + TypeScript + Tailwind CSS v4. E-commerce landing page for Algerian market with Google Sheets + Email (Nodemailer) order processing.

## Quick Commands
```bash
cd D:\bsmonters
npm run dev       # Dev server with Turbopack (port 3000)
npm run build     # Production build
npm run start     # Production server
npm run lint      # ESLint
```

## Git Status
- Initialized: Yes
- Branch: main
- Remote: origin -> https://github.com/oguenfoude/bs.git (up to date)
- Clean working tree

## Environment Setup
Copy `.env.example` -> `.env.local` and fill:
- `GOOGLE_SERVICE_ACCOUNT` (JSON string) -- Sheets API
- `GOOGLE_SHEET_ID` -- Target spreadsheet
- `SMTP_USER` / `SMTP_PASS` -- Gmail App Password
- `ADMIN_EMAIL` -- Comma-separated recipients
- `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` -- Meta Pixel ID

## Key Architecture
- **Order API** (`src/app/api/submit-order/route.ts`): Zod validation -> Google Sheets append -> Email -> CSV backup
- **Anti-spam**: 60s double-click guard + 24h same-phone window (in-memory cache)
- **Meta Pixel**: Purchase event deduplication via localStorage + sessionStorage
- **Algerian localization**: 58 wilayas + communes with delivery fees in `src/app/data/`
- **Arabic RTL**: Full RTL layout, Cairo font

## Project Structure
```
bsmonters/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main landing (product carousel, order form)
│   │   ├── layout.tsx            # Root layout, Meta Pixel, SEO
│   │   ├── globals.css           # Tailwind v4 + custom styles
│   │   ├── api/submit-order/     # Order submission endpoint
│   │   └── data/                 # wilayas.json, cities.json
│   ├── components/
│   │   ├── layout/               # Header, Footer
│   │   ├── pixel/                # FacebookPixel.tsx
│   │   └── ui/                   # Reusable UI (Skeleton, ProgressBar, etc.)
│   └── lib/
│       ├── services/
│       │   ├── googleSheets.ts   # Sheets integration
│       │   └── email.ts          # Nodemailer service
│       ├── validation.ts         # Zod schemas
│       └── types/                # TypeScript types
├── public/                       # Static assets (images)
├── convert_images.mjs            # Image conversion script
└── Configuration files
```

## Build Verification
```bash
npm run build  # Should complete without errors (~30s)
```

## Notes
- No AGENTS.md existed before -- this file created for OpenCode sessions
- All dependencies installed (node_modules present)
- Build verified working as of 2026-10-08