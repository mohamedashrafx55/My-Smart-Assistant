import asyncio,sys,io,zipfile
from h import *
async def main():
    async with Env() as e:
        pg=await e.page(w=1100,h=800)
        ok('cell + docx modules loaded',await pg.evaluate("!!(MSA.cell&&MSA.cell.badge&&MSA.cell.tabBar&&MSA.docx&&MSA.docx.build)"))
        # to-do badge
        r=await pg.evaluate("(()=>{const s={todo:{sections:[{id:'a',title:'A',col:'#fff',items:[{id:'1',text:'x',done:true},{id:'2',text:'y',done:false}]}]}};return [MSA.cell.counts(s).all,MSA.cell.counts(s).done,MSA.cell.badge(s).includes('1/2'),MSA.cell.badge({})===''] })()")
        ok('counts + badge',r==[2,1,True,True],r)
        # tab bar has 3 tabs
        n=await pg.evaluate("(()=>{const d=document.createElement('div');d.innerHTML=MSA.cell.tabBar({});return d.querySelectorAll('[data-ctab],button').length})()")
        ok('tab bar renders 3 tabs',n==3,n)
        # docx build (RTL Arabic, headings, lists) → valid zip with the right parts
        b64=await pg.evaluate("""async()=>{const html='<h1>عنوان</h1><p>فقرة <b>عريض</b> <i>مائل</i> <u>خط</u></p><ul><li>بند</li><li>اثنين</li></ul><ol><li>one</li></ol><p>English line</p>';const blob=MSA.docx.build(html,{title:'T',rtl:true,author:'me'});const buf=new Uint8Array(await blob.arrayBuffer());let s='';for(const c of buf)s+=String.fromCharCode(c);return btoa(s)}""")
        import base64
        z=zipfile.ZipFile(io.BytesIO(base64.b64decode(b64)))
        names=z.namelist()
        ok('docx has required parts',all(x in names for x in ['[Content_Types].xml','_rels/.rels','word/document.xml','word/styles.xml','word/numbering.xml']),names)
        doc=z.read('word/document.xml').decode()
        ok('docx RTL paragraphs + bold/italic/underline',('w:bidi' in doc) and ('<w:b' in doc) and ('<w:i' in doc) and ('<w:u ' in doc),doc[:200])
        ok('docx keeps the Arabic text',('عنوان' in doc) and ('بند' in doc))
        try:
            import docx as pd
            open('/tmp/_t.docx','wb').write(base64.b64decode(b64)); d=pd.Document('/tmp/_t.docx')
            ok('python-docx opens it',any('عنوان' in p.text for p in d.paragraphs))
        except ImportError: ok('python-docx opens it (skipped: not installed)',True)
        # to-do UI on a real project cell via the map
        await pg.evaluate("(()=>{const p=MSA.state.projects.find(p=>p.status!=='done');window.__pid=p.id;MSA.proj.open&&MSA.proj.open(p.id)})()"); await pg.wait_for_timeout(600)
        ok('project opens without errors',not pg.errs,pg.errs)
        # frames API: addCard / prune keep data consistent
        r=await pg.evaluate("""(()=>{const p=MSA.state.projects.find(x=>x.id===window.__pid);p.graph=p.graph||{v:2,pos:{},dim:{},col:{},edges:[],cards:[]};
          let st=null;MSA.proj.walk(p.steps,s=>{if(!st)st=s});st.todo={sections:[{id:'sec1',title:'A',col:'#fff',items:[]}]};
          p.graph.cards=[{id:'ok',k:'todo',s:st.id,ref:'sec1',x:10,y:10,w:200,h:100},{id:'gone-sec',k:'todo',s:st.id,ref:'nope',x:0,y:0,w:100,h:100},{id:'gone-step',k:'note',s:'zzz',ref:'',x:0,y:0,w:100,h:100},{id:'gone-att',k:'att',s:st.id,ref:'missing',x:0,y:0,w:100,h:100}];
          const g=p.graph;const ch=MSA.cell.prune(p,g);return [ch,g.cards.map(c=>c.id).join(',')]})()""")
        ok('prune keeps live frames, drops dead ones',r==[True,'ok'],r)
        ok('no page errors',not pg.errs,pg.errs)
    return summary()
sys.exit(asyncio.run(main()))
