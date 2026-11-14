import asyncio, json
from h import *
MOCK="""
window.__ln={sched:[],cancel:[],perm:'prompt',chan:0,pend:[],ls:{}};
const L=window.__ln;
window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',Plugins:{LocalNotifications:{
 checkPermissions:async()=>({display:L.perm}),requestPermissions:async()=>{L.perm='granted';return {display:'granted'}},
 createChannel:async()=>{L.chan++},getPending:async()=>({notifications:L.pend.slice()}),
 cancel:async o=>{L.cancel.push(o.notifications.map(n=>n.id));L.pend=L.pend.filter(p=>!o.notifications.some(n=>n.id===p.id))},
 schedule:async o=>{o.notifications.forEach(n=>{L.sched.push(n);L.pend.push({id:n.id})})},
 addListener:(n,f)=>{L.ls[n]=f;return {remove(){}}},checkExactNotificationSetting:async()=>({exact_alarm:'granted'}),changeExactNotificationSetting:async()=>{}}}};
"""
async def main():
    async with Env() as e:
        # web: no native -> nothing breaks
        pw=await e.page(lang='ar'); ok('web: alarms inactive but present', await pw.evaluate("MSA.alarms.native()===false&&typeof MSA.alarms.plan==='function'"))
        await pw.evaluate("MSA.openSettings()"); await pw.wait_for_timeout(400); ok('web: settings section', await pw.locator('#alTest').count()==1 and await pw.locator('#alExact').count()==0)
        ok('web no errors', not pw.errs, pw.errs[:3])
        # native mock
        ctx=await e.b.new_context(viewport={'width':390,'height':780}); pg=await ctx.new_page(); pg.errs=[]
        pg.on('pageerror',lambda x: pg.errs.append(str(x)))
        await pg.add_init_script("try{localStorage.setItem('msa_clean_v1','kept');localStorage.setItem('msa_daily_m',new Date().toLocaleDateString('en-CA'));localStorage.setItem('msa_daily_n',new Date().toLocaleDateString('en-CA'))}catch(e){}"); await pg.add_init_script(MOCK)
        await pg.route('**/*',lambda r: r.continue_() if r.request.url.startswith('http://localhost') or r.request.url.startswith('data:') or r.request.url.startswith('blob:') else r.abort())
        await pg.goto(URL); await pg.wait_for_selector('#lkPw',timeout=8000); await pg.fill('#lkPw','Akademia'); await pg.keyboard.press('Enter'); await pg.wait_for_selector('#app:not([hidden])'); await pg.wait_for_timeout(500)
        ok('native detected', await pg.evaluate("MSA.alarms.native()"))
        await pg.evaluate("""()=>{const k=n=>new Date(Date.now()+n*3600000);const f=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+'T'+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
          MSA.state.tasks=[];const b=MSA.tasksApi.blank;
          MSA.state.tasks.push(b({title:'تسليم اللوجو',due:f(k(5)),remind:'60'}));
          MSA.state.tasks.push(b({title:'قديمة',due:f(k(-30)),remind:'10'}));
          MSA.state.tasks.push(b({title:'مخلّصة',due:f(k(6)),remind:'10',status:'done'}));
          MSA.state.tasks.push(b({title:'بدون تذكير',due:f(k(7))}));
          MSA.state.tasks.push(b({title:'مخصص',due:'',remind:'custom',remindAt:f(k(3))}));
          MSA.state.settings.daily={on:true,time:'08:00'};MSA.save()}""")
        r=await pg.evaluate("MSA.alarms.sync(false).then(()=>({s:__ln.sched.map(n=>[n.id,n.title,n.schedule.at.getTime()-Date.now()>0,n.channelId]),perm:__ln.perm,chan:__ln.chan}))")
        titles=[x[1] for x in r['s']]
        ok('permission asked', r['perm']=='granted'); ok('channel created', r['chan']>=1)
        ok('only future open reminders scheduled', 'تسليم اللوجو' in titles and 'مخصص' in titles and not any(t in titles for t in ['قديمة','مخلّصة','بدون تذكير']), titles)
        ok('daily alerts scheduled', sum(1 for x in r['s'] if x[0]<200)>=1, r['s'])
        ok('all in future', all(x[2] for x in r['s']))
        # change -> reschedule and cancel previous
        n0=await pg.evaluate("__ln.sched.length"); await pg.evaluate("MSA.state.tasks[0].title='تسليم معدّل';MSA.save()"); await pg.wait_for_timeout(5500)
        r2=await pg.evaluate("({c:__ln.cancel.length,t:__ln.sched.map(n=>n.title)})")
        ok('edit reschedules (cancel old)', r2['c']>=1 and 'تسليم معدّل' in r2['t'], r2)
        # no-change => no re-schedule
        n1=await pg.evaluate("__ln.sched.length"); await pg.evaluate("MSA.alarms.sync(false)"); await pg.wait_for_timeout(500)
        ok('unchanged plan not rescheduled', await pg.evaluate("__ln.sched.length")==n1)
        # test button + exact alarm
        await pg.evaluate("MSA.openSettings()"); await pg.wait_for_timeout(500)
        ok('settings has test + exact buttons', await pg.locator('#alTest').count()==1 and await pg.locator('#alExact').count()==1)
        await pg.click('#alTest'); await pg.wait_for_timeout(400)
        ok('test alert scheduled (id 99)', await pg.evaluate("__ln.sched.some(n=>n.id===99)"))
        await pg.click('#alExact'); await pg.wait_for_timeout(300)
        ok('status line counts', 'مجدولة' in await pg.inner_text('#alStat'))
        # tap listener
        ok('tap listener registered', await pg.evaluate("typeof __ln.ls.localNotificationActionPerformed==='function'"))
        await pg.evaluate("__ln.ls.localNotificationActionPerformed({notification:{extra:{today:true}}})"); await pg.wait_for_timeout(1000)
        ok('tap on daily opens today panel', await pg.evaluate("!!document.querySelector('#overlayRoot .overlay, #msaBoard, .modal')"))
        ok('native no errors', not pg.errs, pg.errs[:3])
    return summary()
import sys; sys.exit(asyncio.run(main()))
