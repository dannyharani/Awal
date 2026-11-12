/**
 * Moves the bulk-imported DGLAI entries off a real person's profile and onto a dedicated,
 * clearly-labelled import account, so that:
 *   - contribution counts / profile stats of real users aren't inflated by 55k imported rows
 *   - definition cards credit "dglaiimport" (an automated import) instead of a person
 *
 * What it does:
 *   1. Finds or creates the auth user `dglai-import@asafu.invalid` (random password, never
 *      used to log in) → the `handle_new_user` trigger creates its profile (`dglaiimport`).
 *   2. Re-attributes definitions + examples created by `--from-user` inside the seeding
 *      time window. Rows outside the window (anything written by hand) are untouched.
 *
 * Usage:
 *   node scripts/attribute-dglai-import.mjs --from-user <uuid> [--dry-run]
 */
import crypto from 'crypto';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const dryRun = process.argv.includes('--dry-run');
const fromUser = arg('--from-user');
// Window in which the seeding run created its rows (2026-11-12 13:37Z – 13:40Z), with margin.
const WINDOW_START = arg('--since') ?? '2026-11-12T13:30:00Z';
const WINDOW_END = arg('--until') ?? '2026-11-12T13:45:00Z';
const BOT_EMAIL = 'dglai-import@asafu.invalid';
const BOT_USERNAME = 'dglaiimport';

if (!fromUser) {
  console.error('Missing --from-user <uuid>');
  process.exit(1);
}

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
const supabase = createClient(url, key, { auth: { persistSession: false } });

async function findBot() {
  const { data } = await supabase.from('profiles').select('id, username').eq('username', BOT_USERNAME).maybeSingle();
  return data?.id ?? null;
}

let botId = await findBot();
if (!botId && !dryRun) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: BOT_EMAIL,
    password: crypto.randomBytes(32).toString('hex'),
    email_confirm: true,
    user_metadata: { full_name: 'DGLAI Import' }
  });
  if (error) {
    console.error('Could not create import account:', error.message);
    process.exit(1);
  }
  botId = data.user.id;
  for (let i = 0; i < 10; i++) {
    const { data: p } = await supabase.from('profiles').select('id').eq('id', botId).maybeSingle();
    if (p) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  const { error: upErr } = await supabase
    .from('profiles')
    .update({
      bio: "Automated account for entries imported from IRCAM's Dictionnaire Général de la Langue Amazighe (DGLAI). Not a person."
    })
    .eq('id', botId);
  if (upErr) console.warn('Profile bio update failed:', upErr.message);
  console.log('Created import account', botId);
} else {
  console.log(botId ? `Using existing import account ${botId}` : '[dry-run] import account would be created');
}

async function reassign(table, label) {
  const bounds = async (asc) => {
    const { data } = await supabase
      .from(table)
      .select('id')
      .eq('user_id', fromUser)
      .gte('created_at', WINDOW_START)
      .lte('created_at', WINDOW_END)
      .order('id', { ascending: asc })
      .limit(1);
    return data?.[0]?.id ?? null;
  };
  const min = await bounds(true);
  const max = await bounds(false);
  if (min === null) {
    console.log(`${label}: nothing to move`);
    return 0;
  }
  const STEP = 3000;
  let moved = 0;
  for (let start = min; start <= max; start += STEP) {
    let q = supabase
      .from(table)
      .select('*', { count: 'exact', head: dryRun })
      .eq('user_id', fromUser)
      .gte('created_at', WINDOW_START)
      .lte('created_at', WINDOW_END)
      .gte('id', start)
      .lt('id', start + STEP);
    if (dryRun) {
      const { count, error } = await q;
      if (error) throw error;
      moved += count ?? 0;
      continue;
    }
    const { count, error } = await supabase
      .from(table)
      .update({ user_id: botId }, { count: 'exact' })
      .eq('user_id', fromUser)
      .gte('created_at', WINDOW_START)
      .lte('created_at', WINDOW_END)
      .gte('id', start)
      .lt('id', start + STEP);
    if (error) throw error;
    moved += count ?? 0;
    console.log(`${label}: ids ${start}-${start + STEP - 1} → ${count} moved (total ${moved})`);
  }
  console.log(`${label}: ${dryRun ? 'would move' : 'moved'} ${moved}`);
  return moved;
}

await reassign('definitions', 'definitions');
await reassign('examples', 'examples');

if (!dryRun) {
  for (const t of ['definitions', 'examples']) {
    const mine = await supabase.from(t).select('*', { count: 'exact', head: true }).eq('user_id', fromUser);
    const bot = await supabase.from(t).select('*', { count: 'exact', head: true }).eq('user_id', botId);
    console.log(`${t}: ${mine.count} remain with original user, ${bot.count} on import account`);
  }
}
