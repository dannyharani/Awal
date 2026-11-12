import json
import re
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

DATASET_FILE = None
static_files = list(Path("static").glob("*dglai*"))
if static_files:
    DATASET_FILE = static_files[0]
else:
    raise FileNotFoundError("Could not find dglai dataset in static/")

CACHE_FILE = Path("data/dglai_translations_en.json")
CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)

TIFINAGH_RE = re.compile(r"^[\u2D30-\u2D7F]")
PURE_TIFINAGH_RE = re.compile(r"^[\u2D30-\u2D7F\s,]+$")
LATIN_LETTER_RE = re.compile(r"[A-Za-zÀ-ÖØ-öø-ÿŒœ]")
ARABIC_LETTER_RE = re.compile(r"[\u0600-\u06FF]")
TRAILING_EMPLOI_RE = re.compile(r"\s*\bEmploi\b\s*$", re.IGNORECASE)


def parse_example_line(raw_str: str):
    if not isinstance(raw_str, str):
        return None
    cleaned = TRAILING_EMPLOI_RE.sub("", raw_str).strip()
    if not TIFINAGH_RE.match(cleaned):
        return None

    m_lat = LATIN_LETTER_RE.search(cleaned)
    m_ar = ARABIC_LETTER_RE.search(cleaned)

    split_tif_idx = -1
    if m_lat and (not m_ar or m_lat.start() < m_ar.start()):
        split_tif_idx = m_lat.start()
    elif m_ar:
        split_tif_idx = m_ar.start()
    else:
        return None

    tif = cleaned[:split_tif_idx].strip()
    rest = cleaned[split_tif_idx:].strip()
    if not tif or not rest:
        return None

    m_ar_rest = ARABIC_LETTER_RE.search(rest)
    if m_ar_rest:
        fr = rest[: m_ar_rest.start()].strip()
        ar = rest[m_ar_rest.start() :].strip()
    else:
        fr = rest.strip()
        ar = ""

    if not fr and not ar:
        return None
    return {"tif": tif, "fr": fr, "ar": ar}


def normalize_entry_meanings(entry: dict):
    raw_fr = entry.get("meaning_fr")
    raw_ar = entry.get("meaning_ar")
    fr_list = [str(s).strip() for s in (raw_fr if isinstance(raw_fr, list) else [raw_fr] if raw_fr else []) if str(s).strip()]
    ar_list = [str(s).strip() for s in (raw_ar if isinstance(raw_ar, list) else [raw_ar] if raw_ar else []) if str(s).strip()]

    # Fix the 23 entries where meaning_fr and meaning_ar are swapped in the raw JSON
    if fr_list and ARABIC_LETTER_RE.match(fr_list[0]) and ar_list and LATIN_LETTER_RE.search(ar_list[0]):
        fr_list, ar_list = ar_list, fr_list

    # Merge pure-Tifinagh prefix fragments onto the following example sentence
    merged_fr = []
    pending_tif = []
    for item in fr_list:
        if PURE_TIFINAGH_RE.match(item):
            pending_tif.append(item)
        elif pending_tif and TIFINAGH_RE.match(item):
            merged_fr.append(", ".join([*pending_tif, item]))
            pending_tif = []
        else:
            pending_tif = []
            merged_fr.append(item)

    senses_fr = []
    examples = []
    for item in merged_fr:
        ex = parse_example_line(item)
        if ex:
            examples.append(ex)
        elif not PURE_TIFINAGH_RE.match(item):
            senses_fr.append(item)

    return senses_fr, ar_list, examples


print(f"Reading dataset from {DATASET_FILE}...")
with open(DATASET_FILE, "r", encoding="utf-8") as f:
    raw_data = json.load(f)

entries = list(raw_data.values())
print(f"Loaded {len(entries)} entries.")

# Collect all unique French strings (all definition senses + all example translations)
unique_fr: dict[str, str | None] = {}
unique_ar_fallback: dict[str, str | None] = {}

for entry in entries:
    senses_fr, ar_list, examples = normalize_entry_meanings(entry)
    for sense in senses_fr:
        if sense and sense not in unique_fr:
            unique_fr[sense] = None
    for ex in examples:
        if ex["fr"] and ex["fr"] not in unique_fr:
            unique_fr[ex["fr"]] = None
    if not senses_fr and ar_list:
        for ar_sense in ar_list:
            if ar_sense and ar_sense not in unique_ar_fallback:
                unique_ar_fallback[ar_sense] = None

print(
    f"Found {len(unique_fr)} unique French texts (all definition senses + example sentences) "
    f"and {len(unique_ar_fallback)} Arabic-only fallback texts."
)

if CACHE_FILE.exists():
    with open(CACHE_FILE, "r", encoding="utf-8") as f:
        cached = json.load(f)
    for k, v in cached.items():
        if k in unique_fr and v and not ARABIC_LETTER_RE.search(v):
            unique_fr[k] = v
        if k in unique_ar_fallback and v and not ARABIC_LETTER_RE.search(v):
            unique_ar_fallback[k] = v

translated_count = sum(1 for v in unique_fr.values() if v)
print(f"Loaded {translated_count}/{len(unique_fr)} French->English translations from cache.")


def batch_translate(texts: list[str], source_lang: str = "fr") -> list[str]:
    delimiter = "\n---DIV---\n"
    combined = delimiter.join(texts)
    base_url = "https://translate.googleapis.com/translate_a/single"
    params = {
        "client": "gtx",
        "sl": source_lang,
        "tl": "en",
        "dt": "t",
        "q": combined,
    }
    url = f"{base_url}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(
        url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        full = "".join(part[0] for part in data[0] if part[0])
        return [t.strip() for t in full.split("---DIV---")]


def translate_chunk(batch: list[str], source_lang: str = "fr") -> dict[str, str]:
    out: dict[str, str] = {}
    try:
        results = batch_translate(batch, source_lang=source_lang)
        if len(results) == len(batch):
            for orig, trans in zip(batch, results):
                out[orig] = trans
            return out
    except Exception:
        pass

    for item in batch:
        try:
            res = batch_translate([item], source_lang=source_lang)
            out[item] = res[0] if res else item
        except Exception:
            out[item] = item
        time.sleep(0.05)
    return out


pending_fr = [k for k, v in unique_fr.items() if not v]
print(f"Pending French->English strings to translate: {len(pending_fr)}")

BATCH_SIZE = 15
batches = [pending_fr[i : i + BATCH_SIZE] for i in range(0, len(pending_fr), BATCH_SIZE)]

if batches:
    completed_batches = 0
    with ThreadPoolExecutor(max_workers=6) as pool:
        future_to_batch = {pool.submit(translate_chunk, b, "fr"): b for b in batches}
        for fut in as_completed(future_to_batch):
            res_map = fut.result()
            unique_fr.update(res_map)
            completed_batches += 1
            if completed_batches % 25 == 0 or completed_batches == len(batches):
                merged_cache = {**unique_fr, **{k: v for k, v in unique_ar_fallback.items() if v}}
                with open(CACHE_FILE, "w", encoding="utf-8") as f:
                    json.dump(merged_cache, f, ensure_ascii=False, indent=2)
                done = sum(1 for v in unique_fr.values() if v)
                print(
                    f"Progress: {done}/{len(unique_fr)} ({done * 100 / len(unique_fr):.1f}%) saved."
                )

pending_ar = [k for k, v in unique_ar_fallback.items() if not v]
if pending_ar:
    print(f"Translating {len(pending_ar)} Arabic-only fallback strings to English...")
    unique_ar_fallback.update(translate_chunk(pending_ar, source_lang="ar"))

final_cache = {**unique_fr, **{k: v for k, v in unique_ar_fallback.items() if v}}
with open(CACHE_FILE, "w", encoding="utf-8") as f:
    json.dump(final_cache, f, ensure_ascii=False, indent=2)

print(f"Translation complete! Total cached strings: {len(final_cache)}")
