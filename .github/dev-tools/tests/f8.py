import asyncio, json
from h import *
async def main():
    async with Env() as e:
        pg=await e.page(lang='ar'); await pg.wait_for_timeout(800)
        b=await pg.evaluate("JSON.parse(JSON.stringify(MSA.state.settings.backup||null))")
        # fresh/legacy state: old on:true setting must turn off
        await pg.evaluate("MSA.state.settings.backup={on:true,days:7,last:1,snooze:0,where:''};MSA.save()"); 
        await pg.evaluate("MSA.plusHTML()"); st=await pg.evaluate("MSA.state.settings.backup")
        ok('legacy auto-backup turned off, limit 100MB', st['on']==False and st['maxMB']==100, st)
        # no banner / no silent save even when overdue
        await pg.evaluate("MSA.state.settings.backup.last=1;MSA.save();MSA.tools&&0"); await pg.wait_for_timeout(300)
        await pg.evaluate("(MSA.plus||{}).backupTick&&MSA.plus.backupTick()"); await pg.wait_for_timeout(500)
        ok('no reminder banner when reminders are off', not await pg.query_selector('#bkBanner'))
        # 40MB file: skipped at 15MB, included at 100MB
        await pg.evaluate("""async()=>{const f=new File([new Uint8Array(40*1048576)],'big.bin',{type:'application/octet-stream'});const a=await MSA.files.put(f);const p=MSA.state.projects[0];p.steps[0].atts=(p.steps[0].atts||[]);p.steps[0].atts.push(a);MSA.save()}""")
        r={}
        for mb in (15,100):
            await pg.evaluate("mb=>{MSA.state.settings.backup.maxMB=mb}",mb)
            r[mb]=await pg.evaluate("""async()=>{const mb=MSA.state.settings.backup.maxMB;const j=await MSA.exportAll({maxFile:mb*1048576,maxTotal:Math.max(300,mb*2)*1048576});return [j.length,MSA.lastExportSkipped|0]}""")
        ok('15MB limit leaves the 40MB file out', r[15][1]>=1, r)
        ok('100MB limit includes it', r[100][1]==0 and r[100][0]>r[15][0]+40e6, r)
        # settings UI has the selector and the manual button
        await pg.evaluate("MSA.go('settings')"); await pg.wait_for_timeout(600)
        ok('settings: size selector + back up now', await pg.query_selector('#bkMax') and await pg.query_selector('#bkNow'))
        ok('no errors', not pg.errs, pg.errs[:3])
    summary()
asyncio.run(main())
