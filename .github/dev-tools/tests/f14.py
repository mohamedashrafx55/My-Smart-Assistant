import asyncio
from h import *
async def main():
    async with Env() as e:
        pg=await e.page(1280,900,demo=False)
        # --- tips: build two projects (design + video) with named steps
        await pg.evaluate("""()=>{const mk=(t)=>({id:MSA.u.uid('s'),key:null,title:t,done:false,note:'',atts:[],children:[]});
          const A={id:'pa',name:'حملة رمضان',created:Date.now(),status:'active',steps:[...MSA.proj.makeSteps('template'),mk('تصميم بوستر'),mk('خطة غريبة')]};
          const B={id:'pb',name:'فيديو ريلز المنتج',created:Date.now(),status:'active',steps:[mk('السيناريو'),mk('المونتاج'),mk('الصوت والموسيقى'),mk('التلوين'),mk('التسليم')]};
          MSA.state.projects.push(A,B);MSA.state.ui.project='pa';MSA.state.ui.ptab='plan';MSA.state.ui.projView='list';MSA.save();MSA.go('active')}""")
        await pg.wait_for_selector('.tips-btn'); await pg.wait_for_timeout(500)
        n=await pg.locator('.step').count(); nb=await pg.locator('.tips-btn').count()
        ok('every step has a tips icon',nb==n,(n,nb))
        # click on a built-in step (logo) -> logo tips
        async def tips_for(title):
            await pg.locator('.step:has(> .step-main .ttl:text-is("'+title+'")) > .step-main .tips-btn').first.dispatch_event('click'); await pg.wait_for_timeout(500)
            return await pg.evaluate("t=>{const s=[...document.querySelectorAll('.step')].find(x=>x.querySelector('.ttl').textContent.trim()===t);const b=s&&s.querySelector('.tips-box');return b?b.querySelector('.tips-h b').textContent:null}",title)
        h1=await tips_for('اللوجو'); ok('logo step -> logo tips',h1 and 'لوجو' in h1,h1)
        h2=await tips_for('تصميم بوستر'); ok('poster step -> poster tips',h2 and 'بوستر' in h2,h2)
        h3=await tips_for('الألوان'); ok('colours step -> colour tips',h3 and 'الألوان' in h3,h3)
        ok('tips differ per step',len({h1,h2,h3})==3,(h1,h2,h3))
        h4=await tips_for('خطة غريبة'); ok('unknown step -> generic tips (not fonts)',h4 and 'نصائح' in h4,h4)
        # tick an item and persist
        await pg.locator('.tips-box .tip').first.dispatch_event('click'); await pg.wait_for_timeout(300)
        cnt=await pg.evaluate("(()=>{let n=0;MSA.proj.walk(MSA.state.projects[0].steps,s=>{n+=(s.tipsDone||[]).length});return n})()"); ok('tip tick saved',cnt==1,cnt)
        # video project: names map to video tips
        await pg.evaluate("MSA.state.ui.project='pb';MSA.save();MSA.rerender()"); await pg.wait_for_timeout(600)
        res={}
        for t,kw in [('السيناريو','السيناريو'),('المونتاج','المونتاج'),('الصوت والموسيقى','الصوت'),('التلوين','الألوان'),('التسليم','التسليم')]:
            h=await tips_for(t); res[t]=h; ok('video step '+t+' -> '+str(h),h and kw in h,h)
        # tips box with the map detail
        # --- favourites: refs
        await pg.evaluate("""()=>{const S=MSA.state;S.refs=S.refs||[];S.refs.push({id:'r1',url:'https://example.com/a',title:'Ref A',tags:[],folder:null,created:1},{id:'r2',url:'https://example.com/b',title:'Ref B',tags:[],folder:null,created:2});
          S.learning.videos.push({id:'v1',url:'https://youtu.be/abcdefghijk',vid:'abcdefghijk',title:'Vid A',folder:null,created:1,note:''},{id:'v2',url:'https://youtu.be/bbcdefghijk',vid:'bbcdefghijk',title:'Vid B',folder:null,created:2,note:''});
          S.assets=S.assets||[];S.assets.push({id:'a1',type:'font',title:'Cairo',value:'https://fonts.google.com/specimen/Cairo',note:'',tags:[],att:null,created:1},{id:'a2',type:'color',title:'Gold',value:'#d4af37',note:'',tags:[],att:null,created:2});
          S.ui.refFolder=null;S.ui.learnFolder=null;S.ui.ltab='refs';MSA.save();MSA.go('learn')}""")
        await pg.wait_for_selector('.ref-grid'); await pg.wait_for_timeout(400)
        ok('refs: favourites folder card at root',await pg.locator('[data-favfolder]').count()==1)
        await pg.locator('.ref [data-act=fav]').first.dispatch_event('click'); await pg.wait_for_timeout(400)
        ok('refs: star saves fav flag',await pg.evaluate("MSA.state.refs.filter(r=>r.fav).length")==1)
        await pg.locator('[data-favfolder]').dispatch_event('click'); await pg.wait_for_timeout(500)
        ok('refs: favourites view lists only starred',await pg.locator('.ref').count()==1)
        await pg.locator('.ref [data-act=fav]').first.dispatch_event('click'); await pg.wait_for_timeout(400)
        ok('refs: unstar removes it from favourites',await pg.locator('.ref').count()==0)
        await pg.evaluate("MSA.state.ui.refFolder=null;MSA.rerender()"); await pg.wait_for_timeout(300)
        # videos
        await pg.evaluate("MSA.state.ui.ltab='videos';MSA.save();MSA.rerender()"); await pg.wait_for_selector('.vcard'); await pg.wait_for_timeout(300)
        ok('videos: favourites card',await pg.locator('[data-favfolder]').count()==1)
        await pg.locator('.vcard [data-act=fav]').first.dispatch_event('click'); await pg.wait_for_timeout(400)
        ok('videos: star saved',await pg.evaluate("MSA.state.learning.videos.filter(v=>v.fav).length")==1)
        await pg.locator('[data-favfolder]').dispatch_event('click'); await pg.wait_for_timeout(500)
        ok('videos: favourites view',await pg.locator('.vcard').count()==1)
        await pg.evaluate("MSA.state.ui.learnFolder=null;MSA.state.ui.ltab='assets';MSA.save();MSA.rerender()"); await pg.wait_for_selector('.pro-asset'); await pg.wait_for_timeout(300)
        await pg.locator('.pro-asset [data-fv]').first.dispatch_event('click'); await pg.wait_for_timeout(300)
        ok('assets: star saved',await pg.evaluate("MSA.state.assets.filter(a=>a.fav).length")==1)
        await pg.locator('[data-ty=__fav]').dispatch_event('click'); await pg.wait_for_timeout(300)
        ok('assets: favourites chip filters',await pg.locator('.pro-asset').count()==1)
        await pg.evaluate("()=>{const p=MSA.state.projects[0];p.identity={colors:[],fonts:[{h:'Lora',b:'Jost',ah:'Amiri',ab:'Cairo'},{h:'Playfair Display',b:'Lora',ah:'Aref Ruqaa',ab:'Cairo'}],icons:[],notes:[],images:[]};MSA.save();MSA.suggest.openIdentity(p)}")
        await pg.wait_for_selector('[data-id-fav]'); await pg.wait_for_timeout(300)
        ok('identity: star on each font',await pg.locator('[data-id-fav]').count()==2)
        await pg.locator('[data-id-fav="1"]').dispatch_event('click'); await pg.wait_for_timeout(300)
        ok('identity: font star saved',await pg.evaluate("MSA.state.projects[0].identity.fonts.map(f=>!!f.fav)")==[False,True])
        ok('identity: favourite font listed first',await pg.evaluate("document.querySelector('.font-card .tag').textContent.includes('Playfair')"))
        ok('no console errors',not pg.errs,pg.errs[:3])
    return summary()
import sys; sys.exit(1 if asyncio.run(main()) else 0)
