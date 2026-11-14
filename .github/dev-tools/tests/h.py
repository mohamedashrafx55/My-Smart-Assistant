import asyncio, json, sys, os
from playwright.async_api import async_playwright
import glob; CHROME=glob.glob('/opt/pw-browsers/chromium-*/chrome-linux*/chrome')[0]
URL='http://localhost:8765/index.html'
IGN=('manifest','favicon','fonts.googleapis','gstatic','api.iconify','noembed','img.youtube','ERR_','net::','Failed to load resource')
class Env:
    async def __aenter__(self):
        self.pw=await async_playwright().start()
        self.b=await self.pw.chromium.launch(executable_path=CHROME,args=['--no-sandbox'])
        return self
    async def __aexit__(self,*a):
        await self.b.close(); await self.pw.stop()
    async def page(self,w=1280,h=800,state=None,lang=None,theme=None,accept_dl=True,demo=True,quiet=True,nofin=True):
        ctx=await self.b.new_context(viewport={'width':w,'height':h},accept_downloads=True,permissions=['clipboard-read','clipboard-write'])
        if os.environ.get('FAKE_DATE'): await ctx.clock.install(time=os.environ['FAKE_DATE'])
        pg=await ctx.new_page(); pg.errs=[]
        pg.on('pageerror',lambda e: pg.errs.append('PAGEERR '+str(e)))
        pg.on('console',lambda m: pg.errs.append('CONSOLE '+m.text) if m.type=='error' and not any(x in m.text for x in IGN) else None)
        await pg.add_init_script("try{localStorage.setItem('msa_motion','%s')}catch(e){}"%os.environ.get('MSA_MOTION','off'))
        if quiet: await pg.add_init_script("try{localStorage.setItem('msa_clean_v1','kept');localStorage.setItem('msa_daily_m',new Date().toLocaleDateString('en-CA'));localStorage.setItem('msa_daily_n',new Date().toLocaleDateString('en-CA'))}catch(e){}")
        await pg.route('**/*',lambda r: r.continue_() if r.request.url.startswith('http://localhost') or r.request.url.startswith('data:') or r.request.url.startswith('blob:') else r.abort())
        if state is not None:
            await pg.add_init_script("if(!sessionStorage.getItem('_seeded')){localStorage.setItem('msa_state_v1',%s);sessionStorage.setItem('_seeded','1')}"%json.dumps(json.dumps(state)))
        await pg.goto(URL); await pg.keyboard.press('Escape')
        await pg.wait_for_selector('#lkPw',timeout=8000)
        await pg.fill('#lkPw','Akademia'); await pg.keyboard.press('Enter')
        await pg.wait_for_selector('#app:not([hidden])',timeout=8000)
        await pg.wait_for_timeout(600)
        if demo and state is None: await pg.evaluate("MSA.demo.load().then(()=>{MSA.updateCounts&&MSA.updateCounts();MSA.rerender&&MSA.rerender()})"); await pg.wait_for_timeout(900)
        if lang or theme:
            await pg.evaluate("([l,t])=>{if(l)MSA.state.settings.lang=l;if(t)MSA.state.settings.theme=t;MSA.save();MSA.applyTheme();MSA.applyLang()}",[lang,theme])
        if nofin: await pg.evaluate("MSA.plus&&(MSA.plus.financeSetup=()=>{})")
        return pg
R=[]
def ok(name,cond,info=''):
    R.append((name,bool(cond),info)); print(('PASS ' if cond else 'FAIL ')+name+(' :: '+str(info) if (info and not cond) else ''))
def summary():
    f=[r for r in R if not r[1]]; print('\n%d/%d passed'%(len(R)-len(f),len(R)));
    for r in f: print('  FAILED:',r[0],r[2])
    return len(f)
