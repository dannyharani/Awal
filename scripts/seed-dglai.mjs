import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
// Run with:
//   Fresh seed: node --experimental-strip-types scripts/seed-dglai.mjs
//   In-place sync/update: node --experimental-strip-types scripts/seed-dglai.mjs --sync
import { estimateRoot } from '../src/lib/utils/amazigh-roots.ts';
import { tifinaghToLatin } from '../src/lib/utils/amazigh.ts';

// Read .env securely
const envLines = fs.readFileSync('.env', 'utf8').split(/\r?\n/);
let supabaseUrl = '';
let supabaseServiceKey = '';
for (const line of envLines) {
  const idx = line.indexOf('=');
  if (idx > 0) {
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (k === 'PUBLIC_SUPABASE_URL') supabaseUrl = v;
    if (k === 'SUPABASE_SERVICE_ROLE_KEY') supabaseServiceKey = v;
  }
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Role Key in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

// Locate dataset
const staticFiles = fs.readdirSync('static');
const dglaiFileName = staticFiles.find((f) => f.includes('dglai'));
if (!dglaiFileName) {
  console.error('Could not find dglai dataset in static/');
  process.exit(1);
}

const rawDglai = JSON.parse(fs.readFileSync(path.join('static', dglaiFileName), 'utf8'));
const rawEntries = Object.values(rawDglai);
console.log(`Loaded ${rawEntries.length} entries from ${dglaiFileName}.`);

// Load English translations cache
let translations = {};
const cachePath = path.join('data', 'dglai_translations_en.json');
if (fs.existsSync(cachePath)) {
  translations = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  console.log(`Loaded ${Object.keys(translations).length} English translations from cache.`);
} else {
  console.log(
    'No pre-computed English translations found. Run `python scripts/translate-dglai.py` first.'
  );
}

const TIFINAGH_RE = /^[\u2D30-\u2D7F]/;
const ANY_TIFINAGH_RE = /[\u2D30-\u2D7F]/;
const PURE_TIFINAGH_RE = /^[\u2D30-\u2D7F\s,]+$/;
const LATIN_LETTER_RE = /[A-Za-zÀ-ÖØ-öø-ÿŒœ]/;
const ARABIC_LETTER_RE = /[\u0600-\u06FF]/;
const TRAILING_EMPLOI_RE = /\s*\bEmploi\b\s*$/i;

export function mapGrammar(rawGrammar, headwordLatin = '') {
  if (!rawGrammar) return { part_of_speech: 'noun' };
  let g = rawGrammar.trim();
  const attrs = {};

  // Extract bracketed variant/cross-ref note like "[msakam ] verbe"
  const bracketMatch = g.match(/^\[([^\]]+)\]\s*(.*)$/);
  if (bracketMatch) {
    const variant = bracketMatch[1].trim();
    g = bracketMatch[2].trim();
    if (variant && variant.toLowerCase() !== headwordLatin.toLowerCase()) {
      attrs.variant = variant;
    }
  }

  const lower = g.toLowerCase();
  if (!lower || lower === '?' || lower === 'foc. ?') {
    attrs.part_of_speech = 'noun';
    return attrs;
  }

  // Gender
  if (lower.includes('masculin')) attrs.gender = 'masculine';
  else if (lower.includes('féminin')) attrs.gender = 'feminine';

  // Grammatical number
  if (lower.includes('pluriel')) attrs.grammatical_number = 'plural';
  else if (lower.includes('collectif')) attrs.grammatical_number = 'collective';
  else if (lower.includes('nom masculin') || lower.includes('nom féminin')) {
    attrs.grammatical_number = 'singular';
  }

  // Part of speech
  if (lower.includes('nom') && lower.includes('adjectif')) {
    attrs.part_of_speech = 'noun / adjective';
  } else if (lower.includes('nom') && lower.includes('adverbe')) {
    attrs.part_of_speech = 'noun / adverb';
  } else if (lower.includes('nom') && lower.includes('quantifieur')) {
    attrs.part_of_speech = 'noun';
  } else if (lower.includes('nom')) {
    attrs.part_of_speech = 'noun';
  } else if (lower.includes('verbe')) {
    attrs.part_of_speech = 'verb';
  } else if (lower.includes('adjectif')) {
    attrs.part_of_speech = 'adjective';
  } else if (lower.includes('adverbe')) {
    attrs.part_of_speech = 'adverb';
  } else if (lower.includes('préposition')) {
    attrs.part_of_speech = 'preposition';
  } else if (
    lower.includes('pronom') ||
    lower.includes('pronon') ||
    lower.includes('démonstratif')
  ) {
    attrs.part_of_speech = 'pronoun';
  } else if (lower.includes('interrogat')) {
    attrs.part_of_speech = 'interrogative';
  } else if (
    lower.includes('conjonction') ||
    lower.includes('subordonnant') ||
    lower.includes('subodonnant') ||
    lower.includes('coordonnant')
  ) {
    attrs.part_of_speech = 'conjunction';
  } else if (
    lower.includes('vocatif') ||
    lower.includes('interjection') ||
    lower.includes('onomatop')
  ) {
    attrs.part_of_speech = 'interjection';
  } else if (lower.includes('déterminant') || lower.includes('quantifieur')) {
    attrs.part_of_speech = 'determiner';
  } else if (lower.includes('numéral')) {
    attrs.part_of_speech = 'numeral';
  } else if (
    lower.includes('préverbe') ||
    lower.includes('particule') ||
    lower.includes('présentatif')
  ) {
    attrs.part_of_speech = 'particle';
  } else {
    attrs.part_of_speech = 'noun';
  }

  return attrs;
}

export function formatConstructState(rawCs) {
  if (!rawCs) return null;
  const trimmed = String(rawCs).trim();
  if (!trimmed) return null;
  if (ANY_TIFINAGH_RE.test(trimmed) && !LATIN_LETTER_RE.test(trimmed)) {
    const latinCs = tifinaghToLatin(trimmed).replace(/\s+/g, ' ').trim();
    if (latinCs && latinCs !== trimmed) {
      return `${latinCs} (${trimmed})`;
    }
  }
  return trimmed;
}

export function parseExampleSentence(rawStr) {
  if (typeof rawStr !== 'string') return null;
  const cleaned = rawStr.replace(TRAILING_EMPLOI_RE, '').trim();
  if (!TIFINAGH_RE.test(cleaned)) return null;

  const firstLatinIdx = cleaned.search(LATIN_LETTER_RE);
  const firstArabicIdx = cleaned.search(ARABIC_LETTER_RE);

  let splitTifIdx = -1;
  if (firstLatinIdx !== -1 && (firstArabicIdx === -1 || firstLatinIdx < firstArabicIdx)) {
    splitTifIdx = firstLatinIdx;
  } else if (firstArabicIdx !== -1) {
    splitTifIdx = firstArabicIdx;
  } else {
    return null;
  }

  const tif = cleaned.slice(0, splitTifIdx).trim();
  const rest = cleaned.slice(splitTifIdx).trim();
  if (!tif || !rest) return null;

  const arIdxInRest = rest.search(ARABIC_LETTER_RE);
  const fr = (arIdxInRest === -1 ? rest : rest.slice(0, arIdxInRest)).trim();
  const ar = (arIdxInRest === -1 ? '' : rest.slice(arIdxInRest)).trim();

  if (!fr && !ar) return null;

  const latinSentence = tifinaghToLatin(tif).replace(/\s+/g, ' ').trim();
  const sentence_text =
    latinSentence && latinSentence !== tif ? `${latinSentence} (${tif})` : tif;

  const en = fr ? translateFrToEn(fr) : '';
  const translation_text = [en, fr, ar].filter(Boolean).join(' | ');

  return {
    tif,
    latinSentence,
    fr,
    ar,
    en,
    sentence_text,
    translation_text
  };
}

function translateFrToEn(frText) {
  const clean = (frText || '').trim();
  if (!clean || clean === '?') return '';
  if (clean.toLowerCase() === 'un') return 'one, a (masculine)';
  if (clean.toLowerCase() === 'une') return 'one, a (feminine)';
  return (translations[clean] || '').trim();
}

function dedupStrings(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const clean = String(item || '').trim();
    if (!clean || clean === '?') continue;
    const key = clean.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(clean);
    }
  }
  return out;
}

export function extractEntryData(raw, latin, tif) {
  const grammarAttrs = mapGrammar(raw.grammar, latin);
  const root = estimateRoot(latin, grammarAttrs.part_of_speech);
  if (root) {
    grammarAttrs.root = root;
    grammarAttrs.root_estimated = true;
  }
  const formattedCs = formatConstructState(raw.construct_state);
  if (formattedCs) {
    grammarAttrs.construct_state = formattedCs;
  }
  grammarAttrs.source = 'dglai';

  const rawFr = raw.meaning_fr;
  const rawAr = raw.meaning_ar;
  let frList = (Array.isArray(rawFr) ? rawFr : rawFr ? [rawFr] : [])
    .map((s) => String(s).trim())
    .filter(Boolean);
  let arList = (Array.isArray(rawAr) ? rawAr : rawAr ? [rawAr] : [])
    .map((s) => String(s).trim())
    .filter(Boolean);

  // Fix the 23 entries where meaning_fr and meaning_ar are swapped in raw JSON
  if (
    frList.length > 0 &&
    ARABIC_LETTER_RE.test(frList[0]) &&
    arList.length > 0 &&
    LATIN_LETTER_RE.test(arList[0])
  ) {
    [frList, arList] = [arList, frList];
  }

  // Merge pure-Tifinagh prefix fragments onto the following example sentence
  const mergedFr = [];
  let pendingTif = [];
  for (const item of frList) {
    if (PURE_TIFINAGH_RE.test(item)) {
      pendingTif.push(item);
    } else if (pendingTif.length > 0 && TIFINAGH_RE.test(item)) {
      mergedFr.push([...pendingTif, item].join(', '));
      pendingTif = [];
    } else {
      pendingTif = [];
      mergedFr.push(item);
    }
  }

  const sensesFrRaw = [];
  const examples = [];
  for (const item of mergedFr) {
    const ex = parseExampleSentence(item);
    if (ex) {
      examples.push(ex);
    } else if (!PURE_TIFINAGH_RE.test(item)) {
      sensesFrRaw.push(item);
    }
  }

  const sensesFr = dedupStrings(sensesFrRaw);
  const sensesAr = dedupStrings(arList);

  let sensesEn = dedupStrings(sensesFr.map((s) => translateFrToEn(s)));
  if (sensesEn.length === 0 && sensesAr.length > 0) {
    sensesEn = dedupStrings(sensesAr.map((a) => (translations[a] || '').trim()));
  }

  const fullEn = sensesEn.join(' ; ').slice(0, 500);
  const fullFr = sensesFr.join(' ; ').slice(0, 500);
  const fullAr = sensesAr.join(' ؛ ').slice(0, 500);

  return {
    attributes: grammarAttrs,
    fullEn,
    fullFr,
    fullAr,
    examples
  };
}

function slugify(text) {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[()]/g, '')
      .replace(/[^a-z0-9čǧḍṭẓḥṣṛɣɛ-]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'word'
  );
}

function buildProcessedEntries() {
  const headwordMap = new Map();
  const slugCounts = new Map();
  // Also track legacy slugs (where empty latin became word, word-1, ..., word-19) so --sync can match them
  let legacyWordCount = 0;

  for (const entry of rawEntries) {
    const rawLatin = (entry.latin || '').trim();
    const tif = (entry.tifinagh || '').trim();
    if (!rawLatin && !tif) continue;

    const latin = rawLatin || tifinaghToLatin(tif).trim();
    let legacySlug = null;
    if (!rawLatin && tif) {
      legacySlug = legacyWordCount === 0 ? 'word' : `word-${legacyWordCount}`;
      legacyWordCount++;
    }

    const baseSlug = slugify(latin || tif);
    const count = slugCounts.get(baseSlug) || 0;
    slugCounts.set(baseSlug, count + 1);
    const slug = count === 0 ? baseSlug : `${baseSlug}-${count}`;

    headwordMap.set(entry.id, {
      dglai_id: entry.id,
      slug,
      legacySlug,
      script_latin: latin,
      script_tifinagh: tif,
      raw: entry
    });
  }

  return Array.from(headwordMap.values());
}

async function fetchAllRows(table, selectCols, filterFn = null) {
  const pageSize = 1000;
  let from = 0;
  const all = [];
  while (true) {
    let q = supabase.from(table).select(selectCols).order('id', { ascending: true }).range(from, from + pageSize - 1);
    if (filterFn) q = filterFn(q);
    const { data, error } = await q;
    if (error) throw new Error(`Failed fetching ${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

async function runSync(processedList, standardDialect, contributorId) {
  console.log('--- Running In-Place DGLAI Sync (--sync) ---');

  console.log('1. Fetching existing headwords...');
  const existingHeadwords = await fetchAllRows('headwords', 'id, slug, script_latin, script_tifinagh');
  const hwBySlug = new Map(existingHeadwords.map((h) => [h.slug, h]));
  console.log(`   Loaded ${existingHeadwords.length} headwords from DB.`);

  // Fix the 20 legacy headwords that had empty script_latin and slug "word", "word-1", ...
  let fixedHeadwordsCount = 0;
  for (const item of processedList) {
    let hw =
      (item.legacySlug ? hwBySlug.get(item.legacySlug) : null) || hwBySlug.get(item.slug);
    if (hw && (!hw.script_latin || hw.slug === item.legacySlug)) {
      let targetSlug = item.slug;
      if (hwBySlug.has(targetSlug) && hwBySlug.get(targetSlug).id !== hw.id) {
        targetSlug = `${item.slug}-${hw.id}`;
      }
      const { error } = await supabase
        .from('headwords')
        .update({ script_latin: item.script_latin, slug: targetSlug })
        .eq('id', hw.id);
      if (error) {
        console.error(`   Error updating headword ${hw.id}:`, error.message);
      } else {
        hwBySlug.delete(hw.slug);
        hw.script_latin = item.script_latin;
        hw.slug = targetSlug;
        hwBySlug.set(targetSlug, hw);
        item.slug = targetSlug;
        fixedHeadwordsCount++;
      }
    }
  }
  console.log(`   Fixed ${fixedHeadwordsCount} headwords that were missing script_latin/slug.`);

  console.log('2. Fetching existing DGLAI definitions...');
  const existingDefs = await fetchAllRows(
    'definitions',
    'id, headword_id, language_code, definition_text, attributes',
    (q) => q.eq('user_id', contributorId)
  );
  console.log(`   Loaded ${existingDefs.length} DGLAI definitions from DB.`);

  const defsByHwAndLang = new Map();
  for (const d of existingDefs) {
    defsByHwAndLang.set(`${d.headword_id}:${d.language_code}`, d);
  }

  const defsToUpdate = [];
  const defsToInsert = [];
  const allExamples = [];

  for (const item of processedList) {
    const hw = hwBySlug.get(item.slug) || (item.legacySlug ? hwBySlug.get(item.legacySlug) : null);
    if (!hw) continue;

    const { attributes, fullEn, fullFr, fullAr, examples } = extractEntryData(
      item.raw,
      item.script_latin,
      item.script_tifinagh
    );
    const attrJson = JSON.stringify(attributes);

    const targetLangs = [
      { lang: 'en', text: fullEn },
      { lang: 'fr', text: fullFr },
      { lang: 'ar', text: fullAr }
    ];

    for (const { lang, text } of targetLangs) {
      if (!text) continue;
      const existing = defsByHwAndLang.get(`${hw.id}:${lang}`);
      if (existing) {
        const existingAttrJson = JSON.stringify(existing.attributes || {});
        if (existing.definition_text !== text || existingAttrJson !== attrJson) {
          defsToUpdate.push({
            id: existing.id,
            headword_id: hw.id,
            user_id: contributorId,
            dialect_id: standardDialect.id,
            definition_text: text,
            language_code: lang,
            is_verified: true,
            attributes
          });
        }
      } else {
        defsToInsert.push({
          headword_id: hw.id,
          user_id: contributorId,
          dialect_id: standardDialect.id,
          definition_text: text,
          language_code: lang,
          is_verified: true,
          attributes
        });
      }
    }

    for (const ex of examples) {
      allExamples.push({
        headword_id: hw.id,
        sentence_text: ex.sentence_text,
        translation_text: ex.translation_text
      });
    }
  }

  console.log(
    `3. Definitions to update in-place: ${defsToUpdate.length} | New definitions to insert: ${defsToInsert.length}`
  );

  const UPSERT_BATCH = 500;
  let updatedCount = 0;
  for (let i = 0; i < defsToUpdate.length; i += UPSERT_BATCH) {
    const batch = defsToUpdate.slice(i, i + UPSERT_BATCH);
    const { error } = await supabase.from('definitions').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`   Error upserting definition batch ${i}:`, error.message);
    } else {
      updatedCount += batch.length;
    }
    if ((i + UPSERT_BATCH) % 2500 === 0 || i + UPSERT_BATCH >= defsToUpdate.length) {
      console.log(`   Updated ${updatedCount}/${defsToUpdate.length} definitions...`);
    }
  }

  if (defsToInsert.length > 0) {
    const { data: inserted, error } = await supabase
      .from('definitions')
      .insert(defsToInsert)
      .select('id, headword_id, language_code');
    if (error) {
      console.error('   Error inserting new definitions:', error.message);
    } else {
      for (const d of inserted || []) {
        defsByHwAndLang.set(`${d.headword_id}:${d.language_code}`, d);
      }
      console.log(`   Inserted ${inserted?.length || 0} previously missing definitions.`);
    }
  }

  console.log(`4. Refreshing ${allExamples.length} DGLAI example sentences with English translations...`);
  const { error: delExErr } = await supabase
    .from('examples')
    .delete()
    .eq('user_id', contributorId);
  if (delExErr) {
    throw new Error(`Failed deleting old DGLAI examples: ${delExErr.message}`);
  }

  const exampleRowsToInsert = [];
  for (const ex of allExamples) {
    const primaryDef =
      defsByHwAndLang.get(`${ex.headword_id}:en`) ||
      defsByHwAndLang.get(`${ex.headword_id}:fr`) ||
      defsByHwAndLang.get(`${ex.headword_id}:ar`);
    if (!primaryDef) continue;
    exampleRowsToInsert.push({
      definition_id: primaryDef.id,
      user_id: contributorId,
      sentence_text: ex.sentence_text,
      translation_text: ex.translation_text
    });
  }

  let insertedExamples = 0;
  for (let i = 0; i < exampleRowsToInsert.length; i += UPSERT_BATCH) {
    const batch = exampleRowsToInsert.slice(i, i + UPSERT_BATCH);
    const { error } = await supabase.from('examples').insert(batch);
    if (error) {
      console.error(`   Error inserting examples batch ${i}:`, error.message);
    } else {
      insertedExamples += batch.length;
    }
  }

  console.log('====================================');
  console.log('DGLAI Sync completed successfully!');
  console.log(`Headwords fixed (Latin/Slug): ${fixedHeadwordsCount}`);
  console.log(`Definitions updated in-place: ${updatedCount}`);
  console.log(`New definitions inserted:     ${defsToInsert.length}`);
  console.log(`Examples refreshed with EN:   ${insertedExamples}`);
  console.log('====================================');
}

async function runSeed() {
  console.log('--- Starting Asafu DGLAI Seeder ---');

  const { data: dialects, error: dErr } = await supabase.from('dialects').select('id, name');
  if (dErr || !dialects || dialects.length === 0) {
    throw new Error('Failed to fetch dialects from database: ' + (dErr?.message || 'Empty list'));
  }

  const standardDialect =
    dialects.find((d) => d.name.toLowerCase().includes('standard')) || dialects[0];
  console.log(`Using target dialect: "${standardDialect.name}" (ID: ${standardDialect.id})`);

  const { data: importer } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', 'dglaiimport')
    .maybeSingle();
  if (!importer) {
    throw new Error(
      'Import account "dglaiimport" not found. Run scripts/attribute-dglai-import.mjs first to create it.'
    );
  }
  const contributorId = importer.id;
  console.log(`Attributing imported words to: ${importer.username} (${contributorId})`);

  const processedList = buildProcessedEntries();
  console.log(`Prepared ${processedList.length} headwords.`);

  if (process.argv.includes('--sync')) {
    await runSync(processedList, standardDialect, contributorId);
    return;
  }

  const { count: existingCount } = await supabase
    .from('headwords')
    .select('*', { count: 'exact', head: true });
  if ((existingCount ?? 0) > 1000 && !process.argv.includes('--force')) {
    console.error(
      `Database already holds ${existingCount} headwords; refusing full seed (would duplicate definitions). ` +
        'Use `--sync` to update existing rows in-place, or `--force` if you really mean it.'
    );
    process.exit(1);
  }

  const BATCH_SIZE = 100;
  let totalHeadwordsInserted = 0;
  let totalDefinitionsInserted = 0;
  let totalExamplesInserted = 0;

  for (let i = 0; i < processedList.length; i += BATCH_SIZE) {
    const chunk = processedList.slice(i, i + BATCH_SIZE);

    const headwordRows = chunk.map((c) => ({
      slug: c.slug,
      script_latin: c.script_latin,
      script_tifinagh: c.script_tifinagh
    }));

    const { data: insertedHeadwords, error: hErr } = await supabase
      .from('headwords')
      .upsert(headwordRows, { onConflict: 'slug' })
      .select('id, slug');

    if (hErr) {
      console.error(`Error inserting headword chunk ${i}-${i + BATCH_SIZE}:`, hErr);
      continue;
    }

    totalHeadwordsInserted += insertedHeadwords?.length || 0;
    const idBySlug = new Map(insertedHeadwords.map((h) => [h.slug, h.id]));

    const defRows = [];
    const rawExamplesToInsert = [];

    for (const c of chunk) {
      const headwordId = idBySlug.get(c.slug);
      if (!headwordId) continue;

      const { attributes, fullEn, fullFr, fullAr, examples } = extractEntryData(
        c.raw,
        c.script_latin,
        c.script_tifinagh
      );

      for (const [lang, text] of [
        ['en', fullEn],
        ['fr', fullFr],
        ['ar', fullAr]
      ]) {
        if (text) {
          defRows.push({
            headword_id: headwordId,
            user_id: contributorId,
            dialect_id: standardDialect.id,
            definition_text: text,
            language_code: lang,
            is_verified: true,
            attributes
          });
        }
      }

      for (const ex of examples) {
        rawExamplesToInsert.push({
          headword_id: headwordId,
          sentence_text: ex.sentence_text,
          translation_text: ex.translation_text
        });
      }
    }

    if (defRows.length > 0) {
      const { data: insertedDefs, error: defErr } = await supabase
        .from('definitions')
        .insert(defRows)
        .select('id, headword_id, language_code');

      if (defErr) {
        console.error(`Error inserting definitions for chunk ${i}:`, defErr);
      } else {
        totalDefinitionsInserted += insertedDefs?.length || 0;

        if (rawExamplesToInsert.length > 0 && insertedDefs && insertedDefs.length > 0) {
          const defIdMap = new Map();
          for (const d of insertedDefs) {
            if (!defIdMap.has(d.headword_id) || d.language_code === 'en') {
              defIdMap.set(d.headword_id, d.id);
            }
          }

          const exampleRows = [];
          for (const ex of rawExamplesToInsert) {
            const defId = defIdMap.get(ex.headword_id);
            if (defId) {
              exampleRows.push({
                definition_id: defId,
                user_id: contributorId,
                sentence_text: ex.sentence_text,
                translation_text: ex.translation_text
              });
            }
          }

          if (exampleRows.length > 0) {
            const { error: exErr } = await supabase.from('examples').insert(exampleRows);
            if (!exErr) totalExamplesInserted += exampleRows.length;
          }
        }
      }
    }

    if ((i + BATCH_SIZE) % 500 === 0 || i + BATCH_SIZE >= processedList.length) {
      console.log(
        `[${Math.min(i + BATCH_SIZE, processedList.length)}/${processedList.length}] Headwords: ${totalHeadwordsInserted} | Definitions: ${totalDefinitionsInserted} | Examples: ${totalExamplesInserted}`
      );
    }
  }

  console.log('====================================');
  console.log('Seeding finished successfully!');
  console.log(`Total Headwords Inserted/Upserted: ${totalHeadwordsInserted}`);
  console.log(`Total Definitions Inserted: ${totalDefinitionsInserted}`);
  console.log(`Total Examples Inserted: ${totalExamplesInserted}`);
  console.log('====================================');
}

runSeed().catch((err) => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
