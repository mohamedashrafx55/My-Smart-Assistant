import asyncio, json, subprocess, time, urllib.request
from h import *
MOCK='http://localhost:8790'
def db(path='/__db'): return json.loads(urllib.request.urlopen(MOCK+path).read())
async def conn(pg,pw='pw123456'):
    return await pg.evaluate("""async pw=>{try{await MSA.sync.connect('http://localhost:8790','anon-key','me@x.com',pw);return 'ok'}catch(e){return 'ERR '+e.message}}""",pw)
RUN="async f=>{return JSON.stringify(await MSA.sync.run({force:!!f}))}"
async def addtask(pg,tid,title):
    await pg.evaluate("([i,t])=>{MSA.state.tasks.push({id:i,title:t,status:'todo',atts:[],created:Date.now()});MSA.saveNow()}",[tid,title])
async def titles(pg): return await pg.evaluate("MSA.state.tasks.filter(t=>!/تجريبي/.test(t.desc||'')).map(t=>t.title).sort()")
async def main():
    proc=subprocess.Popen(['python3','mock_supabase.py','8790']); time.sleep(1); urllib.request.urlopen(MOCK+'/__reset')
    try:
        async with Env() as e:
            A=await e.page(lang='ar'); B=await e.page(lang='en',theme='light')
            ok('B starts with different theme/lang', await B.evaluate("MSA.state.settings.lang==='en'&&MSA.state.settings.theme==='light'"))
            # --- A: data + a file, connect
            await addtask(A,'ta1','مهمة من A'); await A.evaluate("MSA.state.profile.bio='bio-from-A';MSA.saveNow()")
            fid=await A.evaluate("""async()=>{const png=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='),c=>c.charCodeAt(0));const a=await MSA.files.put(new File([png],'pix.png',{type:'image/png'}));MSA.state.tasks[0].atts=[a];MSA.saveNow();return a.id}""")
            ok('wrong password is refused with a clear message', 'Invalid login' in await conn(A,'nope'), None)
            ok('A connects', await conn(A)=='ok')
            r=json.loads(await A.evaluate(RUN,True)); ok('A first sync pushed', r['state']=='pushed' and not r['files'].get('skipped'), r)
            d=db(); ok('cloud has state + file row + object', len(d['state'])==1 and fid in d['files'] and any(fid in k for k in d['objs']), d)
            # --- B: pristine device pulls everything
            ok('B connects', await conn(B)=='ok')
            r=json.loads(await B.evaluate(RUN,True)); ok('B pulled on first sync', r['state']=='pulled', r)
            ok('B has the task', await titles(B)==['مهمة من A'], await titles(B))
            ok('B got the bio', await B.evaluate("MSA.state.profile.bio")=='bio-from-A')
            ok('B kept its own language/theme', await B.evaluate("MSA.state.settings.lang==='en'&&MSA.state.settings.theme==='light'"))
            ok('B has its own password hash (not overwritten)', await B.evaluate("!!MSA.state.security&&MSA.state.security.on!==undefined"))
            ok('B downloaded the picture', await B.evaluate("MSA.files.ids().then(a=>a.includes('%s'))"%fid))
            ok('B picture is intact', await B.evaluate("async()=>{const r=await MSA.files.get('%s');return r&&r.blob.size>20&&r.mime==='image/png'&&r.name==='pix.png'}"%fid) if False else await B.evaluate("MSA.files.get('%s').then(r=>!!r&&r.blob.size>20&&r.mime==='image/png'&&r.name==='pix.png')"%fid))
            # --- clean propagation both ways
            await addtask(B,'tb1','مهمة من B'); r=json.loads(await B.evaluate(RUN)); ok('B edit pushed', r['state']=='pushed', r)
            r=json.loads(await A.evaluate(RUN)); ok('A pulled B edit', r['state']=='pulled' and await titles(A)==['مهمة من A','مهمة من B'], (r,await titles(A)))
            r=json.loads(await A.evaluate(RUN)); ok('no change -> same (no ping-pong)', r['state']=='same', r)
            # --- conflict: both edit before syncing
            await addtask(A,'ta2','A2'); await addtask(B,'tb2','B2')
            r=json.loads(await B.evaluate(RUN)); ok('B pushes first', r['state']=='pushed', r)
            t=asyncio.ensure_future(A.evaluate(RUN)); await A.wait_for_selector('[data-a=merge]',timeout=6000)
            ok('A sees the conflict dialog', True)
            await A.click('[data-a=merge]'); r=json.loads(await t)
            ok('merge keeps both sides', r['state']=='merged' and await titles(A)==sorted(['مهمة من A','مهمة من B','A2','B2']), (r,await titles(A)))
            r=json.loads(await B.evaluate(RUN)); ok('B receives the merge', await titles(B)==await titles(A), await titles(B))
            ok('safety copy of the replaced side was kept', await A.evaluate("!!localStorage.getItem('msa_sync_prev')"))
            # choose cloud / local
            await addtask(A,'ta3','A3'); await addtask(B,'tb3','B3'); await B.evaluate(RUN)
            t=asyncio.ensure_future(A.evaluate(RUN)); await A.wait_for_selector('[data-a=cloud]'); await A.click('[data-a=cloud]'); await t
            ok('"use cloud" replaces this device', 'A3' not in await titles(A) and 'B3' in await titles(A), await titles(A))
            await addtask(A,'ta4','A4'); await addtask(B,'tb4','B4'); await B.evaluate(RUN)
            t=asyncio.ensure_future(A.evaluate(RUN)); await A.wait_for_selector('[data-a=local]'); await A.click('[data-a=local]'); await t
            await B.evaluate(RUN); ok('"use this device" wins on the cloud', 'A4' in await titles(B) and 'B4' not in await titles(B), await titles(B))
            # --- file deletion propagates
            await A.evaluate("async id=>{await MSA.files.del(id)}",fid); await A.evaluate(RUN)
            d=db(); ok('deleted file removed from the cloud', fid not in d['files'] and not any(fid in k for k in d['objs']), d)
            # --- file added on B arrives on A on demand
            fid2=await B.evaluate("""async()=>{const a=await MSA.files.put(new File([new Uint8Array(300000).fill(7)],'big.bin',{type:'application/octet-stream'}));MSA.state.tasks[0].atts=[a];MSA.saveNow();return a.id}""")
            await B.evaluate(RUN); await A.evaluate(RUN)
            ok('A has the new file', await A.evaluate("MSA.files.ids().then(a=>a.includes('%s'))"%fid2))
            # --- offline then back online
            await A.context.set_offline(True); r=json.loads(await A.evaluate(RUN)); ok('offline: no crash, says offline', r is None or r.get('error')=='offline' or r=={} , r)
            await addtask(A,'ta5','offline edit'); await A.context.set_offline(False)
            r=json.loads(await A.evaluate(RUN)); ok('back online: edit pushed', r['state']=='pushed', r)
            # --- token lost -> asks to sign in again
            urllib.request.urlopen(MOCK+'/__revoke'); 
            r=json.loads(await A.evaluate(RUN)); ok('server forgot the session -> auth error reported', r and r.get('error')=='auth', r)
            ok('disconnect works', await A.evaluate("MSA.sync.disconnect(),MSA.sync.info().linked===false"))
            # --- settings UI renders both modes without errors
            await A.evaluate("MSA.openSettings()"); await A.wait_for_selector('#syGo'); ok('settings shows the connect form', True)
            await A.click('#syGuide'); await A.wait_for_selector('#sySql',state='attached'); ok('setup guide + SQL shown', 'msa_state' in await A.input_value('#sySql'))
            print('A errs',A.errs[:3])
            ok('A no errors', not A.errs, A.errs[:3]); ok('B no errors', not B.errs, B.errs[:3])
        summary()
    finally: proc.terminate()
asyncio.run(main())
