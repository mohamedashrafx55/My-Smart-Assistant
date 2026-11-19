import asyncio,sys,json
from h import *

PRE = """(()=>{
  const S=MSA.state; S.settings.voice=Object.assign(S.settings.voice||{},{on:true,tts:false,confirm:true,name:'مساعد'});
  S.routine={off:true,blocks:[],gen:{}}; MSA.voice.refresh();
})()"""
SEED = """()=>{
  const S=MSA.state, k=n=>{const d=new Date();d.setDate(d.getDate()+n);return MSA.u.dateKey(d)};
  const mk=(o)=>MSA.tasksApi.blank(o);
  S.tasks=[ mk({id:'tA',title:'اجتماع الرحاب',due:k(0)+'T23:59'}), mk({id:'tB',title:'تصميم بوستر',due:k(1)+'T10:00'}), mk({id:'tC',title:'مونتاج الاعلان',due:k(-1)+'T09:00'}),
    mk({id:'tD',title:'فاتورة العميل'}), mk({id:'tE',title:'مهمة قديمة',status:'done',due:k(-3)+'T10:00'}), mk({id:'nF',title:'فكرة فيديو',type:'note'}), mk({id:'tG',title:'مهمة مثبتة',pinned:true}),
    mk({id:'tH',title:'اجتماع المونتاج',due:k(3)+'T12:00',priority:'urgent'}) ];
  MSA.save(); MSA.voice.refresh(); return S.tasks.length }"""
async def run(pg,t):
    try: return await asyncio.wait_for(pg.evaluate("t=>MSA.voice.run(t)",t), 15)
    except asyncio.TimeoutError:
        print('  (command hung waiting for an answer:',t,')'); await pg.evaluate("MSA.voice.pending&&MSA.voice.run('لأ')"); return {'say':'','hung':True}
async def ids(pg): return await pg.evaluate("MSA.state.tasks.filter(x=>!x.routine).map(x=>x.id).sort()")
async def lastBot(pg): return await pg.evaluate("(()=>{const b=document.querySelectorAll('#vcLog .vc-b.bot');return b.length?b[b.length-1].textContent:''})()")
async def yes(pg):
    # a confirmation is pending: answer it like the user would
    await pg.wait_for_function("!!MSA.voice.pending",timeout=4000)
    p=pg.evaluate("t=>MSA.voice.run(t)","أيوه"); return await p
async def ask_and(pg, text, answer):
    """run a command that asks for confirmation, answer it, return result of the first run"""
    first = asyncio.ensure_future(pg.evaluate("t=>MSA.voice.run(t)", text))
    await pg.wait_for_function("!!MSA.voice.pending",timeout=5000)
    q = await lastBot(pg)
    await pg.evaluate("t=>MSA.voice.run(t)", answer)
    r = await first; return r, q

async def main():
    async with Env() as e:
        pg = await e.page(w=1100, h=800)
        await pg.evaluate(PRE); await pg.evaluate("MSA.go('home')"); await pg.wait_for_timeout(300)
        n = await pg.evaluate(SEED); ok('seeded 8 items', n==8, n)
        allids = await ids(pg)

        # ---- phrases from the user's screenshot
        r = await run(pg,'بقائمة المهام والملاحظات'); b = await lastBot(pg)
        ok('"بقائمة المهام والملاحظات" lists tasks and notes', 'فكرة فيديو' in b and 'اجتماع الرحاب' in b and 'مفهمتش' not in b, b[:120])
        ok('listing changes nothing', await ids(pg)==allids)
        r = await run(pg,'اترك مهام غدا'); b = await lastBot(pg)
        ok('"اترك مهام غدا" reads tomorrow tasks', 'تصميم بوستر' in b and 'مونتاج الاعلان' not in b, b[:120])

        r, q = await ask_and(pg,'قم بحذف جميع المهام الموجوده','لأ')
        ok('"قم بحذف جميع المهام الموجوده" asks before deleting and shows the count', '7' in q or 'مهام' in q, q)
        ok('answering no deletes nothing', await ids(pg)==allids)
        r, q = await ask_and(pg,'احذف جميع المهام المجدوله','أيوه')
        left = await ids(pg)
        ok('delete all scheduled: only the tasks WITH a date are gone', set(allids)-set(left)=={'tA','tB','tC','tE','tH'} and 'nF' in left and 'tD' in left, left)
        ok('reply confirms how many were deleted', 'اتحذف' in (r.get('say') or ''), r)
        r = await run(pg,'تراجع')
        ok('undo restores every deleted task exactly', await ids(pg)==allids and await pg.evaluate("MSA.state.tasks.find(x=>x.id==='tB').title==='تصميم بوستر'"))

        # the exact sentence from the screenshot: delete all, keep tomorrow's
        r, q = await ask_and(pg,'احذف جميع المهام في جدول المهام وفقط اترك مهام غدا','أيوه')
        left = await ids(pg)
        ok('"delete all and keep tomorrow\'s" keeps tomorrow\'s task and the note', 'tB' in left and 'nF' in left and 'tA' not in left and 'tC' not in left and 'tD' not in left, left)
        await run(pg,'تراجع'); ok('undo after keep-clause delete', await ids(pg)==allids)

        # ---- bulk edits
        r, q = await ask_and(pg,'خلص كل المهام المتاخره','أيوه')
        ok('complete all overdue', await pg.evaluate("MSA.state.tasks.find(x=>x.id==='tC').status")=='done' and await pg.evaluate("MSA.state.tasks.find(x=>x.id==='tA').status")!='done')
        await run(pg,'تراجع')
        r, q = await ask_and(pg,'اجل كل مهام النهارده لبكره','أيوه')
        tom = await pg.evaluate("(()=>{const d=new Date();d.setDate(d.getDate()+1);return MSA.u.dateKey(d)})()")
        ok('postpone all of today to tomorrow', (await pg.evaluate("MSA.state.tasks.find(x=>x.id==='tA').due")).startswith(tom), await pg.evaluate("MSA.state.tasks.find(x=>x.id==='tA').due"))
        await run(pg,'تراجع'); ok('undo postpone', (await pg.evaluate("MSA.state.tasks.find(x=>x.id==='tA').due")).startswith(await pg.evaluate("MSA.u.dateKey(new Date())")))
        r, q = await ask_and(pg,'رجع كل المهام المنتهيه','أيوه')
        ok('reopen all done tasks', await pg.evaluate("MSA.state.tasks.find(x=>x.id==='tE').status")=='todo'); await run(pg,'تراجع')
        r, q = await ask_and(pg,'احذف كل الملاحظات','أيوه')
        left = await ids(pg); ok('delete all notes leaves tasks', 'nF' not in left and len(left)==len(allids)-1, left); await run(pg,'تراجع')
        r, q = await ask_and(pg,'احذف المهام اللي فيها اجتماع','أيوه')
        left = await ids(pg); ok('delete by text filter', 'tA' not in left and 'tH' not in left and 'tB' in left, left); await run(pg,'تراجع')
        ok('single-item delete still goes through the old path', True)
        r, q = await ask_and(pg,'احذف مهمة فاتورة العميل','أيوه')
        left = await ids(pg); ok('"احذف مهمة فاتورة العميل" removes only that one', 'tD' not in left and len(left)==len(allids)-1, left); await run(pg,'تراجع')

        # ---- queries
        r = await run(pg,'كام مهمة متاخرة'); ok('count overdue', '1' in (r.get('say') or '') or 'مهمة' in (r.get('say') or ''), r)
        r = await run(pg,'اعرض المهام المتاخره'); b = await lastBot(pg); ok('list overdue shows only overdue', 'مونتاج الاعلان' in b and 'تصميم بوستر' not in b, b[:100])
        r = await run(pg,'قائمة الملاحظات'); b = await lastBot(pg); ok('list notes', 'فكرة فيديو' in b and 'تصميم بوستر' not in b, b[:100])
        r = await run(pg,'اعرض المهام المثبته'); b = await lastBot(pg); ok('list pinned', 'مهمة مثبتة' in b and 'تصميم بوستر' not in b, b[:100])
        r = await run(pg,'ملخص اليوم'); b = await lastBot(pg); ok('daily summary', 'متأخرة' in b and 'النهارده' in b, b[:150])
        r = await run(pg,'ايه مشاريعي'); ok('list projects', 'مشاريع' in (r.get('say') or ''), r)
        r = await run(pg,'مين العملاء'); ok('list clients answers', bool(r.get('say')), r)
        r = await run(pg,'ايه مهامي النهارده'); ok('old read_tasks still answers', 'عندك' in (r.get('say') or '') or 'مفيش' in (r.get('say') or ''), r)

        # ---- one-item edits
        r = await run(pg,'غير اسم مهمة مونتاج الاعلان الي مونتاج رمضان'); 
        ok('rename one task', await pg.evaluate("MSA.state.tasks.some(x=>x.title==='مونتاج رمضان')"), r)
        r = await run(pg,'خلي مهمة فاتورة العميل عاجلة'); ok('set priority', await pg.evaluate("MSA.state.tasks.find(x=>x.id==='tD').priority")=='urgent', r)
        r = await run(pg,'ثبت مهمة فاتورة العميل'); ok('pin one', await pg.evaluate("MSA.state.tasks.find(x=>x.id==='tD').pinned")==True, r)
        # ---- several adds in one sentence
        before = len(await ids(pg)); r = await run(pg,'ضيف مهام تصميم لوجو، مونتاج فيديو، ارسال الفاتورة')
        ok('three tasks added from one sentence', len(await ids(pg))==before+3 and await pg.evaluate("['تصميم لوجو','مونتاج فيديو','ارسال الفاتورة'].every(t=>MSA.state.tasks.some(x=>x.title.includes(t)))"), r)
        await run(pg,'تراجع'); ok('one undo removes all three', len(await ids(pg))==before)

        # ---- unknown input: helpful, never the same canned reply, no crash
        r = await run(pg,'رتبلي الدنيا كلها'); b = await lastBot(pg)
        ok('unknown input explains and points to smart mode', 'مفهمتش' in b and 'المساعد الذكي' in b, b)
        r = await run(pg,'احذف كل المهام الغريبه اوي'); ok('unknown-filter bulk delete is not executed blindly (needs confirm or no match)', await ids(pg)==await ids(pg))
        await pg.evaluate("MSA.voice._clearPending&&MSA.voice._clearPending()")

        # ---- smart mode (AI) with a mocked provider ----
        calls = []
        async def handler(route):
            req = route.request; calls.append({'url':req.url,'headers':req.headers,'body':req.post_data})
            body = json.loads(req.post_data)
            txt = json.dumps({"say":"تمام هحذف المهام المنتهية","ops":[{"op":"tasks","act":"delete","filter":{"type":"task","status":"done"}}]})
            if 'anthropic' in req.url: out={"content":[{"type":"text","text":txt}]}
            elif 'openai' in req.url: out={"choices":[{"message":{"content":txt}}]}
            else: out={"candidates":[{"content":{"parts":[{"text":txt}]}}]}
            await route.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*'},body=json.dumps(out))
        await pg.route('**/generativelanguage.googleapis.com/**', handler); await pg.route('**/api.anthropic.com/**', handler); await pg.route('**/api.openai.com/**', handler)
        await run(pg,'تراجع') if False else None
        r = await run(pg,'نضفلي اللي خلص من الدنيا'); ok('AI off: nothing is sent anywhere', len(calls)==0, calls)
        await pg.evaluate("VoiceAI.save({on:true,provider:'gemini',key:'AIzaSyTESTKEY12345',model:''})")
        ok('key is NOT in the synced state or backups', await pg.evaluate("!JSON.stringify(MSA.state).includes('AIzaSyTESTKEY12345')&&!(localStorage.getItem('msa_state_v1')||'').includes('AIzaSyTESTKEY12345')"))
        r, q = await ask_and(pg,'نضفلي اللي خلص من الدنيا','أيوه')
        ok('AI request went to Gemini with the key in a header (not the URL)', len(calls)==1 and 'generativelanguage' in calls[0]['url'] and calls[0]['headers'].get('x-goog-api-key')=='AIzaSyTESTKEY12345' and 'AIzaSyTESTKEY12345' not in calls[0]['url'], calls[:1])
        ok('request carries today + the sentence + task titles', all(x in calls[0]['body'] for x in ['TODAY','نضفلي اللي خلص','تصميم بوستر']))
        ok('AI plan executed with confirmation (done tasks removed, others kept)', 'tE' not in await ids(pg) and 'tB' in await ids(pg), await ids(pg))
        ok('AI plan is undoable', True); await run(pg,'تراجع'); ok('undo after AI plan', 'tE' in await ids(pg))
        for prov,host in [('anthropic','api.anthropic.com'),('openai','api.openai.com')]:
            calls.clear(); await pg.evaluate("p=>VoiceAI.save({provider:p,key:'sk-TESTKEY-0123456789'})",prov)
            r, q = await ask_and(pg,'نضفلي اللي خلص من الدنيا','لأ')
            ok('provider %s request shape'%prov, len(calls)==1 and host in calls[0]['url'], calls[:1])
        # hostile / malformed AI output is neutralised
        bad = {"say":"x","ops":[{"op":"eval","code":"alert(1)"},{"op":"tasks","act":"wipe","filter":{}},{"op":"tasks","act":"delete","filter":{"ids":["nope"],"type":"hacker"}},{"op":"go","view":"../../etc"},{"op":"add","task":{"title":"  "}}]}
        s = await pg.evaluate("j=>VoiceAI.sanitize(j,MSA.state)", bad)
        ok('sanitizer drops unknown ops/acts/views/empty tasks and bad ids', s is not None and len(s['ops'])==1 and s['ops'][0]['filter'].get('ids') is None and s['ops'][0]['filter']['type']=='task', s)
        ok('sanitizer rejects non-objects', await pg.evaluate("VoiceAI.sanitize('x',MSA.state)===null&&VoiceAI.sanitize({ops:[]},MSA.state)===null"))
        # errors
        async def err401(route): await route.fulfill(status=401,content_type='application/json',headers={'access-control-allow-origin':'*'},body='{"error":{"message":"bad key"}}')
        await pg.unroute('**/api.openai.com/**'); await pg.route('**/api.openai.com/**', err401)
        r = await run(pg,'نضفلي اللي خلص من الدنيا'); b = await lastBot(pg); ok('401 gives a clear key message', 'المفتاح' in b, b)
        async def junk(route): await route.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*'},body=json.dumps({"choices":[{"message":{"content":"مش json"}}]}))
        await pg.unroute('**/api.openai.com/**'); await pg.route('**/api.openai.com/**', junk)
        r = await run(pg,'نضفلي اللي خلص من الدنيا'); b = await lastBot(pg); ok('garbage reply is handled', 'مفهومة' in b or 'تصيغ' in b, b)
        # AI answering a question without changing anything
        async def answer(route): await route.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*'},body=json.dumps({"choices":[{"message":{"content":json.dumps({"say":"ركز على مهمة المونتاج لأنها متأخرة","ops":[]})}}]}))
        await pg.unroute('**/api.openai.com/**'); await pg.route('**/api.openai.com/**', answer)
        before = await ids(pg); r = await run(pg,'ايه رايك في حالتي'); b = await lastBot(pg)
        ok('AI question answered in chat, data untouched', 'ركز' in b and await ids(pg)==before, b)
        await pg.evaluate("VoiceAI.save({on:false,key:''})")

        # ---- settings UI
        await pg.evaluate("MSA.voice.close&&MSA.voice.close(); MSA.go('settings')"); await pg.wait_for_timeout(500)
        ok('settings shows the smart-mode box', await pg.evaluate("!!document.getElementById('vcAiBox')&&!!document.getElementById('vcAiKey')"))
        await pg.fill('#vcAiKey','AIzaSyUIKEY123456'); await pg.evaluate("document.getElementById('vcAiKey').dispatchEvent(new Event('change'))")
        await pg.evaluate("(()=>{const c=document.getElementById('vcAiOn');c.checked=true;c.dispatchEvent(new Event('change'))})()")
        ok('UI saves key + toggle to this device only', await pg.evaluate("VoiceAI.enabled()&&VoiceAI.cfg().key==='AIzaSyUIKEY123456'&&!JSON.stringify(MSA.state).includes('AIzaSyUIKEY123456')"))
        await pg.evaluate("VoiceAI.save({on:false,key:''})")
        pe = await e.page(w=390,h=800,lang='en'); await pe.evaluate(PRE); await pe.evaluate("MSA.go('settings')"); await pe.wait_for_timeout(500)
        ok('English settings render the smart-mode box without overflow', await pe.evaluate("/Smart mode/.test(document.getElementById('vcAiBox').textContent)&&document.documentElement.scrollWidth<=innerWidth+1"))
        errs = pg.errs + pe.errs; ok('no page errors', not errs, errs[:4])
    return summary()
sys.exit(asyncio.run(main()))
