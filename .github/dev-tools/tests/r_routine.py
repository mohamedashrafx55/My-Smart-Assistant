import asyncio,json
from h import *
async def main():
    async with Env() as e:
        pg=await e.page(w=1100,h=900)
        # legacy state: 14 days of generated routine, some edited/ticked
        await pg.evaluate("""(()=>{const S=MSA.state;const dk=d=>MSA.u.dateKey(d);S.tasks=[];S.routine={blocks:[{id:'b1',title:'نوم',from:'23:30',to:'23:30'},{id:'b2',title:'تعلم',from:'20:00',to:'21:00'}],gen:{}};
          for(let i=0;i<14;i++){const d=new Date();d.setDate(d.getDate()+i);const k=dk(d);S.routine.blocks.forEach(b=>{const x=MSA.tasksApi.blank({title:b.title,start:k+'T'+b.from,due:k+'T'+b.to});x.routine=b.id;x.rday=k;x.id='rt_'+b.id+'_'+k;S.tasks.push(x);S.routine.gen[b.id+'|'+k]=1})}
          const t=new Date();t.setDate(t.getDate()+1);const tk=dk(t);const ed=S.tasks.find(x=>x.id==='rt_b2_'+tk);ed.title='تعلم (عدلتها)';ed.desc='<p>ملاحظة</p>';
          S.tasks.push(MSA.tasksApi.blank({title:'مهمة عادية',due:dk(new Date())+'T10:00'}));MSA.save();window.__tk=tk})()""")
        await pg.evaluate("delete MSA.state.routine.v2;MSA.sched.ensure()")
        r=await pg.evaluate("(()=>{const l=MSA.state.tasks.filter(x=>x.routine);return [l.length,l.map(x=>x.id).sort().join(','),l.every(x=>x.rday===window.__tk),l.find(x=>x.routine==='b2').title,l.find(x=>x.routine==='b2').desc,MSA.state.tasks.filter(x=>!x.routine).length,Object.keys(MSA.state.routine.gen).length]})()")
        ok('migration keeps exactly one copy per item, dated tomorrow',r[0]==2 and r[1]=='rt_b1,rt_b2' and r[2],r)
        ok('the edited tomorrow copy kept its edits',r[3]=='تعلم (عدلتها)' and 'ملاحظة' in r[4],r)
        ok('normal tasks untouched; old gen map cleared',r[5]==1 and r[6]==0,r)
        await pg.evaluate("MSA.sched.ensure();MSA.sched.ensure()")
        ok('ensure is idempotent (no duplicates)',await pg.evaluate("MSA.state.tasks.filter(x=>x.routine).length===2"))
        # old-format copy coming back from a sync is purged
        await pg.evaluate("(()=>{const x=MSA.tasksApi.blank({title:'قديم'});x.routine='b1';x.rday='2020-01-01';x.id='rt_b1_2020-01-01';MSA.state.tasks.push(x);MSA.sched.ensure()})()")
        ok('old per-day copy from a sync is dropped',await pg.evaluate("MSA.state.tasks.filter(x=>x.routine).length===2"))
        # not in other task views / counters
        await pg.evaluate("MSA.state.ui.tasksView='list';MSA.go('tasks')"); await pg.wait_for_timeout(500)
        txt=await pg.inner_text('#view') if await pg.query_selector('#view') else await pg.inner_text('body')
        ok('routine not in the tasks list',('نوم' not in txt) and ('تعلم (عدلتها)' not in txt) and 'مهمة عادية' in txt,txt[:150])
        ok('routine not counted as open tasks',await pg.evaluate("MSA.taskStats().open===1"))
        for v in ['board','calendar']:
            await pg.evaluate("v=>{MSA.state.ui.tasksView=v;MSA.save();MSA.rerender()}",v); await pg.wait_for_timeout(400)
            t2=await pg.inner_text('body'); ok('routine not in '+v+' view','تعلم (عدلتها)' not in t2)
        await pg.evaluate("MSA.state.ui.tasksView='list';MSA.go('home')"); await pg.wait_for_timeout(500)
        # tab: rename, tick, next-day roll
        await pg.evaluate("MSA.state.ui.hometab='tasks';MSA.state.ui.wk={mode:'routine'};MSA.save();MSA.rerender()"); await pg.wait_for_timeout(500)
        ok('routine tab shows both items, Repeat icon',await pg.evaluate("document.querySelectorAll('.rt-sec .wk-t').length===2&&!!document.querySelector('.rt-tab svg')"))
        await pg.click('.rt-sec .wk-t .cb'); await pg.wait_for_timeout(300)
        ok('ticking marks it done for today (stays as a repeating item)',await pg.evaluate("MSA.state.tasks.filter(x=>x.routine&&x.status==='done').length===1&&MSA.state.tasks.filter(x=>x.routine).length===2"))
        await pg.click('[data-wk=routine]'); await pg.wait_for_timeout(300)
        await pg.fill('#rtName','عاداتي'); await pg.click('button.primary:has-text("حفظ")'); await pg.wait_for_timeout(400)
        ok('tab can be renamed',await pg.evaluate("document.querySelector('.rt-nm').textContent==='عاداتي'&&MSA.sched.name()==='عاداتي'"))
        await pg.fill('#rtName','') if False else None
        # next day: yesterday's tick resets and date rolls to today
        await pg.evaluate("(()=>{const y=new Date();y.setDate(y.getDate()-1);const k=MSA.u.dateKey(y);MSA.state.tasks.filter(x=>x.routine).forEach(x=>{x.rday=k;x.status='done';x.completedAt=Date.now()-864e5*1.2});MSA.sched.ensure()})()")
        r=await pg.evaluate("(()=>{const k=MSA.u.dateKey(new Date());const l=MSA.state.tasks.filter(x=>x.routine);return [l.length,l.every(x=>x.status==='todo'&&x.rday===k&&x.due.startsWith(k))]})()")
        ok('a new day: routine returns un-ticked and dated today',r==[2,True],r)
        # conflicts treat routine as daily
        c=await pg.evaluate("(()=>{const k='2031-05-05';return MSA.sched.conflicts({id:'zz',type:'task',title:'x',start:k+'T20:15',due:k+'T20:45',status:'todo'}).map(x=>x.title)})()")
        ok('a task on any future day clashes with the daily routine slot',c==['تعلم'],c)
        # routine not in search index / reports
        ok('no page errors',not pg.errs,pg.errs)
asyncio.run(main()); summary()
