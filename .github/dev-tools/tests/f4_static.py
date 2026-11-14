import asyncio, re, os, json
from h import *
async def main():
    async with Env() as e:
        pg=await e.page(); await pg.wait_for_timeout(2000)
        d=await pg.evaluate("({ar:Object.keys(MSA.dict.ar),en:Object.keys(MSA.dict.en)})")
        ar,en=set(d['ar']),set(d['en'])
        ok('dict parity ar/en',ar==en,(sorted(ar-en)[:10],sorted(en-ar)[:10]))
        used=set()
        for f in os.listdir('../../../js'):
            t=open('../../../js/'+f).read()
            used|=set(re.findall(r"(?<![\w.])t\('([\w\.\-]+)'",t)); used|=set(re.findall(r"MSA\.t\('([\w\.\-]+)'",t)); used|=set(re.findall(r"data-i18n=\"([\w\.\-]+)\"",t))
        used|=set(re.findall(r'data-i18n="([\w\.\-]+)"',open('../../../index.html').read()))
        miss=sorted(k for k in used if k not in ar and not any(x.startswith(k) for x in ar))  # keys ending in a prefix are built dynamically (t('step.'+key))
        ok('all literal t() keys exist',not miss,miss[:30])
        print('keys used',len(used),'missing',miss[:30])
        # duplicate ids in main DOM per view
        for v in ['home','active','done','learn','tasks','clients','money','settings']:
            await pg.evaluate("v=>MSA.go(v)",v); await pg.wait_for_timeout(500)
            dup=await pg.evaluate("(()=>{const c={};document.querySelectorAll('[id]').forEach(x=>c[x.id]=(c[x.id]||0)+1);return Object.keys(c).filter(k=>c[k]>1)})()")
            ok('no duplicate ids in '+v,not dup,dup)
        ok('no errors',not pg.errs,pg.errs[:3])
    summary()
asyncio.run(main())
