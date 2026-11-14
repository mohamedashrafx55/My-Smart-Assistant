import asyncio,sys,glob,json
from playwright.async_api import async_playwright
CH=glob.glob('/opt/pw-browsers/chromium-*/chrome-linux*/chrome')
R=[]
def ok(n,c,i=''):
    R.append(bool(c)); print(('PASS ' if c else 'FAIL ')+n+(' :: '+str(i) if (i and not c) else ''))
async def boot(b,keys=None):
    ctx=await b.new_context(viewport={'width':1280,'height':800})
    pg=await ctx.new_page(); pg.errs=[]
    pg.on('pageerror',lambda e: pg.errs.append(str(e)))
    await pg.add_init_script("try{localStorage.setItem('msa_motion','off');localStorage.setItem('msa_clean_v1','kept');const d=new Date().toLocaleDateString('en-CA');localStorage.setItem('msa_daily_m',d);localStorage.setItem('msa_daily_n',d)}catch(e){}")
    async def route(r):
        u=r.request.url
        if u.startswith('http://localhost') or u.startswith('data:') or u.startswith('blob:'): await r.continue_()
        elif 'api.pexels.com' in u: await r.fulfill(status=200,content_type='application/json',body=json.dumps({'photos':[{'id':1,'alt':'cup','photographer':'P','url':'https://www.pexels.com/p/1','src':{'medium':'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','large2x':'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}}]}))
        elif 'flickr.com/services/rest' in u: await r.fulfill(status=200,content_type='application/json',body=json.dumps({'stat':'ok','photos':{'photo':[{'id':'9','owner':'o1','title':'fl pic','ownername':'Ann','url_m':'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','url_l':'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}]}}))
        elif 'api.freepik.com' in u: await r.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*'},body=json.dumps({'data':[{'id':5,'title':'fp vec','url':'https://www.freepik.com/x','image':{'source':{'url':'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}},'author':{'name':'Bob'}}]}))
        else: await r.abort()
    await pg.route('**/*',route)
    await pg.goto('http://localhost:8765/index.html'); await pg.keyboard.press('Escape')
    await pg.wait_for_selector('#lkPw',timeout=8000); await pg.fill('#lkPw','Akademia'); await pg.keyboard.press('Enter')
    await pg.wait_for_selector('#app:not([hidden])',timeout=8000); await pg.wait_for_timeout(600)
    await pg.evaluate("MSA.demo.load().then(()=>{MSA.rerender&&MSA.rerender()})"); await pg.wait_for_timeout(900)
    if keys: await pg.evaluate("k=>{Object.assign(MSA.explore.keys(),k);MSA.save()}",keys)
    return pg
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(executable_path=CH[0],args=['--no-sandbox'])
        pg=await boot(b)
        ok('only stock sources exist',await pg.evaluate("MSA.explore.sources.map(s=>s.id).join(',')")=='pexels,unsplash,pixabay,flickr,freepik')
        await pg.evaluate("MSA.explore.open(MSA.state.projects[0],{tab:'images'})"); await pg.wait_for_selector('#exBody .ex-search',timeout=5000)
        t=await pg.inner_text('#exBody')
        ok('no museum / weird names on screen',not any(x in t for x in ['Met Museum','Cleveland','Art Institute','Wikimedia','Openverse']),t[:200])
        ok('no-key state with site chips',await pg.locator('.ex-nokey .cchip').count()>=3)
        names=await pg.evaluate("[...document.querySelectorAll('.ex-nokey .cchip')].map(x=>x.textContent.trim()).join('|')")
        ok('chips include Pinterest + Freepik + Behance',all(n in names for n in ['Pinterest','Freepik','Behance']),names)
        await pg.fill('[data-ex-q]','coffee'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(500)
        ok('search with no key shows friendly message not crash',await pg.locator('.ex-err').count()>=1 and not pg.errs,pg.errs)
        await pg.close()
        pg=await boot(b,{'pexels':'KEY'})
        await pg.evaluate("MSA.explore.open(MSA.state.projects[0],{tab:'images'})"); await pg.wait_for_selector('#exBody .ex-search',timeout=5000)
        ok('with key: source chip appears, no no-key panel',await pg.locator('.ex-src').count()==1 and await pg.locator('.ex-nokey').count()==0)
        await pg.fill('[data-ex-q]','coffee'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(900)
        ok('with key: results show',await pg.locator('.ex-card').count()>=1)
        await pg.close()
        pg=await boot(b,{'flickr':'K','freepik':'K'})
        await pg.evaluate("MSA.explore.open(MSA.state.projects[0],{tab:'images'})"); await pg.wait_for_selector('#exBody .ex-search',timeout=5000)
        ok('flickr + freepik chips appear with keys',await pg.locator('.ex-src').count()==2)
        await pg.evaluate("MSA.state.ui.exSrc=['flickr','freepik'];MSA.save()");
        await pg.fill('[data-ex-q]','coffee'); await pg.click('[data-ex=search]'); await pg.wait_for_timeout(1200)
        ok('results from flickr and freepik merged',await pg.evaluate("[...document.querySelectorAll('.ex-badge')].map(x=>x.textContent).sort().join(',')")=='Flickr,Freepik')
        await pg.close()
        # old saved selection of a removed source must not break
        pg=await boot(b,{'pexels':'KEY'})
        await pg.evaluate("MSA.state.ui.exSrc=['met','openverse'];MSA.save();MSA.explore.open(MSA.state.projects[0],{tab:'images'})"); await pg.wait_for_selector('#exBody .ex-search',timeout=5000)
        ok('stale saved selection falls back to Pexels',await pg.locator('.ex-src.on').count()==1 and not pg.errs,pg.errs)
        # settings connectors section
        await pg.evaluate("document.querySelector('.modal [data-x]').click();MSA.go('settings')"); await pg.wait_for_timeout(600)
        h=await pg.evaluate("document.body.innerText")
        ok('settings: 5 key fields only',await pg.locator('[data-exkey]').count()==5)
        ok('settings text has no museum names',not any(x in h for x in ['Harvard','Smithsonian','Europeana','Openverse','Wikimedia']))
        ok('no page errors',not pg.errs,pg.errs)
        await b.close()
    print('%d/%d passed'%(sum(R),len(R))); return 0 if all(R) else 1
sys.exit(asyncio.run(main()))
