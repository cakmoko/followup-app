# Cara Deploy FollowUp Tool ke Vercel

## Step 1: Buat Akun (kalau belum punya)

1. Buka **github.com** → Sign Up → Buat akun
2. Buka **vercel.com** → Sign Up → Pilih "Continue with GitHub"

---

## Step 2: Upload Code ke GitHub

1. Buka folder project di komputer Anda
2. Buka terminal/cmd, ketik satu-satu:

```
git init
```
(Enter)

```
git add .
```
(Enter)

```
git commit -m "FollowUp Tool"
```
(Enter)

3. Buat repo di GitHub:
   - Buka github.com → Login
   - Click "+" → "New repository"
   - Nama: `followup-app`
   - Pilih "Public"
   - Click "Create repository"

4. Ketik di terminal (ganti USERNAME dengan username GitHub Anda):

```
git remote add origin https://github.com/USERNAME/followup-app.git
```
(Enter)

```
git branch -M main
```
(Enter)

```
git push -u origin main
```
(Enter)

---

## Step 3: Deploy ke Vercel

1. Buka **vercel.com** → Login
2. Click "Add New..." → "Project"
3. Pilih repo `followup-app` dari daftar
4. Click "Environment Variables"
5. Masukkan 2 nilai:

**Variable 1:**
- Name: `NEXT_PUBLIC_SUPABASE_URL`
- Value: `https://afsexoxqjggbxalnrmsm.supabase.co`
- Click "Add"

**Variable 2:**
- Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: (copy dari file `.env.local` di folder project Anda)
- Click "Add"

6. Click "Deploy"
7. Tunggu 2-3 menit

---

## Step 4: Share ke Klien

Setelah deploy selesai:
- Vercel kasih URL seperti: `https://followup-app-xxx.vercel.app`
- Copy URL itu
- Share ke klien (WhatsApp/Email)

---

## Step 5: Kalau Mau Update App

1. Edit code di komputer
2. Ketik di terminal:

```
git add .
git commit -m "Update"
git push
```

3. Tunggu 1-2 menit → Vercel auto update

---

## Checklist Sebelum Deploy

- [ ] Supabase schema sudah run (di Supabase SQL Editor)
- [ ] Email confirmation disabled (Supabase → Authentication → Providers)
- [ ] Login/Register bekerja di localhost
- [ ] Import Excel bekerja
- [ ] WhatsApp link bekerja

---

## Bantuan

Kalau ada error atau tidak paham, kirim screenshot atau tulis di file `.md`