# Liza Kalinina | Cinematic & Magazine Portfolio

An ultra-premium, magazine-style web portfolio designed for Director of Photography **Liza Kalinina**. Built with **Next.js**, **Framer Motion**, and **Prisma**, this application focuses on minimalist editorial aesthetics, cinematic transitions, and secure client screenings.

## ✨ Key Features

- **Magazine Cover Landing**: Dynamic hero section with parallax scroll transitions and massive editorial typography.
- **Cinematic Theater Mode**: Immersive full-screen project expansion featuring ambient "Ambilight" backlighting and high-blur backdrops.
- **Narrative Detail Mode**: A unique, title-first storytelling view for narrative works, revealing visual teasers on hover and supporting multi-image galleries.
- **Private "Premiere" Gates**: Secure, ticket-pass protected areas for private client screenings with persistent session support.
- **Integrated Admin CMS**: A full-featured dashboard for managing projects, metadata, gallery pictures, and secure ticket passes.
- **Theatrical Transitions**: Custom "Stage" mode theme transitions with cinematic sound FX (inspired by Netflix's "Tudum").
- **HLS Ready**: Built to support high-performance video streaming and adaptive bitrates.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Custom Design Tokens)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via [Prisma ORM](https://www.prisma.io/))
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React Hooks & LocalStorage Persistence

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js 20+**
- **PostgreSQL Instance**

### 2. Installation

```bash
git clone https://github.com/your-username/liza-portfolio.git
cd liza-portfolio
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/liza_dop"
```

### 4. Database Initialization

```bash
npx prisma db push
npx prisma generate
```

### 5. Start Development

```bash
npm run dev
```

Visit `http://localhost:3000` to view the site.

## 📁 Project Structure

- `/src/app`: Main application routes and page logic.
- `/src/app/admin`: CMS Dashboard for content management.
- `/src/app/api`: Serverless API routes (Projects, Uploads, Premiere Validation).
- `/prisma`: Database schema and migration logic.
- `/public`: Static assets, cinematic hero images, and uploads.

## 🔒 Security & Admin

- **Admin Access**: Protected dashboard at `/admin`. Default credentials can be set in the logic.
- **Ticket Passes**: Private projects are filtered at the database level and only decrypted/unlocked via valid, time-limited ticket passes.

## 📄 License

Custom Portfolio. All rights reserved. Branding and media belong to Liza Kalinina.
