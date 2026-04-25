# Stella’s Go-Home Playbook (slideshow / ebook)

Private **Crowned K9s Premium Puppy Placement** handoff for Stella’s adopter. Same slideshow pattern as Kobe’s playbook: **save as PDF** and/or share the URL.

## View on the web

After deploy, open:

`https://crownedk9s.com/stella-go-home-playbook/`

Spanish version:

`https://crownedk9s.com/stella-go-home-playbook/index-es.html`

### Test locally (recommended)

From the repo root:

```bash
npm run serve
```

Then open **http://localhost:4173/stella-go-home-playbook/**

### Automated smoke test

```bash
npm run test:playbook
```

(Playwright runs specs under `tests/` including the Stella playbook route.)

## “Private” / unlisted (important)

On a **public** static site, **anyone with the link** can open the page. This playbook is **not** behind login.

- **Do not** put it in main nav or sitemap unless you intend to.
- **Prefer** sharing the URL or PDF only with the adopting family.
- **`noindex`** is set in `index.html` to reduce search-engine discovery.

## Save as PDF

1. Open the playbook in **Chrome** or **Safari**.
2. Click **Save / Print PDF** (top right) or **⌘P** / **Ctrl+P**.
3. Choose **Save as PDF**.
4. Enable **Background graphics** / **Print backgrounds** for colors.

**Pagination:** Stella’s print stylesheet uses a **continuous ebook** flow (no forced new page after every on-screen slide), so PDFs stay denser with less empty space. Only the **cover** starts its own first page. The commands slide prints in **two columns** where the browser allows.

## Customize

- **Cover photo:** `index.html` → `.cover-photo` `src`.
- **Age line:** `data-birthdate="2025-12-22"` plus the inline script (same as Kobe).
- **Contact block:** last slide.
