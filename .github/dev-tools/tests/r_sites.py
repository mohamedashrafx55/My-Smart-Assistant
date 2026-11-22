import asyncio
from h import *
NEW=['freeimages','nohat','stockvault','freerange','logowik','iconape','pngwing','pngegg','pngtree','arabsstock']
async def main():
    async with Env() as e:
        pg=await e.page(w=1200,h=850)
        ok('all 10 missing sites exist as connectors',await pg.evaluate("ids=>ids.every(i=>MSA.conn.all.some(x=>x.id===i))",NEW))
        r=await pg.evaluate("ids=>ids.map(i=>{const x=MSA.conn.all.find(y=>y.id===i);return x.url('coffee%20shop',{})})",NEW)
        ok('every new site builds an https search link with the query',all(u.startswith('https://') for u in r) and sum('coffee' in u for u in r)>=8,r)
        ok('Freepik/Magnific is ONE connector (no duplicate)',await pg.evaluate("MSA.conn.all.filter(x=>/freepik|magnific/i.test(x.id+x.name)).length===1&&MSA.conn.all.find(x=>x.id==='freepik').name==='Magnific'"))
        # gmail setting
        ok('invalid gmail rejected',await pg.evaluate("MSA.conn.setGmail('abc')===false&&MSA.conn.gmail()===''"))
        ok('valid gmail saved',await pg.evaluate("MSA.conn.setGmail('me@gmail.com')===true&&MSA.conn.gmail()==='me@gmail.com'"))
        await pg.evaluate("MSA.go('settings')"); await pg.wait_for_timeout(500)
        ok('settings has Gmail field',await pg.evaluate("!!document.querySelector('#cnGmail')&&document.querySelector('#cnGmail').value==='me@gmail.com'"))
        # explore sites tab (desktop-style)
        await pg.evaluate("window.msaDesktop={webview:true,onWebImage(){}}")
        await pg.evaluate("(()=>{MSA.state.ui.exTab='sites';MSA.save()})()")
        await pg.evaluate("MSA.explore.open(MSA.state.projects[0]||{id:'x',steps:[]},{tab:'sites'})"); await pg.wait_for_timeout(700)
        ok('sites tab lists new sites',await pg.evaluate("[...document.querySelectorAll('.ex-src')].map(b=>b.innerText).filter(t=>/PNGWing|PngTree|Nohat/.test(t)).length===3"))
        ok('sites tab has a single Magnific chip and no Freepik chip',await pg.evaluate("(()=>{const t=[...document.querySelectorAll('.ex-src')].map(b=>b.innerText);return t.filter(x=>/Magnific/.test(x)).length===1&&!t.some(x=>/Freepik/.test(x))})()"))
        ok('Gmail bar shows email + link/fill buttons',await pg.evaluate("!!document.querySelector('.ex-gm [data-ex=gm-link]')&&!!document.querySelector('.ex-gm [data-ex=gm-fill]')&&document.querySelector('.ex-gm b').textContent==='me@gmail.com'"))
        ok('not linked at first',await pg.evaluate("!MSA.state.connectors.gmailLinked&&!document.querySelector('.ex-gms.on')"))
        await pg.evaluate("document.querySelector('[data-ex=gm-copy]').click()"); await pg.wait_for_timeout(300)
        await pg.evaluate("document.querySelector('[data-ex=gm-fill]').click()"); await pg.wait_for_timeout(400)
        ok('fill without a real webview fails gracefully (no crash)',not pg.errs,pg.errs)
        await pg.evaluate("document.querySelector('[data-ex=gm-edit]').click()"); await pg.wait_for_timeout(300)
        ok('edit clears email and shows the input',await pg.evaluate("!!document.querySelector('[data-ex-gm]')&&MSA.conn.gmail()===''"))
        ok('no page errors',not pg.errs,pg.errs)
asyncio.run(main()); summary()
