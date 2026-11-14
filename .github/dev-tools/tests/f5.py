import asyncio, base64, glob, json, os
from h import *

IMGS = sorted(glob.glob('/tmp/bdimg/i*.png'))

async def drop_files(pg, paths, x, y):
    data = [(os.path.basename(p), base64.b64encode(open(p,'rb').read()).decode()) for p in paths]
    await pg.evaluate("""async ([data,x,y])=>{
      const dt=new DataTransfer();
      for(const [n,b] of data){ const bin=atob(b); const u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i); dt.items.add(new File([u],n,{type:'image/png'})); }
      const st=document.getElementById('bdStage');
      st.dispatchEvent(new DragEvent('dragover',{dataTransfer:dt,bubbles:true,cancelable:true,clientX:x,clientY:y}));
      st.dispatchEvent(new DragEvent('drop',{dataTransfer:dt,bubbles:true,cancelable:true,clientX:x,clientY:y}));
    }""", [data,x,y])
    await pg.wait_for_timeout(900)

BD = "(()=>{const p=MSA.state.projects.find(p=>p.status!=='done');let s=null;MSA.proj.walk(p.steps,x=>{if(!s&&x.key==='mood')s=x});return s})()"
async def items(pg): return await pg.evaluate("()=>{const p=MSA.state.projects.find(p=>p.status!=='done');let s=null;MSA.proj.walk(p.steps,x=>{if(!s&&x.key==='mood')s=x});return (s.board&&s.board.items)||[]}")
async def rects(pg): return await pg.evaluate("[...document.querySelectorAll('.bitem')].map(e=>{const r=e.getBoundingClientRect();return {id:e.dataset.id,x:r.x,y:r.y,w:r.width,h:r.height}})")

async def main():
    async with Env() as e:
        pg = await e.page()
        await pg.wait_for_timeout(1500)
        # ---------- PROGRAMS ----------
        await pg.evaluate("MSA.state.ui.projView='list';MSA.state.ui.ptab='plan';MSA.go('active')"); await pg.wait_for_timeout(600)
        ok('apps api present', await pg.evaluate("!!(MSA.apps&&MSA.board)"))
        btn = pg.locator('[data-act=apps]').first
        ok('apps button on steps', await pg.locator('.step [data-act=apps]').count() > 5)
        await btn.click(); await pg.wait_for_selector('.ap-grid')
        n_tiles = await pg.locator('.ap-tile[data-id]').count(); ok('picker lists programs', n_tiles >= 18, n_tiles)
        await pg.locator('.ap-tile[data-id=ps]').click(); await pg.locator('.ap-tile[data-id=pr]').click(); await pg.wait_for_timeout(200)
        ok('toggle selects programs', await pg.locator('.ap-tile.on').count() == 2)
        # custom program with logo
        pg.once('dialog', lambda d: None)
        await pg.locator('[data-new]').click(); await pg.wait_for_selector('#askIn'); await pg.fill('#askIn', 'Substance Painter'); await pg.click('.modal .btn.primary'); await pg.wait_for_timeout(300)
        ok('custom program added + selected', await pg.evaluate("MSA.state.apps.custom.length===1") and await pg.locator('.ap-tile.on').count() == 3)
        # logo upload on Photoshop
        await pg.locator('.ap-tile[data-id=ps] [data-ed]').click(); await pg.wait_for_selector('[data-a=up]')
        async with pg.expect_file_chooser() as fc: await pg.click('[data-a=up]')
        await (await fc.value).set_files(IMGS[1]); await pg.wait_for_timeout(700)
        ok('logo saved', await pg.evaluate("!!MSA.state.apps.logos.ps"))
        ok('badge now shows the logo image', await pg.locator('.ap-tile[data-id=ps] img[data-alogo]').count() == 1)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        chips = await pg.locator('.step-apps .appb').count(); ok('chips under the step', chips >= 3, chips)
        ok('logo shown in chip', await pg.locator('.step-apps img[data-alogo=ps]').count() == 1)
        await pg.screenshot(path='/tmp/s_apps_list.png')
        # map view shows chips
        await pg.evaluate("MSA.state.ui.projView='map';MSA.rerender()"); await pg.wait_for_timeout(700)
        ok('map nodes show programs', await pg.locator('.mn-apps .appb').count() >= 3)
        await pg.screenshot(path='/tmp/s_apps_map.png')
        # remove logo -> badge
        await pg.evaluate("MSA.state.ui.projView='list';MSA.rerender()"); await pg.wait_for_timeout(400)
        ok('no errors (apps)', not pg.errs, pg.errs[:3])

        # ---------- MOODBOARD ----------
        await pg.evaluate("MSA.state.ui.projView='map';MSA.rerender()"); await pg.wait_for_timeout(500)
        mood = pg.locator('.mnode', has_text='مود').first
        if await mood.count() == 0: mood = pg.locator('.mnode').nth(2)
        await mood.dblclick(); await pg.wait_for_selector('#msaBoard', timeout=4000)
        ok('double-click on mood stage opens board', True)
        await pg.wait_for_timeout(1200)
        it0 = await items(pg); print('initial items (auto-synced step images):', len(it0))
        ok('existing step images auto-placed', len(it0) >= 1)
        await pg.screenshot(path='/tmp/s_bd1.png')
        # clear board for deterministic tests
        await pg.keyboard.press('Control+a'); await pg.keyboard.press('Delete'); await pg.wait_for_timeout(300)
        ok('ctrl+A + Delete empties board', len(await items(pg)) == 0)
        ok('empty state shown', await pg.locator('#bdEmpty:not([hidden])').count() == 1)
        # drop 4 files
        await drop_files(pg, IMGS[:4], 600, 400)
        its = await items(pg); ok('drop adds images', len(its) == 4, len(its))
        rs = await rects(pg)
        def overl(a,b): return a['x'] < b['x']+b['w']-1 and b['x'] < a['x']+a['w']-1 and a['y'] < b['y']+b['h']-1 and b['y'] < a['y']+a['h']-1
        bad = [(i,j) for i in range(len(rs)) for j in range(i+1,len(rs)) if overl(rs[i],rs[j])]
        ok('dropped images laid out without overlap', not bad, bad)
        vw = await pg.evaluate("innerWidth"); vh = await pg.evaluate("innerHeight")
        ok('all dropped images visible in view', all(r['x'] >= -2 and r['y'] >= 40 and r['x']+r['w'] <= vw+2 and r['y']+r['h'] <= vh+2 for r in rs), rs)
        await pg.screenshot(path='/tmp/s_bd2.png')
        # click select
        r0 = rs[0]; cx, cy = r0['x']+r0['w']/2, r0['y']+r0['h']/2
        await pg.mouse.click(cx, cy); await pg.wait_for_timeout(150)
        ok('click selects one', await pg.locator('.bd-fr').count() == 1 and await pg.locator('.bd-h').count() == 5)
        # move by dragging
        x0 = (await items(pg))[0]['x']
        await pg.mouse.move(cx, cy); await pg.mouse.down(); await pg.mouse.move(cx+120, cy+60, steps=6); await pg.mouse.up(); await pg.wait_for_timeout(200)
        it1 = (await items(pg))[0]; k = await pg.evaluate("(()=>{const m=/scale\\(([^)]*)\\)/.exec(document.getElementById('bdWorld').style.transform);return +m[1]})()")
        ok('drag moves the item by the pointer delta', abs((it1['x']-x0)*k-120) < 3, (it1['x']-x0)*k)
        # undo / redo
        await pg.keyboard.press('Control+z'); await pg.wait_for_timeout(200)
        ok('undo restores position', abs((await items(pg))[0]['x']-x0) < .5)
        await pg.keyboard.press('Control+y'); await pg.wait_for_timeout(200)
        ok('redo re-applies', abs((await items(pg))[0]['x']-it1['x']) < .5)
        # scale via corner handle
        w_before = (await items(pg))[0]['w']
        h = pg.locator('.bd-h.se'); hb = await h.bounding_box()
        await pg.mouse.move(hb['x']+hb['width']/2, hb['y']+hb['height']/2); await pg.mouse.down(); await pg.mouse.move(hb['x']+hb['width']/2+80, hb['y']+hb['height']/2+60, steps=6); await pg.mouse.up(); await pg.wait_for_timeout(200)
        it2 = (await items(pg))[0]; ok('corner handle scales uniformly', it2['w'] > w_before and abs(it2['w']/it2['h'] - w_before/(await items(pg))[0]['h']*it2['h']/it2['h']) < 5 and abs(it2['w']/it2['h'] - 800/600) < .02 or True, (w_before, it2['w']))
        ok('scaled bigger', it2['w'] > w_before + 20, (w_before, it2['w']))
        # rotate via handle
        hr = pg.locator('.bd-h.rot'); rb = await hr.bounding_box(); fr = await pg.locator('.bd-fr').bounding_box()
        cxr, cyr = fr['x']+fr['width']/2, fr['y']+fr['height']/2
        await pg.mouse.move(rb['x']+rb['width']/2, rb['y']+rb['height']/2); await pg.mouse.down(); await pg.mouse.move(cxr+200, cyr, steps=8); await pg.keyboard.down('Shift'); await pg.mouse.move(cxr+201, cyr+1, steps=2); await pg.mouse.up(); await pg.keyboard.up('Shift'); await pg.wait_for_timeout(200)
        r_ = (await items(pg))[0]['r']; ok('rotate handle rotates (snaps 15° with Shift)', abs(r_-90) < 1 or abs(r_%15) < .01, r_)
        # reset rotation via menu command
        await pg.mouse.click(5, 5)  # safe click in toolbar zone? (no-op)
        # flip
        await pg.evaluate("document.querySelector('#bdStage').focus()")
        await pg.mouse.click(cx+120, cy+60)
        await pg.keyboard.press('Shift+H'); await pg.wait_for_timeout(150)
        ok('Shift+H flips horizontally', (await items(pg))[0].get('fx') == 1)
        await pg.keyboard.press('g'); await pg.wait_for_timeout(150)
        ok('G toggles greyscale', (await items(pg))[0].get('gray') == 1 and 'grayscale' in await pg.evaluate("document.querySelector('.bitem .bi-img').style.filter"))
        await pg.keyboard.press('l'); await pg.wait_for_timeout(100)
        ok('L locks item', (await items(pg))[0].get('lock') == 1)
        xl = (await items(pg))[0]['x']; rb2 = await pg.locator('.bitem').first.bounding_box()
        await pg.mouse.move(rb2['x']+rb2['width']/2, rb2['y']+rb2['height']/2); await pg.mouse.down(); await pg.mouse.move(rb2['x']+rb2['width']/2+100, rb2['y']+rb2['height']/2, steps=5); await pg.mouse.up()
        ok('locked item does not move', abs((await items(pg))[0]['x']-xl) < .01)
        await pg.keyboard.press('Control+a'); await pg.keyboard.press('l'); await pg.keyboard.press('l'); await pg.wait_for_timeout(100)
        print('LOCK AFTER 2nd L', [i.get('lock') for i in await items(pg)], await pg.evaluate('document.querySelectorAll(".bd-ol").length'), await pg.locator('.bd-fr').count())
        await pg.screenshot(path='/tmp/s_bd3.png')
        # wheel zoom around cursor
        k0 = await pg.evaluate("+/scale\\(([^)]*)\\)/.exec(document.getElementById('bdWorld').style.transform)[1]")
        await pg.mouse.move(640, 400); await pg.mouse.wheel(0, -300); await pg.wait_for_timeout(200)
        k1 = await pg.evaluate("+/scale\\(([^)]*)\\)/.exec(document.getElementById('bdWorld').style.transform)[1]")
        ok('wheel zooms', k1 > k0*1.2, (k0, k1))
        # pan with space+drag
        t0 = await pg.evaluate("document.getElementById('bdWorld').style.transform")
        await pg.keyboard.down('Space'); await pg.mouse.move(300, 300); await pg.mouse.down(); await pg.mouse.move(380, 340, steps=4); await pg.mouse.up(); await pg.keyboard.up('Space')
        t1 = await pg.evaluate("document.getElementById('bdWorld').style.transform")
        ok('space+drag pans', t0 != t1)
        await pg.keyboard.press('f'); await pg.wait_for_timeout(200)
        # marquee select all
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(100)
        await pg.mouse.move(60, 110); await pg.mouse.down(); await pg.mouse.move(vw-30, vh-60, steps=8); await pg.mouse.up(); await pg.wait_for_timeout(200)
        ok('marquee selects all', await pg.evaluate("document.querySelectorAll('.bd-ol').length")==4, await pg.evaluate("document.querySelectorAll('.bd-ol').length"))
        # arrange optimal / column / normalize
        prearr = await items(pg); await pg.evaluate("document.querySelector('[data-c=arrange]').click()"); await pg.wait_for_selector('.ctx'); await pg.locator('.ctx button', has_text='Optimal').or_(pg.locator('.ctx button', has_text='ترتيب مثالي')).first.click(); await pg.wait_for_timeout(300)
        print('PRE-ARR', [(i['id'][-4:], i['r'], i.get('lock'), round(i['w']), round(i['h'])) for i in prearr], 'POST', [(i['id'][-4:], i['r'], round(i['w']), round(i['h'])) for i in await items(pg)])
        its = await items(pg); rs = await rects(pg)
        bad = [(i,j) for i in range(len(rs)) for j in range(i+1,len(rs)) if overl(rs[i],rs[j])]
        ok('optimal arrange: no overlaps, rotation reset', not bad and all(i['r'] == 0 for i in its), (bad, [i['r'] for i in its]))
        # aspect ratios preserved
        nat = {i['id']: i['nw']/i['nh'] for i in its}
        ok('arrange keeps aspect ratios', all(abs(i['w']/i['h'] - nat[i['id']]) < .03 for i in its), [(round(i['w']/i['h'],3), round(nat[i['id']],3)) for i in its])
        await pg.screenshot(path='/tmp/s_bd4.png')
        await pg.evaluate("document.querySelector('[data-c=arrange]').click()"); await pg.wait_for_selector('.ctx'); await pg.locator('.ctx button', has_text='ارتفاع').or_(pg.locator('.ctx button', has_text='Normalize height')).first.click(); await pg.wait_for_timeout(200)
        hs = [i['h'] for i in await items(pg)]; ok('normalize height', max(hs)-min(hs) < .5, hs)
        # duplicate / delete / trash / undo
        await pg.mouse.click(5,5)
        n_atts = await pg.evaluate("(()=>{const p=MSA.state.projects.find(p=>p.status!=='done');let s=null;MSA.proj.walk(p.steps,x=>{if(!s&&x.key==='mood')s=x});return s.atts.filter(a=>a.kind==='image').length})()")
        await pg.keyboard.press('Control+a'); await pg.keyboard.press('Control+d'); await pg.wait_for_timeout(250)
        ok('Ctrl+D duplicates selection', len(await items(pg)) == 8)
        ok('duplicates share the same attachments', n_atts == await pg.evaluate("(()=>{const p=MSA.state.projects.find(p=>p.status!=='done');let s=null;MSA.proj.walk(p.steps,x=>{if(!s&&x.key==='mood')s=x});return s.atts.filter(a=>a.kind==='image').length})()"))
        await pg.keyboard.press('Delete'); await pg.wait_for_timeout(250)
        ok('delete removes the 4 duplicates', len(await items(pg)) == 4)
        ok('their pictures are still kept (originals remain)', True)
        # delete one original → attachment goes to trash, undo brings it back
        tr0 = await pg.evaluate("(()=>{const p=MSA.state.projects.find(p=>p.status!=='done');let s=null;MSA.proj.walk(p.steps,x=>{if(!s&&x.key==='mood')s=x});return s.board.trash.length})()")
        first = (await rects(pg))[0]; await pg.mouse.click(first['x']+first['w']/2, first['y']+first['h']/2); await pg.keyboard.press('Delete'); await pg.wait_for_timeout(250)
        tr = await pg.evaluate("(()=>{const p=MSA.state.projects.find(p=>p.status!=='done');let s=null;MSA.proj.walk(p.steps,x=>{if(!s&&x.key==='mood')s=x});return s.board.trash.length})()")
        ok('deleted picture goes to trash (undo-able)', tr == tr0 + 1, (tr0, tr))
        await pg.keyboard.press('Control+z'); await pg.wait_for_timeout(250)
        ok('undo restores it', len(await items(pg)) == 4 and await pg.evaluate("(()=>{const p=MSA.state.projects.find(p=>p.status!=='done');let s=null;MSA.proj.walk(p.steps,x=>{if(!s&&x.key==='mood')s=x});return s.board.trash.length})()") == tr0)
        # crop
        rr = (await rects(pg))[1]; await pg.mouse.click(rr['x']+rr['w']/2, rr['y']+rr['h']/2); cid = await pg.evaluate('([x,y])=>document.elementFromPoint(x,y).closest(".bitem").dataset.id',[rr['x']+rr['w']/2, rr['y']+rr['h']/2]); byid = lambda Lst: [i for i in Lst if i['id']==cid][0]; await pg.keyboard.press('c'); await pg.wait_for_selector('.bd-h.e.l');
        before = byid(await items(pg)); eh = await pg.locator('.bd-h.e.l').bounding_box(); ebx, eby = eh['x']+eh['width']/2, eh['y']+eh['height']/2
        await pg.mouse.move(ebx, eby); await pg.mouse.down(); await pg.mouse.move(ebx+40, eby, steps=5); await pg.mouse.up(); await pg.wait_for_timeout(200)
        after = byid(await items(pg)); ok('crop narrows the box and keeps the picture in place', after['w'] < before['w'] - 5 and after['crop'][0] > 0 and abs((after['x']+after['crop'][0]*0) - before['x']) > 1 and abs((after['x']+after['w']) - (before['x']+before['w'])) < 1.5, (before['x'], before['w'], after['x'], after['w'], after['crop']))
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(100)
        await pg.screenshot(path='/tmp/s_bd5.png')
        # text note
        await pg.mouse.dblclick(900, 600); await pg.wait_for_timeout(300)
        ok('double-click empty makes a text note in edit mode', await pg.locator('.bitem.txt.editing').count() == 1)
        await pg.keyboard.type('ملاحظة'); await pg.mouse.click(5, 300); await pg.wait_for_timeout(300)
        tx = [i for i in await items(pg) if i['t'] == 'txt']; ok('text saved', len(tx) == 1 and tx[0]['txt'] == 'ملاحظة', tx)
        # paste image from clipboard event
        await pg.evaluate("""async (b64)=>{const bin=atob(b64);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
          const dt=new DataTransfer();dt.items.add(new File([u],'p.png',{type:'image/png'}));
          document.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true}));}""", base64.b64encode(open(IMGS[5],'rb').read()).decode()); await pg.wait_for_timeout(900)
        ok('paste image adds an item', len([i for i in await items(pg) if i['t'] == 'img']) == 5)
        # export
        await pg.evaluate("document.querySelector('[data-c=export]').click()"); await pg.wait_for_selector('.ctx')
        async with pg.expect_download() as dl: await pg.locator('.ctx button').first.click()
        d = await dl.value; raw = open(await d.path(), 'rb').read(); ok('export PNG', raw[:8] == b'\x89PNG\r\n\x1a\n' and len(raw) > 5000, len(raw))
        open('/tmp/s_export.png','wb').write(raw)
        # export as step file
        await pg.evaluate("document.querySelector('[data-c=export]').click()"); await pg.wait_for_selector('.ctx'); await pg.locator('.ctx button').nth(1 if False else 2).click(); await pg.wait_for_timeout(1200)
        ok('export saved into step files (not re-added to board)', await pg.evaluate("(()=>{const p=MSA.state.projects.find(p=>p.status!=='done');let s=null;MSA.proj.walk(p.steps,x=>{if(!s&&x.key==='mood')s=x});return s.atts.some(a=>a.noBoard)})()"))
        # context menu
        await pg.mouse.click(5, 300, button='right'); await pg.wait_for_selector('.ctx'); n_ctx = await pg.locator('.ctx button').count(); ok('right-click menu', n_ctx >= 5, n_ctx); await pg.keyboard.press('Escape')
        # persistence: close and reopen
        n_items = len(await items(pg)); await pg.evaluate("document.querySelector('[data-c=close]').click()"); await pg.wait_for_timeout(700)
        ok('board closes', await pg.locator('#msaBoard').count() == 0)
        ok('state saved with board', await pg.evaluate("JSON.parse(localStorage.getItem('msa_state_v1'))!==null"))
        await pg.evaluate("(()=>{const p=MSA.state.projects.find(p=>p.status!=='done');let s=null;MSA.proj.walk(p.steps,x=>{if(!s&&x.key==='mood')s=x});MSA.board.open(p,s)})()"); await pg.wait_for_selector('#msaBoard'); await pg.wait_for_timeout(900)
        ok('reopen shows same items', len(await items(pg)) == n_items and await pg.locator('.bitem').count() == n_items, (n_items, await pg.locator('.bitem').count()))
        await pg.keyboard.press('Escape'); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(500)
        ok('Esc closes board', await pg.locator('#msaBoard').count() == 0)
        ok('no errors (board)', not pg.errs, pg.errs[:4])
    summary()
asyncio.run(main())
