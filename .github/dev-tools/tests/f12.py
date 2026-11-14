import asyncio
from h import *
async def main():
    async with Env() as e:
        for lang in ['ar','en']:
            pg=await e.page(lang=lang,demo=False)
            ok(lang+' fresh empty',await pg.evaluate("MSA.state.projects.length===0"))
            # blank project + every tab, incl. a stale/odd one
            await pg.evaluate("()=>{const p={id:'pb',name:'فاضي',created:Date.now(),status:'active',steps:[]};MSA.state.projects.push(p);MSA.state.ui.project='pb';MSA.save()}")
            for t in ['plan','identity','time','posts','revs','delivery','shots','files']:
                await pg.evaluate("t=>{MSA.state.ui.ptab=t;MSA.save();MSA.go('active');MSA.rerender(false)}",t); await pg.wait_for_timeout(300)
            await pg.evaluate("()=>{MSA.state.ui.ltab='assets';MSA.save();MSA.go('learn')}"); await pg.wait_for_timeout(400)
            ok(lang+' empty assets page',await pg.locator('.empty').count()==1)
            await pg.evaluate("MSA.pro.report()"); await pg.wait_for_timeout(300); ok(lang+' empty report',await pg.locator('.modal').count()==1); await pg.keyboard.press('Escape')
            # project made from the new-project dialog, then revs/time with defaults
            await pg.evaluate("()=>{const T=MSA.tpl.make('reel');const p={id:'pr',name:'ريل',created:Date.now(),status:'active',steps:T.steps,graph:T.graph,type:'reel'};MSA.state.projects.push(p);MSA.state.ui.project='pr';MSA.save()}")
            for t in ['time','revs','delivery','shots','files']:
                await pg.evaluate("t=>{MSA.state.ui.ptab=t;MSA.save();MSA.go('active');MSA.rerender(false)}",t); await pg.wait_for_timeout(400)
            ok(lang+' reel has default stage estimates',await pg.evaluate("Object.keys(MSA.state.projects.find(p=>p.id==='pr').stt.est).length>3"))
            # save/reload keeps data
            await pg.evaluate("MSA.saveNow&&MSA.saveNow()"); await pg.reload(); await pg.wait_for_selector('#lkPw'); await pg.fill('#lkPw','Akademia'); await pg.keyboard.press('Enter'); await pg.wait_for_selector('#app:not([hidden])'); await pg.wait_for_timeout(500)
            ok(lang+' data survives reload',await pg.evaluate("!!MSA.state.projects.find(p=>p.id==='pr').stt"))
            ok(lang+' no errors',not pg.errs,pg.errs[:3])
    return summary()
import sys; sys.exit(asyncio.run(main()))
