# Koda’s Go-Home Playbook (slideshow / ebook)

Private **Premium Puppy Placement** handoff for Koda, formerly known as Owen. It lives in the site as a small slideshow you can **save as PDF** and send.

## View on the web

After deploy, open:

`https://crownedk9s.com/koda-go-home-playbook/`

### Test locally

From the repo root:

```bash
npm run serve
```

Then open **http://localhost:4173/koda-go-home-playbook/**

Using a local server keeps image paths and fonts behaving like production.

## “Private” for PPP buyers

On a public static site, anyone with the link can open the page. This playbook is **not** behind login.

What you can do:

- Do not link it from the main nav or sitemap.
- Only send the URL or PDF export in email/text to the buyer.
- `noindex` is already set to reduce search-engine discovery.

## Save as PDF

1. Open the playbook in Chrome or Safari.
2. Click **Save / Print PDF** or press **⌘P** / **Ctrl+P**.
3. Choose **Save as PDF**.
4. Enable **Background graphics** / **Print backgrounds** so panels and accents show in the PDF.

## Customize

- **Cover photo:** `index.html` → `img.cover-photo` `src`.
- **Age line:** uses `data-birthdate="2026-02-13"`.
- **Shared styling/scripts:** this page reuses `../kobe-go-home-playbook/style.css` and `../kobe-go-home-playbook/script.js`.
