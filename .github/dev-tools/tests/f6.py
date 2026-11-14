import asyncio, base64, glob, os
from h import *
IMGS = sorted(glob.glob('/tmp/bdimg/i*.png'))
async def main():
    async with Env() as e:
        ctx = await e.b.new_context(viewport={'width':390,'height':780}, has_touch=True, is_mobile=True, device_scale_factor=2, accept_downloads=True)
        pg = await ctx.new_page(); pg.errs=[]
        await pg.add_init_script("try{localStorage.setItem('msa_clean_v1','kept');localStorage.setItem('msa_daily_m',new Date().toLocaleDateString('en-CA'));localStorage.setItem('msa_daily_n',new Date().toLocaleDateString('en-CA'))}catch(e){}")
        pg.on('pageerror', lambda x: pg.errs.append(str(x)))
        await pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://localhost','data:','blob:')) else r.abort())
        await pg.goto(URL); await pg.keyboard.press('Escape'); await pg.wait_for_selector('#lkPw'); await pg.fill('#lkPw','Akademia'); await pg.keyboard.press('Enter'); await pg.wait_for_selector('#app:not([hidden])'); await pg.evaluate("MSA.demo.load()"); await pg.wait_for_timeout(900); await pg.wait_for_timeout(1500)
        ok('coarse pointer detected', await pg.evaluate("matchMedia('(pointer:coarse)').matches"))
        await pg.evaluate("MSA.state.ui.projView='list';MSA.go('active')"); await pg.wait_for_timeout(700)
        # apps picker on phone
        await pg.locator('.step [data-act=apps]').first.tap(); await pg.wait_for_selector('.ap-grid'); await pg.wait_for_timeout(300)
        await pg.locator('.ap-tile[data-id=ae]').tap(); await pg.locator('.ap-tile[data-id=au]').tap(); await pg.wait_for_timeout(200)
        await pg.screenshot(path='/tmp/m_apps.png')
        sw = await pg.evaluate("document.documentElement.scrollWidth"); ok('no horizontal overflow (apps picker)', sw <= 392, sw)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        # board on phone
        await pg.evaluate("(()=>{const p=MSA.state.projects.find(p=>p.status!=='done');let s=null;MSA.proj.walk(p.steps,x=>{if(!s&&x.key==='mood')s=x});MSA.board.open(p,s)})()"); await pg.wait_for_selector('#msaBoard'); await pg.wait_for_timeout(1200)
        ok('phone default tool = hand', await pg.locator('[data-c=tool].on').count() == 1)
        top = await pg.evaluate("(()=>{const t=document.querySelector('.bd-top').getBoundingClientRect();return [t.height, document.querySelector('.bd-top').scrollWidth, innerWidth]})()"); ok('toolbar fits (wraps, no overflow)', top[1] <= top[2] + 1 and top[0] < 130, top)
        await pg.screenshot(path='/tmp/m_bd1.png')
        # tap selects, drag on empty pans, tap empty deselects
        r = await pg.evaluate("(()=>{const e=document.querySelector('.bitem').getBoundingClientRect();return [e.x+e.width/2,e.y+e.height/2]})()")
        await pg.touchscreen.tap(r[0], r[1]); await pg.wait_for_timeout(200)
        ok('tap selects', await pg.locator('.bd-fr').count() == 1)
        await pg.touchscreen.tap(8, 700); await pg.wait_for_timeout(250)
        ok('tap on empty deselects', await pg.locator('.bd-fr').count() == 0)
        # drive touch events via CDP for pan + pinch
        cdp = await ctx.new_cdp_session(pg)
        async def touch(type_, pts): await cdp.send('Input.dispatchTouchEvent', {'type': type_, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, (x, y) in enumerate(pts)]})
        t0 = await pg.evaluate("document.getElementById('bdWorld').style.transform")
        await touch('touchStart', [(200, 650)]); 
        for i in range(1, 8): await touch('touchMove', [(200 + i*8, 650 - i*10)])
        await touch('touchEnd', []); await pg.wait_for_timeout(150)
        t1 = await pg.evaluate("document.getElementById('bdWorld').style.transform"); ok('one-finger drag on empty pans', t0 != t1, (t0, t1))
        k0 = await pg.evaluate("+/scale\\(([^)]*)\\)/.exec(document.getElementById('bdWorld').style.transform)[1]")
        await touch('touchStart', [(150, 400), (250, 400)])
        for i in range(1, 9): await touch('touchMove', [(150 - i*10, 400), (250 + i*10, 400)])
        await touch('touchEnd', []); await pg.wait_for_timeout(200)
        k1 = await pg.evaluate("+/scale\\(([^)]*)\\)/.exec(document.getElementById('bdWorld').style.transform)[1]")
        ok('two-finger pinch zooms in', k1 > k0 * 1.5, (k0, k1))
        await pg.evaluate("document.querySelector('[data-c=fit]').click()"); await pg.wait_for_timeout(200)
        # drag an item with one finger moves it
        r = await pg.evaluate("(()=>{const e=document.querySelector('.bitem').getBoundingClientRect();return [e.x+e.width/2,e.y+e.height/2,document.querySelector('.bitem').dataset.id]})()")
        x0 = await pg.evaluate("id=>MSA.state.projects.find(p=>p.status!=='done')&&(()=>{let s=null;MSA.proj.walk(MSA.state.projects.find(p=>p.status!=='done').steps,x=>{if(!s&&x.key==='mood')s=x});return s.board.items.find(i=>i.id===id).x})()", r[2])
        await touch('touchStart', [(r[0], r[1])])
        for i in range(1, 8): await touch('touchMove', [(r[0] + i*10, r[1])])
        await touch('touchEnd', []); await pg.wait_for_timeout(250)
        x1 = await pg.evaluate("id=>(()=>{let s=null;MSA.proj.walk(MSA.state.projects.find(p=>p.status!=='done').steps,x=>{if(!s&&x.key==='mood')s=x});return s.board.items.find(i=>i.id===id).x})()", r[2])
        ok('one-finger drag moves the item', x1 > x0 + 10, (x0, x1))
        # long press -> context menu
        r2 = await pg.evaluate("(()=>{const e=document.querySelector('.bitem').getBoundingClientRect();return [e.x+e.width/2,e.y+e.height/2]})()")
        await pg.evaluate("(()=>{const o=Element.prototype.remove;Element.prototype.remove=function(){if(this.classList&&this.classList.contains('ctx'))window.__st=(window.__st||'')+new Error().stack.split('\\n').slice(1,5).join('|')+'##';return o.call(this)}})()"); await touch('touchStart', [(r2[0], r2[1])]); await pg.wait_for_timeout(900); print('during press ctx:', await pg.locator('.ctx').count()); await touch('touchEnd', []); await pg.wait_for_timeout(300)
        ok('long-press opens the menu', await pg.locator('.ctx').count() == 1)
        print('STACK', await pg.evaluate('window.__st')); await pg.screenshot(path='/tmp/m_bd2.png')
        await pg.keyboard.press('Escape')
        ok('no errors (phone)', not pg.errs, pg.errs[:3])
    summary()
asyncio.run(main())
