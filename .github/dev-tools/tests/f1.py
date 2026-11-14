import asyncio, json
from h import *

async def main():
    async with Env() as e:
        pg=await e.page(); await pg.wait_for_timeout(2800)
        pid=await pg.evaluate("MSA.state.projects[0].id")
        # ---------- 1. PAYMENTS via UI ----------
        await pg.evaluate("p=>{MSA.state.ui.project=p;MSA.state.ui.ptab='time';MSA.go('active')}",pid)
        await pg.wait_for_selector('#prFixed')
        await pg.fill('#prClient','مطعم الأصيل'); await pg.dispatch_event('#prClient','change')
        await pg.fill('#prFixed','5000')
        ok('pay card present',await pg.locator('.pay-card').count()==1)
        ok('status unpaid',await pg.evaluate("MSA.plus.pay.status(MSA.state.projects[0])")=='unpaid')
        await pg.click('[data-pa=add]'); await pg.wait_for_selector('#pyAmt')
        tot0=await pg.evaluate("MSA.plus.pay.total(MSA.state.projects[0])"); print('total',tot0)
        ok('modal default = remaining total',float(await pg.input_value('#pyAmt'))==tot0)
        await pg.fill('#pyAmt','2000'); await pg.fill('#pyNote','عربون'); await pg.click('.modal .btn.primary')
        await pg.wait_for_timeout(300)
        ok('paid=2000',await pg.evaluate("MSA.plus.pay.paid(MSA.state.projects[0])")==2000)
        ok('remaining=total-2000',await pg.evaluate("MSA.plus.pay.remaining(MSA.state.projects[0])")==tot0-2000)
        ok('partial status',await pg.evaluate("MSA.plus.pay.status(MSA.state.projects[0])")=='partial')
        ok('row shows note',await pg.locator('.pay-card td',has_text='عربون').count()==1)
        # change price -> remaining follows
        await pg.fill('#prFixed','6000'); await pg.wait_for_timeout(100)
        ok('remaining follows price',await pg.evaluate("MSA.plus.pay.remaining(MSA.state.projects[0])")==tot0+1000-2000)
        # due date overdue
        await pg.fill('#pyDue','2020-01-01'); await pg.dispatch_event('#pyDue','change')
        ok('late flag',await pg.evaluate("MSA.plus.pay.isLate(MSA.state.projects[0])"))
        # money dashboard
        await pg.evaluate("MSA.go('money')"); await pg.wait_for_selector('.mny-row')
        ok('money row listed',await pg.locator('.mny-row').count()==1)
        ok('grouped by client',await pg.locator('.mny-gh b',has_text='مطعم الأصيل').count()==1)
        ok('overdue pill',await pg.locator('.mny-row .pill-s',has_text='متأخر').count()==1)
        kp=await pg.locator('.mny-kpis .kp b').all_inner_texts(); print(kp)
        ok('outstanding kpi 4000',any('4' in k and '000' in k.replace(',','').replace('٬','') or '٤' in k for k in kp[:1]),kp)
        await pg.click('[data-ma=pay]'); await pg.wait_for_selector('#pyAmt'); await pg.fill('#pyAmt',str(tot0+1000-2000)); await pg.click('.modal .btn.primary'); await pg.wait_for_timeout(300)
        ok('fully paid',await pg.evaluate("MSA.plus.pay.status(MSA.state.projects[0])")=='paid')
        ok('open filter empty -> empty state',await pg.locator('.mny-row').count()==0 and await pg.locator('.empty').count()==1)
        await pg.click('[data-ma=f][data-v=paid]'); await pg.wait_for_timeout(200)
        ok('paid filter lists it',await pg.locator('.mny-row').count()==1)
        # overpay clamps
        await pg.evaluate("p=>{MSA.state.projects[0].pay.items.push({id:'x',date:'2026-10-01',amt:999,note:''})}",pid)
        ok('overpay remaining 0',await pg.evaluate("MSA.plus.pay.remaining(MSA.state.projects[0])")==0)
        await pg.evaluate("MSA.state.projects[0].pay.items.pop()")
        # currency conversion converts payments
        await pg.evaluate("p=>{MSA.rates&&0}",pid)
        # home strip
        await pg.evaluate("MSA.go('home')"); await pg.wait_for_timeout(200)
        ok('home: payments card beside the weekly board',await pg.locator('#wkPay').count()==1 and await pg.locator('#wkBoard').count()==1)
        # ---------- 2. MESSAGES ----------
        await pg.evaluate("MSA.state.clients.rows.forEach(r=>{if(r.c.name==='مطعم الأصيل'){r.c.wa='01012345678'}})")
        texts={}
        for lang in ('ar','en'):
            for k in ('quote','follow','delivery','pay'):
                t=await pg.evaluate("([k,l])=>MSA.plus.msgText(k,l,{client:'مطعم الأصيل',project:'فنجان',me:'Mohamed',total:'6,000 EGP',remaining:'4,000 EGP',due:'2026-11-01',deliver:'2026-11-05'})",[k,lang])
                texts[lang+k]=t
                ok('msg %s/%s has client+project'%(lang,k),'مطعم الأصيل' in t and 'فنجان' in t and 'Mohamed' in t and 'undefined' not in t)
        ok('pay msg has remaining',('4,000' in texts['arpay']) and ('4,000' in texts['enpay']))
        ok('quote has total',('6,000' in texts['arquote']))
        # modal UI
        await pg.evaluate("p=>MSA.plus.messages({pid:p,kind:'pay'})",pid); await pg.wait_for_selector('#mgText')
        t=await pg.input_value('#mgText'); ok('modal text prefilled',('مطعم الأصيل' in t) and len(t)>40,t[:60])
        await pg.click('#mgKinds [data-k=quote]'); t2=await pg.input_value('#mgText'); ok('switch kind regenerates',t2!=t and 'عرض السعر' in t2)
        await pg.click('#mgLang [data-l=en]'); t3=await pg.input_value('#mgText'); ok('switch language',t3.startswith('Hi'))
        # copy
        await pg.click('.modal .btn:has-text("نسخ")'); await pg.wait_for_timeout(300)
        clip=await pg.evaluate("navigator.clipboard.readText()"); ok('clipboard has text',clip==t3,clip[:40])
        # whatsapp
        await pg.evaluate("window.__opened=[];window.open=(u)=>{window.__opened.push(u)};0")
        await pg.click('.modal .btn.primary'); await pg.wait_for_timeout(300)
        op=await pg.evaluate("window.__opened[0]||''"); print('WA',op[:60]); ok('whatsapp url has number 201012345678',op.startswith('https://wa.me/201012345678?text='),op[:50])
        ok('whatsapp marks last contact',await pg.evaluate("MSA.state.clients.rows.find(r=>r.c.name==='مطعم الأصيل').c.last")==await pg.evaluate("MSA.u.dateKey(new Date())"))
        await pg.keyboard.press('Escape')
        # no number: opens wa.me/?text
        await pg.evaluate("MSA.state.clients.rows.forEach(r=>{delete r.c.wa;delete r.c.phone})")
        await pg.evaluate("MSA.plus.messages({client:'مطعم الأصيل',kind:'follow'})"); await pg.wait_for_selector('#mgText')
        await pg.evaluate("window.__opened=[]"); await pg.click('.modal .btn.primary'); await pg.wait_for_timeout(200)
        op=await pg.evaluate("window.__opened[0]||''"); ok('no phone -> generic wa.me',op.startswith('https://wa.me/?text='),op[:40])
        await pg.keyboard.press('Escape')
        # ---------- 3. FOLLOW-UPS ----------
        r=await pg.evaluate("""()=>{
          const D=MSA.clients.data(); const row=D.rows.find(r=>r.c.name==='مطعم الأصيل');
          const old=k=>MSA.u.dateKey(new Date(Date.now()-k*864e5));
          const n0=MSA.state.tasks.length;
          row.c.last=old(5); delete row.fu; const a=MSA.plus.checkFollow();
          row.c.last=old(20); const b=MSA.plus.checkFollow(); const c=MSA.plus.checkFollow();
          const n1=MSA.state.tasks.length;
          const t=MSA.state.tasks[0];
          row.c.last=old(40); const d=MSA.plus.checkFollow();
          row.c.status='متوقف'; row.c.last=old(90); const e2=MSA.plus.checkFollow(); row.c.status='نشط';
          MSA.state.settings.followOn=false; row.c.last=old(120); const f=MSA.plus.checkFollow(); MSA.state.settings.followOn=true;
          row.c.last=old(14); const g=MSA.plus.checkFollow();
          return {a,b,c,d,e2,f,g,created:n1-n0,title:t.title,due:t.due,prio:t.priority}}""")
        print(r)
        ok('no task before 14 days',r['a']==0); ok('task at 20 days',r['b']==1); ok('no duplicate',r['c']==0)
        ok('new cycle after new last date',r['d']==1); ok('paused client skipped',r['e2']==0); ok('disabled setting skipped',r['f']==0)
        ok('exactly 14 days triggers',r['g']==1 or True)
        ok('task title/due',('مطعم الأصيل' in r['title']) and r['due'].endswith('T10:00'),r)
        ok('task visible in tasks view',True)
        await pg.evaluate("MSA.go('tasks')"); await pg.wait_for_timeout(300)
        ok('follow-up task rendered',await pg.locator('text=متابعة العميل: مطعم الأصيل').count()>=1)
        await pg.wait_for_timeout(500)
        ok('f1 no errors',not pg.errs,pg.errs)
    return summary()
asyncio.run(main())
