import asyncio, json, zipfile, io
from h import *
async def main():
    async with Env() as e:
        pg=await e.page(lang='ar')
        pid=await pg.evaluate("(()=>{MSA.state.projects.forEach(p=>p.status='active');const p=MSA.state.projects[0];MSA.state.ui.project=p.id;return p.id})()")
        async def tab(t):
            await pg.evaluate("t=>{MSA.state.ui.ptab=t;MSA.save();MSA.go('active');MSA.rerender(false)}",t); await pg.wait_for_timeout(500)
        # tabs
        await tab('plan')
        ok('files tab present', await pg.locator('[data-t=files]').count()==1)
        ok('shots tab hidden for non-video', await pg.locator('[data-t=shots]').count()==0 or await pg.evaluate("MSA.state.projects[0].type&&MSA.tpl.TYPES.find(x=>x[0]===MSA.state.projects[0].type)[1]==='vid'"))
        # revisions
        await pg.evaluate("p=>{const x=MSA.state.projects.find(q=>q.id===p);x.revs=[{id:'r1',name:'D',rounds:[{id:'a',date:'2026-10-01',note:'',done:true,atts:[]}]}];x.rv={agreed:1,fee:100,alerted:0};x.client='عميل';MSA.save()}",pid)
        await tab('revs')
        ok('revision counter card', await pg.locator('.pro-rv').count()==1 and '0 / 1' in await pg.inner_text('.pro-rv'))
        await pg.click('[data-round]'); await pg.wait_for_timeout(400)
        ok('counter 1/1 after one round', '1 / 1' in await pg.inner_text('.pro-rv') and await pg.locator('#rvMsg').count()==0)
        await pg.click('[data-round]'); await pg.wait_for_timeout(500)
        ok('over limit shows alert + message button', await pg.locator('.pro-rv.over').count()==1 and await pg.locator('#rvMsg').count()==1)
        ok('tab badge warns', await pg.locator('[data-t=revs] .cnt').count()>=1)
        await pg.click('#rvMsg'); await pg.wait_for_timeout(200)
        txt=await pg.input_value('#rvTxt'); ok('message has price and counts', ('100' in txt or '١٠٠' in txt) and '2' in txt and 'جولة' in txt, txt)
        await pg.keyboard.press('Escape')
        # paste notes
        await pg.fill('#pnTxt','[25/10/2026, 10:20] Ali: كبّر اللوجو\n- غيّر اللون للأزرق\n3. زوّد المسافة\n\nكبّر اللوجو\n<Media omitted>')
        n0=await pg.evaluate("MSA.state.tasks.length"); await pg.click('#pnGo'); await pg.wait_for_timeout(700)
        r=await pg.evaluate("(p=>({n:MSA.state.tasks.length,t:MSA.state.tasks.slice(0,3).map(x=>x.title),rounds:MSA.state.projects.find(x=>x.id===p).revs.length}))",pid)
        ok('3 unique lines -> 3 tasks', r['n']-n0==3 and set(r['t'])=={'كبّر اللوجو','غيّر اللون للأزرق','زوّد المسافة'}, r)
        ok('notes landed in a round', r['rounds']==2)
        # stage timer / estimate
        await tab('time')
        ok('stage card shows estimates', await pg.locator('[data-est]').count()>3)
        await pg.evaluate("p=>{const x=MSA.state.projects.find(q=>q.id===p);x.time=x.time||{};x.time.rate=100;x.time.fixed=0;MSA.save()}",pid); await tab('time')
        await pg.locator('[data-run]').first.click(); await pg.wait_for_timeout(500)
        ok('timer running', await pg.evaluate("p=>!!MSA.state.projects.find(q=>q.id===p).stt.run",pid))
        await pg.evaluate("p=>{MSA.state.projects.find(q=>q.id===p).stt.run.start-=5*60000}",pid)
        await pg.locator('[data-run]').first.click(); await pg.wait_for_timeout(500)
        r=await pg.evaluate("p=>{const x=MSA.state.projects.find(q=>q.id===p);return [Object.values(x.stt.spent)[0],x.time.entries.length,!!x.stt.run]}",pid)
        ok('stop saves minutes + time entry', r[0]>=5 and r[1]>=1 and r[2]==False, r)
        await pg.locator('#stUse').click(); await pg.wait_for_timeout(500)
        ok('suggested price becomes fixed', await pg.evaluate("p=>MSA.state.projects.find(q=>q.id===p).time.fixed>0",pid))
        # delivery per type
        await pg.evaluate("p=>{const x=MSA.state.projects.find(q=>q.id===p);x.type='reel';delete x.delivery;MSA.save()}",pid); await tab('delivery')
        ok('video checklist created', 'LUFS' in await pg.inner_text('#stHost'))
        await pg.evaluate("p=>{const x=MSA.state.projects.find(q=>q.id===p);x.type='poster';delete x.delivery;MSA.save()}",pid); await tab('delivery')
        ok('print checklist created', 'CMYK' in await pg.inner_text('#stHost'))
        # shots
        await pg.evaluate("p=>{const x=MSA.state.projects.find(q=>q.id===p);x.type='reel';MSA.save()}",pid); await tab('plan')
        ok('shots tab visible for video', await pg.locator('[data-t=shots]').count()==1)
        await tab('shots'); await pg.click('[data-a=adds]'); await pg.click('[data-a=addc]'); await pg.wait_for_timeout(200)
        await pg.locator('[data-c] [data-f=text]').fill('قصّ المشهد'); await pg.locator('[data-c] [data-f=tc]').fill('1:05'); await pg.locator('[data-c] [data-f=tc]').blur()
        ok('comment saved', await pg.evaluate("p=>MSA.state.projects.find(q=>q.id===p).vcom[0].text",pid)=='قصّ المشهد')
        # video notes with timecodes
        await tab('revs'); await pg.fill('#pnTxt','0:45 خفّض الموسيقى\n1:30 - زوّد التباين'); await pg.click('#pnGo'); await pg.wait_for_timeout(600)
        ok('timecoded notes go to comments', await pg.evaluate("p=>MSA.state.projects.find(q=>q.id===p).vcom.length",pid)==3)
        # naming + zip
        await pg.evaluate("p=>{const x=MSA.state.projects.find(q=>q.id===p);x.name='Cafe Menu';x.client='Al Nour';MSA.state.projects.find(q=>q.id===p).steps[0].atts=[]}",pid)
        await pg.evaluate("async p=>{const x=MSA.state.projects.find(q=>q.id===p);const f=new File([new Uint8Array(5000).map((_,i)=>i%251)],'logo final.png',{type:'image/png'});const a=await MSA.files.put(f);x.steps[0].atts.push(a);const g=new File(['hello'],'a.pdf',{type:'application/pdf'});x.steps[0].atts.push(await MSA.files.put(g));MSA.save()}",pid)
        await tab('files')
        names=await pg.inner_text('.pro-names'); ok('naming preview', 'Al_Nour_Cafe_Menu_v1.png' in names, names)
        async with pg.expect_download() as d: await pg.click('#pkGo')
        dl=await d.value; path=await dl.path(); z=zipfile.ZipFile(path)
        ok('zip valid + names', z.testzip() is None and 'README.txt' in z.namelist() and any(n.startswith('Al_Nour_Cafe_Menu_v1_01') for n in z.namelist()), z.namelist())
        ok('zip content intact', z.read([n for n in z.namelist() if n.endswith('.pdf')][0])==b'hello')
        # assets
        await pg.evaluate("()=>{MSA.state.ui.ltab='assets';MSA.save();MSA.go('learn')}"); await pg.wait_for_timeout(500)
        await pg.click('[data-a=add]'); await pg.fill('#asN','Cairo'); await pg.fill('#asG','عربي, خط'); await pg.select_option('#asT','font'); await pg.fill('#asV','https://fonts.example/cairo')
        await pg.locator('.modal .btn.primary').click(); await pg.wait_for_timeout(300)
        await pg.click('[data-a=add]'); await pg.select_option('#asT','color'); await pg.fill('#asN','Brand blue'); await pg.fill('#asV','#1d4ed8'); await pg.fill('#asG','brand')
        await pg.locator('.modal .btn.primary').click(); await pg.wait_for_timeout(300)
        ok('2 assets + swatch', await pg.locator('.pro-asset').count()==2 and await pg.locator('.pro-sw').count()==1)
        await pg.fill('#asQ','cairo'); await pg.wait_for_timeout(200); ok('search filters', await pg.locator('.pro-asset').count()==1)
        await pg.fill('#asQ',''); await pg.click('[data-tg=brand]'); await pg.wait_for_timeout(200); ok('tag filter', await pg.locator('.pro-asset').count()==1)
        # report
        await pg.evaluate("p=>{const x=MSA.state.projects.find(q=>q.id===p);x.status='done';x.completedAt=Date.now();x.pay={items:[{id:'z',date:new Date().toLocaleDateString('en-CA'),amt:700,note:''}],due:''};MSA.save()}",pid)
        await pg.evaluate("MSA.pro.report()"); await pg.wait_for_timeout(300)
        t=await pg.inner_text('.modal'); ok('report shows finished + collected', ('700' in t or '٧٠٠' in t) and 'Al Nour' in t, t[:200])
        await pg.keyboard.press('Escape')
        # settings button
        await pg.evaluate("MSA.openSettings()"); await pg.wait_for_timeout(400)
        ok('settings has report button', await pg.locator('#sReport').count()==1)
        ok('no JS errors', not pg.errs, pg.errs[:3])
        # English
        pg2=await e.page(lang='en'); await pg2.evaluate("p=>{MSA.state.projects[0].status='active';MSA.state.ui.project=MSA.state.projects[0].id;MSA.state.ui.ptab='revs';MSA.go('active')}",None); await pg2.wait_for_timeout(500)
        ok('EN revision card', 'Revision counter' in await pg2.inner_text('.pro-rv'))
        ok('EN no errors', not pg2.errs, pg2.errs[:3])
    return summary()
import sys; sys.exit(asyncio.run(main()))
