## Deploy on Vercel

1. Go to https://vercel.com → **New Project** → Import this GitHub repo.
2. Framework Preset: **Next.js** (auto-detected).
3. Set Environment Variables:
   - `API_BASE` = `https://<your-backend-host>:8000` (or staging URL)
   - `API_KEY`  = `<your-key>`
4. Click **Deploy**. Every push to `main` auto-deploys.

### Local Dev
```bash
cp .env.example .env.local
# update API_BASE, API_KEY as needed
npm install
npm run dev
# open http://localhost:3000
