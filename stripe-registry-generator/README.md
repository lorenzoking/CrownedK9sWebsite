# Stripe Registry Generator

Local utility that bulk-manages **Stripe Payment Links** for the Crowned K9s **"Our Pack Is Growing"** baby registry and auto-wires them into the website.

This project runs **on your computer**. It never runs in the browser. Your Stripe secret key stays in a local `.env` file.

---

## What this project does

For every item listed in `registry-items.json` it will:

1. Find-or-create a **Stripe Product** (matched by metadata `campaign` + `registry_item`). Title / description / image / active are kept in sync with the JSON on every run.
2. Find-or-create a **Stripe Price** using `custom_unit_amount` so the giver types in any amount they want, with an optional **suggested preset**, **minimum**, and **maximum**.
3. Find-or-create a **Stripe Payment Link** that uses that price, with `submit_type="donate"` (shows a "Donate" button at checkout), an **optional text field** so guests can leave a note for your *Love From Our Village* section, and an optional redirect URL after completion.
4. Tag everything with useful metadata:
  - `campaign: our-pack-is-growing`
  - `registry_type: baby-registry`
  - `registry_item: <slug>`
  - `source: crowned-k9s-site`
  - `config_signature: <hash>` on Prices + Payment Links so we can cleanly distinguish "current config" from "stale config".
5. **Auto-wire** the website: every `<a data-pack-fund-slug="…">` in `our-pack-is-growing/index.html` has its `href` rewritten to the matching (or reused) Stripe URL.
6. Write the finished, ready-to-use links to:
  - `output/payment-links.json`
  - `output/payment-links.csv`

---

## The 10-fund category model

The registry is modeled as **1 general contribution + 9 category funds** — one per filter pill on the page:


| Slug                   | Category                |
| ---------------------- | ----------------------- |
| `general-contribution` | *(general — site-wide)* |
| `feeding-fund`         | Feeding                 |
| `sleeping-fund`        | Sleeping                |
| `diapering-fund`       | Diapering               |
| `baby-gear-fund`       | Baby gear               |
| `health-safety-fund`   | Health & safety         |
| `bathing-fund`         | Bathing                 |
| `clothing-fund`        | Clothing                |
| `playing-fund`         | Playing                 |
| `gift-cards-fund`      | Cash & gift cards       |


When a visitor clicks "Contribute to Feeding Fund" on any registry item card, they're routed straight to the Feeding Fund Payment Link. No per-item Stripe product sprawl.

---

## The `data-pack-fund-slug` contract

Any HTML anchor that should be auto-wired must carry `data-pack-fund-slug="<slug>"` matching a slug in `registry-items.json`. Example:

```html
<a href="https://example.com/stripe-feeding-fund"
   class="fund-btn"
   data-pack-fund-slug="feeding-fund"
   target="_blank" rel="noopener noreferrer">Chip In</a>
```

On `npm run generate`, the `href` is replaced with the real Stripe URL. Everything else on the tag (classes, aria, target, etc.) is preserved.

---

## One-time setup

1. Install Node.js 18.17 or newer.
2. Open a terminal in this folder.
3. Copy the env file and paste your Stripe key:
  ```bash
   cp .env.example .env
  ```
   Open `.env` and fill in:
  - `STRIPE_SECRET_KEY` – start with your **test** key (`sk_test_...`) while you're experimenting.
  - `DEFAULT_SUCCESS_URL` – optional, the page Stripe redirects to after a gift is completed.
4. Install dependencies:
  ```bash
   npm install
  ```

---

## Optional checkout message (Love From Our Village)

Stripe Payment Links do **not** have a built-in “gift message” box. The supported approach is a **Checkout custom field** (one optional text field).

**What the generator does**

- Every **new** Payment Link it creates includes one optional field labeled **“Optional message (may be shared on our page)”** (API key `villageLoveNote`, up to 255 characters).
- On **reuse**, the next `npm run generate` run tries to **add the same field** to existing script-managed links if it is missing (metadata + custom fields are updated in one Stripe call when needed).

**Where you read the text**

- **Dashboard:** Payments → open the successful payment → under Checkout details, look for **Custom fields** / the field key `villageLoveNote`.
- **Automation (optional):** listen for `checkout.session.completed` and read `session.custom_fields`.

**Links you created only in the Dashboard** (for example *Crowned K9s Registry — General Contribution*) are **not** updated by this script unless they carry the same `metadata.source=crowned-k9s-site` matching rules. For those, add the field manually:

1. Stripe Dashboard → **Payment Links** → open the link → **Edit** (or the `⋯` menu → **Edit payment link**).
2. Find **Custom fields** / **Collect additional information** (wording varies).
3. Add a **Text** field, mark it **Optional**, label something like *Optional message for the family*, max length **255**.

Use the same workflow for every fund link you want to collect notes on. Stripe’s reference: [Checkout custom fields](https://docs.stripe.com/payments/checkout/custom-fields).

---

## Editing registry items

All items live in `registry-items.json`. Shape of each item:


| Field              | Type    | Required | Notes                                                                |
| ------------------ | ------- | -------- | -------------------------------------------------------------------- |
| `slug`             | string  | yes      | Stable ID. Must match the `data-pack-fund-slug` on the page anchor.  |
| `title`            | string  | yes      | Shown in Stripe Checkout.                                            |
| `description`      | string  | no       | Shown in Stripe Checkout.                                            |
| `image`            | string  | no       | Public HTTPS URL. Used for product image.                            |
| `currency`         | string  | yes      | Lowercase ISO code, e.g. `"usd"`.                                    |
| `suggested_amount` | integer | no       | **In cents.** Pre-fills the amount at checkout.                      |
| `minimum_amount`   | integer | no       | **In cents.** Stripe enforces this lower bound.                      |
| `maximum_amount`   | integer | no       | **In cents.** Stripe enforces this upper bound.                      |
| `active`           | boolean | no       | Default `true`. Set `false` to skip the item on the next run.        |
| `category`         | string  | no       | Must match a filter-pill category on the page (exact label).         |
| `thank_you_note`   | string  | no       | Used only if no success URL is set (hosted Stripe "thank you" page). |
| `success_url`      | string  | no       | Overrides `DEFAULT_SUCCESS_URL` for this specific item.              |


> **Amounts are in cents.** `$25.00 = 2500`, `$1.00 = 100`.

---

## How to run

```bash
npm run generate
```

Progress looks like:

```
[1/10] feeding-fund
   ↪  Reusing product     prod_XXX
   ↪  Reusing price       price_XXX
   ↪  Reusing payment link  plink_XXX
   ✓  Done: https://buy.stripe.com/…

──────────── Wiring page ────────────
   =  unchanged feeding-fund

──────────── Summary ────────────
Items processed:                 10
Products created:                0
Products reused:                 10
Payment Links created:           0
Payment Links reused:            10
Stale Prices deactivated:        0
Stale Payment Links deactivated: 0
Page anchors updated:            0
Page anchors unchanged:          10
```

---

## Production cleanup/update mode

Use this when you accidentally ran the wrong config on your live key and want to fix names/metadata while avoiding extra catalog clutter.

### Safety behavior

- `cleanup` mode is dry-run first by default unless `--apply` is passed.
- Dry-run performs Stripe reads only and prints a per-item action plan.
- Apply performs updates/creates/deactivations.
- Only objects with `metadata.source=crowned-k9s-site` are eligible for mutation/deactivation.
- Page wiring is disabled in cleanup scripts by default (`--no-wire`) so Stripe cleanup can be done without touching site HTML.

### Commands

```bash
# 1) Review exact planned actions (no Stripe writes)
npm run cleanup:dry-run

# 2) Execute the exact plan after review
npm run cleanup:apply
```

You can still run the raw commands directly:

```bash
node generate-links.js --cleanup --dry-run --no-wire
node generate-links.js --cleanup --apply --no-wire
```

### What dry-run shows

- whether each product will be reused, renamed/updated, or created
- whether each price will be reused or created
- whether each payment link will be reused or created
- how many stale script-generated prices/payment links would be deactivated
- final aggregate tally of would change counts

### What apply does

- updates product name/description/image/metadata in place when drift exists
- reuses matching price/link objects whenever possible
- creates only missing/mismatched objects
- deactivates stale script-generated duplicates (unless `--keep-stale`)

---

## Idempotency guarantees

On every run the script reuses existing Stripe objects whenever the config matches. Here's exactly what triggers a new object vs a reuse:

- **Product reused** when a Product exists with `metadata.campaign=our-pack-is-growing` and `metadata.registry_item=<slug>`. Title / description / image / active are updated in place so the Stripe Dashboard stays in sync with the JSON.
- **Product created** when no matching Product is found.
- **Price reused** when an active Price under that Product matches currency, `custom_unit_amount.enabled`, preset, minimum, and maximum. Preference is given to a Price whose `metadata.config_signature` also matches.
- **Price created** when no matching active Price exists (e.g. you changed the preset/min/max or currency).
- **Payment Link reused** when an active Payment Link exists with matching `metadata.campaign` + `metadata.registry_item` AND its attached line-item Price equals the current Price. A matching `config_signature` promotes it.
- **Payment Link created** otherwise.

If nothing about an item changed between runs, **all 10 Stripe objects are reused and the page URLs are not touched.** No churn.

---

## Stale deactivation

By default, old script-generated objects are retired (non-destructively — `active: false`) once a newer object takes their place:

- A script-generated Price is **stale** if its `metadata.source=crowned-k9s-site`, its slug matches, and its `config_signature` no longer matches the current config.
- A script-generated Payment Link is **stale** if its `metadata.source=crowned-k9s-site`, its slug matches, and its attached Price differs from the current Price.

**Hard safety rail:** objects without `metadata.source=crowned-k9s-site` are never deactivated, even if they happen to share a slug. Anything you manually created in the Stripe Dashboard is always left alone.

Opt out of deactivation:

```bash
npm run generate -- --keep-stale
# or
KEEP_STALE=true npm run generate
```

Nothing is ever deleted. You can reactivate retired objects from the Stripe Dashboard.

---

## Page wiring

After all Stripe work is done, the script rewrites the page to use the final URLs.

- **Target file:** `../our-pack-is-growing/index.html` (resolved relative to this project).
- **Target anchors:** every `<a … data-pack-fund-slug="<slug>" …>` whose slug matches an item in `registry-items.json`.
- **What changes:** only the `href` attribute inside that opening tag. Classes, aria-labels, target, rel, inline text — all preserved.

Opt out of page wiring:

```bash
npm run generate -- --no-wire
# or
WIRE_PAGE=false npm run generate
```

---

## Test mode vs live mode

- While you iterate, keep `STRIPE_SECRET_KEY` set to a **test** key (`sk_test_...`). The generated Payment Links will be test-only (`https://buy.stripe.com/test_...`).
- When you're ready to go live, swap the key for your **live** key (`sk_live_...`) and run `npm run generate` again. That run will create fresh live Products / Prices / Payment Links in your live account.
- **Never commit your `.env`** (it has your secret key).

> Test-mode objects and live-mode objects live in separate Stripe accounts. Switching keys means you'll get a "create" run the first time on the new key, then "reuse" runs after that.

---

## Limitations

- **Custom-amount Prices cannot be edited in place** for preset / minimum / maximum. The script creates a new Price when those change, and deactivates the old one (unless `--keep-stale`).
- **Payment Links cannot swap their line items** in place, so a new Price always means a new Payment Link URL. The script takes care of retiring the old link.
- **Items removed from `registry-items.json`** are not auto-purged. The script only touches objects whose slug still appears in the JSON. Clean up orphans from the Stripe Dashboard, or re-add the slug with `active: false` to keep behavior explicit.
- **Stripe Search API is not used** for product lookup. We page through `products.list` and filter in code, which is always safe on a fresh account.

---

## File map

```
stripe-registry-generator/
├── .env.example          ← template for your Stripe secret key
├── package.json          ← deps + scripts
├── registry-items.json   ← edit this to define items (10 funds by default)
├── generate-links.js     ← the script (idempotent, self-wiring)
├── output/
│   ├── payment-links.json  ← generated
│   └── payment-links.csv   ← generated
└── README.md             ← you're reading it
```

