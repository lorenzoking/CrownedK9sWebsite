# Buddy's Go-Home Playbook (slideshow / ebook)

Private **Crowned K9s Premium Puppy Placement** handoff for Buddy's family. Same slideshow pattern as the other go-home playbooks: **save as PDF** and/or share the URL.

## View on the web

After deploy, open:

`https://crownedk9s.com/buddy-go-home-playbook/`

### Test locally (recommended)

From the repo root:

```bash
npm run serve
```

Then open **http://localhost:4173/buddy-go-home-playbook/**

### Automated smoke test

```bash
npm run test:playbook
```

## "Private" / unlisted (important)

On a **public** static site, **anyone with the link** can open the page. This playbook is **not** behind login.

- **Do not** put it in main nav or sitemap unless you intend to.
- **Prefer** sharing the URL or PDF only with Buddy's family.
- **`noindex`** is set in `index.html` to reduce search-engine discovery.

## Save as PDF

1. Open the playbook in **Chrome** or **Safari**.
2. Click **Save / Print PDF** (top right) or **Cmd+P** / **Ctrl+P**.
3. Choose **Save as PDF**.
4. Enable **Background graphics** / **Print backgrounds** for colors.

## Customize

- **Cover photo:** `index.html` → `.cover-photo` `src`.
- **Requested cover:** `../pictures/PRP/Buddy/buddy-cover.jpg`.
- **Contact block:** last slide.
