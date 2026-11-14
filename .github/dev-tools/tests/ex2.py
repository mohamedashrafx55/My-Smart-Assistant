import asyncio,sys,glob,json
from playwright.async_api import async_playwright
import glob as _g
R=[]
def ok(n,c,i=''):
    R.append(bool(c)); print(('PASS ' if c else 'FAIL ')+n+(' :: '+str(i) if (i and not c) else ''))
CH=glob.glob('/opt/pw-browsers/chromium-*/chrome-linux*/chrome')
src=open('ex1.py').read(); boot_src=src[src.index('async def boot'):src.index('async def main')]
exec(boot_src)
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(executable_path=CH[0],args=['--no-sandbox'])
        pg=await boot(b)
        await pg.evaluate("window.__opened=[];MSA.openLink=u=>window.__opened.push(u);MSA.explore.open(MSA.state.projects[0],{tab:'sites',q:'coffee brand'})")
        await pg.wait_for_selector('#exBody .ex-srcs',timeout=5000)
        n=await pg.locator('[data-ex-site]').count()
        ok('sites tab lists 10+ famous sites',n>=10,n)
        names=await pg.evaluate("[...document.querySelectorAll('[data-ex-site]')].map(x=>x.textContent.trim())")
        ok('Pinterest, Behance, Freepik, Dribbble present',all(x in names for x in ['Pinterest','Behance','Freepik','Dribbble']),names)
        ok('no embedded webview on web',await pg.locator('webview').count()==0)
        ok('explanatory note shown',await pg.locator('.ex-nokey').count()==1)
        await pg.click('[data-ex-site=pinterest]'); await pg.wait_for_timeout(100)
        o=await pg.evaluate("__opened")
        ok('Pinterest opens with the search words',len(o)==1 and 'pinterest.com/search/pins/?q=coffee%20brand' in o[0],o)
        await pg.fill('[data-ex-q]','logo design'); await pg.click('[data-ex-site=behance]'); await pg.wait_for_timeout(100)
        o=await pg.evaluate("__opened")
        ok('typed words are used for the next site',len(o)==2 and 'behance.net' in o[1] and 'logo%20design' in o[1],o)
        await pg.click('[data-ex=site-go]'); await pg.wait_for_timeout(100)
        ok('Search button reopens current site',await pg.evaluate("__opened.length")==3)
        await pg.fill('[data-ex-q]','x y'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(100)
        ok('Enter key triggers the search',await pg.evaluate("__opened.length")==4 and 'x%20y' in await pg.evaluate("__opened[3]"))
        # switching tabs and back keeps working
        await pg.click('[data-ex-tab=colors]'); await pg.click('[data-ex-tab=sites]'); await pg.wait_for_selector('[data-ex-site]')
        ok('tab switch round trip',await pg.locator('[data-ex-site]').count()==n)
        # turning a site off in connectors removes it
        await pg.evaluate("MSA.state.connectors.off.freepik=true;MSA.save()"); await pg.click('[data-ex-tab=images]'); await pg.click('[data-ex-tab=sites]'); await pg.wait_for_selector('[data-ex-site]')
        names=await pg.evaluate("[...document.querySelectorAll('[data-ex-site]')].map(x=>x.textContent.trim())")
        ok('site turned off in Connectors disappears',('Freepik' not in names) and len(names)==n-1,names)
        # step chips include the new sites where relevant
        h=await pg.evaluate("MSA.conn.links('mood','x').map(l=>l.name).join('|')")
        ok('mood-board step offers the new sites',all(x in h for x in ['Flickr','ArtStation','Awwwards']),h)
        ok('no page errors',not pg.errs,pg.errs)
        await b.close()
    print('%d/%d passed'%(sum(R),len(R))); return 0 if all(R) else 1
sys.exit(asyncio.run(main()))
