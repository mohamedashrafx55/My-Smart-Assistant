import asyncio,sys,re
from h import *

async def main():
    async with Env() as e:
        pg = await e.page(w=1100, h=800)
        ok('MSA.changelog loaded', await pg.evaluate("!!MSA.changelog&&MSA.changelog.entries.length>=30"))
        ok('entries newest-first by date', await pg.evaluate("(()=>{const d=MSA.changelog.entries.map(x=>x.d);return d.every((x,i)=>i==0||d[i-1]>=x)})()"))
        ok('every entry has AR+EN title and bullets', await pg.evaluate("MSA.changelog.entries.every(e=>e.t[0]&&e.t[1]&&e.b.length&&e.b.every(b=>b[0]&&b[1]))"))
        ok('build numbers strictly descending per platform, no duplicates', await pg.evaluate("""(()=>{for(const k of ['a','w']){const v=MSA.changelog.entries.map(e=>e[k]).filter(Boolean);for(let i=1;i<v.length;i++)if(v[i]>=v[i-1])return false}return true})()"""))
        ok('latest Android and Windows builds are listed', await pg.evaluate("MSA.changelog.latestOf('android')>=44&&MSA.changelog.latestOf('windows')>=43"))
        ok('no gaps in Android 4..latest', await pg.evaluate("(()=>{const s=new Set(MSA.changelog.entries.map(e=>e.a));for(let i=4;i<=MSA.changelog.latestOf('android');i++)if(!s.has(i))return false;return true})()"))
        ok('no gaps in Windows 4..latest', await pg.evaluate("(()=>{const s=new Set(MSA.changelog.entries.map(e=>e.w));for(let i=4;i<=MSA.changelog.latestOf('windows');i++)if(!s.has(i))return false;return true})()"))
        # settings section
        await pg.evaluate("MSA.go('settings')"); await pg.wait_for_timeout(400)
        ok('settings updates section shows history with 2 latest', await pg.evaluate("document.querySelectorAll('[data-sec=upd] #clSec .cl-mini .cl-e').length===2"))
        ok('first card is the newest entry', await pg.evaluate("document.querySelector('#clSec .cl-e h5').textContent===MSA.changelog.entries[0].t[0]"))
        await pg.click('#clAll'); await pg.wait_for_timeout(300)
        n = await pg.evaluate("document.querySelectorAll('#clL .cl-e').length")
        tot = await pg.evaluate("MSA.changelog.entries.length")
        ok('modal lists every entry', n==tot, (n,tot))
        await pg.click('#clF [data-v=android]'); await pg.wait_for_timeout(150)
        ok('android filter', await pg.evaluate("[...document.querySelectorAll('#clL .cl-e')].every(c=>c.querySelector('.cl-p.and'))&&document.querySelectorAll('#clL .cl-e').length>=30"))
        await pg.click('#clF [data-v=windows]'); await pg.wait_for_timeout(150)
        ok('windows filter', await pg.evaluate("[...document.querySelectorAll('#clL .cl-e')].every(c=>c.querySelector('.cl-p.win'))"))
        await pg.click('#clF [data-v=all]'); await pg.fill('#clQ','ملفاتي'); await pg.wait_for_timeout(150)
        ok('search finds My files entry', await pg.evaluate("document.querySelectorAll('#clL .cl-e').length>=1&&/ملفاتي/.test(document.querySelector('#clL').textContent)"))
        await pg.fill('#clQ','zzzxxyy'); await pg.wait_for_timeout(150)
        ok('empty search shows no results', await pg.evaluate("document.querySelectorAll('#clL .cl-e').length===0&&/لا نتائج/.test(document.querySelector('#clL').textContent)"))
        # current-build marker
        await pg.evaluate("MSA.build.n=MSA.changelog.entries[0].w;MSA.build.platform='windows'"); await pg.fill('#clQ',''); await pg.wait_for_timeout(150)
        ok('current build is marked', await pg.evaluate("document.querySelectorAll('#clL .cl-e.mine').length===1&&!!document.querySelector('#clL .cl-me')"))
        ok('guide section exists', await pg.evaluate("fetch('js/guide-3.js').then(r=>r.text()).then(t=>t.includes(\"id: 'updhist'\"))"))
        # English + mobile
        pe = await e.page(w=390, h=800, lang='en'); await pe.evaluate("MSA.go('settings')"); await pe.wait_for_timeout(400)
        await pe.click('#clAll'); await pe.wait_for_timeout(300)
        ok('English modal title + card', await pe.evaluate("/Updates history/.test(document.querySelector('.modal').textContent)&&/Android/.test(document.querySelector('#clL').textContent)"))
        ok('no horizontal overflow on phone', await pe.evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"))
        errs = pg.errs + pe.errs
        ok('no page errors', not errs, errs[:4])
    return summary()
sys.exit(asyncio.run(main()))
