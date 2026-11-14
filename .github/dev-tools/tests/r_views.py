import asyncio,sys
from h import *
OVER="(()=>{const w=document.documentElement.clientWidth;const bad=[];document.querySelectorAll('#view *,#app *').forEach(e=>{const r=e.getBoundingClientRect();if(r.width>0&&r.right>w+2&&getComputedStyle(e).position!=='fixed'){let p=e.parentElement,clip=false;while(p&&p!==document.body){const o=getComputedStyle(p).overflowX;if(o==='auto'||o==='scroll'||o==='hidden'){clip=true;break}p=p.parentElement}if(!clip)bad.push(e.className||e.tagName)}});return [document.documentElement.scrollWidth<=w+1,bad.slice(0,5)]})()"
async def main():
    async with Env() as e:
        for (w,h,lang) in [(390,780,'ar'),(390,780,'en'),(1280,800,'ar')]:
            pg=await e.page(w=w,h=h,lang=lang); 
            views=await pg.evaluate("Object.keys(MSA.views)")
            bad=[]
            for v in views:
                if v in ('guide',): continue
                await pg.evaluate("v=>MSA.go(v)",v); await pg.wait_for_timeout(250)
                r=await pg.evaluate(OVER)
                if not r[0] and w<500: bad.append((v,r[1]))
            ok('%dpx %s: every view opens, no page-wide horizontal scroll'%(w,lang),not bad and not pg.errs,(bad,pg.errs))
            # guide: every topic (incl. new Motion / Sites sections) renders; no overflow on phones
            tops=await pg.evaluate("MSA.guideData.filter(c=>c&&c.secs).map(c=>c.id)")
            gb=[]
            for t in tops:
                await pg.evaluate("t=>MSA.openGuide(t)",t); await pg.wait_for_timeout(250)
                r=await pg.evaluate(OVER)
                if not r[0] and w<500: gb.append((t,r[1]))
            ok('%dpx %s: guide topics render (%d) without overflow'%(w,lang,len(tops)),not gb and not pg.errs,(gb,pg.errs))
            has=await pg.evaluate("MSA.guideData.some(c=>(c.secs||[]).some(s=>s.id==='motion'))&&MSA.guideData.some(c=>(c.secs||[]).some(s=>s.id==='sites'))")
            ok('guide has motion + sites sections',has)
            if w<500:
                eb=[]
                for tab in ['images','colors','icons','fonts','sites']:
                    await pg.evaluate("t=>MSA.explore.open(MSA.state.projects[0],{tab:t})",tab); await pg.wait_for_timeout(500)
                    r=await pg.evaluate("(()=>{const m=document.querySelector('.modal');return [m.scrollWidth<=m.clientWidth+2,m.scrollWidth,m.clientWidth]})()")
                    if not r[0]: eb.append((tab,r))
                    await pg.evaluate("MSA.closeAllOverlays()"); await pg.wait_for_timeout(100)
                ok('%dpx %s: identity explorer tabs fit the screen'%(w,lang),not eb and not pg.errs,(eb,pg.errs))
            await pg.close()
    return summary()
sys.exit(asyncio.run(main()))
