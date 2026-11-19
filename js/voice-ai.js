/* The voice assistant's main brain. With the user's own API key it understands ANY wording, can look things up inside the app
   (agent loop: the model asks for read-only tools — find / ui / project / stats / tasks — gets the results, then answers with a PLAN),
   and drives the app: open any screen/tab/section, create projects, record payments, edit tasks in bulk, etc.
   The PLAN is a small JSON list of operations that is validated against a whitelist and executed by voice.js with the same
   confirm + undo as local commands. Active whenever there is a key and the device is online (no switch to flip).
   Providers: Google Gemini (free tier, no card) · Groq (free tier, OpenAI-compatible) · Anthropic Claude · OpenAI.
   The key is stored ONLY in this device's localStorage (never in the synced state or backups). Pure parts are exported for node tests. */
(function(root){
'use strict';
const KEY = 'msa_voice_ai', MKEY = 'msa_voice_ai_model';
const DEFAULTS = { provider: 'gemini', key: '', model: '', off: false, aiOnly: false };
const PROVIDERS = {
  gemini: { name: 'Google Gemini', keyUrl: 'https://aistudio.google.com/apikey', free: true, models: ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash'] },
  groq: { name: 'Groq', keyUrl: 'https://console.groq.com/keys', free: true, models: ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'llama-3.1-8b-instant'] },
  anthropic: { name: 'Anthropic Claude', keyUrl: 'https://console.anthropic.com/settings/keys', free: false, models: ['claude-haiku-5-5'] },
  openai: { name: 'OpenAI', keyUrl: 'https://platform.openai.com/api-keys', free: false, models: ['gpt-4o-mini'] }
};
const MODELS = {}; Object.keys(PROVIDERS).forEach(k => MODELS[k] = PROVIDERS[k].models[0]);
const VIEWS = ['home', 'active', 'done', 'learn', 'tasks', 'media', 'reports', 'settings', 'money', 'clients', 'guide', 'files', 'leads', 'upwork'];
const VIEW_AR = 'home=الرئيسية, active=المشاريع قيد التنفيذ, done=المشاريع المكتملة, learn=التعليم والتطوير, tasks=المهام والملاحظات, media=الميديا, reports=التقارير, settings=الإعدادات, money=المدفوعات, clients=العملاء, guide=الدليل, files=ملفاتي, leads=العملاء المحتملين, upwork=عملاء Upwork';
const ACTS = { tasks: ['list', 'count', 'delete', 'complete', 'reopen', 'move', 'pin', 'unpin', 'priority'], one: ['rename', 'reopen', 'priority', 'pin', 'complete', 'delete'], projects: ['list', 'count'], clients: ['list', 'count'] };
const READ = ['find', 'ui', 'project', 'stats', 'tasks'];
const cfg = () => { try { return Object.assign({}, DEFAULTS, JSON.parse(root.localStorage.getItem(KEY) || '{}')); } catch (e) { return Object.assign({}, DEFAULTS); } };
const save = o => { try { root.localStorage.setItem(KEY, JSON.stringify(Object.assign(cfg(), o))); } catch (e) {} };
const hasKey = () => { const c = cfg(); return !!(c.key && c.key.length > 8); };
const enabled = () => hasKey() && !cfg().off;
const modelOf = c => (c.model || '').trim() || MODELS[c.provider] || MODELS.gemini;
const cl = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n || 200);

const SYSTEM = [
  'You are the command brain of "My Smart Assistant", an Arabic-first personal task/project/money manager used by a freelance designer / video editor. The user speaks Egyptian Arabic (voice-to-text, so expect typos and slips like "اترك" for "اقرأ").',
  'You can LOOK THINGS UP and then ACT. Reply with ONE JSON object only (no markdown): {"say":"short friendly reply in Egyptian Arabic","read":[...],"ops":[...]}.',
  'STEP 1 (optional): put read-only tools in "read" when you need data you do not have. The app runs them and sends RESULTS back; then you answer. Leave "read" empty/omitted when you can finish. Max 4 rounds.',
  'READ tools: {"tool":"find","q":"1-3 keywords","scope":"all|tasks|notes|projects|clients|files|videos"}  {"tool":"ui"} (lists the tabs/sections visible on the current screen)  {"tool":"project","query":"name words"} (full details incl. money)  {"tool":"stats"}  {"tool":"tasks","filter":{...same filter as below...}}.',
  'STEP 2: "ops" (executed in order; destructive ones are confirmed by the app, never ask yourself):',
  '{"op":"tasks","act":"list|count|delete|complete|reopen|move|pin|unpin|priority","filter":{"type":"task|note|both","status":"any|open|done","due":"|has|none|today|overdue|week|nextweek|month|date:YYYY-MM-DD","text":"","pinned":null,"prio":"|high|low","ids":[],"not":{same shape}},"set":{"date":"YYYY-MM-DD","time":"HH:MM","prio":"urgent|high|normal|low"}}',
  '{"op":"add","task":{"title":"","type":"task|note","date":"YYYY-MM-DD","time":"HH:MM","priority":"urgent|high|normal|low","desc":""}}',
  '{"op":"one","act":"rename|reopen|priority|pin|complete|delete","query":"words of the task title","value":"new title or priority"}',
  '{"op":"go","view":"' + VIEWS.join('|') + '"}   views: ' + VIEW_AR,
  '{"op":"ui_click","label":"exact text of a tab/section/chip from the ui tool"} (use after go; never for delete/clear buttons)',
  '{"op":"open","n":1} opens the n-th result of your last find   {"op":"project","act":"open","query":""}',
  '{"op":"project_add","name":"","client":"","total":0,"currency":"EGP"}   {"op":"payment_add","project":"name words","amount":0,"note":""}   {"op":"project_set","project":"name words","set":{"status":"active|done","name":"","client":""}}',
  '{"op":"projects","act":"list|count"}  {"op":"clients","act":"list|count"}  {"op":"summary"}  {"op":"search","query":""} (opens the global search box)  {"op":"action","name":"sync"}  {"op":"setting","key":"tts|confirm","value":true}  {"op":"theme","value":"dark|light"}  {"op":"lang","value":"ar|en"}  {"op":"say","text":""}',
  'Rules: never invent data — look it up with find/project/stats/tasks first. Prefer filters over ids. Use "not" for "except / keep only". Resolve relative dates from TODAY. To open a tab: {"op":"go"} then (next round, after the ui tool) {"op":"ui_click"}; for the Money screen tabs the labels are المستحقات / قائمة الأسعار / عروض وفواتير / ربحية العملاء; Upwork tabs العروض / العملاء / قالب Word / بروفايلي وCV.',
  'If a request cannot be done with these tools, return {"say":"<explain briefly in Egyptian Arabic>","ops":[]}. Keep "say" under 220 characters, and for questions put the actual answer in "say".'
].join('\n');

function contextOf(state, now, toMs, extra){
  const key = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const all = (state.tasks || []).filter(t => !t.routine);
  const tasks = all.slice(0, 60).map(t => ({ id: t.id, t: cl(t.title, 60), k: t.type === 'note' ? 'note' : 'task', s: t.status === 'done' ? 'done' : 'open', due: (() => { const m = toMs ? toMs(t.due) : Date.parse(t.due); return m != null && isFinite(m) ? key(new Date(m)) + (/T23:59/.test(String(t.due)) ? '' : 'T' + String(t.due).slice(11, 16)) : ''; })(), p: t.priority !== 'normal' ? t.priority : undefined, pin: t.pinned ? 1 : undefined }));
  return { today: key(now) + ' ' + days[now.getDay()], view: (extra && extra.view) || '', tasks, moreTasks: Math.max(0, all.length - 60), projects: (state.projects || []).slice(0, 40).map(p => cl(p.name, 50)), totalTasks: all.length };
}
const toRole = r => r === 'assistant' ? 'assistant' : 'user';
function buildRequest(c, messages, model){
  model = model || modelOf(c);
  if (typeof messages === 'string') messages = [{ r: 'user', t: messages }];
  if (c.provider === 'anthropic') return { url: 'https://api.anthropic.com/v1/messages', init: { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': c.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ model, max_tokens: 1800, system: SYSTEM, messages: messages.map(m => ({ role: toRole(m.r), content: m.t })) }) } };
  if (c.provider === 'openai' || c.provider === 'groq') return { url: c.provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions', init: { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + c.key }, body: JSON.stringify({ model, response_format: { type: 'json_object' }, temperature: 0.1, messages: [{ role: 'system', content: SYSTEM }].concat(messages.map(m => ({ role: toRole(m.r), content: m.t }))) }) } };
  return { url: 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', init: { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': c.key }, body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM }] }, contents: messages.map(m => ({ role: m.r === 'assistant' ? 'model' : 'user', parts: [{ text: m.t }] })), generationConfig: { responseMimeType: 'application/json', temperature: 0.1 } }) } };
}
function textOf(provider, j){
  try {
    if (provider === 'anthropic') return (j.content || []).map(x => x.text || '').join('');
    if (provider === 'openai' || provider === 'groq') return j.choices[0].message.content;
    return j.candidates[0].content.parts.map(x => x.text || '').join('');
  } catch (e) { return ''; }
}
function parseJSON(t){
  t = String(t || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try { return JSON.parse(t); } catch (e) { const a = t.indexOf('{'), b = t.lastIndexOf('}'); if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (e2) {} } }
  return null;
}
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/, TIME_RE = /^\d{2}:\d{2}$/;
function cleanFilter(f, ids){
  f = f && typeof f === 'object' ? f : {};
  const due = String(f.due || ''); const okDue = ['', 'has', 'none', 'today', 'overdue', 'week', 'nextweek', 'month'].includes(due) || (/^date:/.test(due) && DATE_RE.test(due.slice(5)));
  const o = { type: ['task', 'note', 'both'].includes(f.type) ? f.type : 'task', status: ['any', 'open', 'done'].includes(f.status) ? f.status : 'any', due: okDue ? due : '', text: cl(f.text, 80), pinned: f.pinned === true ? true : null, prio: ['high', 'low'].includes(f.prio) ? f.prio : '' };
  if (Array.isArray(f.ids)) { const set = ids ? new Set(ids) : null; o.ids = f.ids.map(String).filter(x => !set || set.has(x)).slice(0, 80); if (!o.ids.length) delete o.ids; }
  if (f.not && typeof f.not === 'object') o.not = cleanFilter(f.not, ids);
  return o;
}
const num = v => { const n = parseFloat(v); return isFinite(n) && n > 0 && n < 1e9 ? n : 0; };
/* whitelist + shape every op; unknown things are dropped, never executed */
function sanitize(j, state){
  if (!j || typeof j !== 'object') return null;
  const ids = (state && state.tasks || []).map(t => t.id);
  const out = { intent: 'plan', ops: [], say: cl(j.say, 400), ai: true };
  (Array.isArray(j.ops) ? j.ops : []).slice(0, 12).forEach(o => {
    if (!o || typeof o !== 'object') return; const op = o.op;
    if (op === 'tasks' && ACTS.tasks.includes(o.act)) {
      const set = {}; const s = o.set || {}; if (DATE_RE.test(s.date || '')) set.date = s.date; if (TIME_RE.test(s.time || '')) set.time = s.time; if (['urgent', 'high', 'normal', 'low'].includes(s.prio)) set.prio = s.prio;
      if (o.act === 'move' && !set.date && !set.time) return; if (o.act === 'priority' && !set.prio) return;
      out.ops.push({ op, act: o.act, filter: cleanFilter(o.filter, ids), set });
    } else if (op === 'add' && o.task && cl(o.task.title, 200)) {
      const t = o.task; out.ops.push({ op, task: { title: cl(t.title, 200), type: t.type === 'note' ? 'note' : 'task', date: DATE_RE.test(t.date || '') ? t.date : '', time: TIME_RE.test(t.time || '') ? t.time : '', priority: ['urgent', 'high', 'normal', 'low'].includes(t.priority) ? t.priority : 'normal', desc: cl(t.desc, 600) } });
    } else if (op === 'one' && ACTS.one.includes(o.act) && cl(o.query, 120)) out.ops.push({ op, act: o.act, query: cl(o.query, 120), value: cl(o.value, 200) });
    else if (op === 'go' && VIEWS.includes(o.view)) out.ops.push({ op, view: o.view });
    else if (op === 'ui_click' && cl(o.label, 80)) out.ops.push({ op, label: cl(o.label, 80) });
    else if (op === 'open' && Number.isInteger(o.n) && o.n >= 1 && o.n <= 40) out.ops.push({ op, n: o.n });
    else if (op === 'project' && o.act === 'open' && cl(o.query, 120)) out.ops.push({ op, act: 'open', query: cl(o.query, 120) });
    else if (op === 'project_add' && cl(o.name, 120)) out.ops.push({ op, name: cl(o.name, 120), client: cl(o.client, 80), total: num(o.total), currency: ['EGP', 'USD', 'SAR', 'EUR', 'AED'].includes(o.currency) ? o.currency : '' });
    else if (op === 'payment_add' && cl(o.project, 120) && num(o.amount)) out.ops.push({ op, project: cl(o.project, 120), amount: num(o.amount), note: cl(o.note, 100) });
    else if (op === 'project_set' && cl(o.project, 120) && o.set && typeof o.set === 'object') { const s = {}; if (['active', 'done'].includes(o.set.status)) s.status = o.set.status; if (cl(o.set.name, 120)) s.name = cl(o.set.name, 120); if (cl(o.set.client, 80)) s.client = cl(o.set.client, 80); if (Object.keys(s).length) out.ops.push({ op, project: cl(o.project, 120), set: s }); }
    else if ((op === 'projects' || op === 'clients') && ACTS[op].includes(o.act)) out.ops.push({ op, act: o.act });
    else if (op === 'search') out.ops.push({ op, query: cl(o.query, 120) });
    else if (op === 'summary') out.ops.push({ op });
    else if (op === 'action' && o.name === 'sync') out.ops.push({ op, name: 'sync' });
    else if (op === 'setting' && ['tts', 'confirm'].includes(o.key)) out.ops.push({ op, key: o.key, value: o.value === true || o.value === 'true' });
    else if (op === 'theme' && ['dark', 'light'].includes(o.value)) out.ops.push({ op, value: o.value });
    else if (op === 'lang' && ['ar', 'en'].includes(o.value)) out.ops.push({ op, value: o.value });
    else if (op === 'say' && cl(o.text, 300)) out.ops.push({ op, text: cl(o.text, 300) });
  });
  if (!out.ops.length && !out.say) return null;
  return out;
}
function cleanRead(list, ids){
  return (Array.isArray(list) ? list : []).slice(0, 4).map(r => {
    if (!r || typeof r !== 'object' || !READ.includes(r.tool)) return null;
    if (r.tool === 'find') return { tool: 'find', q: cl(r.q, 80), scope: ['all', 'tasks', 'notes', 'projects', 'clients', 'files', 'videos'].includes(r.scope) ? r.scope : 'all' };
    if (r.tool === 'project') return { tool: 'project', query: cl(r.query, 100) };
    if (r.tool === 'tasks') return { tool: 'tasks', filter: cleanFilter(r.filter, ids) };
    return { tool: r.tool };
  }).filter(Boolean);
}

/* ---- Gemini: pick a model that exists (names change often) ---- */
async function geminiCandidates(c, signal){
  if ((c.model || '').trim()) return [c.model.trim()];
  let cached = null; try { cached = JSON.parse(root.localStorage.getItem(MKEY) || 'null'); } catch (e) {}
  const out = [];
  if (cached && cached.m && Date.now() - cached.t < 7 * 864e5) out.push(cached.m);
  if (!out.length) {
    try {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': c.key }, signal });
      if (r.ok) {
        const j = await r.json(); const ver = n => { const m = /gemini-(\d+(?:\.\d+)?)/.exec(n); return m ? parseFloat(m[1]) : 0; };
        const list = (j.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent')).map(m => String(m.name || '').replace(/^models\//, ''))
          .filter(n => /^gemini-[\d.]+-flash(?:-lite)?(?:-\d+)?$/.test(n)).sort((a, b) => (/lite/.test(a) - /lite/.test(b)) || ver(b) - ver(a) || a.length - b.length);
        list.slice(0, 3).forEach(n => out.push(n));
      }
    } catch (e) {}
  }
  PROVIDERS.gemini.models.forEach(m => { if (!out.includes(m)) out.push(m); });
  return out;
}
async function callOnce(c, messages, signal){
  const cands = c.provider === 'gemini' ? await geminiCandidates(c, signal) : ((c.model || '').trim() ? [c.model.trim()] : PROVIDERS[c.provider].models);
  let last = null;
  for (const model of cands) {
    const req = buildRequest(c, messages, model);
    let r;
    try { r = await fetch(req.url, Object.assign({}, req.init, signal ? { signal } : {})); } catch (e) { return { error: e && e.name === 'AbortError' ? 'timeout' : 'net' }; }
    if (r.ok) { const j = await r.json(); if (c.provider === 'gemini' && !(c.model || '').trim()) { try { root.localStorage.setItem(MKEY, JSON.stringify({ m: model, t: Date.now() })); } catch (e) {} } return { text: textOf(c.provider, j), model }; }
    let m = ''; try { const e = await r.json(); m = (e.error && (e.error.message || e.error)) || ''; } catch (e) {}
    last = { error: r.status === 401 || r.status === 403 ? 'auth' : r.status === 429 ? 'limit' : r.status === 404 ? 'model' : 'http', status: r.status, detail: cl(typeof m === 'string' ? m : JSON.stringify(m), 200) };
    if (last.error === 'auth') return last;                         // wrong key: no point trying other models
    if (c.provider === 'gemini') { try { root.localStorage.removeItem(MKEY); } catch (e) {} }
    if (last.error === 'http' && r.status >= 500) continue;
  }
  return last || { error: 'http' };
}
/* tools = { run(readTool) -> JSON-able result, view: current view id } */
async function ask(text, state, now, toMs, tools){
  const c = cfg(); if (!enabled()) return { error: 'off' };
  const ctx = contextOf(state, now, toMs, { view: tools && tools.view });
  const ids = (state.tasks || []).map(t => t.id);
  const messages = [{ r: 'user', t: 'TODAY: ' + ctx.today + '\nCURRENT SCREEN: ' + (ctx.view || '?') + '\nCONTEXT: ' + JSON.stringify({ tasks: ctx.tasks, moreTasks: ctx.moreTasks, projects: ctx.projects, totalTasks: ctx.totalTasks }) + '\nUSER SAID: ' + cl(text, 600) }];
  const ac = typeof AbortController !== 'undefined' ? new AbortController() : null; const tm = setTimeout(() => ac && ac.abort(), 45000);
  try {
    let reads = 0;
    for (let round = 0; round < 5; round++) {
      const r = await callOnce(c, messages, ac && ac.signal); if (r.error) return r;
      const j = parseJSON(r.text); if (!j) return { error: 'parse' };
      const rd = round < 4 ? cleanRead(j.read, ids) : [];
      if (rd.length && tools && tools.run) {
        reads += rd.length;
        const results = rd.map(x => { let res; try { res = tools.run(x); } catch (e) { res = { error: String(e && e.message || e) }; } return { tool: x.tool, query: x.q || x.query || undefined, result: res }; });
        messages.push({ r: 'assistant', t: r.text }); messages.push({ r: 'user', t: 'RESULTS: ' + JSON.stringify(results).slice(0, 9000) + '\nNow answer: put the final answer in "say" and the actions in "ops" (read only if still needed).' });
        continue;
      }
      const plan = sanitize(j, state); return plan ? { plan, rounds: round + 1, reads } : { error: 'parse' };
    }
    return { error: 'parse' };
  } finally { clearTimeout(tm); }
}
const api = { cfg, save, enabled, hasKey, ask, sanitize, cleanRead, buildRequest, textOf, parseJSON, contextOf, MODELS, PROVIDERS, modelOf, SYSTEM, VIEWS, callOnce };
root.VoiceAI = api; if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
