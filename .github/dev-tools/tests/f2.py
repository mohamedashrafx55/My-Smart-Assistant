import asyncio, json
from h import *

async def main():
    async with Env() as e:
        pg=await e.page(); await pg.wait_for_timeout(2800)
        pid=await pg.evaluate("MSA.state.projects[0].id")
        # ---------- 4. CLIENT IDENTITY ----------
        await pg.evaluate("p=>{const pr=MSA.state.projects[0];pr.client='بن الحارة';MSA.clients.ensure('بن الحارة');MSA.state.ui.project=p;MSA.state.ui.ptab='identity';MSA.go('active')}",pid)
        await pg.wait_for_selector('#idClientCard')
        ok('identity card present',await pg.locator('#idClientCard').count()==1)
        ok('save button enabled (project has identity)',await pg.locator('#idClientCard [data-ic=save]').is_enabled())
        # give the demo project a logo attachment on the 'logo' step to test logo copy
        await pg.evaluate("""async()=>{const p=MSA.state.projects[0];let st=null;MSA.proj.walk(p.steps,s=>{if(s.key==='logo')st=s});
          const svg=new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>'],{type:'image/svg+xml'});
          const f=new File([svg],'logo.svg',{type:'image/svg+xml'});const a=await MSA.files.put(f);st.atts.push(a);MSA.save();return !!st}""")
        n0=await pg.evaluate("MSA.files.all().then(a=>a.length)")
        await pg.click('#idClientCard [data-ic=save]'); await pg.wait_for_timeout(600)
        ok('identity saved to client row',await pg.evaluate("(()=>{const r=MSA.clients.data().rows.find(r=>r.c.name==='بن الحارة');return !!(r&&r.ident&&r.ident.colors.length>=1&&r.ident.fonts.length>=1&&r.ident.logos.length>=1)})()"))
        n1=await pg.evaluate("MSA.files.all().then(a=>a.length)")
        nl=await pg.evaluate("MSA.clients.data().rows.find(r=>r.c.name==='بن الحارة').ident.logos.length"); ok('logo blobs duplicated (independent files)',n1==n0+nl and nl>=1,(n0,n1,nl))
        ok('card shows swatches after save',await pg.locator('#idClientCard .sw-card').count()>=1)
        # new project through the real modal with that client
        await pg.evaluate("MSA.go('active')"); await pg.wait_for_timeout(300)
        await pg.click('[data-act=new]'); await pg.wait_for_selector('#npName')
        await pg.fill('#npName','لوجو بن الحارة الجديد'); await pg.fill('#npClient','بن الحارة')
        await pg.click('.modal .btn.primary'); await pg.wait_for_timeout(900)
        r=await pg.evaluate("""()=>{const p=MSA.state.projects[0];const id=p.identity||{};let ls=null;MSA.proj.walk(p.steps,s=>{if(s.key==='logo')ls=s});
          return {name:p.name,colors:(id.colors||[]).length,fonts:(id.fonts||[]).length,logoAtts:ls?ls.atts.length:-1,applied:p.identApplied,imgs:(id.images||[]).length}}""")
        print(r)
        ok('new project got colors+fonts automatically',r['colors']>=1 and r['fonts']>=1,r)
        ok('new project got logo copies',r['logoAtts']>=nl or r['imgs']>=nl,r)
        # project with other client gets nothing
        await pg.evaluate("MSA.go('active')"); await pg.click('[data-act=new]'); await pg.wait_for_selector('#npName')
        await pg.fill('#npName','شغل عميل تاني'); await pg.fill('#npClient','عميل مختلف'); await pg.click('.modal .btn.primary'); await pg.wait_for_timeout(700)
        ok('other client unaffected',await pg.evaluate("(MSA.state.projects[0].identity||{colors:[]}).colors.length")==0)
        # set client later -> applies
        await pg.evaluate("MSA.state.ui.ptab='plan'"); 
        await pg.evaluate("async()=>{const p=MSA.state.projects[0];p.client='بن الحارة';await MSA.plus.autoIdent(p)}")
        ok('late client assignment applies identity',await pg.evaluate("MSA.state.projects[0].identity.colors.length")>=1)
        # idempotent
        c1=await pg.evaluate("MSA.state.projects[0].identity.colors.length"); await pg.evaluate("async()=>{await MSA.plus.applyIdent(MSA.state.projects[0],true)}")
        ok('apply is idempotent',await pg.evaluate("MSA.state.projects[0].identity.colors.length")==c1)
        n3=await pg.evaluate("MSA.files.all().then(a=>a.length)")
        # delete identity
        await pg.evaluate("p=>{MSA.state.ui.project=p;MSA.state.ui.ptab='identity';MSA.go('active')}",pid); await pg.wait_for_selector('#idClientCard [data-ic=del]')
        await pg.click('#idClientCard [data-ic=del]'); await pg.wait_for_selector('.modal .btn.primary'); await pg.click('.modal .btn.primary'); await pg.wait_for_timeout(400)
        ok('identity deleted',await pg.evaluate("!MSA.clients.data().rows.find(r=>r.c.name==='بن الحارة').ident"))
        n2=await pg.evaluate("MSA.files.all().then(a=>a.length)"); ok('client logo files cleaned',n2==n3-nl,(n3,n2,nl))
        # no client -> hint
        await pg.evaluate("MSA.state.projects.find(p=>p.id==='%s').client=''; MSA.state.projects.find(p=>p.id==='%s').time.client='';MSA.rerender(true)"%(pid,pid)); await pg.wait_for_timeout(300)
        ok('no-client hint+button',await pg.locator('#idClientCard [data-ic=client]').count()==1)

        # ---------- 5. STAGE DEADLINES ----------
        await pg.evaluate("p=>{MSA.state.ui.project=p;MSA.state.ui.ptab='plan';MSA.state.ui.projView='list';MSA.go('active')}",pid); await pg.wait_for_selector('[data-act=dl]')
        info=await pg.evaluate("p=>{const pr=MSA.state.projects.find(x=>x.id===p);return {leaves:pr.steps.flatMap(MSA.proj.leaves).length,done:pr.steps.flatMap(MSA.proj.leaves).filter(s=>s.done).length}}",pid); print(info)
        await pg.click('[data-act=dl]'); await pg.wait_for_selector('#dlS')
        fut=await pg.evaluate("MSA.u.dateKey(new Date(Date.now()+20*864e5))")
        await pg.fill('#dlE',fut); await pg.dispatch_event('#dlE','change')
        ok('preview text',len(await pg.inner_text('#dlPrev'))>10)
        nt0=await pg.evaluate("MSA.state.tasks.length")
        await pg.click('.modal .btn.primary'); await pg.wait_for_timeout(500)
        r=await pg.evaluate("""p=>{const pr=MSA.state.projects.find(x=>x.id===p);const L=pr.steps.flatMap(MSA.proj.leaves).filter(s=>!s.done);
          const ds=L.map(s=>s.due);return {n:L.length,first:ds[0],last:ds[ds.length-1],sorted:ds.every((d,i)=>i==0||d>=ds[i-1]),all:ds.every(Boolean),deliver:pr.deliver,tasks:MSA.state.tasks.filter(t=>t.src&&t.src.pid===p).length}}""",pid)
        print(r)
        ok('every open stage has date',r['all'] and r['n']>0); ok('dates ascending',r['sorted']); ok('last stage = delivery date',r['last']==fut and r['deliver']==fut)
        ok('one task per stage',r['tasks']==r['n'],r)
        ok('chips shown in list',await pg.locator('.step .due-chip').count()>=r['n'])
        # map view chips
        await pg.evaluate("MSA.state.ui.projView='map';MSA.rerender(true)"); await pg.wait_for_selector('.mnode'); await pg.wait_for_timeout(500)
        ok('chips shown on map nodes',await pg.locator('.mnode .due-chip').count()>=1)
        # sync: complete a stage -> its task closes
        sid=await pg.evaluate("p=>{const pr=MSA.state.projects.find(x=>x.id===p);const s=pr.steps.flatMap(MSA.proj.leaves).find(s=>!s.done);MSA.proj.setDone(s,true);MSA.save();return s.id}",pid)
        await pg.wait_for_timeout(4800)
        ok('finished stage closes its task',await pg.evaluate("s=>MSA.state.tasks.find(t=>t.src&&t.src.sid===s).status",sid)=='done')
        await pg.evaluate("([p,s])=>{const pr=MSA.state.projects.find(x=>x.id===p);MSA.proj.setDone(MSA.proj.find(pr.steps,s).step,false);MSA.save()}",[pid,sid]); await pg.wait_for_timeout(4800)
        ok('un-ticking re-opens it',await pg.evaluate("s=>MSA.state.tasks.find(t=>t.src&&t.src.sid===s).status",sid)=='todo')
        # redistribute doesn't duplicate tasks
        await pg.evaluate("MSA.go('active')"); await pg.wait_for_selector('[data-act=dl]'); await pg.click('[data-act=dl]'); await pg.wait_for_selector('#dlS'); await pg.click('.modal .btn.primary'); await pg.wait_for_timeout(500)
        ok('re-distribute no duplicates',await pg.evaluate("p=>MSA.state.tasks.filter(t=>t.src&&t.src.pid===p).length",pid)==r['n'])
        # invalid range
        await pg.click('[data-act=dl]'); await pg.wait_for_selector('#dlS'); await pg.fill('#dlE','2000-01-01'); await pg.click('.modal .btn.primary'); await pg.wait_for_timeout(200)
        ok('invalid range rejected (modal stays)',await pg.locator('#dlS').count()==1); 
        await pg.keyboard.press('Escape')
        # clear
        await pg.click('[data-act=dl]'); await pg.wait_for_selector('#dlS'); await pg.click('.modal .btn.ghost:has-text("مسح")'); await pg.wait_for_timeout(300)
        ok('cleared dates+tasks',await pg.evaluate("p=>{const pr=MSA.state.projects.find(x=>x.id===p);return !pr.deliver&&MSA.state.tasks.filter(t=>t.src&&t.src.pid===p&&t.status!=='done').length===0}",pid))
        # skip Friday option
        r=await pg.evaluate("""p=>{const pr=MSA.state.projects.find(x=>x.id===p);const s=MSA.u.dateKey(new Date());const e=MSA.u.dateKey(new Date(Date.now()+30*864e5));
          MSA.plus.applyDeadlines(pr,{start:s,end:e,tasks:false,skipFri:true});const L=pr.steps.flatMap(MSA.proj.leaves).filter(s=>s.due);
          return L.filter(x=>new Date(x.due+'T00:00').getDay()===5).length}""",pid)
        ok('skip-friday honoured',r==0,r)
        # project delete removes linked open tasks
        await pg.evaluate("p=>MSA.plus.applyDeadlines(MSA.state.projects.find(x=>x.id===p),{start:MSA.u.dateKey(new Date()),end:MSA.u.dateKey(new Date(Date.now()+9*864e5)),tasks:true})",pid)
        await pg.evaluate("p=>{MSA.state.projects=MSA.state.projects.filter(x=>x.id!==p)}",pid); await pg.wait_for_timeout(4500)
        ok('orphan stage tasks removed after project delete',await pg.evaluate("p=>MSA.state.tasks.filter(t=>t.src&&t.src.pid===p).length",pid)==0)
        await pg.wait_for_timeout(300)
        ok('f2 no errors',not pg.errs,pg.errs)
    return summary()
asyncio.run(main())
