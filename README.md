# FollowUp Tool - WhatsApp Agency Tool

Tool follow-up WhatsApp untuk agency dengan fitur import Excel dan generate link WhatsApp otomatis.

## Features

- Import file Excel (.xlsx) dengan auto-detect kolom
- Template pesan WhatsApp dengan emoji dan enter
- FollowUp button langsung buka WhatsApp
- Status tracking (Belum, Sudah, Group, Tidak Aktif)
- Filter dan search data
- Pagination 50 data per halaman
- Export progress ke Excel

## Tech Stack

- Next.js 14 + TypeScript
- Supabase (PostgreSQL)
- XLSX library untuk import/export

## Setup

### 1. Install Dependencies

```bash
cd followup-app
npm install
```

### 2. Setup Supabase

1. Buat project di https://supabase.com
2. Copy `supabase-schema.sql` ke SQL Editor dan run
3. Copy URL dan anon key dari Settings > API

### 3. Environment Variables

Copy `.env.local.example` ke `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run

```bash
npm run dev
```

## Format File Excel

Auto-detect kolom berdasarkan header:
- **Nilai 1** atau kolom dengan "nama" → Nama
- **Nilai 2** atau kolom dengan "whatsapp/wa/hp" → No WhatsApp
- **Nilai 3** atau kolom dengan "kota/kecamatan" → Kota
- **Nilai 4** atau kolom dengan "usia/umur" → Usia
- **Nilai 5** atau kolom dengan "pekerjaan" → Pekerjaan

## Status

- **Belum** - Orange, belum di followup
- **Sudah** - Green, sudah di followup
- **Group** - Blue, sudah masuk group
- **Tidak Aktif** - Red, nomor tidak aktif