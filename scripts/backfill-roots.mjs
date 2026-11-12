/**
 * Backfill: replace the naive roots written by the first DGLAI seeding run with the
 * improved estimate from src/lib/utils/amazigh-roots.ts.
 *
 * Safety rules:
 *  - Only definitions whose current `attributes.root` equals the legacy naive formula
 *    for that headword are touched, so roots typed in by humans are never overwritten.
 *  - `--dry-run` reports what would change without writing.
 *  - Keyset pagination on definitions.id (primary key) keeps every query index-backed,
 *    so it works with or without the search_engine_v2 migration applied.
 *
 * Usage:
 *   node --experimental-strip-types scripts/backfill-roots.mjs --dry-run
 *   node --experimental-strip-types scripts/backfill-roots.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { estimateRoot, legacyNaiveRoot } from '../src/lib/utils/amazigh-roots.ts';

const dryRun = process.argv.includes('--dry-run');

let url = '';
let key = '';
for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const idx = line.indexOf('=');
  if (idx <= 0) continue;
  const k = line.slice(0, idx).trim();
  const v = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
  if (k === 'PUBLIC_SUPABASE_URL') url = v;
  if (k === 'SUPABASE_SERVICE_ROLE_KEY') key = v;
}
if (!url || !key) {
  console.error('Missing PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const PAGE = 1000; // PostgREST's default max rows per response

// `definition_search` is a generated column (see search_engine_v2 migration); it can't be
// written, so strip it from rows we send back.
const withoutGenerated = (def) => {
  const { definition_search: _ignored, ...row } = def;
  return row;
};

let lastId = 0;
let scanned = 0;
let changed = 0;
let removed = 0;
let skippedHuman = 0;
const sample = [];

for (;;) {
  const { data: defs, error } = await supabase
    .from('definitions')
    .select('*')
    .gt('id', lastId)
    .order('id', { ascending: true })
    .limit(PAGE);
  if (error) {
    console.error('Fetch failed:', error);
    process.exit(1);
  }
  if (!defs || defs.length === 0) break;
  lastId = defs[defs.length - 1].id;

  const headwordIds = [...new Set(defs.map((d) => d.headword_id).filter(Boolean))];
  const latinById = new Map();
  for (let i = 0; i < headwordIds.length; i += 200) {
    const { data: hws, error: hErr } = await supabase
      .from('headwords')
      .select('id, script_latin')
      .in('id', headwordIds.slice(i, i + 200));
    if (hErr) {
      console.error('Headword fetch failed:', hErr);
      process.exit(1);
    }
    for (const h of hws ?? []) latinById.set(h.id, h.script_latin);
  }

  const updates = [];
  for (const def of defs) {
    scanned++;
    const attrs = typeof def.attributes === 'string' ? JSON.parse(def.attributes) : def.attributes ?? {};
    if (!attrs.root) continue;
    const latin = latinById.get(def.headword_id);
    if (attrs.root !== legacyNaiveRoot(latin)) {
      skippedHuman++;
      continue;
    }
    const next = { ...attrs };
    delete next.root;
    delete next.root_estimated;
    const estimate = estimateRoot(latin, attrs.part_of_speech);
    if (estimate) {
      next.root = estimate;
      next.root_estimated = true;
      changed++;
      if (sample.length < 12) sample.push(`${latin}: ${attrs.root} -> ${estimate}`);
    } else {
      removed++;
    }
    updates.push({ ...withoutGenerated(def), attributes: next });
  }

  if (!dryRun && updates.length > 0) {
    for (let i = 0; i < updates.length; i += 500) {
      const { error: upErr } = await supabase
        .from('definitions')
        .upsert(updates.slice(i, i + 500), { onConflict: 'id' });
      if (upErr) {
        console.error(`Upsert failed near definition id ${lastId}:`, upErr);
        process.exit(1);
      }
    }
  }

  console.log(`through definition id ${lastId} | scanned ${scanned} | re-rooted ${changed} | root removed ${removed}`);
}

console.log('==============================');
console.log(dryRun ? 'DRY RUN (nothing written)' : 'Backfill complete');
console.log({ scanned, reRooted: changed, rootRemoved: removed, skippedHumanRoots: skippedHuman });
console.log('Examples:\n  ' + sample.join('\n  '));
