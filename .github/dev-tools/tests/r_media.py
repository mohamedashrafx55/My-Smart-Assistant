import asyncio,sys,time
from h import *
WAV="""(sec,hz)=>{const sr=8000,n=sr*sec,b=new ArrayBuffer(44+n*2),v=new DataView(b);const w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};
w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sr,true);v.setUint32(28,sr*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);
for(let i=0;i<n;i++)v.setInt16(44+i*2,Math.sin(2*Math.PI*hz*i/sr)*9000,true);return b}"""
async def main():
    async with Env() as e:
        pg=await e.page(w=420,h=820)
        await pg.evaluate("MSA.go('media')"); await pg.wait_for_selector('.mediav')
        ok('empty music state',await pg.locator('.mediav .empty').count()==1)
        await pg.evaluate("(%s)"%("()=>{const mk=%s;MSA.pickFiles=async()=>[new File([mk(30,440)],'Song One.wav',{type:'audio/wav'}),new File([mk(30,660)],'Song_Two.wav',{type:'audio/wav'}),new File([mk(30,880)],'Third.wav',{type:'audio/wav'})]}"%WAV))
        await pg.click('[data-md=add]'); await pg.wait_for_timeout(900)
        ok('3 tracks added',await pg.locator('.trk').count()==3)
        ok('names cleaned',await pg.evaluate("MSA.state.media.tracks.map(t=>t.name).join('|')")=='Song One|Song Two|Third')
        await pg.locator('.trk-n').first.click(); await pg.wait_for_timeout(900)
        ok('mini bar appears',await pg.locator('#msaMini').count()==1)
        ok('audio is playing',await pg.evaluate("!MSA.media.audio.paused"))
        await pg.click('#msaMini [data-mm=next]'); await pg.wait_for_timeout(700)
        ok('next goes to track 2',await pg.locator('#msaMini .mm-n').inner_text()=='Song Two')
        t0=time.time(); await pg.click('#msaMini [data-mm=prev]',timeout=4000); dt=time.time()-t0
        ok('prev button is clickable right away (no toast on top of it)',dt<2.5,dt)
        await pg.wait_for_timeout(700)
        ok('prev goes back to track 1',await pg.locator('#msaMini .mm-n').inner_text()=='Song One')
        await pg.click('#msaMini [data-mm=play]'); await pg.wait_for_timeout(200)
        ok('pause works',await pg.evaluate("MSA.media.audio.paused"))
        await pg.click('#msaMini [data-mm=play]'); await pg.wait_for_timeout(300)
        ok('resume works',await pg.evaluate("!MSA.media.audio.paused"))
        await pg.click('#msaMini [data-mm=stop]'); await pg.wait_for_timeout(300)
        ok('stop closes the mini bar',await pg.locator('#msaMini').count()==0)
        ok('no page errors',not pg.errs,pg.errs)
    return summary()
sys.exit(asyncio.run(main()))
