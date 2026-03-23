# Kobe’s Go-Home Playbook (slideshow / ebook)

Private **Premium Puppy Placement** handoff for Kobe’s adopter. It lives in the site as a small slideshow you can **save as PDF** and send.

## View on the web

After deploy, open:

`https://crownedk9s.com/kobe-go-home-playbook/`

### Test locally (recommended)

From the repo root:

```bash
npm run serve
```

Then open **http://localhost:4173/kobe-go-home-playbook/**

Using a local server keeps image paths and fonts behaving like production (better than `file://`).

### Automated smoke test

```bash
npm run test:playbook
```

This uses Playwright (starts `http-server` on port 4173 per `playwright.config.ts`).

## “Private” for PPP buyers (important)

On a **public** static site (e.g. GitHub Pages), **anyone with the link** can open the page. This playbook is **not** behind login.

What you *can* do:

- **Do not** link it from the main nav or sitemap (keep it **unlisted**).
- **Only send** the URL (or PDF export) in email/text to the buyer.
- **`noindex`** is already set to reduce search-engine discovery.
- For **real** access control, use something like **Cloudflare Access**, **Netlify password protection**, or **email the PDF only** and skip a public URL.

If you want a harder-to-guess URL later, rename the folder to a long random slug and share that link only with buyers.

## Save as PDF (recommended)

1. Open the playbook in **Chrome** or **Safari**.
2. Click **Save / Print PDF** (top right) or press **⌘P** (Mac) / **Ctrl+P** (Windows).
3. Choose **Save as PDF**.
4. In print settings:
   - **Portrait** is usually best for reading on a phone.
   - Enable **Background graphics** / **Print backgrounds** so navy/gold panels and accents show in the PDF.

**Pagination:** Long chapters split at **natural breakpoints** (between panels/cards) so you get fewer “one line on the next page” orphans. Each numbered slideshow section still starts on a new page. If a single panel is taller than one sheet, the browser may still split it—that’s a browser limit.

## Navigate

- **Previous / Next** at the bottom  
- **Arrow keys** ← →  
- **Dots** to jump to a slide  

## Customize

- **Cover photo:** `index.html` → `img.cover-photo` `src`.
- **Age line:** uses `data-birthdate="2025-12-29"` and the same “weeks old” script as the main site.
- **Contact block:** last slide — update phone/email if needed.

## Privacy

`index.html` includes `<meta name="robots" content="noindex, nofollow">` so search engines are less likely to index this URL. Remove that tag if you ever want it public.
