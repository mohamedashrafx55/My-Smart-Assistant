import asyncio, random, sys, glob
from h import *
IMGS = sorted(glob.glob('/tmp/bdimg/i*.png'))
VIEWS = ['home','active','done','learn','tasks','clients','money','settings']
SEL = "button:visible, [role=button]:visible, a:visible, .ptab:visible, .ttab:visible, .mnode:visible, .step:visible, .bitem:visible, .ap-tile:visible, summary:visible, label:visible, [data-act]:visible, input[type=checkbox]:visible, select:visible"
WORDS = ['اختبار','test','١٢٣','<b>x</b>','"quote"',"' or 1=1",'a'*200,'', '0', '-5', '99999999999']
async def run(seed, n, w, h, lang, theme):
    rnd = random.Random(seed)
    async with Env() as e:
        pg = await e.page(w=w, h=h, lang=lang, theme=theme); await pg.wait_for_timeout(1000)
        pg.on('dialog', lambda d: asyncio.ensure_future(d.dismiss()))
        acts = 0
        for i in range(n):
            try:
                r = rnd.random()
                if r < .06:
                    await pg.evaluate("v=>MSA.go(v)", rnd.choice(VIEWS))
                elif r < .10:
                    await pg.keyboard.press(rnd.choice(['Escape','Escape','Enter','Tab','Control+k','Control+a','Delete','ArrowDown','Space','Control+z','Shift+h','g','l','c','f','t']))
                elif r < .16:
                    inp = pg.locator('input:visible:not([type=file]):not([type=color]):not([type=range]), textarea:visible')
                    c = await inp.count()
                    if c: await inp.nth(rnd.randrange(c)).fill(rnd.choice(WORDS), timeout=500)
                elif r < .18 and await pg.locator('#msaBoard').count():
                    await pg.evaluate("(a)=>{const s=document.getElementById('bdStage');const rc=s.getBoundingClientRect();s.dispatchEvent(new WheelEvent('wheel',{deltaY:a,clientX:rc.x+300,clientY:rc.y+300,bubbles:true,cancelable:true}))}", rnd.choice([-400,400,-120,120]))
                elif r < .22 and await pg.locator('#msaBoard').count():
                    x, y = rnd.randrange(30, w-30), rnd.randrange(120, h-60)
                    await pg.mouse.move(x, y); await pg.mouse.down(); await pg.mouse.move(x+rnd.randrange(-200,200), y+rnd.randrange(-200,200), steps=4); await pg.mouse.up()
                elif r < .24:
                    await pg.evaluate("(()=>{const p=MSA.state.projects.find(p=>p.status!=='done');if(!p)return;let s=null;MSA.proj.walk(p.steps,x=>{if(!s&&x.key==='mood')s=x});if(s&&!document.getElementById('msaBoard'))MSA.board.open(p,s)})()")
                else:
                    loc = pg.locator(SEL); c = await loc.count()
                    if c:
                        el = loc.nth(rnd.randrange(c))
                        await el.click(timeout=500, button=rnd.choice(['left','left','left','right']), force=False)
                acts += 1
            except Exception as ex:
                pass
            if pg.errs: break
            await pg.wait_for_timeout(25)
        print(f'seed {seed} {w}x{h} {lang}/{theme}: actions {acts} errors {len(pg.errs)}', pg.errs[:3])
        return len(pg.errs)
async def main():
    seeds = [int(x) for x in sys.argv[1:]] or [1]
    bad = 0
    cfg = [(1280,800,'ar','dark'),(390,780,'ar','light'),(1024,700,'en','dark'),(768,1024,'en','light')]
    for s in seeds:
        w,h,l,t = cfg[s % len(cfg)]
        bad += await run(s, 220, w, h, l, t)
    print('TOTAL ERRORS', bad)
asyncio.run(main())
