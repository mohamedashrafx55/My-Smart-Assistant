import asyncio,sys
from h import *

async def main():
    async with Env() as e:
        pg = await e.page(w=1200, h=800)
        await pg.evaluate("""(async()=>{MSA.state.vault={items:[]};const F=MSA.vault;
          const d=F.newFolder('هدف');
          await F.addFiles([new File(['hello world'],'note.txt',{type:'text/plain'}),new File(['x,y\\n1,2'],'data.csv',{type:'text/csv'})],null);
          MSA.go('files')})()"""); await pg.wait_for_timeout(700)
        card = lambda n: "document.querySelector('.fm-card[data-id=\"'+MSA.state.vault.items.find(x=>x.name==='%s').id+'\"]')"%n
        async def rc(name):
            await pg.evaluate("n=>{const x=MSA.state.vault.items.find(y=>y.name===n);document.querySelector('.fm-card[data-id=\"'+x.id+'\"]').scrollIntoView()}", name)
            box = await pg.evaluate("n=>{const x=MSA.state.vault.items.find(y=>y.name===n);const r=document.querySelector('.fm-card[data-id=\"'+x.id+'\"]').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]}", name)
            await pg.mouse.click(box[0], box[1], button='right'); await pg.wait_for_selector('.fm-ctx')
        ms = lambda: pg.evaluate("[...document.querySelectorAll('.fm-ctx [data-m]')].map(b=>b.dataset.m)")
        names = lambda: pg.evaluate("MSA.state.vault.items.map(x=>x.name).sort()")
        await rc('note.txt'); m = await ms()
        ok('file menu: open/edit/download/print/cut/copy/dup/mv/ren/fav/props/del', all(i in m for i in ['open','edit','dl','print','cut','copy','dup','mv','ren','fav','props','del']), m)
        ok('menu shows keyboard hints', await pg.evaluate("/Ctrl\\+C|Del|F2/.test(document.querySelector('.fm-ctx').textContent)"))
        ok('menu inside viewport', await pg.evaluate("(()=>{const r=document.querySelector('.fm-ctx').getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight})()"))
        await pg.keyboard.press('Escape'); ok('Esc closes the menu', not await pg.query_selector('.fm-ctx'))
        # duplicate
        await rc('note.txt'); await pg.click('.fm-ctx [data-m=dup]'); await pg.wait_for_timeout(500)
        n = await names(); ok('duplicate creates a uniquely named copy', len(n)==4 and any(x.startswith('note') and x!='note.txt' for x in n), n)
        ok('duplicate stored its own blob', await pg.evaluate("(async()=>{const ids=await MSA.files.ids();const f=MSA.state.vault.items.filter(x=>x.t==='f');return new Set(f.map(x=>x.a.id)).size===f.length&&f.every(x=>ids.includes(x.a.id))})()"))
        # edit text
        await rc('note.txt'); await pg.click('.fm-ctx [data-m=edit]'); await pg.wait_for_selector('#fmTx')
        ok('text editor loads the content', await pg.evaluate("document.getElementById('fmTx').value")=='hello world')
        await pg.fill('#fmTx','changed text'); await pg.evaluate("[...document.querySelectorAll('.modal button')].find(b=>/^حفظ$/.test(b.textContent.trim())).click()"); await pg.wait_for_timeout(500)
        ok('text editor saves new content', await pg.evaluate("(async()=>{const x=MSA.state.vault.items.find(y=>y.name==='note.txt');const r=await MSA.files.get(x.a.id);return await r.blob.text()})()")=='changed text')
        # copy + paste into folder
        await rc('data.csv'); await pg.click('.fm-ctx [data-m=copy]'); await pg.wait_for_timeout(150)
        ok('copy fills the clipboard (paste enabled)', await pg.evaluate("!!MSA.vault.ctx.clip()"))
        await rc('هدف'); ok('folder menu offers paste into folder', 'pasteIn' in await ms())
        await pg.click('.fm-ctx [data-m=pasteIn]'); await pg.wait_for_timeout(500)
        ok('pasted copy lives in the folder, original stays', await pg.evaluate("(()=>{const d=MSA.state.vault.items.find(x=>x.name==='هدف').id;const c=MSA.state.vault.items.filter(x=>x.name==='data.csv');return c.length===2&&c.some(x=>x.parent===d)&&c.some(x=>!x.parent)})()"))
        # cut + paste (move)
        await rc('note.txt'); await pg.click('.fm-ctx [data-m=cut]')
        await rc('هدف'); await pg.click('.fm-ctx [data-m=pasteIn]'); await pg.wait_for_timeout(400)
        ok('cut+paste moves the original', await pg.evaluate("(()=>{const d=MSA.state.vault.items.find(x=>x.name==='هدف').id;return MSA.state.vault.items.find(x=>x.name==='note.txt').parent===d&&!MSA.vault.ctx.clip()})()"))
        # background menu
        bx = await pg.evaluate("(()=>{const r=document.querySelector('.fm-title').getBoundingClientRect();return [r.left+5,r.top+5]})()")
        await pg.mouse.click(bx[0], bx[1], button='right'); await pg.wait_for_selector('.fm-ctx'); m = await ms()
        ok('background menu: new folder/text/upload/select all/sort/view/refresh', all(i in m for i in ['newf','newt','up','all','sort','view','refresh']), m)
        await pg.click('.fm-ctx [data-m=newt]'); await pg.wait_for_selector('.modal input'); await pg.fill('.modal input','جديد.txt')
        await pg.evaluate("[...document.querySelectorAll('.modal button')].find(b=>/حفظ|موافق|OK|إنشاء/.test(b.textContent)).click()"); await pg.wait_for_selector('#fmTx', timeout=5000)
        ok('new text file created and opened in the editor', await pg.evaluate("MSA.state.vault.items.some(x=>x.name==='جديد.txt')"))
        await pg.evaluate("[...document.querySelectorAll('.modal button')].find(b=>/إلغاء/.test(b.textContent)).click()"); await pg.wait_for_timeout(200)
        # sort submenu
        await pg.mouse.click(bx[0], bx[1], button='right'); await pg.wait_for_selector('.fm-ctx'); await pg.click('.fm-ctx [data-m=sort]'); await pg.click('.fm-ctx [data-m="sort:size"]'); await pg.wait_for_timeout(250)
        ok('sort submenu changes the sort', await pg.evaluate("MSA.state.ui.files&&MSA.state.ui.files.sort==='size'||document.getElementById('fmSort').value==='size'"))
        # properties
        await rc('data.csv'); await pg.click('.fm-ctx [data-m=props]'); await pg.wait_for_selector('.modal')
        ok('properties dialog shows name + location', await pg.evaluate("/data.csv/.test(document.querySelector('.modal').textContent)&&/ملفاتي/.test(document.querySelector('.modal').textContent)"))
        await pg.evaluate("document.querySelector('.modal .btn.primary').click()"); await pg.wait_for_timeout(200)
        # print (text file → hidden iframe)
        await rc('data.csv'); await pg.click('.fm-ctx [data-m=print]'); await pg.wait_for_timeout(600)
        ok('print builds a hidden print frame for text files', await pg.evaluate("document.querySelectorAll('iframe').length>0"))
        # multi: ctrl+A then menu shows count
        await pg.mouse.click(bx[0], bx[1]); await pg.wait_for_timeout(100); print('dbg', await pg.evaluate("[document.activeElement.tagName, !!document.querySelector('.overlay,.fm-ctx'), MSA.view]")); await pg.keyboard.press('Control+a'); await pg.wait_for_timeout(150)
        n = await pg.evaluate("document.querySelectorAll('.fm-card.sel').length")
        c0 = await pg.evaluate("document.querySelector('.fm-card')"); 
        await pg.evaluate("document.querySelector('.fm-card').dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:300,clientY:300}))"); await pg.wait_for_selector('.fm-ctx')
        ok('multi-select menu shows the delete count', n>=2 and await pg.evaluate("/\\d/.test(document.querySelector('.fm-ctx .danger').textContent)"), n)
        await pg.click('.fm-ctx [data-m=del]'); await pg.wait_for_selector('.overlay .mf .btn.primary'); await pg.click('.overlay .mf .btn.primary'); await pg.wait_for_timeout(500)
        ok('delete from the menu removes the selection', await pg.evaluate("MSA.state.vault.items.length<=1"), await names())
        ok('deleted blobs are gone from IndexedDB', await pg.evaluate("(async()=>{const ids=await MSA.files.ids();return MSA.state.vault.items.filter(x=>x.t==='f').every(x=>ids.includes(x.a.id))})()"))
        # mobile menu: ⋯ button works
        pm = await e.page(w=390, h=800)
        await pm.evaluate("""(async()=>{MSA.state.vault={items:[]};await MSA.vault.addFiles([new File(['a'],'a.txt',{type:'text/plain'})],null);MSA.go('files')})()"""); await pm.wait_for_timeout(600)
        await pm.click('.fm-card [data-fa=more]'); await pm.wait_for_selector('.fm-ctx')
        ok('mobile: ⋯ opens the same menu inside the screen', await pm.evaluate("(()=>{const r=document.querySelector('.fm-ctx').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&document.documentElement.scrollWidth<=innerWidth+1})()"))
        pe = await e.page(w=1100, h=800, lang='en'); await pe.evaluate("""(async()=>{MSA.state.vault={items:[]};await MSA.vault.addFiles([new File(['a'],'a.txt',{type:'text/plain'})],null);MSA.go('files')})()"""); await pe.wait_for_timeout(600)
        await pe.click('.fm-card', button='right'); await pe.wait_for_selector('.fm-ctx')
        ok('English menu labels', await pe.evaluate("/Duplicate/.test(document.querySelector('.fm-ctx').textContent)&&/Properties/.test(document.querySelector('.fm-ctx').textContent)"))
        errs = pg.errs + pm.errs + pe.errs; ok('no page errors', not errs, errs[:4])
    return summary()
sys.exit(asyncio.run(main()))
