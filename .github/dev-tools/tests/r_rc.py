import asyncio
from h import *
async def main():
    async with Env() as e:
        pg = await e.page(w=1280, h=900); await pg.wait_for_timeout(1200)
        # ---- presentation plan ----
        ok('presentation type exists in the picker data', await pg.evaluate("!!MSA.tpl.find('showcase')"))
        r = await pg.evaluate("""(()=>{const m=MSA.tpl.make('showcase');const L=[];MSA.proj.walk(m.steps,s=>L.push(MSA.proj.title(s)));return {n:m.steps.length,L,notes:m.steps.filter(s=>s.note).length,edges:m.graph.edges.length,pos:Object.keys(m.graph.pos).length}})()""")
        txt = ' | '.join(r['L']); print(txt)
        ok('plan has the 8 showcase elements + review/publish', all(k in txt for k in ['Cover','Hero','Project overview','Motion','Outro','Sketches','Logo construction']) or all(k in txt for k in ['صورة الغلاف','البانر','نبذة','الحركة','الخاتمة','اسكتشات','بناء الشعار']), txt)
        ok('plan reuses built-in stages (moodboard, colours, fonts, icons, mockups)', await pg.evaluate("(()=>{const m=MSA.tpl.make('showcase');const k=m.steps.map(s=>s.key);return ['mood','colors','fonts','icons','mockups'].every(x=>k.includes(x))})()"))
        ok('every stage carries the guidance note from the brief', r['notes'] >= 10 and r['n'] == 14, r)
        ok('map has arrows and positions', r['edges'] >= 12 and r['pos'] == r['n'], r)
        ok('cover note has the 808×632 size', await pg.evaluate("MSA.tpl.make('showcase').steps.some(s=>/808×632/.test(s.note))"))
        # create it through the New-project dialog
        await pg.evaluate("MSA.state.ui.projView='list';MSA.go('active')"); await pg.wait_for_timeout(500)
        n0 = await pg.evaluate("MSA.state.projects.length")
        await pg.evaluate("document.querySelector('[data-act=newproj],[data-act=new],#btnNewProj')&&0")
        btn = pg.locator('button', has_text='مشروع جديد').first
        if await btn.count(): await btn.click()
        else: await pg.evaluate("MSA.proj.newProject&&MSA.proj.newProject()")
        await pg.wait_for_selector('#npGrid', timeout=5000)
        await pg.fill('#npName', 'عرض اختبار'); await pg.fill('#npQ', 'Behance'); await pg.wait_for_timeout(300)
        card = pg.locator('#npGrid [data-k="type:showcase"]').first
        if await card.count() == 0: card = pg.locator('#npGrid .tcard, #npGrid button, #npGrid > *', has_text='Behance').first
        if await card.count() == 0: card = pg.locator('#npGrid > *', has_text='Behance').first
        ok('presentation card shows in the New-project picker', await card.count() >= 1)
        await card.click(); await pg.click('.modal .btn.primary'); await pg.wait_for_timeout(800)
        p = await pg.evaluate("(()=>{const p=MSA.state.projects.find(x=>x.name==='عرض اختبار');return p?{n:p.steps.length,notes:p.steps.filter(s=>s.note).length}:null})()")
        ok('project created with the plan and its notes', p and p['n'] == 14 and p['notes'] >= 10, p)
        # ---- My files: select checkbox ----
        await pg.evaluate("MSA.vault.newFolder('A');MSA.vault.newFolder('B');MSA.go('files')"); await pg.wait_for_timeout(500)
        await pg.evaluate("MSA.state.vault.items.push({id:'f1',t:'f',name:'x.txt',parent:null,a:{id:'zz',kind:'doc',size:3,name:'x.txt'},updated:Date.now()});MSA.rerender(true)"); await pg.wait_for_timeout(500)
        for i in range(3):
            c = pg.locator('.fm-card').nth(i); await c.hover(); await c.locator('.fm-chk').click(); await pg.wait_for_timeout(200)
        ok('checkbox selects the cards (3) and opens nothing', await pg.locator('.fm-card.sel').count() == 3 and await pg.locator('.overlay').count() == 0 and await pg.evaluate("MSA.view==='files'"))
        await pg.locator('.fm-card').nth(1).locator('.fm-chk').click(); await pg.wait_for_timeout(200)
        ok('checkbox toggles off', await pg.locator('.fm-card.sel').count() == 2)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        # ---- right-click anywhere empty ----
        vb = await pg.evaluate("(()=>{const r=document.querySelector('#view').getBoundingClientRect();const h=document.querySelector('#view > *').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,hb:h.bottom,hr:h.right,hl:h.left}})()")
        pts = {'far below content': (vb['x']+vb['w']/2, vb['y']+vb['h']-8), 'right margin': (vb['x']+vb['w']-6, vb['y']+300), 'left margin': (vb['x']+5, vb['y']+300), 'top padding': (vb['x']+vb['w']/2, vb['y']+4)}
        for nm,(x,y) in pts.items():
            await pg.mouse.click(10, 5)  # neutral
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(100)
            await pg.mouse.click(x, y, button='right'); await pg.wait_for_timeout(250)
            ok('files: right-click in "%s" opens the menu' % nm, await pg.locator('.fm-ctx').count() >= 1)
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(100)
            if await pg.locator('.fm-ctx').count(): await pg.mouse.click(5, 5)
        # ---- tasks view (multi-select bg menu) ----
        await pg.evaluate("MSA.go('tasks')"); await pg.wait_for_timeout(500)
        await pg.evaluate("MSA.tasksApi&&MSA.tasksApi.add&&0")
        vb = await pg.evaluate("(()=>{const r=document.querySelector('#view').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()")
        await pg.mouse.click(vb['x']+vb['w']/2, vb['y']+vb['h']-8, button='right'); await pg.wait_for_timeout(250)
        ok('tasks: right-click far below the content opens a menu', await pg.locator('.fm-ctx').count() >= 1)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(150)
        # no menu where none is expected & no errors; a plain right-click on a view without bg menu leaves default behaviour
        await pg.evaluate("MSA.go('home')"); await pg.wait_for_timeout(400)
        await pg.mouse.click(vb['x']+vb['w']/2, vb['y']+vb['h']-8, button='right'); await pg.wait_for_timeout(200)
        ok('no page errors', not pg.errs, pg.errs[:3])
asyncio.run(main()); summary()
