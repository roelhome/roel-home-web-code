# ROEL Home Solutions — Web Platform

> Architectural materials, distinctive doors, wall solutions and decorative accents in Kochi, Kerala.  
> **Spaces Elevated. Defining Living.**

---

## 🌟 Key Highlights & Capabilities

- **100% Visual Fidelity**: Meticulously crafted design system based on warm architectural tones (`#19120C`, `#765941`, `#E5BF8C`, `#D49E58`, `#D7B691`, `#F0E2CE`).
- **Astro + React Islands Architecture**: 0 KB baseline JavaScript for static pages, delivering sub-second load times and 98–100 Google Lighthouse scores.
- **Lenis Smooth Scrolling**: Ultra-smooth inertia scrolling synchronized with GSAP ScrollTrigger ticker at 60/120 FPS.
- **GSAP Animations**: Scroll-triggered section reveals, staggered headlines, hover micro-interactions, and modal transitions.
- **Three.js 3D Architectural Canvas**: Real-time tactile undulating 3D fluted material surface rendered on WebGL with mouse parallax and auto-pause offscreen.
- **Supabase Integration**: Data layer for products, services, portfolio projects, and incoming customer enquiries with Row Level Security (RLS).
- **Cloudflare Pages & Edge Functions**: Unlimited bandwidth and requests on Cloudflare Pages free tier. Serverless edge functions handling form submissions and emails.
- **Cloudflare R2 Ready**: Optimized media caching and storage structure.
- **Resend Email Alerts**: Instant email notifications dispatched to the ROEL team on every client enquiry.
- **Top-Tier SEO**: Semantic HTML5, dynamic OpenGraph/Twitter social cards, LocalBusiness schema (Kochi, Kerala), Product schemas, `sitemap.xml`, and `robots.txt`.

---

## 🏗️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Astro v5](https://astro.build/) |
| **UI Components** | [React 19](https://react.dev/) (Interactive Islands) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | Handcrafted Design Tokens & Custom CSS System |
| **Animations** | [GSAP 3](https://gsap.com/) + [ScrollTrigger](https://gsap.com/scrolltrigger/) |
| **3D Graphics** | [Three.js](https://threejs.org/) (WebGL) |
| **Smooth Scroll** | [Lenis](https://github.com/darkroomengineering/lenis) |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL + RLS) |
| **Email Service** | [Resend](https://resend.com/) |
| **Media Storage** | [Cloudflare R2](https://www.cloudflare.com/developer-platform/products/r2/) |
| **Hosting** | [Cloudflare Pages](https://pages.cloudflare.com/) |

---

## 📁 Project Structure

```
d:/Roel Homes/
├── public/
│   ├── fonts/               # RoelSerif & RoelSans custom WOFF2 fonts
│   ├── images/              # Clean WebP images & brand logo
│   ├── videos/              # Brand preview film (MP4)
│   ├── robots.txt           # Search crawler directives
│   └── sitemap.xml          # XML sitemap for Google & Bing
├── src/
│   ├── components/
│   │   ├── Announcement.astro   # Top brand ticker
│   │   ├── BrandFilmModal.tsx   # Video modal player island
│   │   ├── CatalogueFilter.tsx  # Interactive product category filter
│   │   ├── ContactForm.tsx      # Interactive contact form
│   │   ├── CtaBand.astro        # Reusable CTA section
│   │   ├── EnquiryModal.tsx     # Global quick enquiry modal island
│   │   ├── Footer.astro         # Comprehensive architectural footer
│   │   ├── Header.astro         # Sticky header + responsive drawer
│   │   ├── HeroCanvas.astro     # Three.js 3D wave canvas
│   │   ├── SearchModal.tsx      # Quick search modal island (Ctrl+K or /)
│   │   └── SmoothScroll.astro   # Lenis + GSAP scroll engine
│   ├── data/                # Initial seed data (products, services, projects)
│   ├── layouts/
│   │   └── Layout.astro     # Main layout with SEO meta & Schema.org
│   ├── lib/
│   │   ├── resend.ts        # Resend email notification service
│   │   └── supabase.ts      # Supabase database client with fallback
│   ├── pages/
│   │   ├── index.astro          # Homepage
│   │   ├── about.astro          # Our Story & Brand Identity
│   │   ├── contact.astro        # Contact Us & Kochi Studio Info
│   │   ├── catalogue/
│   │   │   └── index.astro      # Full Products Catalogue
│   │   ├── product/
│   │   │   └── [id].astro       # Dynamic Product Detail Pages
│   │   ├── services/
│   │   │   └── index.astro      # Services Overview
│   │   ├── service/
│   │   │   └── [id].astro       # Dynamic Service Detail Pages
│   │   ├── projects/
│   │   │   └── index.astro      # Projects Portfolio
│   │   ├── project/
│   │   │   └── [id].astro       # Dynamic Project Detail Pages
│   │   └── api/
│   │       └── enquiry.ts       # Cloudflare Edge Function for form submission
│   └── styles/
│       └── global.css       # Complete design tokens, reset, typography
├── supabase/
│   ├── migrations/          # SQL schema migrations
│   └── seed.sql             # Initial database seed data
├── astro.config.mjs         # Astro + Cloudflare + React configuration
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js 18+ (tested on Node v20/v22/v24)
- npm or pnpm

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in:
- `PUBLIC_SUPABASE_URL`: Your Supabase Project URL
- `PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon/Public Key
- `RESEND_API_KEY`: Your Resend API key (e.g. `re_...`)
- `NOTIFICATION_EMAIL`: Team inbox to receive enquiries (e.g. `info@roelhome.com`)

### 4. Start Development Server
```bash
npm run dev
```
Visit `http://localhost:4321` in your browser.

---

## 🗄️ Supabase Database Setup

1. Open your Supabase Dashboard at `https://supabase.com/dashboard/project/phjuttpvdcotdouwcmsg`.
2. Go to the **SQL Editor**.
3. Run the SQL script located in `supabase/migrations/20261108_initial_schema.sql` to create the tables and RLS policies.
4. Run `supabase/seed.sql` to seed the initial products, services, and projects.

---

## ☁️ Deployment to Cloudflare Pages

### Option 1: Automatic Deployment via GitHub (Recommended)
1. Push your changes to GitHub:
   ```bash
   git push origin main
   ```
2. In your Cloudflare Dashboard, go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select the repository `roelhome/roel-home-web-code`.
4. Configure build settings:
   - **Framework preset**: `Astro`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. In **Environment Variables**, add:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `RESEND_API_KEY`
   - `NOTIFICATION_EMAIL`
6. Click **Save and Deploy**. Cloudflare Pages will build and deploy your site to a global CDN edge.

---

## 📅 Roadmap: Phase 2 — Secure Admin Dashboard

- [ ] Secure Admin Authentication via Supabase Auth
- [ ] Product & Category CRUD (Add, edit, delete, mark featured)
- [ ] Direct Image / Media Upload to Cloudflare R2
- [ ] Completed Projects Portfolio Manager
- [ ] Homepage Brand Video & Announcement Bar CMS
- [ ] Real-time Customer Enquiry Management Inbox & CSV Export
