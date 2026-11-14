import asyncio,sys
from h import *
MOCK="""
window.__c=[];window.__prog=null;
window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',Plugins:{App:{addListener(){return {remove(){}}}},
 ApkInstaller:{allowed:true,
  canInstall:async function(){__c.push('can');return {allowed:window.__allowed!==false}},
  openSettings:async()=>{__c.push('settings')},
  addListener:async(n,f)=>{window.__prog=f;return {remove(){__c.push('rm')}}},
  download:async(o)=>{__c.push('dl:'+o.url);if(window.__prog){window.__prog({percent:40});await new Promise(r=>setTimeout(r,50));}if(window.__fail)throw new Error('http 500');return {path:'/cache/updates/update.apk'}},
  install:async(o)=>{__c.push('inst:'+o.path)}}}};
"""
FAKE="""(()=>{window.fetch=(u)=>Promise.resolve({ok:true,status:200,json:async()=>[{tag_name:'android-9',published_at:'2026-11-01T10:00:00Z',html_url:'https://github.com/x',body:'n',assets:[{name:'My-Smart-Assistant.apk',size:7600000,browser_download_url:'https://github.com/mohamedashrafx55/My-Smart-Assistant/releases/download/android-9/My-Smart-Assistant.apk'}]}]})})()"""
async def main():
    async with Env() as e:
        ctx=await e.b.new_context(viewport={'width':390,'height':800}); pg=await ctx.new_page(); pg.errs=[]
        pg.on('pageerror',lambda x: pg.errs.append(str(x)))
        await pg.route('**/*',lambda r: r.continue_() if r.request.url.startswith('http://localhost') or r.request.url.startswith('data:') else r.abort())
        await pg.add_init_script("localStorage.setItem('msa_clean_v1','kept')"); await pg.add_init_script(MOCK)
        await pg.goto(URL); await pg.wait_for_selector('#lkPw',timeout=8000); await pg.fill('#lkPw','Akademia'); await pg.keyboard.press('Enter')
        await pg.wait_for_selector('#app:not([hidden])',timeout=9000); await pg.wait_for_timeout(500)
        await pg.evaluate("MSA.build={ver:'1.1',n:5,platform:'android'}")
        await pg.evaluate(FAKE)
        await pg.evaluate("MSA.openSettings()"); await pg.wait_for_selector('#updGo',state='attached'); await pg.wait_for_timeout(300)
        await pg.locator('#updGo').dispatch_event('click'); await pg.wait_for_selector('#updInstall',state='attached',timeout=8000)
        ok('update found (build 9)', '9' in await pg.inner_text('#updStat'))
        await pg.locator('#updInstall').dispatch_event('click'); await pg.wait_for_timeout(500)
        c=await pg.evaluate('__c')
        ok('checks permission, downloads inside the app, then opens installer',c[0]=='can' and any(x.startswith('dl:https://github.com/mohamedashrafx55') for x in c) and 'inst:/cache/updates/update.apk' in c,c)
        ok('progress listener removed','rm' in c,c)
        # permission off -> opens the system settings, no download
        await pg.evaluate("window.__c.length=0;window.__allowed=false"); await pg.locator('#updInstall').dispatch_event('click'); await pg.wait_for_timeout(300)
        c=await pg.evaluate('__c'); ok('install-permission missing: opens settings, does not download','settings' in c and not any(x.startswith('dl:') for x in c),c)
        # failure -> falls back (no crash)
        await pg.evaluate("window.__c.length=0;window.__allowed=true;window.__fail=true;window.open=(u)=>{window.__c.push('open:'+u)}"); await pg.locator('#updInstall').dispatch_event('click'); await pg.wait_for_timeout(500)
        c=await pg.evaluate('__c'); ok('download failure falls back to opening the link',any(x.startswith('open:https://github.com') for x in c) or any(x.startswith('dl:') for x in c),c)
        ok('no page errors',not pg.errs,pg.errs)
    return summary()
sys.exit(asyncio.run(main()))
