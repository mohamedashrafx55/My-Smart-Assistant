"""Minimal in-memory imitation of the Supabase endpoints sync.js uses (auth, PostgREST tables, storage). For tests only."""
import json, re, sys, threading, uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs
UID='11111111-1111-1111-1111-111111111111'
DB={'state':{},'files':{},'objs':{},'refresh':{},'log':[]}
LOCK=threading.Lock()
class H(BaseHTTPRequestHandler):
    def log_message(self,*a): pass
    def cors(self):
        self.send_header('Access-Control-Allow-Origin','*'); self.send_header('Access-Control-Allow-Headers','*'); self.send_header('Access-Control-Allow-Methods','*')
    def out(self,code,obj=None,raw=None,ctype='application/json'):
        b=raw if raw is not None else json.dumps(obj).encode()
        self.send_response(code); self.cors(); self.send_header('Content-Type',ctype); self.send_header('Content-Length',str(len(b))); self.end_headers(); self.wfile.write(b)
    def body(self):
        n=int(self.headers.get('Content-Length') or 0); return self.rfile.read(n) if n else b''
    def authed(self):
        a=self.headers.get('Authorization','')
        return a=='Bearer tok-'+UID and not DB.get('revoked')
    def do_OPTIONS(self): self.send_response(204); self.cors(); self.send_header('Content-Length','0'); self.end_headers()
    def handle_any(self,m):
        u=urlparse(self.path); q=parse_qs(u.query); p=u.path; b=self.body()
        with LOCK:
            DB['log'].append((m,p))
            if p=='/__db': return self.out(200,{k:(list(v.keys()) if isinstance(v,dict) else v) for k,v in DB.items()})
            if p=='/__revoke': DB['revoked']=True; DB['refresh'].clear(); return self.out(200,{})
            if p=='/__reset':
                DB['revoked']=False
                for k in ('state','files','objs','refresh'): DB[k].clear()
                DB['log'].clear(); return self.out(200,{})
            if p=='/auth/v1/token':
                j=json.loads(b or b'{}'); g=q.get('grant_type',[''])[0]
                if g=='password':
                    if j.get('email')=='me@x.com' and j.get('password')=='pw123456':
                        r='rt-'+uuid.uuid4().hex; DB['refresh'][r]=1
                        return self.out(200,{'access_token':'tok-'+UID,'expires_in':3600,'refresh_token':r,'user':{'id':UID}})
                    return self.out(400,{'error_description':'Invalid login credentials'})
                if g=='refresh_token':
                    if j.get('refresh_token') in DB['refresh']:
                        r='rt-'+uuid.uuid4().hex; DB['refresh'][r]=1
                        return self.out(200,{'access_token':'tok-'+UID,'expires_in':3600,'refresh_token':r,'user':{'id':UID}})
                    return self.out(400,{'error_description':'Invalid Refresh Token'})
            if not self.authed(): return self.out(401,{'message':'JWT'})
            if p=='/rest/v1/msa_state':
                if m=='GET':
                    r=DB['state'].get(UID); return self.out(200,[r] if r else [])
                if m=='POST':
                    j=json.loads(b)
                    if UID in DB['state']: return self.out(409,{'message':'duplicate'})
                    DB['state'][UID]=j; return self.out(201,[j])
                if m=='PATCH':
                    j=json.loads(b); cur=DB['state'].get(UID); want=int(q.get('rev',['eq.0'])[0].split('.')[1])
                    if not cur or cur['rev']!=want: return self.out(200,[])
                    cur.update(j); return self.out(200,[cur])
            if p=='/rest/v1/msa_files':
                if m=='GET':
                    return self.out(200,[v for k,v in sorted(DB['files'].items())])
                if m=='POST':
                    j=json.loads(b); DB['files'][j['id']]=j; return self.out(201,[])
                if m=='DELETE':
                    i=q.get('id',['eq.'])[0].split('.',1)[1]; DB['files'].pop(i,None); return self.out(204,raw=b'')
            mo=re.match(r'^/storage/v1/object/(?:authenticated/)?msa-files/(.+)$',p)
            if mo and m=='POST': DB['objs'][mo.group(1)]=(b,self.headers.get('Content-Type')); return self.out(200,{'Key':mo.group(1)})
            if mo and m=='GET':
                o=DB['objs'].get(mo.group(1))
                return self.out(200,raw=o[0],ctype=o[1] or 'application/octet-stream') if o else self.out(404,{'message':'not found'})
            if p=='/storage/v1/object/msa-files' and m=='DELETE':
                for x in json.loads(b)['prefixes']: DB['objs'].pop(x,None)
                return self.out(200,[])
            return self.out(404,{'message':'unhandled '+m+' '+p})
    def do_GET(self): self.handle_any('GET')
    def do_POST(self): self.handle_any('POST')
    def do_PATCH(self): self.handle_any('PATCH')
    def do_DELETE(self): self.handle_any('DELETE')
if __name__=='__main__': ThreadingHTTPServer(('127.0.0.1',int(sys.argv[1]) if len(sys.argv)>1 else 8790),H).serve_forever()
