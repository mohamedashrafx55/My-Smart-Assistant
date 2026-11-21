import re,sys
R='../../../js/'
need={'apps.js':1,'biz.js':2,'cell.js':2,'connectors.js':1,'map.js':1,'pricing.js':1,'pro.js':1,'settings.js':1,'studio.js':6,'suggest.js':1,'tasks.js':2,'board.js':1,'select.js':1}
fails=0
for f,n in need.items():
    c=len(re.findall(r'confirmDel',open(R+f,encoding='utf8').read()))
    good=c>=n
    print(('PASS' if good else 'FAIL'),'delete confirmation present in',f,c); fails+=0 if good else 1
# every plain removal handler is awaited behind a confirm: no leftover un-confirmed known patterns
bad=[]
pats=[("js/pricing.js","d.lines.splice(+x.dataset.x, 1); draw(); return; }"),("js/settings.js","S.accounts = S.accounts.filter(x => x.id !== acc.id); persist(); draw(); }")]
for f,p in pats:
    s=open('../../../'+f,encoding='utf8').read()
    i=s.index(p); pre=s[max(0,i-140):i]
    if 'confirmDel' not in pre: bad.append(f)
print(('PASS' if not bad else 'FAIL'),'removal statements sit behind a confirm',bad); fails+=1 if bad else 0
print('delconfirm: %d failed, rest passed'%fails); sys.exit(1 if fails else 0)
