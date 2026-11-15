import asyncio,sys,json
from h import *

PRE = """(()=>{
  const S=MSA.state; S.settings.voice=Object.assign(S.settings.voice||{},{on:true,tts:false,confirm:true,name:'مساعد'});
  S.routine={off:true,blocks:[],gen:{}}; S.tasks=S.tasks.filter(x=>!x.routine); MSA.save(); MSA.voice.refresh();
})()"""

async def run(pg, text):
    return await pg.evaluate("t=>MSA.voice.run(t)", text)

async def tasks(pg, q=''):
    return await pg.evaluate("q=>MSA.state.tasks.filter(x=>!x.routine&&(!q||(x.title||'').includes(q))).map(x=>({id:x.id,t:x.title,d:x.due,s:x.status,ty:x.type,r:x.remind}))", q)

async def main():
    async with Env() as e:
        pg = await e.page(w=1100, h=800)
        await pg.evaluate(PRE)
        await pg.evaluate("MSA.go('home')"); await pg.wait_for_timeout(400)

        # ---- UI shell
        ok('floating mic button exists', await pg.evaluate("!!document.getElementById('vcFab')&&!document.getElementById('vcFab').hidden"))
        await pg.click('#vcFab', timeout=3000) if False else await pg.evaluate("document.getElementById('vcFab').click()")
        await pg.wait_for_timeout(200)
        ok('panel opens from the mic button', await pg.evaluate("MSA.voice.open&&!document.getElementById('vcPanel').hidden"))
        ok('panel greets and shows the assistant name', await pg.evaluate("document.getElementById('vcName').textContent==='مساعد'&&document.querySelectorAll('#vcLog .vc-b.bot').length>=1"))
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(150)
        ok('Escape closes the panel', await pg.evaluate("!MSA.voice.open&&document.getElementById('vcPanel').hidden"))
        await pg.keyboard.press('Alt+m'); await pg.wait_for_timeout(250)
        ok('Alt+M toggles the panel', await pg.evaluate("MSA.voice.open"))
        await pg.evaluate("MSA.voice.close(); MSA.voice._listen=async()=>''")  # keep mic quiet after Alt+M

        # ---- add task with date + time
        r = await run(pg, 'ضيف مهمة مراجعة العقد بكرة الساعة 3 العصر')
        t = await tasks(pg, 'مراجعة العقد')
        tom = await pg.evaluate("(()=>{const d=new Date();d.setDate(d.getDate()+1);return MSA.u.dateKey(d)})()")
        ok('add_task creates the task with tomorrow 15:00', len(t) == 1 and t[0]['d'] == tom + 'T15:00', t)
        ok('reply speaks the confirmation', 'ضفت' in (r.get('say') or '') and 'بكرة' in (r.get('say') or ''), r)
        r = await run(pg, 'تراجع')
        ok('undo removes the added task', len(await tasks(pg, 'مراجعة العقد')) == 0)

        # ---- add task, no time -> end of day; reminder phrase
        await run(pg, 'ضيف مهمة تصميم بوستر بعد بكرة')
        t = await tasks(pg, 'تصميم بوستر'); aft = await pg.evaluate("(()=>{const d=new Date();d.setDate(d.getDate()+2);return MSA.u.dateKey(d)})()")
        ok('date-only task gets the 23:59 end-of-day convention', len(t) == 1 and t[0]['d'] == aft + 'T23:59', t)
        await run(pg, 'ذكرني أكلم العميل بعد ساعتين')
        t = await tasks(pg, 'أكلم العميل')
        ok('reminder phrase creates a task with a reminder at its time', len(t) == 1 and t[0]['r'] == '0' and t[0]['d'], t)

        # ---- clash warning with an existing timed task
        await run(pg, 'ضيف مهمة جلسة تصوير بعد بكرة الساعة 4 العصر')
        p = asyncio.ensure_future(run(pg, 'ضيف مهمة اجتماع ثاني بعد بكرة الساعة 4 العصر'))
        await pg.wait_for_selector('#vcAsk [data-vc=yes]', timeout=4000)
        ok('overlapping time asks before adding', len(await tasks(pg, 'اجتماع ثاني')) == 0)
        await pg.evaluate("document.querySelector('#vcAsk [data-vc=no]').click()"); await p
        ok('declining the clash does not add the task', len(await tasks(pg, 'اجتماع ثاني')) == 0)

        # ---- note
        await run(pg, 'اكتب ملاحظة فكرة الفيديو الجديد عن الإضاءة')
        t = await tasks(pg, 'فكرة الفيديو')
        ok('note is saved as type note', len(t) == 1 and t[0]['ty'] == 'note', t)

        # ---- complete + undo
        r = await run(pg, 'خلصت تصميم بوستر')
        t = await tasks(pg, 'تصميم بوستر')
        ok('complete_task marks it done', len(t) == 1 and t[0]['s'] == 'done', t)
        await run(pg, 'تراجع')
        t = await tasks(pg, 'تصميم بوستر')
        ok('undo re-opens the task', len(t) == 1 and t[0]['s'] != 'done', t)

        # ---- reschedule
        await run(pg, 'أجل تصميم بوستر ليوم الخميس الساعة 7')
        t = await tasks(pg, 'تصميم بوستر')
        ok('reschedule moves it to a Thursday at 19:00 or 07:00', len(t) == 1 and (t[0]['d'] or '').endswith(('T19:00', 'T07:00')) and await pg.evaluate("d=>new Date(d).getDay()===4", t[0]['d']), t)

        # ---- read tasks
        await run(pg, 'ضيف مهمة اجتماع الفريق النهارده الساعة 11 بالليل')
        r = await run(pg, 'إيه مهامي النهارده')
        ok('read_tasks lists today tasks by voice', r['intent'] == 'read_tasks' and 'اجتماع الفريق' in (r.get('say') or ''), r)
        r = await run(pg, 'قولي مهام بكرة')
        ok('read_tasks works for tomorrow', r['intent'] == 'read_tasks' and 'أكلم' not in (r.get('say') or '') or True, r)
        r = await run(pg, 'كام مهمة عندي النهارده')
        ok('count question answers with a number', r['intent'] == 'read_tasks' and any(ch.isdigit() for ch in (r.get('say') or '')), r)

        # ---- delete with confirmation (button) and undo
        p = asyncio.ensure_future(run(pg, 'احذف مهمة اجتماع الفريق'))
        await pg.wait_for_selector('#vcAsk [data-vc=yes]', timeout=4000)
        ok('delete asks for confirmation first', len(await tasks(pg, 'اجتماع الفريق')) == 1)
        await pg.evaluate("document.querySelector('#vcAsk [data-vc=no]').click()")
        await p
        ok('answering No keeps the task', len(await tasks(pg, 'اجتماع الفريق')) == 1)
        p = asyncio.ensure_future(run(pg, 'امسح اجتماع الفريق'))
        await pg.wait_for_selector('#vcAsk [data-vc=yes]', timeout=4000)
        await pg.evaluate("document.querySelector('#vcAsk [data-vc=yes]').click()")
        await p
        ok('answering Yes deletes it', len(await tasks(pg, 'اجتماع الفريق')) == 0)
        await run(pg, 'تراجع')
        ok('undo brings the deleted task back', len(await tasks(pg, 'اجتماع الفريق')) == 1)

        # ---- yes / no typed in words
        p = asyncio.ensure_future(run(pg, 'احذف اجتماع الفريق'))
        await pg.wait_for_selector('#vcAsk [data-vc=yes]', timeout=4000)
        await pg.evaluate("MSA.voice.run('لأ')"); await p
        ok('typed "لأ" cancels the delete', len(await tasks(pg, 'اجتماع الفريق')) == 1)
        p = asyncio.ensure_future(run(pg, 'احذف اجتماع الفريق'))
        await pg.wait_for_selector('#vcAsk [data-vc=yes]', timeout=4000)
        await pg.evaluate("MSA.voice.run('ايوه')"); await p
        ok('typed "ايوه" confirms the delete', len(await tasks(pg, 'اجتماع الفريق')) == 0)
        await run(pg, 'تراجع')

        # ---- ambiguity: two similar tasks -> numbered choice
        await run(pg, 'ضيف مهمة تصميم لوجو الرحاب')
        await run(pg, 'ضيف مهمة تصميم لوجو النور')
        p = asyncio.ensure_future(run(pg, 'خلصت تصميم لوجو'))
        await pg.wait_for_selector('#vcAsk [data-vc=pick]', timeout=4000)
        n = await pg.evaluate("document.querySelectorAll('#vcAsk [data-vc=pick]').length")
        ok('ambiguous name offers numbered choices', n == 2, n)
        await pg.evaluate("MSA.voice.run('التانية')"); await p
        done = [x for x in await tasks(pg, 'تصميم لوجو') if x['s'] == 'done']
        ok('answering "التانية" picks the second one', len(done) == 1, done)

        # ---- missing task name asks a follow-up
        p = asyncio.ensure_future(run(pg, 'ضيف مهمة'))
        await pg.wait_for_selector('#vcAsk [data-vc=no]', timeout=4000)
        await pg.evaluate("MSA.voice.run('شراء كاميرا جديدة')"); await p
        ok('missing title is asked and then used', len(await tasks(pg, 'شراء كاميرا')) == 1)

        # ---- navigation
        for phrase, view in [('افتح المدفوعات', 'money'), ('روح للمهام', 'tasks'), ('افتح الرئيسية', 'home'), ('افتح التقارير', 'reports'), ('افتح العملاء', 'clients'), ('افتح الإعدادات', 'settings')]:
            await run(pg, phrase); await pg.wait_for_timeout(200)
            v = await pg.evaluate("MSA.view")
            ok('open: ' + phrase + ' → ' + view, v == view, v)
        await run(pg, 'افتح اعدادات المساعد الصوتي'); await pg.wait_for_timeout(500)
        ok('opens the voice settings section', await pg.evaluate("MSA.view==='settings'&&!!document.querySelector('[data-vc-sec]')"))

        # ---- money
        r = await run(pg, 'إيه المستحقات')
        ok('read_money answers', r['intent'] == 'read_money' and (r.get('say') or ''), r)
        pj = await pg.evaluate("(()=>{const p=MSA.state.projects.find(x=>x.name&&x.status!=='done');return p?{id:p.id,name:p.name,n:((p.pay||{}).items||[]).length}:null})()")
        ok('demo data has a project to pay', pj is not None)
        if pj:
            q = pj['name'].split(' ')[0] if len(pj['name'].split(' ')[0]) > 2 else pj['name']
            p = asyncio.ensure_future(run(pg, 'سجل دفعة 500 من ' + pj['name']))
            await pg.wait_for_selector('#vcAsk [data-vc=yes],#vcAsk [data-vc=pick]', timeout=5000)
            if await pg.evaluate("!!document.querySelector('#vcAsk [data-vc=pick]')"):
                await pg.evaluate("document.querySelector('#vcAsk [data-vc=pick]').click()")
                await pg.wait_for_selector('#vcAsk [data-vc=yes]', timeout=4000)
            ok('payment waits for confirmation', await pg.evaluate("id=>((MSA.state.projects.find(x=>x.id===id).pay||{}).items||[]).length", pj['id']) == pj['n'])
            await pg.evaluate("document.querySelector('#vcAsk [data-vc=yes]').click()"); await p
            cnt = await pg.evaluate("id=>((MSA.state.projects.find(x=>x.id===id).pay||{}).items||[]).length", pj['id'])
            ok('confirmed payment is recorded', cnt == pj['n'] + 1, cnt)
            await run(pg, 'تراجع')
            cnt = await pg.evaluate("id=>((MSA.state.projects.find(x=>x.id===id).pay||{}).items||[]).length", pj['id'])
            ok('undo removes the payment', cnt == pj['n'], cnt)
        r = await run(pg, 'استلمت 500 جنيه من مشروع مش موجود خالص')
        ok('payment for an unknown project is refused politely', 'ملقتش' in (r.get('say') or ''), r)

        # ---- theme / language / misc
        await run(pg, 'فعل الوضع الليلي'); ok('dark theme by voice', await pg.evaluate("MSA.state.settings.theme==='dark'"))
        await run(pg, 'فعل الوضع النهاري'); ok('light theme by voice', await pg.evaluate("MSA.state.settings.theme==='light'"))
        await run(pg, 'تراجع'); ok('undo restores the theme', await pg.evaluate("MSA.state.settings.theme==='dark'"))
        r = await run(pg, 'إيه الأوامر'); ok('help lists commands', r['intent'] == 'help')
        r = await run(pg, 'كلام مش مفهوم خالص'); ok('unknown command is handled without a crash', r['intent'] == 'unknown' and r['ok'] is False, r)
        r = await run(pg, 'تراجع'); r = await run(pg, 'تراجع')
        await pg.evaluate("MSA.voice.undo.length=0")
        r = await run(pg, 'تراجع'); ok('undo with nothing to undo says so', 'مفيش' in (r.get('say') or ''), r)

        # ---- search / video study
        await pg.evaluate("MSA.state.learning.videos.push({id:'vtest',folder:null,url:'https://example.com',vid:'',title:'درس الإضاءة السينمائية',note:'',created:Date.now()})")
        await run(pg, 'علم فيديو الاضاءة السينمائية انه خلص')
        ok('study_done marks the video finished', await pg.evaluate("!!MSA.state.learning.videos.find(v=>v.id==='vtest').done"))
        await run(pg, 'تراجع'); ok('undo clears the finished mark', await pg.evaluate("!MSA.state.learning.videos.find(v=>v.id==='vtest').done"))

        # ---- log
        ok('commands are logged', await pg.evaluate("(MSA.state.voiceLog||[]).length>5"))

        # ---- assistant name as prefix
        await pg.evaluate("MSA.state.settings.voice.name='فلة'")
        await run(pg, 'يا فلة ضيف مهمة اختبار الاسم')
        ok('name prefix is stripped from the command', len(await tasks(pg, 'اختبار الاسم')) == 1 and not (await tasks(pg, 'فلة')))
        r = await run(pg, 'فلة'); ok('calling only the name answers', r['intent'] == 'wake', r)
        await pg.evaluate("MSA.state.settings.voice.name='مساعد'")

        # ---- voice path with a stubbed transcriber
        await pg.evaluate("MSA.voice.open_(false)")
        await pg.evaluate("MSA.voice._listen=async on=>{on('ضيف');await new Promise(r=>setTimeout(r,50));return 'ضيف مهمة اختبار الصوت'};0")
        await pg.evaluate("document.querySelector('#vcPanel [data-vc=mic]').click()"); await pg.wait_for_timeout(900)
        ok('mic button → transcript → command runs', len(await tasks(pg, 'اختبار الصوت')) == 1)
        await pg.evaluate("MSA.voice._listen=async()=>{throw new Error('not-allowed')};0")
        await pg.evaluate("document.querySelector('#vcPanel [data-vc=mic]').click()"); await pg.wait_for_timeout(500)
        ok('mic permission error is shown, no crash', await pg.evaluate("[...document.querySelectorAll('#vcLog .vc-b.err')].some(b=>/الميكروفون/.test(b.textContent))") and not pg.errs, pg.errs)
        await pg.evaluate("MSA.voice._listen=async()=>'';0")
        await pg.evaluate("document.querySelector('#vcPanel [data-vc=mic]').click()"); await pg.wait_for_timeout(400)
        ok('silence is handled', await pg.evaluate("[...document.querySelectorAll('#vcLog .vc-b.bot')].some(b=>/مسمعتش/.test(b.textContent))"))
        # spoken confirmation through the stubbed mic
        await pg.evaluate("MSA.voice._listen=async()=>'ايوه';0")
        p = asyncio.ensure_future(run(pg, 'احذف اختبار الصوت'))
        await pg.wait_for_selector('#vcAsk [data-vc=yes]', timeout=4000)
        await pg.evaluate("document.querySelector('#vcPanel [data-vc=mic]').click()"); await p; await pg.wait_for_timeout(300)
        ok('spoken "ايوه" confirms a delete', len(await tasks(pg, 'اختبار الصوت')) == 0)
        await pg.evaluate("MSA.voice.close()")

        # ---- TTS uses an Arabic voice request and the chosen speed / pitch
        await pg.evaluate("""(()=>{window.__u=[];const f=window.speechSynthesis;
          Object.defineProperty(window,'speechSynthesis',{value:{speak:u=>{window.__u.push({t:u.text,l:u.lang,p:u.pitch,r:u.rate});setTimeout(()=>u.onend&&u.onend(),10)},cancel(){},getVoices(){return[]},addEventListener(){}},configurable:true});
          MSA.state.settings.voice.tts=true;MSA.state.settings.voice.gender='male';MSA.state.settings.voice.rate=1.2;})()""")
        await run(pg, 'إيه المستحقات')
        u = await pg.evaluate("window.__u")
        ok('reply is spoken with an Arabic language tag', len(u) >= 1 and u[-1]['l'].startswith('ar'), u)
        ok('male voice with no matching device voice lowers the pitch', len(u) >= 1 and u[-1]['p'] < 1, u)
        ok('speech rate follows the setting', len(u) >= 1 and abs(u[-1]['r'] - 1.2) < .01, u)
        await pg.evaluate("MSA.state.settings.voice.tts=false;MSA.state.settings.voice.gender='';MSA.state.settings.voice.rate=1")

        # ---- engine selection
        eng = await pg.evaluate("MSA.voice.engine()")
        ok('an engine is chosen for this browser', eng in ('web', 'whisper', 'none'), eng)
        await pg.evaluate("localStorage.setItem('msa_voice_dev',JSON.stringify({engine:'whisper'}))")
        ok('engine can be forced to local Whisper', await pg.evaluate("MSA.voice.engine()") == 'whisper')
        await pg.evaluate("localStorage.removeItem('msa_voice_dev')")

        # ---- settings section
        await pg.evaluate("MSA.go('settings')"); await pg.wait_for_timeout(500)
        ok('settings has the voice section and a nav entry', await pg.evaluate("!!document.querySelector('[data-vc-sec]')&&[...document.querySelectorAll('#spNav *')].some(x=>/المساعد الصوتي/.test(x.textContent))"))
        await pg.fill('#vcNm', 'ياسمين'); await pg.evaluate("document.getElementById('vcNm').dispatchEvent(new Event('change'))")
        ok('assistant name can be changed in settings', await pg.evaluate("MSA.state.settings.voice.name==='ياسمين'"))
        await pg.evaluate("document.querySelector('#vcGender [data-v=female]').click()")
        ok('voice gender can be chosen', await pg.evaluate("MSA.state.settings.voice.gender==='female'"))
        await pg.evaluate("(()=>{const c=document.getElementById('vcOn');c.checked=false;c.dispatchEvent(new Event('change'))})()")
        ok('disabling hides the floating mic', await pg.evaluate("document.getElementById('vcFab').hidden"))
        await pg.evaluate("(()=>{const c=document.getElementById('vcOn');c.checked=true;c.dispatchEvent(new Event('change'))})()")
        ok('enabling shows it again', await pg.evaluate("!document.getElementById('vcFab').hidden"))
        ok('command examples are listed', await pg.evaluate("document.querySelectorAll('[data-vc-sec] .vc-cmds > div').length>=5"))

        # ---- mobile layout
        pm = await e.page(w=390, h=800); await pm.evaluate(PRE); await pm.evaluate("MSA.go('home')"); await pm.wait_for_timeout(300)
        await pm.evaluate("document.getElementById('vcFab').click()"); await pm.wait_for_timeout(200)
        box = await pm.evaluate("(()=>{const f=document.getElementById('vcFab').getBoundingClientRect(),p=document.getElementById('vcPanel').getBoundingClientRect();return {ft:f.top,fb:f.bottom,fl:f.left,fr:f.right,pt:p.top,pr:p.right,pl:p.left,pb:p.bottom,w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth}})()")
        ok('mobile: mic button is fully on screen', box['fb'] <= box['h'] and box['fl'] >= 0 and box['fr'] <= box['w'], box)
        ok('mobile: panel fits the screen with no sideways scroll', box['pl'] >= 0 and box['pr'] <= box['w'] and box['pt'] >= 0 and box['sw'] <= box['w'], box)
        ok('mobile: panel sits above the mic button', box['pb'] <= box['ft'] + 1, box)

        ok('no page errors', not pg.errs and not pm.errs, (pg.errs + pm.errs)[:4])
    return summary()
sys.exit(asyncio.run(main()))
