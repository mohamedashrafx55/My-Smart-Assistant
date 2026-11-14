import asyncio,sys
from h import *
OPEN="(k)=>{const p=MSA.state.projects[0];let t=null;MSA.proj.walk(p.steps,s=>{if(!t&&s.key===k)t=s});MSA.suggest.open(p,t)}"
async def main():
    async with Env() as e:
        pg=await e.page(lang='ar',demo=True)
        res=await pg.evaluate("""(()=>{const p=MSA.state.projects[0];const o=[];MSA.proj.walk(p.steps,s=>{const id=MSA.tips.pick(p,s);const d=MSA.profData[id];o.push([id,!!(d&&d.secs&&d.secs.length>=4)])});return o})()""")
        ok('every step of the demo project has >=4 success factors',all(r[1] for r in res),[r for r in res if not r[1]])
        allids=await pg.evaluate("Object.keys(MSA.tips.cats)")
        bad=[i for i in allids if not await pg.evaluate("(i)=>{const d=MSA.profData[i];return !!(d&&d.secs&&d.secs.length>=4&&d.secs.every(x=>x.length==4&&x[0]&&x[1]&&x[2]&&x[3]))}",i)]
        ok('all categories well-formed (ar+en title and text)',not bad,bad)
        await pg.evaluate(OPEN,'main'); await pg.wait_for_selector('.sf-item'); await pg.wait_for_timeout(300)
        ok('no professor tab any more (only suggestions + colour theory)',await pg.locator('[data-tab=prof]').count()==0 and await pg.locator('.sg-tab').count()==2)
        n=await pg.locator('.sf-item').count(); ok('main design step lists success factors in order',n>=7,n)
        txt=await pg.inner_text('.sf-list'); ok('items are numbered with name (English term) and explanation','التسلسل الهرمي البصري (Visual Hierarchy)' in txt and 'توزيع العناصر' in txt)
        ok('suggestions content still shown below',await pg.locator('.sg-body .sg-sec').count()>=2)
        await pg.screenshot(path='/tmp/sf-d.png')
        n0=await pg.evaluate("((MSA.state.projects[0].identity||{}).notes||[]).length")
        await pg.locator('.sf-item .icon-btn').first.dispatch_event('click'); await pg.wait_for_timeout(200)
        ok('pin a factor to identity notes',await pg.evaluate("(MSA.state.projects[0].identity.notes||[]).length")==n0+1)
        # social post step (uses the project name matching via tips.pick)
        await pg.evaluate("""(()=>{const p=MSA.state.projects[0];p.steps.push({id:'zz1',title:'تصميم سوشيال ميديا',atts:[],note:'',children:[]})})()""")
        r=await pg.evaluate("(()=>{const p=MSA.state.projects[0];const s=p.steps.find(x=>x.id==='zz1');return [MSA.tips.pick(p,s),MSA.profData[MSA.tips.pick(p,s)].secs.length]})()")
        ok('social media step has the 9 factors',r[0]=='social' and r[1]==9,r)
        await pg.evaluate("MSA.state.settings.lang='en';MSA.save();MSA.applyLang()"); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        await pg.evaluate(OPEN,'main'); await pg.wait_for_selector('.sf-item'); await pg.wait_for_timeout(300)
        t2=await pg.inner_text('.sf-list'); ok('english shows English names',('Visual Hierarchy' in t2) and ('التسلسل' not in t2),t2[:80])
        pg2=await e.page(w=390,h=800,lang='ar',demo=True)
        await pg2.evaluate(OPEN,'colors'); await pg2.wait_for_selector('.sf-item'); await pg2.wait_for_timeout(300)
        ok('mobile: no horizontal overflow',await pg2.evaluate("document.documentElement.scrollWidth<=innerWidth+1"))
        await pg2.screenshot(path='/tmp/sf-m.png')
        ok('no page errors',not pg.errs and not pg2.errs,pg.errs+pg2.errs)
    return summary()
sys.exit(asyncio.run(main()))
