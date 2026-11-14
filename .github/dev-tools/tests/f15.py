import asyncio, json
from h import *
REL=lambda tag,n,asset,body='Fix things': {'tag_name':tag,'name':tag,'body':body,'draft':False,'prerelease':False,'html_url':'https://github.com/x/releases/'+tag,'published_at':'2026-10-30T10:00:00Z','assets':[{'name':asset,'size':8000000,'browser_download_url':'https://github.com/mohamedashrafx55/My-Smart-Assistant/releases/download/%s/%s'%(tag,asset)}]}
LIST=[REL('android-9',9,'My-Smart-Assistant.apk','New: favourites\nFix: arrows'),REL('windows-6',6,'My-Smart-Assistant-Setup.exe'),REL('android-4',4,'My-Smart-Assistant.apk')]
async def setup(pg,build,fetch='ok',desktop=False):
    await pg.evaluate("""([b,f,l,d])=>{MSA.build=b;window.__links=[];MSA.openLink=u=>window.__links.push(u);
      window.fetch=async(u)=>{ if(String(u).includes('api.github.com')){ if(f==='fail') throw new Error('net'); return {ok:true,json:async()=>l}; } return {ok:false}; };
      if(d){ window.msaDesktop={installUpdate:async(u)=>{window.__inst=u;return {ok:true}}}; } }""",[build,fetch,LIST,desktop])
async def main():
    async with Env() as e:
        pg=await e.page(1100,900,demo=False)
        # ---- Android older build -> update found
        await setup(pg,{'ver':'1.1','n':5,'platform':'android'})
        ok('platform detected android',await pg.evaluate("MSA.updates.plat()")=='android')
        await pg.evaluate("MSA.openSettings()"); await pg.wait_for_selector('[data-sec=upd]'); await pg.wait_for_timeout(300)
        ok('shows version + build',('v1.1' in await pg.inner_text('[data-sec=upd]')) and ('5' in await pg.inner_text('[data-sec=upd]')))
        await pg.click('#updGo'); await pg.wait_for_selector('.upd-ok'); 
        t=await pg.inner_text('#updStat'); ok('finds newer android build (9, not windows 6)','9' in t and 'favourites' in t,t)
        ok('download button visible',await pg.locator('#updInstall').is_visible())
        await pg.click('#updInstall'); await pg.wait_for_timeout(200)
        links=await pg.evaluate("window.__links"); ok('opens the .apk link',len(links)==1 and links[0].endswith('android-9/My-Smart-Assistant.apk'),links)
        ok('bar shown for the update',await pg.locator('#updBar').count()==1)
        # ---- up to date
        await setup(pg,{'ver':'1.1','n':9,'platform':'android'})
        await pg.click('#updGo'); await pg.wait_for_timeout(700)
        ok('up to date message',('✓' in await pg.inner_text('#updStat')) and not await pg.locator('#updInstall').is_visible(),await pg.inner_text('#updStat'))
        # ---- error
        await setup(pg,{'ver':'1.1','n':5,'platform':'android'},fetch='fail')
        await pg.click('#updGo'); await pg.wait_for_selector('.upd-err',timeout=4000); ok('network error handled',True)
        # ---- unknown build
        await setup(pg,{'ver':'1.1','n':0,'platform':'android'})
        await pg.click('#updGo'); await pg.wait_for_timeout(500); ok('unbuilt copy explains itself',len((await pg.inner_text('#updStat')).strip())>20)
        # ---- windows: uses the desktop bridge
        await setup(pg,{'ver':'1.1','n':2,'platform':'windows'},desktop=True)
        await pg.click('#updGo'); await pg.wait_for_selector('.upd-ok'); t=await pg.inner_text('#updStat'); ok('windows finds build 6',' 6' in t,t)
        await pg.click('#updInstall'); await pg.wait_for_timeout(300)
        inst=await pg.evaluate("window.__inst"); ok('windows installer url sent to desktop bridge',bool(inst) and inst.endswith('windows-6/My-Smart-Assistant-Setup.exe'),inst)
        # ---- auto flag
        await pg.locator('#updAuto').uncheck(); ok('auto flag saved',await pg.evaluate("MSA.state.settings.updates.auto")==False)
        # ---- web: no SW in test server -> unsupported, no crash
        await setup(pg,{'ver':'1.1','n':0,'platform':'web'})
        await pg.click('#updGo'); await pg.wait_for_timeout(1500)
        ok('web without service worker is handled',len((await pg.inner_text('#updStat')).strip())>5)
        ok('no console errors',not pg.errs,pg.errs[:3])
    return summary()
import sys; sys.exit(1 if asyncio.run(main()) else 0)
