import asyncio, json
from h import *

async def main():
    async with Env() as e:
        pg=await e.page(); await pg.wait_for_timeout(2800)
        # ---------- seed varied data ----------
        await pg.evaluate("""()=>{
          const S=MSA.state;
          S.tasks.unshift({id:'tk1',type:'task',title:'تصميم منيو المطعم',desc:'<p>اللون الأخضر الزيتوني مهم</p>',status:'todo',priority:'normal',start:'',due:'',remind:'',remindAt:'',repeat:'',tags:['عاجل'],checklist:[{id:'c1',text:'مراجعة الخطوط',done:false}],atts:[],color:'',pinned:false,created:Date.now(),updated:Date.now()});
          S.tasks.unshift({id:'tk2',type:'note',title:'ملاحظة عن الألوان',desc:'<p>Pantone 7545 للخلفية</p>',status:'todo',priority:'normal',tags:[],checklist:[],atts:[],created:Date.now(),updated:Date.now()});
          S.learning.videos.push({id:'v1',folder:null,url:'https://youtu.be/abcdefghijk',vid:'abcdefghijk',title:'شرح الـ Kerning في اليستريتور',note:'',created:Date.now()});
          S.refs=S.refs||[]; S.refs.push({id:'rf1',url:'https://behance.net/gallery/123',title:'مرجع هوية قهوة',tags:['قهوة'],note:'',folder:null,created:Date.now()});
          MSA.clients.ensure('شركة النور'); const r=MSA.clients.data().rows.find(x=>x.c.name==='شركة النور'); r.c.phone='0100000111'; r.c.email='nour@example.com'; MSA.save();
        }""")
        # ---------- GLOBAL SEARCH ----------
        await pg.keyboard.press('Control+k'); await pg.wait_for_selector('#srQ')
        ok('ctrl+K opens search',await pg.locator('#srQ').count()==1)
        ok('idle shows quick chips',await pg.locator('.sr-out .pchip').count()==4)
        await pg.keyboard.press('Control+k'); await pg.wait_for_timeout(100)
        ok('ctrl+K again does not duplicate',await pg.locator('#srQ').count()==1)
        async def q(t):
            await pg.fill('#srQ',''); await pg.fill('#srQ',t); await pg.wait_for_timeout(350)
            return await pg.evaluate("[...document.querySelectorAll('.sr-g span')].map(x=>x.textContent)")
        g=await q('فنجان'); ok('project found by name',any('المشاريع' in x for x in g),g)
        g=await q('زيتوني'); ok('task found by description text',any('المهام' in x for x in g),g)
        g=await q('مراجعة الخطوط'); ok('task found by checklist item',any('المهام' in x for x in g),g)
        g=await q('pantone'); ok('note found (case-insens.)',any('الملاحظات' in x for x in g),g)
        g=await q('النور'); ok('client found',any('العملاء' in x for x in g),g)
        g=await q('nour@example'); ok('client found by email',any('العملاء' in x for x in g),g)
        g=await q('kerning'); ok('video found',any('فيديوهات' in x for x in g),g)
        g=await q('قهوه'); ok('arabic normalisation (ة/ه) finds ref',any('المراجع' in x for x in g),g)
        g=await q('الوان'); ok('arabic normalisation (أ/ا) works',len(g)>0,g)
        g=await q('٧٥٤٥'); ok('arabic-indic digits match latin digits',any('الملاحظات' in x for x in g),g)
        g=await q('لوجو'); ok('plan stages searchable',any('مراحل' in x for x in g),g)
        await q('zzzqqq'); ok('no results message',await pg.locator('.sr-none').count()==1)
        g=await q('لوجو فنجان'); ok('multi-word AND search',len(g)>=1,g)
        # keyboard nav + Enter on task opens editor
        await q('تصميم منيو')
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(700)
        ok('enter on task opens editor',await pg.evaluate("MSA.view==='tasks' && !!document.querySelector('.modal, .drawer, .drawer-wrap')"))
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        # open client result
        await pg.evaluate("MSA.go('home')"); await pg.keyboard.press('Control+k'); await pg.wait_for_selector('#srQ'); await q('شركة النور'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(600)
        ok('client result opens clients sheet filtered',await pg.evaluate("MSA.view==='clients' && MSA.state.clients.q.includes('النور')"))
        await pg.evaluate("MSA.state.clients.q='';MSA.save()")
        # video -> learn
        await pg.evaluate("MSA.go('home')"); await pg.keyboard.press('Control+k'); await pg.wait_for_selector('#srQ'); await q('kerning'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(600)
        ok('video result opens learning/videos',await pg.evaluate("MSA.view==='learn' && MSA.state.ui.ltab==='videos'"))
        # ref -> refs tab
        await pg.evaluate("MSA.go('home')"); await pg.keyboard.press('Control+k'); await pg.wait_for_selector('#srQ'); await q('مرجع هوية'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(600)
        ok('ref result opens refs tab',await pg.evaluate("MSA.view==='learn' && MSA.state.ui.ltab==='refs'"))
        # project result
        await pg.evaluate("MSA.go('home')"); await pg.keyboard.press('Control+k'); await pg.wait_for_selector('#srQ'); await q('فنجان'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(800)
        ok('project result opens project',await pg.evaluate("MSA.view==='active' && !!MSA.state.ui.project"))
        # file result (attachment name) opens viewer
        nm=await pg.evaluate("(()=>{let n=null;MSA.state.projects.forEach(p=>MSA.proj.walk(p.steps,s=>{(s.atts||[]).forEach(a=>{if(!n&&a.name)n=a.name})}));return n})()")
        print('attachment name',nm)
        if nm:
            await pg.keyboard.press('Control+k'); await pg.wait_for_selector('#srQ'); g=await q(nm[:6]); ok('file found by name',any('الملفات' in x for x in g),g)
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        ok('Esc closes search',await pg.locator('#srQ').count()==0)
        # top bar button + home strip
        await pg.evaluate("MSA.go('home')"); await pg.wait_for_timeout(200)
        await pg.click('#btnSearch'); await pg.wait_for_selector('#srQ'); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        await pg.click('.hs-search'); await pg.wait_for_selector('#srQ'); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        ok('top button + home bar open search',True)
        # lock screen blocks search
        await pg.evaluate("MSA.lockNow&&MSA.lockNow()"); await pg.wait_for_timeout(200)
        has=await pg.evaluate("!!document.getElementById('lock')")
        if has:
            await pg.keyboard.press('Control+k'); await pg.wait_for_timeout(200)
            ok('search blocked while locked',await pg.locator('#srQ').count()==0)
            await pg.fill('#lkPw','Akademia'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(700)
        else: print('lock.now not available; skipped lock check')
        # performance with many items
        await pg.evaluate("""()=>{for(let i=0;i<3000;i++)MSA.state.tasks.push({id:'bulk'+i,type:'task',title:'bulk task '+i+' كلمة'+i,desc:'',status:'todo',tags:[],checklist:[],atts:[]})}""")
        t=await pg.evaluate("(()=>{const t0=performance.now();const r=MSA.plus.search('bulk 29');return [performance.now()-t0,r.length]})()")
        ok('search 3000 items fast (<400ms)',t[0]<400 and t[1]>0,t)
        await pg.evaluate("MSA.state.tasks=MSA.state.tasks.filter(x=>!String(x.id).startsWith('bulk'))")

        # ---------- BACKUP ----------
        ok('backup defaults (manual only, 100MB)',await pg.evaluate("(()=>{const b=MSA.state.settings.backup;return b&&b.on===false&&b.maxMB===100&&b.days===7&&b.last>0})()"))
        await pg.evaluate("MSA.openSettings()"); await pg.wait_for_selector('#bkNow'); 
        ok('settings backup section present',await pg.locator('#bkNow').count()==1)
        await pg.select_option('#bkDays','3'); ok('days persisted',await pg.evaluate("MSA.state.settings.backup.days")==3)
        await pg.select_option('#bkDays','7')
        await pg.uncheck('#bkOn'); ok('reminder toggled off',await pg.evaluate("MSA.state.settings.backup.on")==False)
        await pg.check('#bkOn')
        await pg.evaluate("MSA.go('home')")
        # not due -> no banner
        await pg.evaluate("MSA.plus.backupTick()"); await pg.wait_for_timeout(200)
        ok('no banner when not due',await pg.locator('#bkBanner').count()==0)
        # due -> banner
        await pg.evaluate("(()=>{const b=MSA.state.settings.backup;b.last=Date.now()-8*864e5;b.snooze=0;MSA.save()})()")
        await pg.evaluate("MSA.plus.backupTick()"); await pg.wait_for_timeout(200)
        ok('banner appears when due',await pg.locator('#bkBanner').count()==1)
        await pg.evaluate("MSA.plus.backupTick()"); ok('banner not duplicated',await pg.locator('#bkBanner').count()==1)
        await pg.click('#bkBanner [data-bk=later]'); await pg.wait_for_timeout(200)
        ok('later hides banner',await pg.locator('#bkBanner').count()==0)
        await pg.evaluate("MSA.plus.backupTick()"); await pg.wait_for_timeout(200)
        ok('snoozed: no banner',await pg.locator('#bkBanner').count()==0)
        await pg.evaluate("MSA.state.settings.backup.snooze=Date.now()-1000");
        await pg.evaluate("MSA.plus.backupTick()"); await pg.wait_for_timeout(200)
        ok('after snooze banner returns',await pg.locator('#bkBanner').count()==1)
        async with pg.expect_download() as dl: await pg.click('#bkBanner [data-bk=now]')
        d=await dl.value; ok('save-now downloads json',d.suggested_filename.startswith('my-smart-assistant-backup-') and d.suggested_filename.endswith('.json'),d.suggested_filename)
        path=await d.path(); data=json.load(open(path))
        ok('backup file is valid and has files+state',data['app']=='my-smart-assistant' and 'state' in data and isinstance(data['files'],list))
        await pg.wait_for_timeout(300)
        ok('banner gone after save',await pg.locator('#bkBanner').count()==0)
        ok('last updated',await pg.evaluate("Date.now()-MSA.state.settings.backup.last<5000"))
        # manual full export from settings also counts
        await pg.evaluate("MSA.state.settings.backup.last=Date.now()-9*864e5");
        await pg.evaluate("MSA.exportAll()")
        ok('manual export counts as backup',await pg.evaluate("Date.now()-MSA.state.settings.backup.last<5000"))
        # light backup skips big files
        await pg.evaluate("""async()=>{const big=new File([new Uint8Array(16*1048576)],'big.mp4',{type:'video/mp4'});window.__big=await MSA.files.put(big)}""")
        light=json.loads(await pg.evaluate("MSA.exportAll({maxFile:15*1048576,maxTotal:120*1048576})"))
        full=json.loads(await pg.evaluate("MSA.exportAll()"))
        ok('light backup lists skipped big file',any(s['name']=='big.mp4' for s in (light.get('skipped') or [])))
        ok('light backup excludes its data',not any(f['name']=='big.mp4' for f in light['files']))
        ok('full backup includes big file',any(f['name']=='big.mp4' for f in full['files']))
        ok('full backup has no skipped list','skipped' not in full)
        await pg.evaluate("MSA.files.del(window.__big.id)")
        # native auto-save with mocked Filesystem
        await pg.evaluate("""()=>{
          window.__fs={files:{},calls:[]};
          window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',Plugins:{Filesystem:{
            writeFile:async o=>{__fs.calls.push('w:'+o.path);__fs.files[o.path]=o.data.length;return {uri:'file:///x/'+o.path}},
            readdir:async o=>({files:Object.keys(__fs.files).filter(k=>k.startsWith(o.path+'/')).map(k=>({name:k.split('/').pop()}))}),
            deleteFile:async o=>{__fs.calls.push('d:'+o.path);delete __fs.files[o.path]}},
            Share:{share:async()=>({})}}};
          for(let i=1;i<=6;i++)__fs.files['MySmartAssistant/my-smart-assistant-backup-2026-01-0'+i+'.json']=10;
          const b=MSA.state.settings.backup;b.last=Date.now()-8*864e5;b.snooze=0;MSA.plus._autoTried=false;}""")
        await pg.evaluate("MSA.state.settings.backup.on=true;MSA.plus.backupTick()"); await pg.wait_for_timeout(900)
        fs=await pg.evaluate("window.__fs")
        ok('native: NO silent auto-save (only a reminder asking permission)',await pg.locator('#bkBanner').count()==1 and not any(c.startswith('w:') for c in fs['calls']),fs['calls'])
        await pg.evaluate("MSA.plus.backupNow()"); await pg.wait_for_timeout(1200)
        fs=await pg.evaluate("window.__fs")
        ok('native: manual backup writes a copy',any(c.startswith('w:MySmartAssistant/my-smart-assistant-backup-') for c in fs['calls']),fs['calls'])
        ok('native: pruned to last 4 copies',len(fs['files'])==4,list(fs['files']))
        ok('native: last updated',await pg.evaluate("Date.now()-MSA.state.settings.backup.last<5000"))
        ok('reminder hidden after saving',await pg.locator('#bkBanner').count()==0)
        await pg.evaluate("delete window.Capacitor; document.getElementById('bkBanner')&&document.getElementById('bkBanner').remove(); MSA.state.settings.backup.last=Date.now(); MSA.save()")

        # ---------- ROUND TRIP of every new field ----------
        await pg.evaluate("""async()=>{
          const p=MSA.state.projects[0]; p.client='عميل الرحلة'; MSA.clients.ensure('عميل الرحلة');
          p.time=p.time||{rate:100,cur:'EGP',entries:[],extras:[],fixed:0}; p.time.fixed=1234; p.time.cur='EGP';
          p.pay={items:[{id:'rt1',date:'2026-10-01',amt:200,note:'x'}],due:'2026-12-31'}; p.deliver='2026-12-30';
          const r=MSA.clients.data().rows.find(x=>x.c.name==='عميل الرحلة'); r.c.last='2026-09-01'; r.fu='2026-09-01';
          MSA.save();}""")
        txt=await pg.evaluate("MSA.exportAll()")
        pg2=await e.page(); await pg2.wait_for_timeout(1500)
        await pg2.evaluate("t=>MSA.importAll(t)",txt); await pg2.reload(); await pg2.keyboard.press('Escape')
        await pg2.wait_for_selector('#lkPw'); await pg2.fill('#lkPw','Akademia'); await pg2.keyboard.press('Enter'); await pg2.wait_for_selector('#app:not([hidden])'); await pg2.wait_for_timeout(800)
        rr=await pg2.evaluate("""()=>{const p=MSA.state.projects[0];const r=MSA.clients.data().rows.find(x=>x.c.name==='عميل الرحلة');return {pay:p.pay,deliver:p.deliver,last:r&&r.c.last,fu:r&&r.fu,col:MSA.clients.data().cols.some(c=>c.id==='last'),bk:!!MSA.state.settings.backup,tasks:MSA.state.tasks.some(t=>t.id==='tk1')}}""")
        print(rr)
        ok('roundtrip: payments+due',rr['pay'] and rr['pay']['items'][0]['amt']==200 and rr['pay']['due']=='2026-12-31')
        ok('roundtrip: delivery date',rr['deliver']=='2026-12-30')
        ok('roundtrip: last contact',rr['last']=='2026-09-01' and rr['fu']=='2026-09-01' and rr['col'])
        ok('roundtrip: backup settings + tasks',rr['bk'] and rr['tasks'])
        ok('f3 no errors (main)',not pg.errs,pg.errs[:3]); ok('f3 no errors (restore)',not pg2.errs,pg2.errs[:3])
    summary()
asyncio.run(main())
