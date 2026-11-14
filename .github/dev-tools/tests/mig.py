import asyncio, json
from h import *
async def main():
    async with Env() as e:
        pg=await e.page(); await pg.wait_for_timeout(2600)
        st=await pg.evaluate("""()=>{const s=JSON.parse(JSON.stringify(MSA.state));
          s.projects.forEach(p=>{delete p.pay;delete p.deliver;delete p.dlStart;delete p.identApplied;MSA.proj.walk(p.steps,x=>{delete x.due})});
          delete s.settings.backup;delete s.settings.followOn;delete s.settings.followDays;delete s.ui.moneyF;
          s.clients.cols=s.clients.cols.filter(c=>c.id!=='last');delete s.clients.m2;s.clients.rows.forEach(r=>{delete r.ident;delete r.fu;delete r.c.last});
          s.tasks=s.tasks.filter(t=>!t.src);if(s.connectors)delete s.connectors.claude;return s}""")
        await pg.context.close()
        for lang in ('ar','en'):
            pg=await e.page(state=st,lang=lang); await pg.wait_for_timeout(3500)
            for v in ['home','active','done','learn','tasks','clients','money','settings']:
                await pg.evaluate("v=>MSA.go(v)",v); await pg.wait_for_timeout(350)
            await pg.evaluate("p=>{MSA.state.ui.project=MSA.state.projects[0].id;['plan','identity','time','posts','revs','delivery'].forEach(t=>{});}")
            for t in ['plan','identity','time','posts','revs','delivery']:
                await pg.evaluate("t=>{MSA.state.ui.project=MSA.state.projects[0].id;MSA.state.ui.ptab=t;MSA.go('active')}",t); await pg.wait_for_timeout(350)
            await pg.evaluate("MSA.plus.openSearch('فنجان')"); await pg.wait_for_timeout(500); await pg.keyboard.press('Escape')
            await pg.evaluate("MSA.plus.messages({pid:MSA.state.projects[0].id,kind:'quote'})"); await pg.wait_for_timeout(400); await pg.keyboard.press('Escape')
            ok('old state boots, all views, %s'%lang,not pg.errs,pg.errs[:3])
            ok('defaults created (%s)'%lang,await pg.evaluate("!!MSA.state.settings.backup && MSA.state.clients.cols.some(c=>c.id==='last')"))
            await pg.context.close()
    summary()
asyncio.run(main())
