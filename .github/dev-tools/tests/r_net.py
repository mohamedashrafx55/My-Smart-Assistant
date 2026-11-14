import asyncio,sys
from h import *
async def main():
    async with Env() as e:
        pg=await e.page(w=420,h=820)
        ok('net module loaded',await pg.evaluate("!!MSA.net&&typeof MSA.net.state==='function'"))
        await pg.evaluate("MSA.go('settings')"); await pg.wait_for_selector('#netRow',timeout=5000)
        ok('settings has connection row',await pg.locator('#netRow').count()==1)
        ok('row has an icon and a label',await pg.locator('#netRow .net-ic svg').count()==1 and len((await pg.inner_text('#netRow')).strip())>3)
        # offline: browser flag flips -> grey crossed icon + toast
        await pg.context.set_offline(True); await pg.evaluate("window.dispatchEvent(new Event('offline'))"); await pg.wait_for_timeout(3500)
        ok('offline state',await pg.evaluate("MSA.net.state()")=='offline',await pg.evaluate("MSA.net.state()"))
        ok('offline icon class',await pg.locator('#netRow .net-ic.net-offline').count()==1)
        ok('offline toast shown',await pg.locator('#toastRoot .toast').count()>=1)
        await pg.context.set_offline(False); await pg.evaluate("window.dispatchEvent(new Event('online'))"); await pg.wait_for_timeout(300)
        ok('check button exists',await pg.locator('[data-net=check]').count()==1)
        ok('no page errors',not pg.errs,pg.errs)
    return summary()
sys.exit(asyncio.run(main()))
