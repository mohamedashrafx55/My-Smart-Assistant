import asyncio
from h import *
async def main():
    async with Env() as e:
        pg=await e.page()
        await pg.wait_for_timeout(2500)
        ok('boot no errors',not pg.errs,pg.errs)
        ok('plus API loaded',await pg.evaluate("!!(MSA.plus&&MSA.plus.messages&&MSA.plus.openSearch&&MSA.views.money)"))
        ok('home strip',await pg.locator('.home-strip').count()==1)
        ok('top search btn',await pg.locator('#btnSearch').count()==1)
        for v in ['money','clients','tasks','done','learn','active','settings']:
            await pg.evaluate("v=>MSA.go(v)",v); await pg.wait_for_timeout(300)
        ok('views no errors',not pg.errs,pg.errs)
        print(pg.errs)
    summary()
asyncio.run(main())
