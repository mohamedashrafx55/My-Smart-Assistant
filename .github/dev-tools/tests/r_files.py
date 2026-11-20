import asyncio,sys,os
from h import *

async def main():
    async with Env() as e:
        pg = await e.page(w=1100, h=800)
        os.makedirs('/tmp/fm', exist_ok=True)
        open('/tmp/fm/a.docx','wb').write(b'PK\x03\x04docx'); open('/tmp/fm/b.pdf','wb').write(b'%PDF-1.4 x'); 
        from PIL import Image
        Image.new('RGB',(80,60),(200,50,50)).save('/tmp/fm/pic.png')
        # header button
        ok('icon button sits right after the guide icon', await pg.evaluate("document.getElementById('btnGuide').nextElementSibling===document.getElementById('btnFiles')"))
        ok('icon has no visible text, name is tooltip + aria', await pg.evaluate("(()=>{const b=document.getElementById('btnFiles');return b.textContent.trim()===''&&b.title==='ملفاتي'&&b.getAttribute('aria-label')==='ملفاتي'})()"))
        await pg.click('#btnFiles'); await pg.wait_for_timeout(300)
        ok('click opens ملفاتي view', await pg.evaluate("MSA.view==='files'&&!!document.querySelector('.fm')"))
        ok('empty state shown', await pg.evaluate("!!document.querySelector('.fm-empty')"))
        # upload via file chooser
        async with pg.expect_file_chooser() as fc:
            await pg.click('[data-fa=up]')
        ch = await fc.value; await ch.set_files(['/tmp/fm/a.docx','/tmp/fm/b.pdf','/tmp/fm/pic.png']); await pg.wait_for_timeout(900)
        ok('3 files uploaded (docx, pdf, image)', await pg.evaluate("MSA.state.vault.items.filter(x=>x.t==='f').length===3"))
        ok('blobs stored in IndexedDB', await pg.evaluate("(async()=>{const ids=await MSA.files.ids();return MSA.state.vault.items.every(x=>ids.includes(x.a.id))})()"))
        ok('cards rendered with extension badge and image thumb', await pg.evaluate("document.querySelectorAll('.fm-card').length===3&&document.querySelector('.fm-card img[data-thumb]')&&[...document.querySelectorAll('.fm-ext')].some(x=>x.textContent==='DOCX')"))
        # new folder with colour
        await pg.click('[data-fa=newf]'); await pg.wait_for_timeout(250)
        await pg.fill('#fdN', 'عملاء'); await pg.click('.fm-col[data-c="#e5484d"]')
        await pg.evaluate("[...document.querySelectorAll('.modal button')].find(b=>/^حفظ$/.test(b.textContent.trim())).click()"); await pg.wait_for_timeout(300)
        fo = await pg.evaluate("MSA.state.vault.items.find(x=>x.t==='d')")
        ok('folder created with name and colour', fo and fo['name']=='عملاء' and fo['color']=='#e5484d', fo)
        ok('folders listed before files', await pg.evaluate("document.querySelector('.fm-card').classList.contains('dir')"))
        # move a file into folder via menu picker
        fid = await pg.evaluate("MSA.state.vault.items.find(x=>x.name==='b.pdf').id")
        await pg.evaluate("i=>document.querySelector('.fm-card[data-id=\"'+i+'\"] [data-fa=more]').click()", fid); await pg.wait_for_timeout(250)
        await pg.click('[data-m=mv]'); await pg.wait_for_timeout(250)
        await pg.click('.fm-pk[data-p="%s"]' % fo['id'])
        await pg.evaluate("[...document.querySelectorAll('.modal button')].find(b=>/نقل هنا/.test(b.textContent)).click()"); await pg.wait_for_timeout(300)
        ok('file moved into the folder', await pg.evaluate("i=>MSA.state.vault.items.find(x=>x.name==='b.pdf').parent===i", fo['id']))
        ok('folder shows item count 1', await pg.evaluate("document.querySelector('.fm-card.dir .fm-mt').textContent.includes('1')"))
        # open folder + breadcrumbs
        await pg.evaluate("document.querySelector('.fm-card.dir').click()"); await pg.wait_for_timeout(300)
        ok('opening folder shows its content and breadcrumb', await pg.evaluate("document.querySelectorAll('.fm-card').length===1&&document.querySelector('.fm-crumbs').textContent.includes('عملاء')"))
        # subfolder + nested
        await pg.click('[data-fa=newf]'); await pg.wait_for_timeout(200); await pg.fill('#fdN','2026')
        await pg.evaluate("[...document.querySelectorAll('.modal button')].find(b=>/^حفظ$/.test(b.textContent.trim())).click()"); await pg.wait_for_timeout(250)
        ok('nested folder created inside', await pg.evaluate("MSA.state.vault.items.find(x=>x.name==='2026').parent===MSA.state.vault.ui.cur"))
        # star
        await pg.evaluate("document.querySelector('.fm-card:not(.dir) [data-fa=fav]').click()"); await pg.wait_for_timeout(250)
        ok('star marks favourite', await pg.evaluate("MSA.state.vault.items.find(x=>x.name==='b.pdf').fav===true&&!!document.querySelector('.fm-star.on')"))
        await pg.click('[data-fa=go][data-id=""]'); await pg.wait_for_timeout(250)
        await pg.click('[data-fa=f][data-v=fav]'); await pg.wait_for_timeout(250)
        ok('favourites filter finds it across folders', await pg.evaluate("(()=>{const c=[...document.querySelectorAll('.fm-card')];return c.length===1&&c[0].textContent.includes('b.pdf')})()"))
        await pg.click('[data-fa=f][data-v=""]'); await pg.wait_for_timeout(200)
        await pg.click('[data-fa=f][data-v=image]'); await pg.wait_for_timeout(200)
        ok('image filter', await pg.evaluate("document.querySelectorAll('.fm-card').length===1"))
        await pg.click('[data-fa=f][data-v=""]'); await pg.wait_for_timeout(200)
        await pg.fill('#fmQ','pic'); await pg.wait_for_timeout(250)
        ok('search by name keeps focus', await pg.evaluate("document.querySelectorAll('.fm-card').length===1&&document.activeElement.id==='fmQ'"))
        await pg.fill('#fmQ',''); await pg.wait_for_timeout(200)
        # rename file
        pid = await pg.evaluate("MSA.state.vault.items.find(x=>x.name==='pic.png').id")
        await pg.evaluate("i=>document.querySelector('.fm-card[data-id=\"'+i+'\"] [data-fa=more]').click()", pid); await pg.wait_for_timeout(200)
        await pg.click('[data-m=ren]'); await pg.wait_for_timeout(250)
        await pg.fill('#fmNm','logo.png'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(300)
        ok('rename (Enter) updates item and attachment name', await pg.evaluate("i=>{const x=MSA.state.vault.items.find(y=>y.id===i);return x.name==='logo.png'&&x.a.name==='logo.png'}", pid))
        # edit folder colour/name
        await pg.evaluate("document.querySelector('.fm-card.dir [data-fa=more]').click()"); await pg.wait_for_timeout(200)
        await pg.click('[data-m=ren]'); await pg.wait_for_timeout(250)
        await pg.fill('#fdN','زباين'); await pg.click('.fm-col[data-c="#2fa66d"]')
        await pg.evaluate("[...document.querySelectorAll('.modal button')].find(b=>/^حفظ$/.test(b.textContent.trim())).click()"); await pg.wait_for_timeout(250)
        ok('folder renamed and recoloured', await pg.evaluate("MSA.state.vault.items.some(x=>x.t==='d'&&x.name==='زباين'&&x.color==='#2fa66d')"))
        # multi-select + bulk move to root-level folder
        for _ in range(2):
            await pg.evaluate("document.querySelector('.fm-card:not(.dir):not(.sel) [data-fa=chk]').click()"); await pg.wait_for_timeout(150)
        ok('multi-select shows the bulk bar', await pg.evaluate("!!document.querySelector('.fm-sel')&&document.querySelectorAll('.fm-card.sel').length>=2"))
        # cannot move folder into its own child
        d1 = await pg.evaluate("MSA.state.vault.items.find(x=>x.name==='زباين').id"); d2 = await pg.evaluate("MSA.state.vault.items.find(x=>x.name==='2026').id")
        ok('folder cannot be moved into its own subfolder', await pg.evaluate("([a,b])=>MSA.vault.move([a],b)===0&&MSA.state.vault.items.find(x=>x.id===a).parent===null",[d1,d2]))
        await pg.click('[data-fa=bclr]'); await pg.wait_for_timeout(200)
        # list view
        await pg.click('#fmView [data-v=list]'); await pg.wait_for_timeout(250)
        ok('list view', await pg.evaluate("!!document.querySelector('.fm-grid.list')"))
        await pg.click('#fmView [data-v=grid]'); await pg.wait_for_timeout(200)
        # preview
        await pg.evaluate("i=>document.querySelector('.fm-card[data-id=\"'+i+'\"]').click()", pid); await pg.wait_for_timeout(500)
        ok('clicking an image opens the viewer', await pg.evaluate("!!document.querySelector('#vwr img')"))
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        # delete folder recursively removes blobs
        n0 = len(await pg.evaluate("MSA.files.ids()"))
        await pg.evaluate("i=>document.querySelector('.fm-card[data-id=\"'+i+'\"] [data-fa=more]').click()", d1); await pg.wait_for_timeout(200)
        await pg.click('[data-m=del]'); await pg.wait_for_timeout(250)
        await pg.evaluate("[...document.querySelectorAll('.modal button')].find(b=>/تأكيد|حذف|نعم|موافق/.test(b.textContent)&&!/إلغاء/.test(b.textContent)).click()"); await pg.wait_for_timeout(500)
        ok('deleting a folder removes its subfolders, files and blobs', await pg.evaluate("MSA.state.vault.items.every(x=>x.name!=='زباين'&&x.name!=='2026'&&x.name!=='b.pdf')") and len(await pg.evaluate("MSA.files.ids()")) == n0 - 1, n0)
        ok('other files untouched', await pg.evaluate("MSA.state.vault.items.filter(x=>x.t==='f').length===2"))
        # persistence in backup
        bk = await pg.evaluate("MSA.exportAll().then(t=>JSON.parse(t))")
        ok('backup contains vault tree and file blobs', len(bk['state']['vault']['items']) == 2 and len(bk['files']) >= 2)
        # health counts
        # drag move
        await pg.evaluate("MSA.vault.newFolder('هدف',null,'#9b6bff');MSA.rerender(true)"); await pg.wait_for_timeout(250)
        ok('drag a card onto a folder moves it', await pg.evaluate("""(()=>{const c=document.querySelector('.fm-card:not(.dir)'),f=document.querySelector('.fm-card.dir');const dt=new DataTransfer();dt.setData('text/msa-fm',JSON.stringify([c.dataset.id]));
          c.dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:dt}));f.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt}));
          return MSA.state.vault.items.find(x=>x.id===c.dataset.id).parent===f.dataset.id})()"""))
        # mobile + english
        pm = await e.page(w=390, h=800)
        await pm.evaluate("MSA.vault.newFolder('A');MSA.vault.newFolder('B');MSA.go('files')"); await pm.wait_for_timeout(300)
        ok('mobile: no sideways scroll, 2 columns', await pm.evaluate("document.documentElement.scrollWidth<=innerWidth+1&&getComputedStyle(document.getElementById('fmGrid')).gridTemplateColumns.split(' ').length===2"))
        ok('mobile: header icon visible and tappable', await pm.evaluate("(()=>{const r=document.getElementById('btnFiles').getBoundingClientRect();return r.width>=32&&r.left>=0&&r.right<=innerWidth})()"))
        pe = await e.page(w=1100, h=800, lang='en')
        ok('English: tooltip is "My files"', await pe.evaluate("document.getElementById('btnFiles').title==='My files'||MSA.applyLang()||document.getElementById('btnFiles').title==='My files'"))
        await pe.evaluate("MSA.go('files')"); await pe.wait_for_timeout(250)
        ok('English: view renders', await pe.evaluate("document.querySelector('.fm h1').textContent==='My files'"))
        errs = pg.errs + pm.errs + pe.errs
        ok('no page errors', not errs, errs[:4])
    return summary()
sys.exit(asyncio.run(main()))
