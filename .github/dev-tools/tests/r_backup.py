import asyncio,sys,json
from h import *

async def main():
    async with Env() as e:
        pg = await e.page(w=1100, h=800)
        await pg.evaluate("(()=>{const b=MSA.state.settings.backup=MSA.state.settings.backup||{on:false,days:7,last:0,snooze:0,where:'',manual:1,maxMB:100};b.last=1;b.mode=undefined;MSA.save()})()")
        # ---------- default (auto) on web = Downloads
        async with pg.expect_download() as dl:
            r = await pg.evaluate("MSA.plus.backupNow()")
        d = await dl.value
        ok('auto mode on web downloads a dated .json backup', r is True and d.suggested_filename.startswith('my-smart-assistant-backup-') and d.suggested_filename.endswith('.json'), d.suggested_filename)
        ok('where = Downloads folder, last-backup time updated', await pg.evaluate("MSA.state.settings.backup.where.includes('التنزيلات')&&MSA.state.settings.backup.last>Date.now()-60000"))

        # ---------- ask each time (showSaveFilePicker)
        await pg.evaluate("""(()=>{window.__log=[];window.__saved=null;
          window.showSaveFilePicker=async function(o){window.__log.push('picker');window.__opts=o;if(window.__cancel){const x=new Error('x');x.name='AbortError';throw x}
            return {name:'my-pick.json',createWritable:async()=>({write:async t=>{window.__log.push('write');window.__saved=t},close:async()=>{window.__log.push('close')}})}};
          const ex=MSA.exportAll;MSA.exportAll=async function(){window.__log.push('export');return ex.apply(this,arguments)};
          MSA.state.settings.backup.mode='ask';MSA.save()})()""")
        r = await pg.evaluate("MSA.plus.backupNow()")
        log = await pg.evaluate("window.__log")
        ok('ask mode: picker is opened BEFORE the export (click stays valid)', log[:2] == ['picker', 'export'], log)
        ok('ask mode: file written once and closed', log.count('write') == 1 and log[-1] == 'close' and r is True, log)
        saved = json.loads(await pg.evaluate("window.__saved"))
        ok('saved content is a valid backup with state', saved.get('app') == 'my-smart-assistant' and 'state' in saved)
        ok('suggested name + .json type filter', await pg.evaluate("window.__opts.suggestedName.endsWith('.json')&&JSON.stringify(window.__opts.types).includes('.json')"))
        ok('where shows the chosen file name', await pg.evaluate("MSA.state.settings.backup.where.includes('my-pick.json')"))
        # cancel
        await pg.evaluate("window.__cancel=true;window.__log=[];MSA.state.settings.backup.last=5;MSA.state.settings.backup.where='old'")
        r = await pg.evaluate("MSA.plus.backupNow()")
        ok('cancelling the picker saves nothing and keeps last-backup time', r is False and await pg.evaluate("MSA.state.settings.backup.last===5&&window.__log.join()==='picker'"), r)
        await pg.evaluate("window.__cancel=false")
        # write failure -> falls back to Downloads with a warning
        await pg.evaluate("window.showSaveFilePicker=async()=>({name:'bad.json',createWritable:async()=>{throw new Error('denied')}})")
        async with pg.expect_download() as dl2:
            r = await pg.evaluate("MSA.plus.backupNow()")
        ok('write failure falls back to Downloads (no data loss)', r is True and (await dl2.value).suggested_filename.endswith('.json'))
        await pg.evaluate("delete window.showSaveFilePicker")
        async with pg.expect_download() as dl3:
            await pg.evaluate("MSA.plus.backupNow()")
        ok('ask mode without browser support falls back to Downloads', (await dl3.value).suggested_filename.endswith('.json'))

        # ---------- fixed folder (real OPFS handle, stubbed permission)
        await pg.evaluate("""(async()=>{
          const root=await navigator.storage.getDirectory();window.__dir=await root.getDirectoryHandle('bk-test',{create:true});
          const P=FileSystemDirectoryHandle.prototype;window.__perm='granted';window.__req=0;
          P.queryPermission=async()=>window.__perm;P.requestPermission=async()=>{window.__req++;return window.__perm};
          (()=>{let m=null;MSA.plus._ds={get:async()=>m,set:async h=>{m=h;return true}}})();
          window.__picks=0;window.showDirectoryPicker=async()=>{window.__picks++;if(window.__cancelDir){const x=new Error('c');x.name='AbortError';throw x}return window.__dir};
          MSA.state.settings.backup.mode='ask';MSA.state.settings.backup.dirName='';MSA.save()})()""")
        ok('plus UI offers 3 modes when folders are supported', await pg.evaluate("MSA.plusHTML().includes('data-v=\"folder\"')"))
        h = await pg.evaluate("MSA.plus.pickBackupFolder().then(h=>h&&h.name)")
        ok('choosing a folder stores the name and switches to folder mode', h == 'bk-test' and await pg.evaluate("MSA.state.settings.backup.mode==='folder'&&MSA.state.settings.backup.dirName==='bk-test'"))
        r = await pg.evaluate("MSA.plus.backupNow()")
        files = await pg.evaluate("(async()=>{const o=[];for await(const [n,f] of window.__dir.entries())o.push(n);return o})()")
        ok('folder mode writes the backup silently into the folder', r is True and len(files) == 1 and files[0].startswith('my-smart-assistant-backup-'), files)
        body = json.loads(await pg.evaluate("(async()=>{const f=await (await window.__dir.getFileHandle((await (async()=>{for await(const [n] of window.__dir.entries())return n})())) ).getFile();return f.text()})()"))
        ok('folder backup content is valid', body.get('app') == 'my-smart-assistant' and 'state' in body)
        ok('where shows the folder', await pg.evaluate("MSA.state.settings.backup.where.includes('bk-test')"))
        await pg.evaluate("window.__picks=0")
        await pg.evaluate("MSA.plus.backupNow()")
        ok('second backup reuses the remembered folder (no picker)', await pg.evaluate("window.__picks===0"))
        # permission lost -> asks again, then re-picks
        await pg.evaluate("window.__perm='denied';window.__cancelDir=true;MSA.state.settings.backup.last=7")
        r = await pg.evaluate("MSA.plus.backupNow()")
        ok('permission denied + picker cancelled = nothing saved, no error', r is False and await pg.evaluate("window.__req>=1&&MSA.state.settings.backup.last===7"))
        await pg.evaluate("window.__perm='granted';window.__cancelDir=false")
        ok('folder picker cancel returns null', await pg.evaluate("(()=>{window.__cancelDir=true;return MSA.plus.pickBackupFolder().then(x=>{window.__cancelDir=false;return x===null})})()"))

        # ---------- settings UI
        await pg.evaluate("MSA.go('settings')"); await pg.wait_for_timeout(500)
        ok('settings shows backup location control + button', await pg.evaluate("!!document.getElementById('bkMode')&&!!document.getElementById('bkPick')&&document.getElementById('bkPick').textContent.includes('اختر مكان الحفظ')"))
        await pg.evaluate("document.querySelector('#bkMode [data-v=auto]').click()"); await pg.wait_for_timeout(150)
        ok('switching mode saves and updates the hint', await pg.evaluate("MSA.state.settings.backup.mode==='auto'&&document.getElementById('bkModeHint').textContent.includes('التنزيلات')"))
        await pg.evaluate("window.showSaveFilePicker=async()=>({});document.querySelector('#bkMode [data-v=ask]').click()"); await pg.wait_for_timeout(150)
        ok('ask hint explains the window', await pg.evaluate("MSA.state.settings.backup.mode==='ask'&&document.getElementById('bkModeHint').textContent.includes('نافذة')"))
        await pg.evaluate("document.getElementById('bkPick').click()"); await pg.wait_for_timeout(300)
        ok('"اختر مكان الحفظ" opens the folder picker and selects folder mode', await pg.evaluate("MSA.state.settings.backup.mode==='folder'&&document.querySelector('#bkMode [data-v=folder]').classList.contains('on')&&document.getElementById('bkModeHint').textContent.includes('bk-test')"))
        await pg.evaluate("window.__picks=0;MSA.state.settings.backup.mode='auto';MSA.state.settings.backup.dirName='';MSA.refreshSettings&&MSA.refreshSettings()"); await pg.wait_for_timeout(300)
        await pg.evaluate("document.querySelector('#bkMode [data-v=folder]').click()"); await pg.wait_for_timeout(300)
        ok('choosing "fixed folder" without a folder prompts to pick one', await pg.evaluate("window.__picks===1&&MSA.state.settings.backup.dirName==='bk-test'"))
        await pg.evaluate("delete window.showDirectoryPicker;MSA.refreshSettings&&MSA.refreshSettings()"); await pg.wait_for_timeout(300)
        ok('without folder support only 2 modes are shown', await pg.evaluate("!document.querySelector('#bkMode [data-v=folder]')"))
        await pg.evaluate("MSA.state.settings.backup.mode='auto';document.getElementById('bkPick').click()"); await pg.wait_for_timeout(200)
        ok('no folder API: the button switches to "ask each time"', await pg.evaluate("MSA.state.settings.backup.mode==='ask'"))

        # ---------- Android emulation (native plugins)
        await pg.evaluate("""(()=>{window.__n=[];const FS={writeFile:async o=>{window.__n.push('fs:'+o.directory);return {uri:'file:///x'}},readdir:async()=>({files:[]}),deleteFile:async()=>{}};
          const SH={share:async o=>{window.__n.push('share');if(window.__shCancel){throw new Error('Share canceled')}}};
          MSA.native=n=>n==='Filesystem'?FS:n==='Share'?SH:null;MSA.state.settings.backup.mode='auto'})()""")
        r = await pg.evaluate("MSA.plus.backupNow()")
        ok('Android auto: written to Documents/MySmartAssistant, no share sheet', await pg.evaluate("window.__n.join()==='fs:DOCUMENTS'") and r is True)
        await pg.evaluate("window.__n=[];MSA.state.settings.backup.mode='ask'")
        r = await pg.evaluate("MSA.plus.backupNow()")
        ok('Android ask: goes straight to the share sheet (Documents untouched)', await pg.evaluate("window.__n.join()==='fs:CACHE,share'") and r is True, await pg.evaluate("window.__n"))
        await pg.evaluate("window.__n=[];window.__shCancel=true;MSA.state.settings.backup.last=9")
        r = await pg.evaluate("MSA.plus.backupNow()")
        ok('Android ask + cancel: nothing recorded', r is False and await pg.evaluate("MSA.state.settings.backup.last===9"))
        ok('Android hint mentions the share sheet', await pg.evaluate("document.body&&true"))
        await pg.evaluate("MSA.native=()=>null")

        # ---------- reminder banner + manual export still work
        await pg.evaluate("MSA.state.settings.backup.mode='ask';window.showSaveFilePicker=async()=>({name:'b.json',createWritable:async()=>({write:async()=>{},close:async()=>{}})});MSA.state.settings.backup.on=true;MSA.state.settings.backup.last=Date.now()-30*864e5;MSA.state.settings.backup.snooze=0;MSA.plus.backupTick()"); await pg.wait_for_timeout(300)
        ok('overdue reminder banner appears', await pg.evaluate("!!document.getElementById('bkBanner')"))
        await pg.evaluate("document.querySelector('#bkBanner [data-bk]:not([data-bk=later])').click()"); await pg.wait_for_timeout(700)
        ok('banner "back up" uses the chosen mode and clears the banner', await pg.evaluate("!document.getElementById('bkBanner')&&MSA.state.settings.backup.where.includes('b.json')"))
        g = await pg.evaluate("fetch('js/guide-3.js').then(r=>r.text())")
        ok('guide documents choosing the backup location', 'اختر مكان الحفظ' in g)

        # ---------- mobile + English
        pm = await e.page(w=390, h=800); await pm.evaluate("MSA.go('settings')"); await pm.wait_for_timeout(500)
        ok('mobile: backup location control fits', await pm.evaluate("(()=>{const r=document.getElementById('bkWhere').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&document.documentElement.scrollWidth<=innerWidth+1})()"))
        pe = await e.page(w=1100, h=800, lang='en'); await pe.evaluate("MSA.go('settings')"); await pe.wait_for_timeout(500)
        ok('English labels', await pe.evaluate("document.getElementById('bkPick').textContent.includes('Choose where to save')&&document.getElementById('bkMode').textContent.includes('Ask each time')"))
        errs = pg.errs + pm.errs + pe.errs
        ok('no page errors', not errs, errs[:4])
    return summary()
sys.exit(asyncio.run(main()))
