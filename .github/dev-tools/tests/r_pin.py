import asyncio,subprocess,json
from h import *
PIX="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
HTML="""<body style='margin:0'>
<div id=a style='position:absolute;left:0;top:0;width:100px;height:100px'><img src='%s' style='width:100px;height:100px'><div style='position:absolute;inset:0'></div></div>
<div id=b style="position:absolute;left:150px;top:0;width:100px;height:100px;background:url('%s')"></div>
<canvas id=c width=50 height=50 style='position:absolute;left:300px;top:0'></canvas>
<div id=d style='position:absolute;left:400px;top:0;width:100px;height:100px;background:red'></div>
<script>var x=document.getElementById('c').getContext('2d');x.fillStyle='blue';x.fillRect(0,0,50,50)</script></body>"""%(PIX,PIX)
def build_probe():
    import re
    y=open('../../workflows/build-exe.yml',encoding='utf8').read()
    m=re.search(r'const PROBE = (.*?`);\n',y,re.S)
    body=m.group(1)
    open('/tmp/probe_fn.js','w').write('module.exports='+body+';')
async def main():
    build_probe()
    probe=json.loads(subprocess.check_output(['node','-e',"const f=require('/tmp/probe_fn.js');console.log(JSON.stringify([f(50,50),f(200,50),f(320,20),f(450,50)]))"]))
    async with Env() as e:
        pg=await e.page(w=600,h=300)
        await pg.set_content(HTML)
        r=[await pg.evaluate(js) for js in probe]
        ok('image under a transparent overlay is found',r[0].startswith('data:image/png'),r[0][:30])
        ok('CSS background image is found',r[1].startswith('data:image/png'),r[1][:30])
        ok('canvas is captured',r[2].startswith('data:image/png'),r[2][:30])
        ok('plain area without a picture returns nothing (falls back to screenshot)',r[3]=='',r[3][:30])
        pg2=await e.page(w=1100,h=800)
        await pg2.add_init_script("window.msaDesktop={webview:true,onWebImage(cb){window.__cb=cb}}")
        await pg2.reload(); await pg2.wait_for_timeout(1200)
        has=await pg2.evaluate("typeof window.__cb")
        ok('desktop hook registered',has=='function',has)
        if has=='function':
            await pg2.evaluate("MSA.explore.open(MSA.state.projects[0],{tab:'sites'})"); await pg2.wait_for_timeout(500)
            cnt="(()=>{const i=MSA.state.projects[0].identity;return i?(i.images||[]).length:0})()"
            n0=await pg2.evaluate(cnt)
            await pg2.evaluate("window.__cb({src:'',thumb:'data:image/jpeg;base64,/9j/4AAQ',page:'https://www.logowik.com/x',mime:'image/png',b64:'%s'})"%PIX.split(',')[1]); await pg2.wait_for_timeout(800)
            n1=await pg2.evaluate(cnt)
            ok('image without http src is pinned to the identity',n1==n0+1,(n0,n1))
        ok('no page errors',not pg2.errs,pg2.errs)
asyncio.run(main()); summary()
