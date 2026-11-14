import asyncio, base64, glob, os
from h import *
exec(open('f5.py',encoding='utf8').read().split('async def main')[0].split('from h import *')[1])
async def main():
    async with Env() as e:
        pg=await e.page(lang='ar'); await pg.wait_for_timeout(1200)
        await pg.evaluate("MSA.state.ui.projView='list';MSA.go('active')"); await pg.wait_for_timeout(500)
        await pg.evaluate("(()=>{const p=MSA.state.projects.find(p=>p.status!=='done');let s=null;MSA.proj.walk(p.steps,x=>{if(!s&&x.key==='mood')s=x});MSA.board.open(p,s)})()"); await pg.wait_for_selector('#msaBoard'); await pg.wait_for_timeout(1000)
        n0=len(await items(pg)); rs=await rects(pg); r=rs[0]; await pg.mouse.click(r['x']+r['w']/2,r['y']+r['h']/2)
        # Arabic keyboard layout: key is an Arabic letter, code is the physical key
        await pg.evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'ذ',code:'KeyG',bubbles:true,cancelable:true}))"); await pg.wait_for_timeout(150)
        ok('G works on an Arabic keyboard layout (physical key)', sum(1 for i in await items(pg) if i.get('gray'))==1)
        await pg.evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'ي',code:'KeyD',ctrlKey:true,bubbles:true,cancelable:true}))"); await pg.wait_for_timeout(150)
        ok('Ctrl+D works on an Arabic layout', len(await items(pg))==n0+1)
        # corrupt image is skipped, not added as a blank item
        await pg.evaluate("""async()=>{const dt=new DataTransfer();dt.items.add(new File([new Uint8Array([1,2,3,4,5])],'bad.png',{type:'image/png'}));const st=document.getElementById('bdStage');st.dispatchEvent(new DragEvent('drop',{dataTransfer:dt,bubbles:true,cancelable:true,clientX:600,clientY:400}))}"""); await pg.wait_for_timeout(1200)
        ok('corrupt image is skipped (no blank item)', len(await items(pg))==n0+1 and not await pg.evaluate("(()=>{let s=null;MSA.proj.walk(MSA.state.projects.find(p=>p.status!=='done').steps,x=>{if(!s&&x.key==='mood')s=x});return s.atts.some(a=>a.name==='bad.png')})()"))
        # deleting the project removes board-trash files too
        await pg.keyboard.press('Control+a'); await pg.keyboard.press('Delete'); await pg.wait_for_timeout(300)
        tr=await pg.evaluate("(()=>{let s=null;MSA.proj.walk(MSA.state.projects.find(p=>p.status!=='done').steps,x=>{if(!s&&x.key==='mood')s=x});return s.board.trash.map(a=>a.id)})()")
        ok('trash holds the removed pictures', len(tr)>=1, tr)
        own=await pg.evaluate("(()=>{const p=MSA.state.projects.find(p=>p.status!=='done');return MSA.proj.ownedAtts(p.steps).map(a=>a.id)})()")
        ok('ownedAtts includes trash (so deleting a project cleans the files)', all(t in own for t in tr))
        await pg.keyboard.press('Control+z'); await pg.wait_for_timeout(200)
        # picture removed from the plan view while the board is closed -> orphan item dropped on reopen
        await pg.evaluate("document.querySelector('[data-c=close]').click()"); await pg.wait_for_timeout(600)
        await pg.evaluate("""(()=>{const p=MSA.state.projects.find(p=>p.status!=='done');let s=null;MSA.proj.walk(p.steps,x=>{if(!s&&x.key==='mood')s=x});const a=s.atts.find(a=>a.kind==='image');s.atts=s.atts.filter(x=>x.id!==a.id);MSA.save()})()""")
        before=await pg.evaluate("(()=>{let s=null;MSA.proj.walk(MSA.state.projects.find(p=>p.status!=='done').steps,x=>{if(!s&&x.key==='mood')s=x});return s.board.items.length})()")
        await pg.evaluate("(()=>{const p=MSA.state.projects.find(p=>p.status!=='done');let s=null;MSA.proj.walk(p.steps,x=>{if(!s&&x.key==='mood')s=x});MSA.board.open(p,s)})()"); await pg.wait_for_selector('#msaBoard'); await pg.wait_for_timeout(1000)
        after=len(await items(pg)); ok('orphan items (picture deleted elsewhere) are dropped', after<before, (before,after))
        ok('no blank items on board', await pg.evaluate("[...document.querySelectorAll('.bi-img')].every(i=>i.src)"))
        ok('no errors', not pg.errs, pg.errs[:3])
    summary()
asyncio.run(main())
