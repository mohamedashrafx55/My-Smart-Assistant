import asyncio, base64, glob, os
from h import *
IMGS = sorted(glob.glob('/tmp/bdimg/i*.png'))
BD = "(()=>{const p=MSA.state.projects.find(p=>p.status!=='done');let s=null;MSA.proj.walk(p.steps,x=>{if(!s&&x.key==='mood')s=x});return s})()"
async def items(pg): return await pg.evaluate("()=>{const s="+BD+";return (s.board&&s.board.items)||[]}")
async def main():
    async with Env() as e:
        pg = await e.page(); await pg.wait_for_timeout(1500)
        await pg.evaluate("MSA.state.ui.projView='list';MSA.state.ui.ptab='plan';MSA.go('active')"); await pg.wait_for_timeout(600); await pg.evaluate("MSA.state.ui.projView='map';MSA.rerender()"); await pg.wait_for_timeout(600)
        mood = pg.locator('.mnode', has_text='مود').first
        if await mood.count() == 0: mood = pg.locator('.mnode').nth(2)
        await mood.dblclick(); await pg.wait_for_selector('#msaBoard', timeout=4000); await pg.wait_for_timeout(1000)
        # clean board then add two images through the file chooser path used by drop
        await pg.keyboard.press('Control+a'); await pg.keyboard.press('Delete'); await pg.wait_for_timeout(250); await pg.evaluate(CONFJS); await pg.wait_for_timeout(300)
        data = [(os.path.basename(p), base64.b64encode(open(p,'rb').read()).decode()) for p in IMGS[:2]]
        await pg.evaluate("""async ([data])=>{const dt=new DataTransfer();for(const [n,b] of data){const bin=atob(b);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);dt.items.add(new File([u],n,{type:'image/png'}));}
          const st=document.getElementById('bdStage');st.dispatchEvent(new DragEvent('dragover',{dataTransfer:dt,bubbles:true,cancelable:true}));st.dispatchEvent(new DragEvent('drop',{dataTransfer:dt,bubbles:true,cancelable:true}));}""", [data])
        await pg.wait_for_timeout(1000)
        sr = await pg.evaluate("(()=>{const r=document.querySelector('#bdStage').getBoundingClientRect();return [r.x+r.width-12,r.y+r.height-12]})()"); await pg.mouse.click(sr[0], sr[1]); await pg.wait_for_timeout(250)
        it = await items(pg); ok('board has 2 images', len(it) == 2 and all(i['t']=='img' for i in it), [i['t'] for i in it])
        ok('Note button exists and is disabled with no selection', await pg.evaluate("(()=>{const b=document.querySelector('[data-c=note]');return !!b&&b.disabled})()"))
        # no selection + N -> toast, no dialog
        await pg.evaluate("document.querySelector('#bdStage').focus()"); await pg.keyboard.press('n'); await pg.wait_for_timeout(300)
        ok('N with nothing selected opens no dialog', await pg.locator('#askIn').count() == 0)
        # select first image by click
        r = await pg.evaluate("(()=>{const e=document.querySelector('.bitem:not(.txt)');const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2,e.dataset.id]})()")
        await pg.mouse.click(r[0], r[1]); await pg.wait_for_timeout(250)
        ok('Note button enabled once an item is selected', await pg.evaluate("!document.querySelector('[data-c=note]').disabled"))
        ok('note strip hidden before any note', await pg.evaluate("document.querySelector('#bdNote').hidden"))
        await pg.click('[data-c=note]'); await pg.wait_for_selector('#askIn')
        ok('note dialog is a textarea and empty', await pg.evaluate("document.querySelector('#askIn').tagName==='TEXTAREA'&&document.querySelector('#askIn').value===''"))
        await pg.fill('#askIn', 'عجبني توزيع الألوان والإضاءة'); await pg.click('.modal .btn.primary'); await pg.wait_for_timeout(400)
        it = await items(pg); a = next(i for i in it if i['id'] == r[2]); (lambda *x: None)('DBG', r[2], [(i['id'], i.get('note')) for i in it], await pg.evaluate("[...document.querySelectorAll('.bitem')].map(e=>e.dataset.id+':'+!!e.querySelector('.bi-nb'))"))
        ok('note stored on the item', a.get('note') == 'عجبني توزيع الألوان والإضاءة', a.get('note'))
        ok('badge shown on that item only', await pg.evaluate("document.querySelectorAll('.bi-nb').length===1&&document.querySelector('.bitem[data-id=\"%s\"] .bi-nb')!==null" % r[2]))
        ok('badge carries the note text for hover', await pg.evaluate("document.querySelector('.bi-nb').dataset.note==='عجبني توزيع الألوان والإضاءة'"))
        ok('strip shows the note for the selected item', await pg.evaluate("(()=>{const n=document.querySelector('#bdNote');return !n.hidden&&n.textContent.includes('عجبني توزيع')})()"))
        ok('Note button lit when item has note', await pg.evaluate("document.querySelector('[data-c=note]').classList.contains('on')"))
        # clicking the strip edits (and does not deselect)
        await pg.click('#bdNote'); await pg.wait_for_selector('#askIn')
        ok('dialog pre-filled with the existing note', await pg.evaluate("document.querySelector('#askIn').value==='عجبني توزيع الألوان والإضاءة'"))
        await pg.fill('#askIn', 'الخط كبير وواضح\nوالتباين ممتاز'); await pg.click('.modal .btn.primary'); await pg.wait_for_timeout(300)
        it = await items(pg); a = next(i for i in it if i['id'] == r[2]); ok('multi-line note saved', a.get('note') == 'الخط كبير وواضح\nوالتباين ممتاز')
        # undo / redo
        await pg.keyboard.press('Control+z'); await pg.wait_for_timeout(250)
        it = await items(pg); a = next(i for i in it if i['id'] == r[2]); ok('undo restores the previous note', a.get('note') == 'عجبني توزيع الألوان والإضاءة', a.get('note'))
        await pg.keyboard.press('Control+y'); await pg.wait_for_timeout(250)
        it = await items(pg); a = next(i for i in it if i['id'] == r[2]); ok('redo brings the new note back', 'التباين' in (a.get('note') or ''))
        # duplicate keeps the note
        await pg.keyboard.press('Control+d'); await pg.wait_for_timeout(300)
        it = await items(pg); ok('duplicate keeps the note', sum(1 for i in it if i.get('note')) == 2 and len(it) == 3)
        await pg.keyboard.press('Control+z'); await pg.wait_for_timeout(250)
        # text item note via context menu (right click)
        await pg.click('[data-c=text]'); await pg.wait_for_timeout(300); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        t = await pg.evaluate("(()=>{const e=document.querySelector('.bitem.txt');const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2,e.dataset.id]})()")
        await pg.mouse.click(t[0], t[1]); await pg.wait_for_timeout(200)
        await pg.mouse.click(t[0], t[1], button='right'); await pg.wait_for_timeout(300)
        ok('context menu has the Note entry', await pg.locator('.ctx button', has_text='ملاحظة').count() >= 1)
        await pg.locator('.ctx button', has_text='ملاحظة').first.click(); await pg.wait_for_selector('#askIn')
        await pg.fill('#askIn', 'نص العنوان عاجبني'); await pg.click('.modal .btn.primary'); await pg.wait_for_timeout(300)
        it = await items(pg); ok('text/document item can hold a note too', next(i for i in it if i['id'] == t[2]).get('note') == 'نص العنوان عاجبني')
        # multi-select -> same note on all
        await pg.keyboard.press('Control+a'); await pg.wait_for_timeout(150); await pg.keyboard.press('n'); await pg.wait_for_selector('#askIn')
        await pg.fill('#askIn', 'مرجع للألوان'); await pg.click('.modal .btn.primary'); await pg.wait_for_timeout(300)
        it = await items(pg); ok('multi-select applies one note to all', all(i.get('note') == 'مرجع للألوان' for i in it) and len(it) == 3)
        ok('3 badges visible', await pg.locator('.bi-nb').count() == 3)
        ok('strip hidden with multi-selection', await pg.evaluate("document.querySelector('#bdNote').hidden"))
        # locked items can still take a note
        await pg.keyboard.press('l'); await pg.wait_for_timeout(150); await pg.keyboard.press('n'); await pg.wait_for_selector('#askIn'); await pg.fill('#askIn', 'مثبّت وعليه ملاحظة'); await pg.click('.modal .btn.primary'); await pg.wait_for_timeout(300)
        it = await items(pg); ok('locked items accept a note', all(i.get('lock') and i.get('note') == 'مثبّت وعليه ملاحظة' for i in it))
        await pg.keyboard.press('l'); await pg.wait_for_timeout(150)
        # cancel keeps note
        await pg.keyboard.press('n'); await pg.wait_for_selector('#askIn'); await pg.fill('#askIn', 'مش هتتحفظ'); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        it = await items(pg); ok('cancel leaves notes unchanged', all(i.get('note') == 'مثبّت وعليه ملاحظة' for i in it))
        # typing N inside the dialog must not re-open anything
        await pg.keyboard.press('n'); await pg.wait_for_selector('#askIn'); await pg.wait_for_timeout(200); await pg.keyboard.type('nnn'); await pg.wait_for_timeout(200)
        ok('typing n inside the dialog is just text', await pg.locator('#askIn').count() == 1 and await pg.evaluate("document.querySelector('#askIn').value.endsWith('nnn')"))
        await pg.fill('#askIn', ''); await pg.click('.modal .btn.primary'); await pg.wait_for_timeout(300)
        it = await items(pg); ok('empty text removes the notes', all('note' not in i for i in it) and await pg.locator('.bi-nb').count() == 0)
        # save + reopen persists
        await pg.keyboard.press('Control+a'); await pg.keyboard.press('n'); await pg.wait_for_selector('#askIn'); await pg.fill('#askIn', 'يفضل بعد الإغلاق'); await pg.click('.modal .btn.primary'); await pg.wait_for_timeout(300)
        await pg.click('[data-c=close]'); await pg.wait_for_timeout(700)
        ok('board closed', await pg.locator('#msaBoard').count() == 0)
        raw = await pg.evaluate("localStorage.getItem('msa_state_v1')||''"); ok('note persisted into saved state', 'يفضل بعد الإغلاق' in raw)
        await mood.dblclick(); await pg.wait_for_selector('#msaBoard', timeout=4000); await pg.wait_for_timeout(900)
        ok('badges come back after reopening', await pg.locator('.bi-nb').count() == 3)
        # shortcuts help lists N
        await pg.click('[data-c=help]'); await pg.wait_for_timeout(300)
        ok('shortcuts help lists the N key', await pg.evaluate("[...document.querySelectorAll('.bd-help kbd')].some(k=>k.textContent.trim()==='N')"))
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        await pg.screenshot(path='/tmp/s_note.png')
        ok('no page errors', not pg.errs, pg.errs[:3])
asyncio.run(main()); summary()
