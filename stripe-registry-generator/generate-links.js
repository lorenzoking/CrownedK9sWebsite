/**
 * ─────────────────────────────────────────────────────────────
 * Crowned K9s – Our Pack Is Growing
 * Local bulk Stripe Payment Link generator (idempotent)
 * ─────────────────────────────────────────────────────────────
 *
 * What this script does for every item in registry-items.json:
 *   1. Find-or-create a Stripe Product, matched by metadata
 *      `campaign` + `registry_item` (the slug). Title / description /
 *      image / active are kept in sync with the JSON on every run.
 *   2. Find-or-create a Stripe Price with `custom_unit_amount`
 *      (donation-style). A price is reused when currency, preset,
 *      minimum, maximum, and active status all match. Otherwise a
 *      new Price is created and the old script-generated Price is
 *      deactivated.
 *   3. Find-or-create a Stripe Payment Link with `submit_type=donate`
 *      that points at the current Price. Stale script-generated
 *      Payment Links for the same slug are deactivated.
 *   4. Regex-wire every `data-pack-fund-slug="<slug>"` anchor in
 *      our-pack-is-growing/index.html to the (possibly reused) URL.
 *   5. Write the finished links to:
 *        output/payment-links.json
 *        output/payment-links.csv
 *
 * How to run (one-time setup)
 *   1. cp .env.example .env   # then paste your STRIPE_SECRET_KEY
 *   2. npm install
 *   3. npm run generate
 *
 * Safety / opt-outs
 *   --keep-stale            do not deactivate stale Prices / Payment Links
 *   KEEP_STALE=true         same, via env var
 *   --no-wire               skip the page-wiring step
 *   WIRE_PAGE=false         same, via env var
 *
 * Only objects whose metadata.source === 'crowned-k9s-site' are ever
 * deactivated. Nothing is deleted — `active: false` is reversible
 * from the Stripe Dashboard.
 * ─────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import Stripe from 'stripe';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const REGISTRY_PATH = path.join(__dirname, 'registry-items.json');
const OUTPUT_DIR = path.join(__dirname, 'output');
const OUTPUT_JSON = path.join(OUTPUT_DIR, 'payment-links.json');
const OUTPUT_CSV = path.join(OUTPUT_DIR, 'payment-links.csv');
const PAGE_PATH = path.resolve(__dirname, '..', 'our-pack-is-growing', 'index.html');

const CAMPAIGN = 'our-pack-is-growing';
const REGISTRY_TYPE = 'baby-registry';
const SOURCE = 'crowned-k9s-site';

/** Checkout custom field: donors can leave an optional note (read in Dashboard or via webhook). */
const VILLAGE_NOTE_FIELD_KEY = 'villageLoveNote';

function packCheckoutCustomFields() {
  return [
    {
      key: VILLAGE_NOTE_FIELD_KEY,
      label: { type: 'custom', custom: 'Optional message (may be shared on our page)' },
      type: 'text',
      optional: true,
      text: { maximum_length: 255 },
    },
  ];
}

function paymentLinkHasVillageNoteField(link) {
  const fields = link?.custom_fields;
  if (!Array.isArray(fields) || !fields.length) return false;
  return fields.some((f) => f?.key === VILLAGE_NOTE_FIELD_KEY);
}
const LEGACY_SLUG_ALIASES = {
  'general-contribution': ['family-love-gift'],
  'feeding-fund': ['baby-essentials-fund', 'baby-essentials'],
  'sleeping-fund': ['nursery-support-fund', 'nursery-support'],
  'diapering-fund': ['diapers-fund'],
  'baby-gear-fund': ['meal-support-fund', 'meal-support'],
};
const LEGACY_PRODUCT_NAME_ALIASES = {
  'general-contribution': ['Family Love Gift'],
  'feeding-fund': ['Baby Essentials Fund'],
  'sleeping-fund': ['Nursery Support Fund'],
  'diapering-fund': ['Diapers Fund'],
  'baby-gear-fund': ['Meal Support Fund'],
};

// CLI flags / env
const CLI_ARGS = new Set(process.argv.slice(2));
const KEEP_STALE = CLI_ARGS.has('--keep-stale') || String(process.env.KEEP_STALE).toLowerCase() === 'true';
const WIRE_PAGE = !CLI_ARGS.has('--no-wire') && String(process.env.WIRE_PAGE).toLowerCase() !== 'false';
const CLEANUP_MODE = CLI_ARGS.has('--cleanup') || CLI_ARGS.has('--dry-run') || CLI_ARGS.has('--apply');
const DRY_RUN = CLI_ARGS.has('--dry-run') || (CLEANUP_MODE && !CLI_ARGS.has('--apply'));
const APPLY_MODE = CLI_ARGS.has('--apply');

if (CLI_ARGS.has('--dry-run') && CLI_ARGS.has('--apply')) {
  console.error('Use either --dry-run or --apply, not both.');
  process.exit(1);
}

// ───────────────────────────────────────────────
// Environment + Stripe client
// ───────────────────────────────────────────────
function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    console.error(`\nMissing required environment variable: ${name}`);
    console.error('Copy .env.example to .env and fill in the values, then re-run.\n');
    process.exit(1);
  }
  return value.trim();
}

const STRIPE_SECRET_KEY = requireEnv('STRIPE_SECRET_KEY');
const DEFAULT_SUCCESS_URL = (process.env.DEFAULT_SUCCESS_URL || '').trim();
const KEY_MODE = /^(sk|rk)_live_/.test(STRIPE_SECRET_KEY) ? 'live' : 'test';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  appInfo: {
    name: 'crowned-k9s-registry-generator',
    version: '2.1.0',
  },
});

// ───────────────────────────────────────────────
// Config signature
// A deterministic fingerprint of the pricing config. We write it to
// Price + Payment Link metadata so we can cleanly separate "old
// script-generated object with stale config" from "current one".
// ───────────────────────────────────────────────
function priceSignature(item) {
  const parts = [
    (item.currency || 'usd').toLowerCase(),
    'custom',
    item.suggested_amount ?? 'none',
    item.minimum_amount ?? 'none',
    item.maximum_amount ?? 'none',
    item.active === false ? 'inactive' : 'active',
  ];
  const raw = parts.join('|');
  return crypto.createHash('sha1').update(raw).digest('hex').slice(0, 16);
}

// ───────────────────────────────────────────────
// Metadata builders
// ───────────────────────────────────────────────
function buildBaseMetadata(item) {
  const base = {
    campaign: CAMPAIGN,
    registry_type: REGISTRY_TYPE,
    registry_item: item.slug,
    registry_slug: item.slug,
    source: SOURCE,
  };
  if (item.category) base.category = String(item.category);
  return base;
}

function buildProductMetadata(item) {
  return buildBaseMetadata(item);
}

function buildPricingMetadata(item) {
  return {
    ...buildBaseMetadata(item),
    config_signature: priceSignature(item),
  };
}

function isScopedObject(obj) {
  return obj?.metadata?.source === SOURCE;
}

function normalizeLabel(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function buildMatchKeys(item) {
  const slug = String(item.slug || '').trim();
  const aliases = LEGACY_SLUG_ALIASES[slug] || [];
  return new Set([slug, ...aliases].filter(Boolean));
}

function buildNameAliases(item) {
  const aliases = LEGACY_PRODUCT_NAME_ALIASES[item.slug] || [];
  return new Set([item.title, ...aliases].map(normalizeLabel).filter(Boolean));
}

// ───────────────────────────────────────────────
// Validation
// ───────────────────────────────────────────────
function validateItem(item) {
  if (!item || typeof item !== 'object') throw new Error('Item is not an object');
  if (!item.slug) throw new Error('Missing `slug`');
  if (!/^[a-z0-9][a-z0-9-_]*$/i.test(item.slug)) {
    throw new Error(`Invalid slug "${item.slug}" (letters, numbers, dashes, underscores only)`);
  }
  if (!item.title) throw new Error('Missing `title`');
  if (!item.currency) throw new Error('Missing `currency` (e.g. "usd")');

  const { suggested_amount, minimum_amount, maximum_amount } = item;
  const isInt = (v) => v == null || (Number.isInteger(v) && v >= 0);
  if (!isInt(suggested_amount)) throw new Error('`suggested_amount` must be a non-negative integer (cents)');
  if (!isInt(minimum_amount)) throw new Error('`minimum_amount` must be a non-negative integer (cents)');
  if (!isInt(maximum_amount)) throw new Error('`maximum_amount` must be a non-negative integer (cents)');

  if (minimum_amount != null && maximum_amount != null && minimum_amount > maximum_amount) {
    throw new Error('`minimum_amount` cannot be greater than `maximum_amount`');
  }
  if (suggested_amount != null) {
    if (minimum_amount != null && suggested_amount < minimum_amount) {
      throw new Error('`suggested_amount` cannot be lower than `minimum_amount`');
    }
    if (maximum_amount != null && suggested_amount > maximum_amount) {
      throw new Error('`suggested_amount` cannot be higher than `maximum_amount`');
    }
  }
}

// ───────────────────────────────────────────────
// Product: find-or-create (list-and-filter, no Search API)
// ───────────────────────────────────────────────
async function findExistingProduct(item) {
  const keys = buildMatchKeys(item);
  const nameAliases = buildNameAliases(item);
  let match = null;
  for await (const p of stripe.products.list({ limit: 100 })) {
    if (!isScopedObject(p)) continue;
    const productCampaign = p.metadata?.campaign;
    const productRegistryItem = p.metadata?.registry_item || '';
    const productRegistrySlug = p.metadata?.registry_slug || '';
    const normalizedName = normalizeLabel(p.name);
    const metadataMatch = productCampaign === CAMPAIGN && (keys.has(productRegistryItem) || keys.has(productRegistrySlug));
    const nameMatch = productCampaign === CAMPAIGN && nameAliases.has(normalizedName);

    if (metadataMatch || nameMatch) {
      match = p;
      break;
    }
  }
  return match;
}

function productNeedsUpdate(existing, desired) {
  const descMatches = (existing.description || '') === (desired.description || '');
  const nameMatches = existing.name === desired.name;
  const existingImage = Array.isArray(existing.images) && existing.images.length ? existing.images[0] : '';
  const desiredImage = Array.isArray(desired.images) && desired.images.length ? desired.images[0] : '';
  const imageMatches = existingImage === desiredImage;
  const activeMatches = existing.active === desired.active;

  // Compare only the keys we manage.
  const desiredMeta = desired.metadata || {};
  const existingMeta = existing.metadata || {};
  const metaKeys = ['campaign', 'registry_type', 'registry_item', 'registry_slug', 'source', 'category'];
  const metaMatches = metaKeys.every((k) => (existingMeta[k] || '') === (desiredMeta[k] || ''));

  return !(nameMatches && descMatches && imageMatches && activeMatches && metaMatches);
}

async function upsertProduct(item, options = {}) {
  const { dryRun = false } = options;
  const desiredInput = {
    name: item.title,
    description: item.description || undefined,
    images: item.image ? [item.image] : undefined,
    active: item.active !== false,
    metadata: buildProductMetadata(item),
  };

  const existing = await findExistingProduct(item);
  if (existing) {
    // Build "desired" in a shape comparable to the existing product.
    const desiredForCompare = {
      name: desiredInput.name,
      description: desiredInput.description || '',
      images: desiredInput.images || [],
      active: desiredInput.active,
      metadata: desiredInput.metadata,
    };
    if (productNeedsUpdate(existing, desiredForCompare)) {
      if (dryRun) {
        console.log(`   ~  Would update product    ${existing.id}`);
        return { product: existing, reused: true, updated: true, action: 'update_product' };
      }
      console.log(`   ↪  Updating product    ${existing.id}`);
      const updated = await stripe.products.update(existing.id, {
        name: desiredInput.name,
        description: desiredInput.description ?? '',
        images: desiredInput.images || [],
        active: desiredInput.active,
        metadata: desiredInput.metadata,
      });
      return { product: updated, reused: true, updated: true, action: 'update_product' };
    }
    console.log(`   ↪  Reusing product     ${existing.id}`);
    return { product: existing, reused: true, updated: false, action: 'reuse_product' };
  }

  if (dryRun) {
    console.log(`   ~  Would create product    (slug: ${item.slug})`);
    return {
      product: { id: `dryrun-prod-${item.slug}`, metadata: buildProductMetadata(item) },
      reused: false,
      updated: false,
      action: 'create_product',
    };
  }
  console.log(`   +  Creating product   (slug: ${item.slug})`);
  const created = await stripe.products.create(desiredInput);
  return { product: created, reused: false, updated: false, action: 'create_product' };
}

// ───────────────────────────────────────────────
// Price: customer-chosen amount, reuse when config matches
// ───────────────────────────────────────────────
function priceMatchesItem(price, item) {
  if (!price.active) return false;
  if ((price.currency || '').toLowerCase() !== item.currency.toLowerCase()) return false;
  const cua = price.custom_unit_amount;
  if (!cua || cua.enabled !== true) return false;
  const desiredPreset = item.suggested_amount ?? null;
  const desiredMin = item.minimum_amount ?? null;
  const desiredMax = item.maximum_amount ?? null;
  if ((cua.preset ?? null) !== desiredPreset) return false;
  if ((cua.minimum ?? null) !== desiredMin) return false;
  if ((cua.maximum ?? null) !== desiredMax) return false;
  return true;
}

async function listProductPrices(productId) {
  const prices = [];
  for await (const p of stripe.prices.list({ product: productId, limit: 100 })) {
    prices.push(p);
  }
  return prices;
}

async function upsertPrice(product, item, options = {}) {
  const { dryRun = false } = options;
  if (dryRun && String(product.id || '').startsWith('dryrun-prod-')) {
    console.log('   ~  Would create price');
    return {
      price: { id: `dryrun-price-${item.slug}`, metadata: buildPricingMetadata(item) },
      reused: false,
      stalePrices: [],
      action: 'create_price',
    };
  }

  const targetSignature = priceSignature(item);
  const matchKeys = buildMatchKeys(item);
  const allPrices = await listProductPrices(product.id);

  // Reuse a matching active price. Prefer one whose config_signature
  // also matches (unambiguous), but accept plain shape match too.
  const activePrices = allPrices.filter((p) => p.active && isScopedObject(p));
  let match = activePrices.find(
    (p) => priceMatchesItem(p, item) && p.metadata?.config_signature === targetSignature
  );
  if (!match) {
    match = activePrices.find((p) => priceMatchesItem(p, item));
  }

  let price;
  let reused;
  let action;
  if (match) {
    console.log(`   ↪  Reusing price       ${match.id}`);
    price = match;
    reused = true;
    action = 'reuse_price';
    // Keep metadata fresh (campaign, signature, etc.) without changing price shape.
    const desiredMeta = buildPricingMetadata(item);
    const metaKeys = Object.keys(desiredMeta);
    const metaDrift = metaKeys.some((k) => (match.metadata?.[k] || '') !== (desiredMeta[k] || ''));
    if (metaDrift) {
      if (dryRun) {
        console.log(`   ~  Would update price metadata ${match.id}`);
      } else {
        try {
          await stripe.prices.update(match.id, { metadata: desiredMeta });
        } catch (_) {
          // metadata update failures are non-fatal
        }
      }
    }
  } else {
    action = 'create_price';
    if (dryRun) {
      console.log(`   ~  Would create price`);
      price = { id: `dryrun-price-${item.slug}`, metadata: buildPricingMetadata(item) };
    } else {
      console.log(`   +  Creating price`);
      const custom_unit_amount = { enabled: true };
      if (item.suggested_amount != null) custom_unit_amount.preset = item.suggested_amount;
      if (item.minimum_amount != null) custom_unit_amount.minimum = item.minimum_amount;
      if (item.maximum_amount != null) custom_unit_amount.maximum = item.maximum_amount;
      price = await stripe.prices.create({
        product: product.id,
        currency: item.currency.toLowerCase(),
        custom_unit_amount,
        metadata: buildPricingMetadata(item),
      });
    }
    reused = false;
  }

  // Identify stale script-generated prices to retire.
  const stalePrices = activePrices.filter((p) => {
    if (p.id === price.id) return false;
    if (p.metadata?.source !== SOURCE) return false; // never touch non-script objects
    const priceRegistryItem = p.metadata?.registry_item || '';
    const priceRegistrySlug = p.metadata?.registry_slug || '';
    if (!matchKeys.has(priceRegistryItem) && !matchKeys.has(priceRegistrySlug)) return false;
    // Different signature => considered stale.
    return p.metadata?.config_signature !== targetSignature;
  });

  return { price, reused, stalePrices, action };
}

// ───────────────────────────────────────────────
// Payment Link: reuse by metadata + line item check
// ───────────────────────────────────────────────
async function listAllActivePaymentLinks() {
  const links = [];
  for await (const l of stripe.paymentLinks.list({ active: true, limit: 100 })) {
    links.push(l);
  }
  return links;
}

async function paymentLinkAttachedPriceId(linkId) {
  const lineItems = await stripe.paymentLinks.listLineItems(linkId, { limit: 10 });
  if (!lineItems.data.length || lineItems.data.length > 1) return null;
  return lineItems.data[0].price?.id || null;
}

async function upsertPaymentLink(product, price, item, options = {}) {
  const { dryRun = false, allActiveLinks = null } = options;
  const targetSignature = priceSignature(item);
  const matchKeys = buildMatchKeys(item);
  const allActive = Array.isArray(allActiveLinks) ? allActiveLinks : await listAllActivePaymentLinks();
  const candidates = allActive.filter(
    (l) =>
      l.metadata?.campaign === CAMPAIGN &&
      (matchKeys.has(l.metadata?.registry_item || '') || matchKeys.has(l.metadata?.registry_slug || '')) &&
      isScopedObject(l)
  );

  let match = null;
  const staleLinks = [];

  // Fast path: matching config signature AND currently-attached price matches.
  for (const candidate of candidates) {
    try {
      const attachedPriceId = await paymentLinkAttachedPriceId(candidate.id);
      const sigMatches = candidate.metadata?.config_signature === targetSignature;
      if (attachedPriceId === price.id && sigMatches) {
        match = candidate;
        break;
      }
      if (!match && attachedPriceId === price.id) {
        // Same price attached — good enough to reuse even if sig drifted.
        match = candidate;
      }
    } catch (err) {
      // If we can't confirm the line item, treat as stale so we don't reuse unsafely.
      if (candidate.metadata?.source === SOURCE) staleLinks.push(candidate);
    }
  }

  // Any candidate that isn't the match and was script-generated = stale.
  for (const candidate of candidates) {
    if (match && candidate.id === match.id) continue;
    if (candidate.metadata?.source !== SOURCE) continue;
    if (!staleLinks.find((s) => s.id === candidate.id)) staleLinks.push(candidate);
  }

  let link;
  let reused;
  let action;
  if (match) {
    console.log(`   ↪  Reusing payment link  ${match.id}`);
    link = match;
    reused = true;
    action = 'reuse_payment_link';
    // Keep metadata fresh (signature, campaign, etc.).
    const desiredMeta = buildPricingMetadata(item);
    const metaKeys = Object.keys(desiredMeta);
    const metaDrift = metaKeys.some((k) => (match.metadata?.[k] || '') !== (desiredMeta[k] || ''));
    const needsVillageField = !paymentLinkHasVillageNoteField(match);
    if (metaDrift || needsVillageField) {
      if (dryRun) {
        console.log(
          `   ~  Would update payment link ${match.id}${metaDrift ? ' metadata' : ''}${
            needsVillageField ? ' + optional village message field' : ''
          }`
        );
      } else {
        try {
          const payload = {};
          if (metaDrift) payload.metadata = desiredMeta;
          if (needsVillageField) payload.custom_fields = packCheckoutCustomFields();
          if (Object.keys(payload).length) {
            await stripe.paymentLinks.update(match.id, payload);
          }
        } catch (err) {
          console.warn(`   !  Could not update payment link ${match.id}: ${err.message}`);
        }
      }
    }
  } else {
    action = 'create_payment_link';
    if (dryRun) {
      console.log(`   ~  Would create payment link`);
      link = { id: `dryrun-link-${item.slug}`, url: `https://example.com/dry-run/${item.slug}` };
    } else {
      console.log(`   +  Creating payment link`);
      const successUrl = (item.success_url && item.success_url.trim()) || DEFAULT_SUCCESS_URL;
      const params = {
        line_items: [{ price: price.id, quantity: 1 }],
        submit_type: 'donate',
        metadata: buildPricingMetadata(item),
        custom_fields: packCheckoutCustomFields(),
      };
      if (successUrl) {
        params.after_completion = { type: 'redirect', redirect: { url: successUrl } };
      } else if (item.thank_you_note) {
        params.after_completion = {
          type: 'hosted_confirmation',
          hosted_confirmation: { custom_message: item.thank_you_note },
        };
      }
      link = await stripe.paymentLinks.create(params);
    }
    reused = false;
  }

  return { link, reused, staleLinks, action };
}

// ───────────────────────────────────────────────
// Deactivation (stale-object retirement)
// ───────────────────────────────────────────────
async function deactivatePrices(prices) {
  let count = 0;
  for (const p of prices) {
    if (p.metadata?.source !== SOURCE) continue; // hard guard
    try {
      await stripe.prices.update(p.id, { active: false });
      console.log(`   ⊘  Deactivated stale price        ${p.id}`);
      count++;
    } catch (err) {
      console.warn(`   !  Could not deactivate price ${p.id}: ${err.message}`);
    }
  }
  return count;
}

async function deactivatePaymentLinks(links) {
  let count = 0;
  for (const l of links) {
    if (l.metadata?.source !== SOURCE) continue; // hard guard
    try {
      await stripe.paymentLinks.update(l.id, { active: false });
      console.log(`   ⊘  Deactivated stale payment link ${l.id}`);
      count++;
    } catch (err) {
      console.warn(`   !  Could not deactivate payment link ${l.id}: ${err.message}`);
    }
  }
  return count;
}

// ───────────────────────────────────────────────
// Output formatting
// ───────────────────────────────────────────────
const OUTPUT_COLUMNS = [
  'slug',
  'title',
  'description',
  'stripe_url',
  'payment_link_id',
  'product_id',
  'price_id',
  'suggested_amount',
  'minimum_amount',
  'maximum_amount',
  'image',
  'category',
  'reused_product',
  'reused_payment_link',
];

function csvEscape(value) {
  if (value == null) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function toCSV(rows) {
  const header = OUTPUT_COLUMNS.join(',');
  const body = rows
    .map((row) => OUTPUT_COLUMNS.map((col) => csvEscape(row[col])).join(','))
    .join('\n');
  return header + '\n' + body + (rows.length ? '\n' : '');
}

function toFrontEndObject(item, product, price, link, flags) {
  return {
    slug: item.slug,
    title: item.title,
    description: item.description || '',
    stripe_url: link.url,
    payment_link_id: link.id,
    product_id: product.id,
    price_id: price.id,
    suggested_amount: item.suggested_amount ?? null,
    minimum_amount: item.minimum_amount ?? null,
    maximum_amount: item.maximum_amount ?? null,
    image: item.image || '',
    category: item.category || '',
    reused_product: !!flags?.reused_product,
    reused_payment_link: !!flags?.reused_payment_link,
  };
}

// ───────────────────────────────────────────────
// wirePage: rewrite hrefs on every data-pack-fund-slug anchor
// ───────────────────────────────────────────────
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function wirePage(successes) {
  if (!WIRE_PAGE) {
    console.log('\nPage wiring skipped (--no-wire / WIRE_PAGE=false).');
    return { updated: 0, unchanged: 0, missing: 0 };
  }

  let html;
  try {
    html = await fs.readFile(PAGE_PATH, 'utf8');
  } catch (err) {
    console.log(`\nPage wiring skipped (could not read ${PAGE_PATH}: ${err.message}).`);
    return { updated: 0, unchanged: 0, missing: 0 };
  }

  let updated = 0;
  let unchanged = 0;
  let missing = 0;
  let mutated = html;

  for (const row of successes) {
    const slug = row.slug;
    const targetUrl = row.stripe_url;
    if (!slug || !targetUrl) continue;

    // Match the opening <a ...> tag that carries data-pack-fund-slug="<slug>".
    // Supports the attribute appearing before or after href= within the tag.
    const tagRegex = new RegExp(
      `<a\\b([^>]*?)data-pack-fund-slug="${escapeRegex(slug)}"([^>]*?)>`,
      'g'
    );

    let found = false;
    let currentChanged = false;

    mutated = mutated.replace(tagRegex, (fullTag, before, after) => {
      found = true;
      const hrefRegex = /href="([^"]*)"/;
      const combined = `${before}data-pack-fund-slug="${slug}"${after}`;
      if (hrefRegex.test(combined)) {
        const currentHref = combined.match(hrefRegex)[1];
        if (currentHref === targetUrl) return fullTag;
        currentChanged = true;
        const rewritten = combined.replace(hrefRegex, `href="${targetUrl}"`);
        return `<a${rewritten}>`;
      }
      // No href — inject one at the start of the attributes.
      currentChanged = true;
      return `<a href="${targetUrl}"${before}data-pack-fund-slug="${slug}"${after}>`;
    });

    if (!found) {
      missing++;
      console.log(`   ?  no anchor for ${slug}`);
      continue;
    }
    if (currentChanged) {
      updated++;
      console.log(`   ✓  wired ${slug} -> ${targetUrl}`);
    } else {
      unchanged++;
      console.log(`   =  unchanged ${slug}`);
    }
  }

  if (mutated !== html) {
    await fs.writeFile(PAGE_PATH, mutated, 'utf8');
    console.log(`\nPage updated: ${PAGE_PATH}`);
  } else {
    console.log('\nPage already up to date (no hrefs changed).');
  }
  return { updated, unchanged, missing };
}

// ───────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────
async function main() {
  const raw = await fs.readFile(REGISTRY_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  const items = Array.isArray(parsed) ? parsed : parsed.items;

  if (!Array.isArray(items) || items.length === 0) {
    console.error('registry-items.json must be a non-empty array (or an object with an `items` array).');
    process.exit(1);
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const successes = [];
  const failures = [];
  const skipped = [];
  const plannedChanges = {
    createProducts: 0,
    reuseProducts: 0,
    updateProducts: 0,
    createPrices: 0,
    reusePrices: 0,
    createLinks: 0,
    reuseLinks: 0,
    deactivatePrices: 0,
    deactivateLinks: 0,
  };
  let productsReused = 0;
  let productsCreated = 0;
  let linksReused = 0;
  let linksCreated = 0;
  let stalePricesDeactivated = 0;
  let staleLinksDeactivated = 0;
  const allActiveLinksSnapshot = DRY_RUN ? await listAllActivePaymentLinks() : null;

  console.log(`\nProcessing ${items.length} registry item${items.length === 1 ? '' : 's'}…`);
  console.log(`  Stripe key mode:      ${KEY_MODE}`);
  if (CLEANUP_MODE) console.log(`  cleanup mode:         ${DRY_RUN ? 'DRY RUN (no Stripe writes)' : 'APPLY'}`);
  if (KEEP_STALE) console.log('  stale deactivation: OFF (--keep-stale / KEEP_STALE=true)');
  if (!WIRE_PAGE) console.log('  page wiring:        OFF (--no-wire / WIRE_PAGE=false)');
  if (KEY_MODE === 'live' && DRY_RUN) {
    console.log('  live-key guard:      active (use --apply to make changes)');
  }
  if (KEY_MODE === 'live' && CLEANUP_MODE && !APPLY_MODE) {
    console.log('  live-key writes:     blocked in dry-run mode');
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const label = item && item.slug ? item.slug : '(unknown)';
    console.log(`\n[${i + 1}/${items.length}] ${label}`);

    try {
      validateItem(item);

      if (item.active === false) {
        console.log('   ⤫  Skipping (active=false)');
        skipped.push(item.slug);
        continue;
      }

      const { product, reused: productReused, action: productAction } = await upsertProduct(item, { dryRun: DRY_RUN });
      if (!DRY_RUN) {
        if (productReused) productsReused++; else productsCreated++;
      }
      if (productAction === 'create_product') plannedChanges.createProducts++;
      if (productAction === 'reuse_product') plannedChanges.reuseProducts++;
      if (productAction === 'update_product') plannedChanges.reuseProducts++;
      if (productAction === 'update_product') plannedChanges.updateProducts++;

      const { price, stalePrices, action: priceAction } = await upsertPrice(product, item, { dryRun: DRY_RUN });
      const { link, reused: linkReused, staleLinks, action: linkAction } = await upsertPaymentLink(product, price, item, {
        dryRun: DRY_RUN,
        allActiveLinks: allActiveLinksSnapshot,
      });
      if (!DRY_RUN) {
        if (linkReused) linksReused++; else linksCreated++;
      }
      if (priceAction === 'create_price') plannedChanges.createPrices++;
      if (priceAction === 'reuse_price') plannedChanges.reusePrices++;
      if (linkAction === 'create_payment_link') plannedChanges.createLinks++;
      if (linkAction === 'reuse_payment_link') plannedChanges.reuseLinks++;

      if (!KEEP_STALE) {
        if (DRY_RUN) {
          if (stalePrices.length || staleLinks.length) {
            console.log(`   ~  Would deactivate stale: ${stalePrices.length} price(s), ${staleLinks.length} link(s)`);
          }
          plannedChanges.deactivatePrices += stalePrices.length;
          plannedChanges.deactivateLinks += staleLinks.length;
        } else {
          stalePricesDeactivated += await deactivatePrices(stalePrices);
          staleLinksDeactivated += await deactivatePaymentLinks(staleLinks);
        }
      } else if (stalePrices.length || staleLinks.length) {
        console.log(`   ·  Stale kept: ${stalePrices.length} price(s), ${staleLinks.length} link(s)`);
      }

      console.log(`   ✓  ${DRY_RUN ? 'Planned' : 'Done'}: ${link.url || '(link will be created)'}`);
      successes.push(
        toFrontEndObject(item, product, price, link, {
          reused_product: productReused,
          reused_payment_link: linkReused,
        })
      );
    } catch (err) {
      const message = err && err.message ? err.message : String(err);
      console.error(`   ✗  Failed: ${message}`);
      failures.push({ slug: label, error: message });
    }
  }

  if (!DRY_RUN) {
    await fs.writeFile(OUTPUT_JSON, JSON.stringify(successes, null, 2) + '\n', 'utf8');
    await fs.writeFile(OUTPUT_CSV, toCSV(successes), 'utf8');
  }

  // Wire the page with the final URLs.
  let wireStats = { updated: 0, unchanged: 0, missing: 0 };
  if (!DRY_RUN && successes.length) {
    console.log('\n──────────── Wiring page ────────────');
    wireStats = await wirePage(successes);
  }

  console.log(`\n──────────── ${DRY_RUN ? 'Dry-Run Summary' : 'Summary'} ────────────`);
  console.log(`Items processed:                 ${items.length}`);
  if (DRY_RUN) {
    console.log(`Would create products:           ${plannedChanges.createProducts}`);
    console.log(`Would reuse products:            ${plannedChanges.reuseProducts}`);
    console.log(`Would update products:           ${plannedChanges.updateProducts}`);
    console.log(`Would create prices:             ${plannedChanges.createPrices}`);
    console.log(`Would reuse prices:              ${plannedChanges.reusePrices}`);
    console.log(`Would create payment links:      ${plannedChanges.createLinks}`);
    console.log(`Would reuse payment links:       ${plannedChanges.reuseLinks}`);
    console.log(`Would deactivate stale prices:   ${plannedChanges.deactivatePrices}`);
    console.log(`Would deactivate stale links:    ${plannedChanges.deactivateLinks}`);
  }
  console.log(`Products created:                ${productsCreated}`);
  console.log(`Products reused:                 ${productsReused}`);
  console.log(`Payment Links created:           ${linksCreated}`);
  console.log(`Payment Links reused:            ${linksReused}`);
  console.log(`Stale Prices deactivated:        ${stalePricesDeactivated}`);
  console.log(`Stale Payment Links deactivated: ${staleLinksDeactivated}`);
  console.log(`Page anchors updated:            ${wireStats.updated}`);
  console.log(`Page anchors unchanged:          ${wireStats.unchanged}`);
  if (wireStats.missing) console.log(`Page anchors missing:            ${wireStats.missing}`);
  console.log(`Skipped (active=false):          ${skipped.length}`);
  console.log(`Failed items:                    ${failures.length}`);
  if (failures.length) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  - ${f.slug}: ${f.error}`);
  }
  if (!DRY_RUN) {
    console.log(`\nJSON output: ${OUTPUT_JSON}`);
    console.log(`CSV output:  ${OUTPUT_CSV}`);
  } else {
    console.log('\nDry-run made no file writes and no Stripe mutations.');
    console.log('Re-run with --apply to execute the planned changes.');
  }
  console.log('Done.\n');

  if (failures.length > 0 && successes.length === 0) process.exit(1);
}

main().catch((err) => {
  console.error('\nFatal error:', err && err.message ? err.message : err);
  process.exit(1);
});
