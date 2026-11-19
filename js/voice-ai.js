/* Optional "smart mode" for the voice assistant: sends the sentence to an AI provider with the user's OWN key and gets back a PLAN
   (a small JSON list of operations). The plan is validated against a whitelist and executed by voice.js with the same confirm + undo
   as local commands. Off by default. The key lives only in this device's localStorage (never in the synced state / backups).
   Providers: Google Gemini (has a free tier), Anthropic Claude, OpenAI. Pure logic is exported for node tests. */
(function(root){
'use strict';
const KEY = 'msa_voice_ai';
const DEFAULTS = { on: false, provider: 'gemini', key: '', model: '' };
const MODELS = { gemini: 'gemini-2.0-flash', anthropic: 'claude-haiku-5-5', openai: 'gpt-4o-mini' };
const PROVIDERS = { gemini: 'Google Gemini', anthropic: 'Anthropic Claude', openai: 'OpenAI' };
const VIEWS = ['home', 'active', 'done', 'learn', 'tasks', 'media', 'reports', 'settings', 'money', 'clients', 'guide', 'files', 'leads', 'upwork'];
const ACTS = { tasks: ['list', 'count', 'delete', 'complete', 'reopen', 'move', 'pin', 'unpin', 'priority'], one: ['rename', 'reopen', 'priority', 'pin', 'complete', 'delete'], projects: ['list', 'count'], clients: ['list', 'count'], project: ['open'] };
const cfg = () => { try { return Object.assign({}, DEFAULTS, JSON.parse(root.localStorage.getItem(KEY) || '{}')); } catch (e) { return Object.assign({}, DEFAULTS); } };
const save = o => { try { root.localStorage.setItem(KEY, JSON.stringify(Object.assign(cfg(), o))); } catch (e) {} };
const enabled = () => { const c = cfg(); return !!(c.on && c.key && c.key.length > 8); };
const modelOf = c => (c.model || '').trim() || MODELS[c.provider] || MODELS.gemini;
const cl = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n || 200);

const SYSTEM = [
  'You are the command brain of "My Smart Assistant", an Arabic-first personal task/project manager. The user speaks Egyptian Arabic (voice-to-text, so expect typos and slips).',
  'Turn the user sentence into a PLAN. Reply with ONE JSON object only, no markdown: {"say":"short friendly reply in Egyptian Arabic","ops":[...]}.',
  'Allowed ops (anything else is ignored):',
  '{"op":"tasks","act":"list|count|delete|complete|reopen|move|pin|unpin|priority","filter":{"type":"task|note|both","status":"any|open|done","due":"|has|none|today|overdue|week|nextweek|month|date:YYYY-MM-DD","text":"","pinned":null,"prio":"|high|low","ids":[],"not":{same filter shape}},"set":{"date":"YYYY-MM-DD","time":"HH:MM","prio":"urgent|high|normal|low"}}',
  '{"op":"add","task":{"title":"","type":"task|note","date":"YYYY-MM-DD","time":"HH:MM","priority":"urgent|high|normal|low","desc":""}}',
  '{"op":"one","act":"rename|reopen|priority|pin|complete|delete","query":"words of the item title","value":"new title or priority"}',
  '{"op":"go","view":"' + VIEWS.join('|') + '"}  {"op":"project","act":"open","query":""}  {"op":"projects","act":"list|count"}  {"op":"clients","act":"list|count"}  {"op":"search","query":""}  {"op":"summary"}  {"op":"theme","value":"dark|light"}  {"op":"lang","value":"ar|en"}  {"op":"say","text":""}',
  'Rules: prefer filters over ids. Use "not" for "except / keep only". Resolve relative dates from TODAY given below. Never invent tasks or data; answer questions only from the CONTEXT. Destructive ops are confirmed by the app, so do not ask for confirmation yourself.',
  'If the request cannot be done with these ops, return {"say":"<explain briefly in Egyptian Arabic what is not possible>","ops":[]}. Keep "say" under 200 characters.'
].join('\n');

function contextOf(state, now, toMs){
  const key = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const tasks = (state.tasks || []).filter(t => !t.routine).slice(0, 80).map(t => ({ id: t.id, t: cl(t.title, 70), k: t.type === 'note' ? 'note' : 'task', s: t.status === 'done' ? 'done' : 'open', due: (() => { const m = toMs ? toMs(t.due) : Date.parse(t.due); return m != null && isFinite(m) ? key(new Date(m)) + (/T23:59/.test(String(t.due)) ? '' : 'T' + String(t.due).slice(11, 16)) : ''; })(), p: t.priority !== 'normal' ? t.priority : undefined, pin: t.pinned ? 1 : undefined }));
  return { today: key(now) + ' ' + days[now.getDay()], tasks, projects: (state.projects || []).slice(0, 40).map(p => cl(p.name, 50)), totalTasks: (state.tasks || []).filter(t => !t.routine).length };
}
function buildRequest(c, text, ctx){
  const user = 'TODAY: ' + ctx.today + '\nCONTEXT: ' + JSON.stringify({ tasks: ctx.tasks, projects: ctx.projects, totalTasks: ctx.totalTasks }) + '\nUSER SAID: ' + cl(text, 600);
  const model = modelOf(c);
  if (c.provider === 'anthropic') return { url: 'https://api.anthropic.com/v1/messages', init: { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': c.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ model, max_tokens: 1500, system: SYSTEM, messages: [{ role: 'user', content: user }] }) } };
  if (c.provider === 'openai') return { url: 'https://api.openai.com/v1/chat/completions', init: { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + c.key }, body: JSON.stringify({ model, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }] }) } };
  return { url: 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', init: { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': c.key }, body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM }] }, contents: [{ role: 'user', parts: [{ text: user }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.1 } }) } };
}
function textOf(provider, j){
  try {
    if (provider === 'anthropic') return (j.content || []).map(x => x.text || '').join('');
    if (provider === 'openai') return j.choices[0].message.content;
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
/* whitelist + shape every op; unknown things are dropped, never executed */
function sanitize(j, state){
  if (!j || typeof j !== 'object') return null;
  const ids = (state && state.tasks || []).map(t => t.id);
  const out = { intent: 'plan', ops: [], say: cl(j.say, 300), ai: true };
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
    else if (op === 'project' && o.act === 'open' && cl(o.query, 120)) out.ops.push({ op, act: 'open', query: cl(o.query, 120) });
    else if ((op === 'projects' || op === 'clients') && ACTS[op].includes(o.act)) out.ops.push({ op, act: o.act });
    else if (op === 'search') out.ops.push({ op, query: cl(o.query, 120) });
    else if (op === 'summary') out.ops.push({ op });
    else if (op === 'theme' && ['dark', 'light'].includes(o.value)) out.ops.push({ op, value: o.value });
    else if (op === 'lang' && ['ar', 'en'].includes(o.value)) out.ops.push({ op, value: o.value });
    else if (op === 'say' && cl(o.text, 300)) out.ops.push({ op, text: cl(o.text, 300) });
  });
  if (!out.ops.length && !out.say) return null;
  return out;
}
async function ask(text, state, now, toMs){
  const c = cfg(); if (!enabled()) return { error: 'off' };
  const ctx = contextOf(state, now, toMs), req = buildRequest(c, text, ctx);
  const ac = typeof AbortController !== 'undefined' ? new AbortController() : null; const tm = setTimeout(() => ac && ac.abort(), 25000);
  try {
    const r = await fetch(req.url, Object.assign({}, req.init, ac ? { signal: ac.signal } : {}));
    if (!r.ok) { let m = ''; try { m = (await r.json()); m = (m.error && (m.error.message || m.error)) || ''; } catch (e) {} return { error: r.status === 401 || r.status === 403 ? 'auth' : r.status === 429 ? 'limit' : 'http', status: r.status, detail: cl(typeof m === 'string' ? m : JSON.stringify(m), 160) }; }
    const j = await r.json(); const plan = sanitize(parseJSON(textOf(c.provider, j)), state);
    return plan ? { plan } : { error: 'parse' };
  } catch (e) { return { error: e && e.name === 'AbortError' ? 'timeout' : 'net' }; }
  finally { clearTimeout(tm); }
}
const api = { cfg, save, enabled, ask, sanitize, buildRequest, textOf, parseJSON, contextOf, MODELS, PROVIDERS, modelOf, SYSTEM };
root.VoiceAI = api; if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
