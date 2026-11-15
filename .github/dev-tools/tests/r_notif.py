import asyncio,sys
from h import *
async def main():
    async with Env() as e:
        pg=await e.page(w=1100,h=800)
        await pg.evaluate("MSA.go('home')"); await pg.wait_for_timeout(500)
        r=await pg.evaluate("""(()=>{
          const d=new Date();d.setDate(d.getDate()+1);const k=MSA.u.dateKey(d);
          MSA.state.tasks=MSA.state.tasks.filter(x=>x.routine);
          const mk=(t,tm)=>Object.assign(MSA.tasksApi.blank({title:t,due:k+'T'+tm}),{});
          MSA.state.tasks.push(mk('تصميم بوستر','10:30'),mk('مونتاج ريل','15:00'),mk('رد على العميل','23:59'));
          MSA.state.settings.daily={on:true,time:'08:00'};
          const p=MSA.alarms.plan().filter(x=>x.group==='msa-day-'+k);
          return {n:p.length,titles:p.filter(x=>!x.summary).map(x=>x.title),sum:p.filter(x=>x.summary).map(x=>[x.title,x.body]),groups:[...new Set(p.map(x=>x.group))].length,routineLeak:p.some(x=>/راحة|نوم|ألعاب/.test(x.title+x.body))}})()""")
        ok('one notification per task + one summary',r['n']==4,r)
        ok('each task title is its own notification',sorted(r['titles'])==sorted(['تصميم بوستر','مونتاج ريل','رد على العميل']),r)
        ok('summary says the count and lists every title',('3' in r['sum'][0][0]) and all(t in r['sum'][0][1] for t in ['تصميم بوستر','مونتاج ريل','رد على العميل']),r)
        ok('times shown in the list (none for 23:59)','10:30 تصميم بوستر' in r['sum'][0][1] and '23:59' not in r['sum'][0][1],r)
        ok('routine tasks never leak into the alert',not r['routineLeak'],r)
        ok('all grouped together',r['groups']==1,r)
        r2=await pg.evaluate("""(()=>{const ids=MSA.alarms.plan().map(x=>x.id);return [ids.length,new Set(ids).size]})()""")
        ok('notification ids are unique',r2[0]==r2[1],r2)
        r3=await pg.evaluate("(()=>{MSA.state.tasks=MSA.state.tasks.filter(x=>x.routine);return MSA.alarms.plan().filter(x=>x.group).length})()")
        ok('no tasks → no daily alert at all',r3==0,r3)
        ok('no page errors',not pg.errs,pg.errs)
    return summary()
sys.exit(asyncio.run(main()))
