import asyncio,sys,json
from h import *

async def main():
    async with Env() as e:
        pg = await e.page(w=1100, h=800)
        await pg.evaluate("localStorage.setItem('msa_voice_dev','{}');localStorage.setItem('msa_voice_ai_v1','{\"key\":\"x\"}');const s=JSON.parse(localStorage.getItem('msa_state_v1')||'{}');s.voiceLog=[{said:'x'}];s.settings=s.settings||{};s.settings.voice={on:true};localStorage.setItem('msa_state_v1',JSON.stringify(s))")
        await pg.reload(); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(600)
        ok('no voice assistant objects exist', await pg.evaluate("!MSA.voice&&!window.VoiceAI&&!window.VoiceSmart&&!window.VoiceNLP&&!MSA.voiceHTML"))
        ok('no floating mic button or panel in the page', await pg.evaluate("!document.querySelector('.vc-fab,.vc-panel,#vcPanel')"))
        ok('leftover assistant data was wiped (state + device keys)', await pg.evaluate("!('voiceLog' in MSA.state)&&!('voice' in MSA.state.settings)&&!Object.keys(localStorage).some(k=>/^msa_voice/.test(k))&&!(localStorage.getItem('msa_state_v1')||'').includes('voiceLog')"))
        await pg.evaluate("MSA.go('settings')"); await pg.wait_for_timeout(500)
        ok('settings has no assistant section', await pg.evaluate("!document.querySelector('[data-vc-sec],#vcOn,#vcAiBox')&&!/المساعد الصوتي|المساعد الذكي|voice assistant/i.test(Array.from(document.querySelectorAll('.sec')).filter(x=>!x.querySelector('#clSec')).map(x=>x.textContent).join(' '))"))
        # Alt+M no longer opens anything
        await pg.keyboard.press('Alt+M'); await pg.wait_for_timeout(300)
        ok('Alt+M does nothing', await pg.evaluate("!document.querySelector('.vc-panel')"))
        # guide has no assistant sections
        g3 = await pg.evaluate("fetch('js/guide-3.js').then(r=>r.text())")
        ok('guide source has no assistant sections', 'المساعد الصوتي' not in g3 and 'المساعد الذكي' not in g3)
        ok('guide has no assistant sections', await pg.evaluate("(()=>{const g=MSA.guide;const t=JSON.stringify(g&&g.sections||g&&g.SECTIONS||'');return !/المساعد الصوتي|المساعد الذكي/.test(t)})()"))
        # quick task still understands dates
        ok('TextNLP parser available for quick task', await pg.evaluate("!!window.TextNLP&&typeof TextNLP.parse==='function'"))
        # quick-task date parsing itself is covered by r_biz2 (typed 'بكرة الساعة 3 العصر')
        ok('no page errors', not pg.errs, pg.errs[:4])
    return summary()
sys.exit(asyncio.run(main()))
