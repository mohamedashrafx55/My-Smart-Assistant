import asyncio,sys
from h import *
MOCK="""
window.__calls=[];
window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',Plugins:{
 App:{addListener(){return {remove(){}}}},
 LocalNotifications:{checkPermissions:async()=>({display:'prompt'}),requestPermissions:async()=>{__calls.push('ln.req');return {display:'granted'}}},
 Clipboard:{read:async()=>{__calls.push('cb.read');return {value:'x',type:'text/plain'}}}}};
const _q=navigator.permissions.query.bind(navigator.permissions);
navigator.permissions.query=async(d)=>({state:'denied',onchange:null});
navigator.mediaDevices.getUserMedia=async()=>{__calls.push('gum');const e=new Error('x');e.name='NotAllowedError';throw e};
"""
async def main():
    async with Env() as e:
        ctx=await e.b.new_context(viewport={'width':390,'height':800})
        pg=await ctx.new_page(); pg.errs=[]
        pg.on('pageerror',lambda x: pg.errs.append(str(x)))
        await pg.route('**/*',lambda r: r.continue_() if r.request.url.startswith('http://localhost') or r.request.url.startswith('data:') else r.abort())
        await pg.add_init_script("localStorage.setItem('msa_clean_v1','kept')")
        await pg.add_init_script(MOCK)
        await pg.goto(URL); await pg.wait_for_selector('#lkPw',timeout=8000); await pg.fill('#lkPw','Akademia'); await pg.keyboard.press('Enter')
        await pg.wait_for_selector('#app:not([hidden])',timeout=9000); await pg.wait_for_timeout(500)
        ok('phone/app gets the light splash class',await pg.evaluate("document.documentElement.classList.contains('lite')"))
        await pg.evaluate("MSA.openSettings()"); await pg.wait_for_selector('[data-perm=camera]',state='attached'); await pg.wait_for_timeout(400)
        st=lambda i: pg.evaluate("(i)=>{const r=document.querySelector('[data-perm=\"'+i+'\"]');return {b:r.querySelector('.pbadge').textContent,hid:r.querySelector('[data-perm-go]').hidden}}",i)
        n=await st('notifications'); ok('notifications supported via the app plugin (button shown)',not n['hid'],n)
        c=await st('clipboard'); ok('clipboard is shown as allowed inside the app (no blocked state)',c['b'] and c['hid'],c)
        cam=await st('camera'); ok('camera "denied" hint still lets you press Allow in the app',not cam['hid'],cam)
        await pg.locator('[data-perm=notifications] [data-perm-go]').dispatch_event('click'); await pg.wait_for_timeout(300)
        ok('notification allow calls the native plugin','ln.req' in await pg.evaluate('__calls'))
        await pg.locator('[data-perm=camera] [data-perm-go]').dispatch_event('click'); await pg.wait_for_timeout(400)
        x=await pg.inner_text('[data-perm=camera] .perm-x')
        ok('camera failure shows how to enable it in phone settings','إعدادات الهاتف' in x,x)
        ok('no page errors',not pg.errs,pg.errs)
        # splash timeline starts after boot
        pg2=await e.page(w=390,h=800,demo=False,quiet=True)
        ok('splash runs on web phone too (lite)',await pg2.evaluate("document.documentElement.classList.contains('lite')"))
        pd=await e.page(w=1280,h=800,demo=False)
        ok('desktop keeps the full splash',not await pd.evaluate("document.documentElement.classList.contains('lite')"))
    return summary()
sys.exit(asyncio.run(main()))
