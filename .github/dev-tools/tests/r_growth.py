import asyncio,sys
from h import *
async def main():
    async with Env() as e:
        pg=await e.page(w=1100,h=800)
        ok('growth module loaded',await pg.evaluate("!!(MSA.growth&&MSA.growth.leads&&MSA.growth.convert&&MSA.growth.stats)"))
        await pg.evaluate("MSA.growth.leads().push({id:'l1',name:'عميل تجريبي',stage:'new',value:'3000',cur:'EGP',source:'Behance',phone:'01000000000',next:'2000-01-01',created:Date.now()},{id:'l2',name:'Other',stage:'lost',closed:Date.now()});MSA.save()")
        s=await pg.evaluate("MSA.growth.stats()")
        ok('stats count open / lost / late',s['total']==2 and s['open']==1 and s['lost']==1 and s['late']==1,s)
        await pg.evaluate("MSA.go('leads')"); await pg.wait_for_timeout(600)
        ok('leads view renders the lead',await pg.evaluate("document.body.innerText.includes('عميل تجريبي')"))
        n0=await pg.evaluate("MSA.state.clients?Object.keys(MSA.state.clients).length:0")
        await pg.evaluate("MSA.growth.convert(MSA.growth.leads()[0],false)"); await pg.wait_for_timeout(500)
        ok('convert marks the lead won',await pg.evaluate("MSA.growth.leads()[0].stage")=='won')
        ok('convert records the source on the client',await pg.evaluate("JSON.stringify(MSA.state).includes('Behance')"))
        s=await pg.evaluate("MSA.growth.stats()")
        ok('win rate computed after closing',s['won']==1 and s['rate']==50,s)
        ok('portfolio + dashboard builders exist',await pg.evaluate("typeof MSA.growth.portfolio==='function'&&typeof MSA.growth.dash==='function'&&typeof MSA.growth.numbers==='function'"))
        h=await pg.evaluate("MSA.growth.dash()")
        ok('dashboard returns html',isinstance(h,str) and len(h)>50)
        # package / story / after-delivery modals open without errors on a real project
        for call in ["MSA.growth.pkgModal(p)","MSA.growth.storyModal(p)","MSA.growth.afterModal(p)"]:
            await pg.evaluate("p=>{window.__p=p}",None) if False else None
            await pg.evaluate("(()=>{const p=MSA.state.projects[0];%s})()"%call); await pg.wait_for_timeout(500)
            ok('modal opens: '+call.split('.')[2].split('(')[0],await pg.locator('.overlay .modal').count()>=1)
            await pg.evaluate("MSA.closeAllOverlays&&MSA.closeAllOverlays()"); await pg.wait_for_timeout(200)
        await pg.evaluate("(()=>{const p=MSA.state.projects[0];MSA.growth.enableAfter(p,true)})()"); await pg.wait_for_timeout(300)
        ok('enableAfter creates follow-up tasks',await pg.evaluate("(MSA.state.tasks||[]).some(t=>t.src&&t.src.after)"))
        ok('no page errors',not pg.errs,pg.errs)
    return summary()
sys.exit(asyncio.run(main()))
