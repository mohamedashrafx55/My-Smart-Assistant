import asyncio,sys
from h import *
OPEN="(k)=>{const p=MSA.state.projects[0];let t=null;MSA.proj.walk(p.steps,s=>{if(!t&&s.key===k)t=s});MSA.suggest.open(p,t)}"
async def main():
    async with Env() as e:
        pg=await e.page(lang='ar',demo=True)
        # maths
        m=await pg.evaluate("""(()=>{const C=MSA.colorTheory;const r=C.hsv2rgb(0,1,1),b=C.hsv2rgb(240,1,1);return {red:r,blue:b,back:C.rgb2hsv(0,255,0),white:C.ratio('#ffffff','#000000'),comp:C.colorsOf({h:0,s:1,v:1,mode:'comp'}),tri:C.colorsOf({h:0,s:1,v:1,mode:'triad'}),sq:C.colorsOf({h:0,s:1,v:1,mode:'square'}).length,an:C.colorsOf({h:0,s:1,v:1,mode:'analog'}).length,mono:C.colorsOf({h:200,s:.8,v:.8,mode:'mono'}).length}})()""")
        ok('hsv->rgb red/blue',m['red']==[255,0,0] and m['blue']==[0,0,255],m)
        ok('rgb->hsv green',round(m['back'][0])==120,m)
        ok('contrast white/black = 21',round(m['white'])==21,m)
        ok('complementary of red is cyan',m['comp']==['#ff0000','#00ffff'],m['comp'])
        ok('triadic of red = red, green, blue',m['tri']==['#ff0000','#00ff00','#0000ff'],m['tri'])
        ok('square=4, analogous=5, mono=5',m['sq']==4 and m['an']==5 and m['mono']==5,m)
        for k in ['brief','main','colors']:
            await pg.evaluate(OPEN,k); await pg.wait_for_selector('.sg-tab'); await pg.wait_for_timeout(250)
            ok('theory tab present on step '+k,await pg.locator('[data-tab=theory]').count()==1)
            await pg.locator('[data-tab=theory]').dispatch_event('click'); await pg.wait_for_selector('#ctWheel'); await pg.wait_for_timeout(200)
            ok('wheel + palette + course render on '+k,await pg.locator('.ct-dot').count()>=2 and await pg.locator('.ct-c').count()>=2 and await pg.locator('.ct-course details').count()>=6)
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(350)
        # interactions on last open
        await pg.evaluate(OPEN,'colors'); await pg.wait_for_selector('.sg-tab'); await pg.wait_for_timeout(300); await pg.locator('[data-tab=theory]').dispatch_event('click'); await pg.wait_for_selector('#ctWheel'); await pg.wait_for_timeout(200)
        bx=await pg.locator('#ctWheel').bounding_box(); cx=bx['x']+bx['width']/2; cy=bx['y']+bx['height']/2
        await pg.mouse.move(cx,cy-bx['height']*0.45); await pg.mouse.down(); await pg.mouse.move(cx,cy-bx['height']*0.45+2); await pg.mouse.up(); await pg.wait_for_timeout(200)
        hx=await pg.input_value('#ctHex'); r,g,b=[int(hx[i:i+2],16) for i in (1,3,5)]; ok('dragging on the wheel top gives a red-hued base',r>g and r>b and abs(g-b)<=2,hx)
        await pg.locator('[data-ct-mode=triad]').dispatch_event('click'); await pg.wait_for_timeout(150)
        ok('triad shows 3 colours',await pg.locator('.ct-c').count()==3)
        await pg.fill('#ctHex','#3366CC'); await pg.wait_for_timeout(200)
        ok('typing a HEX updates the palette',(await pg.inner_text('.ct-c >> nth=0')).upper()=='#3366CC',await pg.inner_text('.ct-c >> nth=0'))
        await pg.locator('[data-ct-mode=comp]').dispatch_event('click'); await pg.wait_for_timeout(150)
        ok('complementary of #3366CC has 2 colours',await pg.locator('.ct-c').count()==2)
        n0=await pg.evaluate("((MSA.state.projects[0].identity||{}).colors||[]).length")
        await pg.locator('[data-ct=pinall]').dispatch_event('click'); await pg.wait_for_timeout(250)
        ok('add palette to identity',await pg.evaluate("MSA.state.projects[0].identity.colors.length")>=n0+1)
        ok('contrast checker shows a ratio',':' in await pg.inner_text('.ct-score b'))
        ok('ramp has 9 steps',await pg.locator('.ct-r').count()==9)
        await pg.screenshot(path='/tmp/ct-d.png')
        await pg.locator('[data-tab=sug]').dispatch_event('click'); await pg.wait_for_timeout(250)
        ok('back to suggestions works',await pg.locator('.sf-item').count()>=1)
        pg2=await e.page(w=390,h=800,lang='ar',demo=True)
        await pg2.evaluate(OPEN,'colors'); await pg2.wait_for_selector('.sg-tab'); await pg2.wait_for_timeout(600); await pg2.locator('[data-tab=theory]').dispatch_event('click'); await pg2.wait_for_selector('#ctWheel'); await pg2.wait_for_timeout(300)
        ok('mobile: no horizontal overflow',await pg2.evaluate("document.documentElement.scrollWidth<=innerWidth+1"))
        await pg2.screenshot(path='/tmp/ct-m.png')
        ok('no page errors',not pg.errs and not pg2.errs,pg.errs+pg2.errs)
    return summary()
sys.exit(asyncio.run(main()))
