/* Cross-device sync through the user's OWN free Supabase project (nothing goes to anyone else).
   - one row per user holds the app data (whole-state document with a revision number = compare-and-swap, so two devices never overwrite each other silently)
   - attached files go to a private storage bucket, one object per file id, uploaded once and downloaded on demand
   - sign-in is email + password of a user the owner created in his own Supabase dashboard; only a refresh token is kept on the device (outside the synced data and outside backups) */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$;
const T = (a, e) => MSA.T(a, e), esc = U.esc;
const CFG_KEY = 'msa_sync_cfg', PREV_KEY = 'msa_sync_prev';
const BUCKET = 'msa-files', MAX_UP = 50 * 1048576;
const S = () => MSA.state;

/* ---------- local config (never part of the synced state or of backups) ---------- */
let cfg = {};
try { cfg = JSON.parse(localStorage.getItem(CFG_KEY) || '{}') || {}; } catch (e) { cfg = {}; }
const saveCfg = () => { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) {} };
if (!cfg.device) { cfg.device = U.uid('dv'); saveCfg(); }
const linked = () => !!(cfg.url && cfg.key && cfg.refresh && cfg.uid);

/* ---------- what is synced ---------- */
function payload(){
  const st = JSON.parse(JSON.stringify(S()));
  delete st.security; delete st.ui; delete st.seeded;
  if (st.connectors) { for (const k of Object.keys(st.connectors)) if (SECRET.test(k)) delete st.connectors[k]; }
  if (st.settings) DEVICE_SET.forEach(k => { delete st.settings[k]; });
  return st;
}
const hashOf = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return h + ':' + s.length; };
const DEVICE_SET = ['theme', 'lang', 'accent', 'intro', 'backup'];   /* appearance / language / backup choices stay per device */
const SECRET = /key|token|secret|pass/i;
function apply(remote){
  const cur = S(), keepTop = { security: cur.security, ui: cur.ui, seeded: cur.seeded };
  const keepSet = {}; DEVICE_SET.forEach(k => { if (cur.settings && k in cur.settings) keepSet[k] = cur.settings[k]; });
  const keepConn = {}; if (cur.connectors) for (const k of Object.keys(cur.connectors)) if (SECRET.test(k)) keepConn[k] = cur.connectors[k];
  for (const k of Object.keys(cur)) delete cur[k];
  Object.assign(cur, JSON.parse(JSON.stringify(remote)), keepTop);
  cur.settings = Object.assign(cur.settings || {}, keepSet);
  if (Object.keys(keepConn).length) cur.connectors = Object.assign(cur.connectors || {}, keepConn);
}
/* union by id: items only on the other side are added, the same item keeps this device's version */
function mergeStates(a, b){
  const out = JSON.parse(JSON.stringify(a));
  const mergeArr = (x, y) => { const ids = new Set((x || []).map(i => i && i.id).filter(Boolean)); const add = (y || []).filter(i => i && i.id && !ids.has(i.id)); return (x || []).concat(JSON.parse(JSON.stringify(add))); };
  for (const k of Object.keys(b)) {
    if (Array.isArray(b[k])) out[k] = Array.isArray(out[k]) ? mergeArr(out[k], b[k]) : b[k];
    else if (b[k] && typeof b[k] === 'object' && !(k in out)) out[k] = b[k];
    else if (b[k] && typeof b[k] === 'object' && out[k] && typeof out[k] === 'object') {
      for (const kk of Object.keys(b[k])) { if (Array.isArray(b[k][kk]) && Array.isArray(out[k][kk])) out[k][kk] = mergeArr(out[k][kk], b[k][kk]); else if (!(kk in out[k])) out[k][kk] = b[k][kk]; }
    }
  }
  return out;
}
const isDemo = p => !!(p && /مشروع تجريبي/.test((p.name || '') + ' ' + (p.desc || '')));
const pristine = () => { const s = S(); return !(s.projects || []).some(p => !isDemo(p)) && !(s.tasks || []).some(t => !isDemo(t)) && !(s.accounts && s.accounts.length) && !((s.learning && s.learning.folders || []).length) && !(s.clients && s.clients.length); };

/* ---------- network ---------- */
let tok = null, tokExp = 0;
const base = () => cfg.url.replace(/\/+$/, '');
async function tokenCall(body, grant){
  const r = await fetch(base() + '/auth/v1/token?grant_type=' + grant, { method: 'POST', headers: { apikey: cfg.key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error_description || j.msg || j.message || ('HTTP ' + r.status)); e.status = r.status; throw e; }
  return j;
}
function takeToken(j){ tok = j.access_token; tokExp = Date.now() + Math.max(60, (j.expires_in || 3600) - 60) * 1000; if (j.refresh_token) cfg.refresh = j.refresh_token; if (j.user && j.user.id) cfg.uid = j.user.id; saveCfg(); }
async function auth(){
  if (tok && Date.now() < tokExp) return tok;
  try { takeToken(await tokenCall({ refresh_token: cfg.refresh }, 'refresh_token')); }
  catch (e) { if (e.status === 400 || e.status === 401 || e.status === 403) { cfg.refresh = ''; saveCfg(); e.auth = true; } throw e; }
  return tok;
}
async function api(path, o, again){
  o = o || {}; const t = await auth();
  const h = Object.assign({ apikey: cfg.key, Authorization: 'Bearer ' + t }, o.headers || {});
  if (o.json !== undefined) { h['Content-Type'] = 'application/json'; o.body = JSON.stringify(o.json); }
  const r = await fetch(base() + path, { method: o.method || 'GET', headers: h, body: o.body });
  if (r.status === 401 && !again) { tok = null; return api(path, o, true); }
  if (!r.ok && !o.soft) { let m = ''; try { m = (await r.json()).message || ''; } catch (e) {} const e = new Error(m || ('HTTP ' + r.status)); e.status = r.status; throw e; }
  return r;
}
const ST = '/rest/v1/msa_state', FL = '/rest/v1/msa_files';
const remoteMeta = async () => { const j = await (await api(ST + '?select=rev,device,updated_at&user_id=eq.' + cfg.uid)).json(); return j[0] || null; };
const remoteFull = async () => { const j = await (await api(ST + '?select=*&user_id=eq.' + cfg.uid)).json(); return j[0] || null; };

/* ---------- state machine ---------- */
let busy = false, applying = false, timer = null, pollT = null, lastErr = '';
const listeners = new Set(); const emit = () => listeners.forEach(f => { try { f(); } catch (e) {} });
const info = () => ({ linked: linked(), busy, err: lastErr, last: cfg.last || 0, email: cfg.email || '', auto: cfg.auto !== false, files: fileProg });
const overlayOpen = () => !!(document.querySelector('#overlayRoot .overlay') || document.getElementById('msaBoard') || document.getElementById('lock'));
function localDirty(){ return hashOf(JSON.stringify(payload())) !== cfg.hash; }
function markSynced(rev){ cfg.rev = rev; cfg.hash = hashOf(JSON.stringify(payload())); cfg.last = Date.now(); lastErr = ''; saveCfg(); }
function rememberPrev(obj){ try { const s = JSON.stringify(obj); if (s.length < 4e6) localStorage.setItem(PREV_KEY, s); } catch (e) {} }

function applyRemote(row){
  rememberPrev(payload()); applying = true;
  try { apply(row.data); MSA.saveNow(); } finally { setTimeout(() => { applying = false; }, 400); }
  markSynced(row.rev);
  try { MSA.applyTheme && MSA.applyTheme(); MSA.applyProfile && MSA.applyProfile(); MSA.updateCounts && MSA.updateCounts(); MSA.rerender && MSA.rerender(true); } catch (e) { console.warn('sync refresh', e); }
}
async function push(rev){
  const body = { rev: (rev || 0) + 1, device: cfg.device, updated_at: new Date().toISOString(), data: payload() };
  if (!rev) {
    const r = await api(ST, { method: 'POST', json: Object.assign({ user_id: cfg.uid }, body), headers: { Prefer: 'return=representation' }, soft: true });
    if (r.status === 409) return false;
    if (!r.ok) throw new Error('HTTP ' + r.status);
    markSynced(body.rev); return true;
  }
  const r = await (await api(ST + '?user_id=eq.' + cfg.uid + '&rev=eq.' + rev, { method: 'PATCH', json: body, headers: { Prefer: 'return=representation' } })).json();
  if (!r.length) return false;
  markSynced(body.rev); return true;
}
function ask3(row){
  return new Promise(res => {
    let done = false; const fin = v => { if (!done) { done = true; res(v); } };
    const when = row.updated_at ? MSA.fmtDate(new Date(row.updated_at).getTime(), true) : '';
    const m = MSA.modal({ title: T('بيانات مختلفة على جهازين', 'Different data on two devices'), static: true, footer: false, onClose: () => fin('later'),
      body: '<div class="hint" style="margin-bottom:12px;line-height:1.7">' + esc(T('فيه بيانات على السحابة (آخر تعديل ' + when + ') وفيه بيانات على الجهاز ده، ومختلفين. اختر إزاي نكمل — والنسخة اللي مش هتختارها بتتحفظ احتياطيًا على الجهاز ده.', 'The cloud has data (last changed ' + when + ') and this device has different data. Choose how to continue — the version you do not pick is kept as a safety copy on this device.')) + '</div>' +
        '<div class="col" style="gap:8px"><button class="btn primary" data-a="merge">' + esc(T('دمج الاتنين (موصى به): أضيف الناقص من كل جهة', 'Combine both (recommended): add what is missing on each side')) + '</button>' +
        '<button class="btn" data-a="cloud">' + esc(T('استخدم بيانات السحابة (يستبدل اللي على الجهاز ده)', 'Use the cloud data (replaces this device)')) + '</button>' +
        '<button class="btn" data-a="local">' + esc(T('استخدم بيانات الجهاز ده (يستبدل اللي على السحابة)', 'Use this device (replaces the cloud)')) + '</button>' +
        '<button class="btn ghost" data-a="later">' + esc(T('لاحقًا', 'Later')) + '</button></div>' });
    $$('[data-a]', m.el).forEach(b => b.onclick = () => { fin(b.dataset.a); m.close(); });
  });
}
async function syncState(force){
  const meta = await remoteMeta();
  if (!meta) { if (!(await push(0))) return syncState(force); return 'pushed'; }
  const dirty = localDirty();
  if (meta.rev === cfg.rev) { if (!dirty) return 'same'; if (await push(meta.rev)) return 'pushed'; return syncState(force); }
  /* the cloud moved on */
  if (cfg.rev && !dirty) { if (!force && overlayOpen()) return 'deferred'; applyRemote(await remoteFull()); return 'pulled'; }
  const row = await remoteFull();
  if (!cfg.rev && pristine()) { applyRemote(row); return 'pulled'; }
  if (!force && overlayOpen()) return 'deferred';
  const ch = await ask3(row);
  if (ch === 'later') return 'deferred';
  if (ch === 'cloud') { applyRemote(row); return 'pulled'; }
  if (ch === 'merge') { rememberPrev(payload()); const mine = payload(); applying = true; try { apply(mergeStates(mine, row.data)); MSA.saveNow(); } finally { setTimeout(() => { applying = false; }, 400); } cfg.rev = row.rev; cfg.hash = ''; saveCfg(); if (!(await push(row.rev))) return syncState(force); MSA.rerender && MSA.rerender(true); return 'merged'; }
  rememberPrev(row.data); cfg.rev = row.rev; if (!(await push(row.rev))) return syncState(force); return 'pushed';
}

/* ---------- files ---------- */
let fileProg = null;
async function remoteFiles(){
  const out = new Map(); let off = 0;
  for (;;) {
    const j = await (await api(FL + '?select=id,name,mime,size&user_id=eq.' + cfg.uid + '&order=id&limit=1000&offset=' + off)).json();
    j.forEach(f => out.set(f.id, f)); if (j.length < 1000) break; off += 1000;
  }
  return out;
}
async function uploadFile(rec){
  if (!rec || !rec.blob || (rec.size || rec.blob.size) > MAX_UP) return false;
  const r = await api('/storage/v1/object/' + BUCKET + '/' + cfg.uid + '/' + rec.id, { method: 'POST', body: rec.blob, headers: { 'Content-Type': rec.mime || 'application/octet-stream', 'x-upsert': 'true' }, soft: true });
  if (!r.ok) return false;
  await api(FL + '?on_conflict=user_id,id', { method: 'POST', json: { user_id: cfg.uid, id: rec.id, name: rec.name, mime: rec.mime || '', size: rec.size || rec.blob.size || 0 }, headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } });
  return true;
}
async function downloadFile(id, meta){
  const r = await api('/storage/v1/object/authenticated/' + BUCKET + '/' + cfg.uid + '/' + id, { soft: true }); if (!r.ok) return false;
  const blob = await r.blob(); const mime = (meta && meta.mime) || blob.type || '';
  await origPutRec({ id, name: (meta && meta.name) || 'file', mime, size: (meta && meta.size) || blob.size, blob: new Blob([blob], { type: mime }), created: Date.now() });
  return true;
}
const origGet = MSA.files.get.bind(MSA.files), origDel = MSA.files.del.bind(MSA.files), origPutRec = MSA.files.putRec.bind(MSA.files);
let metaCache = null;
async function syncFiles(){
  const rem = await remoteFiles(); metaCache = rem;
  const local = new Set(await MSA.files.ids());
  const up = [...local].filter(id => !rem.has(id) && !(cfg.noUp || []).includes(id)), down = [...rem.keys()].filter(id => !local.has(id));
  const del = (cfg.pendDel || []).slice();
  fileProg = { up: 0, upN: up.length, down: 0, downN: down.length, skipped: 0 }; emit();
  for (const id of del) { try { await api('/storage/v1/object/' + BUCKET, { method: 'DELETE', json: { prefixes: [cfg.uid + '/' + id] }, soft: true }); await api(FL + '?user_id=eq.' + cfg.uid + '&id=eq.' + id, { method: 'DELETE', soft: true }); cfg.pendDel = (cfg.pendDel || []).filter(x => x !== id); saveCfg(); } catch (e) { if (e.auth) throw e; } }
  for (const id of up) {
    if (cfg.pendDel && cfg.pendDel.includes(id)) continue;
    const rec = await origGet(id);
    if (rec && (rec.size || (rec.blob && rec.blob.size) || 0) > MAX_UP) { cfg.noUp = (cfg.noUp || []).concat(id); fileProg.skipped++; saveCfg(); continue; }
    try { if (await uploadFile(rec)) fileProg.up++; else { cfg.noUp = (cfg.noUp || []).concat(id); fileProg.skipped++; saveCfg(); } } catch (e) { if (e.auth) throw e; fileProg.skipped++; }
    emit();
  }
  let got = 0;
  for (const id of down) { try { if (await downloadFile(id, rem.get(id))) { fileProg.down++; got++; } } catch (e) { if (e.auth) throw e; } emit(); }
  if (got && MSA.rerender && !overlayOpen()) MSA.rerender(true);
  const r = fileProg; fileProg = null; return r;
}
/* a picture that exists only in the cloud is fetched the moment something asks for it */
MSA.files.get = async function(id){
  const rec = await origGet(id);
  if (rec || !linked() || !navigator.onLine) return rec;
  try { if (!metaCache) metaCache = await remoteFiles(); const m = metaCache.get(id); if (m && await downloadFile(id, m)) return await origGet(id); } catch (e) {}
  return rec;
};
MSA.files.del = async function(id){
  if (linked()) { cfg.pendDel = (cfg.pendDel || []); if (!cfg.pendDel.includes(id)) cfg.pendDel.push(id); saveCfg(); scheduleSoon(); }
  return origDel(id);
};

/* ---------- running ---------- */
async function run(opts){
  opts = opts || {};
  if (!linked() || busy) return null;
  if (!navigator.onLine) { lastErr = 'offline'; emit(); return null; }
  busy = true; emit(); let res = null;
  try { const st = await syncState(opts.force); const fr = await syncFiles(); res = { state: st, files: fr }; lastErr = ''; if (st !== 'deferred') { cfg.last = Date.now(); saveCfg(); } }
  catch (e) { console.warn('sync', e); lastErr = e.auth ? 'auth' : (e.message || 'error'); res = { error: lastErr }; }
  busy = false; fileProg = null; emit(); return res;
}
function scheduleSoon(ms){ if (!linked() || cfg.auto === false) return; clearTimeout(timer); timer = setTimeout(() => run(), ms || 4000); }
const _save = MSA.save;
MSA.save = function(){ const r = _save.apply(this, arguments); if (linked() && !applying && cfg.auto !== false) scheduleSoon(); return r; };
function startPolling(){
  clearInterval(pollT); if (!linked()) return;
  pollT = setInterval(() => { if (!document.hidden && cfg.auto !== false) run(); }, 45000);
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && linked() && cfg.auto !== false) setTimeout(() => run(), 800); });
window.addEventListener('online', () => { if (linked() && cfg.auto !== false) setTimeout(() => run(), 1200); });
setTimeout(() => { if (linked() && cfg.auto !== false) run(); startPolling(); }, 3500);

/* ---------- connect / disconnect ---------- */
async function connect(url, key, email, pw){
  url = (url || '').trim().replace(/\/+$/, ''); key = (key || '').trim(); email = (email || '').trim();
  if (!/^https:\/\/[^/]+\.supabase\.(co|in)$/i.test(url) && !/^https?:\/\/localhost[:/]/.test(url)) throw new Error(T('عنوان المشروع لازم يكون بالشكل https://xxxx.supabase.co', 'The project URL must look like https://xxxx.supabase.co'));
  if (!key || !email || !pw) throw new Error(T('اكتب كل البيانات', 'Fill in every field'));
  const old = Object.assign({}, cfg); cfg.url = url; cfg.key = key;
  try {
    const j = await tokenCall({ email, password: pw }, 'password');
    cfg.email = email; cfg.rev = 0; cfg.hash = ''; cfg.pendDel = []; cfg.noUp = []; takeToken(j);
    const r = await api(ST + '?select=rev&limit=1', { soft: true });
    if (!r.ok) throw new Error(T('الجداول لسه مش متجهزة على Supabase — نفّذ كود الإعداد أولًا', 'The tables are not set up on Supabase yet — run the setup code first'));
  } catch (e) { cfg = old; saveCfg(); tok = null; throw e; }
  saveCfg(); startPolling(); emit();
}
function disconnect(){ clearTimeout(timer); clearInterval(pollT); const d = cfg.device; cfg = { device: d }; tok = null; metaCache = null; saveCfg(); emit(); }

/* ---------- setup guide ---------- */
const SQL = `create table if not exists public.msa_state (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  rev bigint not null default 1,
  device text,
  updated_at timestamptz not null default now(),
  data jsonb not null
);
create table if not exists public.msa_files (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  name text, mime text, size bigint,
  primary key (user_id, id)
);
alter table public.msa_state enable row level security;
alter table public.msa_files enable row level security;
drop policy if exists "own state" on public.msa_state;
drop policy if exists "own files" on public.msa_files;
create policy "own state" on public.msa_state for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own files" on public.msa_files for all using (user_id = auth.uid()) with check (user_id = auth.uid());
insert into storage.buckets (id, name, public) values ('msa-files', 'msa-files', false) on conflict (id) do nothing;
drop policy if exists "msa files read" on storage.objects;
drop policy if exists "msa files write" on storage.objects;
drop policy if exists "msa files update" on storage.objects;
drop policy if exists "msa files delete" on storage.objects;
create policy "msa files read" on storage.objects for select using (bucket_id = 'msa-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "msa files write" on storage.objects for insert with check (bucket_id = 'msa-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "msa files update" on storage.objects for update using (bucket_id = 'msa-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "msa files delete" on storage.objects for delete using (bucket_id = 'msa-files' and (storage.foldername(name))[1] = auth.uid()::text);`;
function guide(){
  const steps = [
    T('اعمل حساب مجاني على supabase.com (بإيميلك) واضغط New project، واكتب أي اسم وكلمة سر لقاعدة البيانات، واختار أقرب منطقة. استنى دقيقة لحد ما يجهز.', 'Create a free account at supabase.com, click New project, pick any name and database password and the nearest region. Wait a minute until it is ready.'),
    T('من القائمة اليسار افتح SQL Editor، والصق الكود اللي تحت كله، واضغط Run. المفروض يقول Success.', 'Open SQL Editor from the left menu, paste the whole code below and press Run. It should say Success.'),
    T('افتح Authentication ← Users ← Add user ← Create new user. اكتب إيميلك وكلمة سر، وفعّل Auto Confirm User. دي بيانات دخولك للمزامنة.', 'Open Authentication → Users → Add user → Create new user. Enter your email and a password and tick Auto Confirm User. These are your sync login details.'),
    T('افتح Project Settings ← API. انسخ Project URL و anon public key (المفتاح العام).', 'Open Project Settings → API. Copy the Project URL and the anon public key.'),
    T('ارجع هنا واكتب العنوان والمفتاح والإيميل وكلمة السر، واضغط «ربط». اعمل نفس الخطوة على كل جهاز.', 'Come back here, enter the URL, key, email and password and press Connect. Repeat this on every device.')
  ];
  const m = MSA.modal({ title: T('إعداد المزامنة (مرة واحدة)', 'Sync setup (one time)'), size: 'wide', footer: false,
    body: '<ol class="sync-steps">' + steps.map(s => '<li>' + esc(s) + '</li>').join('') + '</ol>' +
      '<div class="row" style="margin:10px 0 6px"><b>' + esc(T('كود الإعداد', 'Setup code')) + '</b><button class="btn sm" id="syCopy">' + I('copy', 'sm') + esc(T('نسخ', 'Copy')) + '</button></div>' +
      '<textarea id="sySql" readonly dir="ltr" rows="9" style="width:100%;font:12px/1.5 monospace">' + esc(SQL) + '</textarea>' +
      '<div class="hint" style="margin-top:8px">' + esc(T('الملفات الأكبر من 50 م.ب مش بتتزامن (حد المجاني). بياناتك بتتخزن في حسابك إنت فقط، ومحدش غيرك يقدر يقرأها.', 'Files larger than 50 MB are not synced (free-plan limit). Your data lives only in your own account and nobody else can read it.')) + '</div>' });
  $('#syCopy', m.el).onclick = async () => { try { await navigator.clipboard.writeText(SQL); MSA.toast(T('تم النسخ', 'Copied'), 'ok'); } catch (e) { const t = $('#sySql', m.el); t.select(); document.execCommand && document.execCommand('copy'); MSA.toast(T('تم النسخ', 'Copied'), 'ok'); } };
}

/* ---------- settings section ---------- */
function describe(){
  const i = info();
  if (!i.linked) return T('غير مربوط', 'Not connected');
  if (i.busy) return i.files ? T('جاري نقل الملفات… ↑' + i.files.up + '/' + i.files.upN + ' ↓' + i.files.down + '/' + i.files.downN, 'Moving files… ↑' + i.files.up + '/' + i.files.upN + ' ↓' + i.files.down + '/' + i.files.downN) : T('جاري المزامنة…', 'Syncing…');
  if (i.err === 'offline') return T('مفيش إنترنت — هيزامن لما يرجع', 'Offline — will sync when back online');
  if (i.err === 'auth') return T('لازم تسجل الدخول من جديد', 'Please sign in again');
  if (i.err) return T('تعذّرت المزامنة: ', 'Sync failed: ') + i.err;
  return T('تمت المزامنة ', 'Synced ') + (i.last ? MSA.fmtDate(i.last, true) : '');
}
MSA.syncHTML = function(){
  const i = info();
  const form = '<div class="col" style="gap:8px;margin-bottom:8px">' +
    '<input id="syUrl" dir="ltr" placeholder="https://xxxx.supabase.co" value="' + esc(cfg.url || '') + '">' +
    '<input id="syKey" dir="ltr" placeholder="' + esc(T('المفتاح العام (anon public key)', 'anon public key')) + '" value="' + esc(cfg.key || '') + '">' +
    '<input id="syMail" dir="ltr" type="email" placeholder="' + esc(T('الإيميل', 'Email')) + '" value="' + esc(cfg.email || '') + '">' +
    '<input id="syPw" dir="ltr" type="password" placeholder="' + esc(T('كلمة السر', 'Password')) + '" autocomplete="current-password"></div>';
  return '<div class="sec" id="syncSec"><h4>' + I('repeat', 'sm') + esc(T('المزامنة بين الأجهزة', 'Sync between devices')) + '</h4>' +
    '<div class="hint" style="margin-bottom:10px;line-height:1.7">' + esc(T('بياناتك وملفاتك بتتنقل تلقائيًا بين كل أجهزتك عن طريق حساب Supabase المجاني بتاعك إنت. بتتعمل مرة واحدة.', 'Your data and files move automatically between all your devices through your own free Supabase account. One-time setup.')) + '</div>' +
    (i.linked
      ? '<div class="row" style="margin-bottom:8px"><b dir="ltr">' + esc(i.email) + '</b></div><div class="hint" id="syStat" style="margin-bottom:10px">' + esc(describe()) + '</div>' +
        '<label class="row" style="margin-bottom:10px;cursor:pointer"><input type="checkbox" class="cb" id="syAuto" ' + (i.auto ? 'checked' : '') + '><span>' + esc(T('مزامنة تلقائية', 'Sync automatically')) + '</span></label>' +
        '<div class="row"><button class="btn sm primary" id="syNow">' + I('repeat', 'sm') + esc(T('زامن الآن', 'Sync now')) + '</button><button class="btn sm" id="syGuide">' + esc(T('دليل الإعداد', 'Setup guide')) + '</button><button class="btn sm danger" id="syOff">' + esc(T('فصل هذا الجهاز', 'Disconnect this device')) + '</button></div>'
      : form + '<div class="row"><button class="btn sm primary" id="syGo">' + I('link', 'sm') + esc(T('ربط', 'Connect')) + '</button><button class="btn sm" id="syGuide">' + esc(T('دليل الإعداد (مرة واحدة)', 'Setup guide (one time)')) + '</button></div><div class="lk-err" id="syErr" role="alert" style="margin-top:8px"></div>') + '</div>';
};
MSA.wireSync = function(root, redraw){
  const g = $('#syGuide', root); if (g) g.onclick = guide;
  const go = $('#syGo', root);
  if (go) go.onclick = async () => {
    const err = $('#syErr', root); err.textContent = ''; go.disabled = true;
    try { await connect($('#syUrl', root).value, $('#syKey', root).value, $('#syMail', root).value, $('#syPw', root).value); const r = await run({ force: true }); redraw && redraw(); MSA.toast(r && r.error ? T('اتربط، بس المزامنة الأولى فشلت: ' + r.error, 'Connected, but the first sync failed: ' + r.error) : T('تم الربط والمزامنة', 'Connected and synced'), r && r.error ? 'err' : 'ok'); }
    catch (e) { err.textContent = e.message || String(e); go.disabled = false; }
  };
  const now = $('#syNow', root); if (now) now.onclick = async () => { now.disabled = true; const r = await run({ force: true }); redraw && redraw(); if (r && r.error) MSA.toast(T('تعذّرت المزامنة: ', 'Sync failed: ') + r.error, 'err'); else MSA.toast(T('تمت المزامنة', 'Synced'), 'ok'); };
  const au = $('#syAuto', root); if (au) au.onchange = e => { cfg.auto = e.target.checked; saveCfg(); if (cfg.auto) scheduleSoon(500); };
  const off = $('#syOff', root); if (off) off.onclick = async () => { if (await MSA.confirm(T('فصل هذا الجهاز؟ بياناتك هتفضل على الجهاز وعلى السحابة، بس مش هتتزامن.', 'Disconnect this device? Your data stays here and in the cloud but stops syncing.'), { okLabel: T('فصل', 'Disconnect') })) { disconnect(); redraw && redraw(); } };
  const stat = $('#syStat', root);
  if (stat) { const f = () => { if (!document.body.contains(stat)) { listeners.delete(f); return; } stat.textContent = describe(); }; listeners.add(f); }
};
MSA.sync = { run, connect, disconnect, info, _cfg: () => cfg, _payload: payload, _merge: mergeStates };
})();
