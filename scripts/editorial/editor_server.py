"""Private browser editor for the Turso article library. No third-party dependencies."""
import argparse
from collections import defaultdict,deque
import hmac
from http import cookies
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
import json
import os
import re
from pathlib import Path
import secrets
import sys
import threading
import time
from urllib.parse import urlsplit
from articles import Remote,FIELDS,update_article

HTML=Path(__file__).with_name('editor.html')
MAX_BODY=2*1024*1024
STATUSES={'draft','review','published','archived'}

def serialize(row,names):return dict(zip(names,row))

def validate_changes(value):
    if not isinstance(value,dict) or set(value)-set(FIELDS) or not value:raise ValueError('Invalid editable fields')
    for key,text in value.items():
        if not isinstance(text,str) or len(text)>500000:raise ValueError('Invalid field type or length')
    for key in ('title','body_text'):
        if key in value and not value[key].strip():raise ValueError('Title and text cannot be empty')
    if len(value.get('title',''))>500:raise ValueError('Title too long')
    if 'status' in value and value['status'] not in STATUSES:raise ValueError('Invalid status')
    for key in ('tags_json','review_flags_json'):
        if key in value:
            tags=json.loads(value[key])
            if not isinstance(tags,list) or any(not isinstance(t,str) or len(t)>200 for t in tags) or len(tags)>100:raise ValueError('Invalid tag list')
    return value

class Library:
    def __init__(self,factory=Remote):self.factory=factory
    def run(self,callback):
        db=self.factory()
        try:return callback(db)
        finally:db.close()
    def catalog(self):
        fields='id source_position title summary status revision updated_at'.split()
        return self.run(lambda db:[serialize(row,fields) for row in db.execute('SELECT '+','.join(fields)+' FROM editorial__article_catalog ORDER BY source_id,source_position')])
    def article(self,identity):
        def read(db):
            fields=['id']+FIELDS+['page_start','page_end','updated_at','revision']
            rows=db.execute('SELECT a.id,'+','.join('a.'+k for k in FIELDS)+',a.page_start,a.page_end,a.updated_at,(SELECT max(revision_no) FROM editorial__article_revisions r WHERE r.article_id=a.id) FROM editorial__articles a WHERE a.id=?',[identity])
            return serialize(rows[0],fields) if rows else None
        return self.run(read)
    def history(self,identity,revision=None):
        def read(db):
            if revision is None:
                fields=['revision_no','title','status','change_note','saved_at']
                return [serialize(row,fields) for row in db.execute('SELECT '+','.join(fields)+' FROM editorial__article_revisions WHERE article_id=? ORDER BY revision_no DESC',[identity])]
            fields=['revision_no']+FIELDS+['saved_at']
            rows=db.execute('SELECT '+','.join(fields)+' FROM editorial__article_revisions WHERE article_id=? AND revision_no=?',[identity,revision])
            return serialize(rows[0],fields) if rows else None
        return self.run(read)
    def save(self,identity,expected,changes):
        validate_changes(changes)
        return self.run(lambda db:update_article(db,identity,expected,changes))

class EditorServer(ThreadingHTTPServer):
    daemon_threads=True
    def __init__(self,address,library,password):
        self.library=library
        self.password=password
        self.sessions={}
        self.failures=defaultdict(deque)
        self.lock=threading.Lock()
        super().__init__(address,Handler)
        name=os.environ.get("CODESPACE_NAME","")
        domain=os.environ.get("GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN","")
        self.forwarded_origin=("https://"+name+"-"+str(self.server_port)+"."+domain) if re.fullmatch(r"[a-z0-9-]+",name) and re.fullmatch(r"[a-zA-Z0-9.-]+",domain) else None

class Handler(BaseHTTPRequestHandler):
    server_version='ArticleEditor/1.0'
    def log_message(self,*args):pass # Never log article paths, bodies, access codes or cookies.
    def send(self,status,value,extra=(),html=False):
        body=value.encode() if html else json.dumps(value,ensure_ascii=False).encode()
        self.send_response(status)
        for k,v in [('Content-Type','text/html; charset=utf-8' if html else 'application/json; charset=utf-8'),
                    ('Content-Length',str(len(body))),('Cache-Control','no-store'),('X-Content-Type-Options','nosniff'),
                    ('Referrer-Policy','no-referrer'),('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")]+list(extra):
            self.send_header(k,v)
        self.end_headers()
        self.wfile.write(body)
    def input(self):
        if self.headers.get('Content-Type','').split(';')[0]!='application/json':raise ValueError('JSON required')
        size=int(self.headers.get('Content-Length','0'))
        if not 0<size<=MAX_BODY:raise ValueError('Invalid request size')
        data=json.loads(self.rfile.read(size))
        if not isinstance(data,dict):raise ValueError('JSON object required')
        return data
    def session(self):
        jar=cookies.SimpleCookie()
        try:jar.load(self.headers.get('Cookie',''))
        except cookies.CookieError:return None
        token=jar.get('atlas_editor')
        if not token:return None
        with self.server.lock:
            now=time.time()
            self.server.sessions={k:v for k,v in self.server.sessions.items() if v['expires']>now}
            return self.server.sessions.get(token.value)
    def origin_ok(self):
        origin=self.headers.get('Origin','')
        parsed=urlsplit(origin)
        return parsed.scheme in ('http','https') and (parsed.netloc==self.headers.get('Host','') or origin==self.server.forwarded_origin)
    def do_GET(self):
        path=urlsplit(self.path).path
        if path=='/':return self.send(200,HTML.read_text(),html=True)
        if path=='/editor.js':
            body=HTML.with_name('editor.js').read_bytes()
            self.send_response(200)
            self.send_header('Content-Type','text/javascript; charset=utf-8')
            self.send_header('Content-Length',str(len(body)))
            self.send_header('Cache-Control','no-store')
            self.send_header('X-Content-Type-Options','nosniff')
            self.end_headers();self.wfile.write(body);return
        session=self.session()
        if not session:return self.send(401,{'error':'Kirjaudu editoriin.'})
        try:
            if path=='/api/session':return self.send(200,{'csrf':session['csrf']})
            if path=='/api/articles':return self.send(200,{'articles':self.server.library.catalog()})
            parts=path.strip('/').split('/')
            if len(parts)>=3 and parts[:2]==['api','articles']:
                identity=parts[2]
                if len(parts)==3:record=self.server.library.article(identity)
                elif len(parts)==4 and parts[3]=='history':record=self.server.library.history(identity)
                elif len(parts)==5 and parts[3]=='history':record=self.server.library.history(identity,int(parts[4]))
                else:return self.send(404,{'error':'Tuntematon osoite.'})
                return self.send(200,record) if record is not None else self.send(404,{'error':'Artikkelia tai versiota ei löydy.'})
            return self.send(404,{'error':'Tuntematon osoite.'})
        except (ValueError,TypeError):return self.send(400,{'error':'Virheellinen pyyntö.'})
        except Exception:return self.send(503,{'error':'Tietokantayhteys epäonnistui. Tarkista palvelimen Turso-asetus.'})
    def do_POST(self):
        path=urlsplit(self.path).path
        if not self.origin_ok():return self.send(403,{'error':'Pyyntö ei tullut editorin omasta osoitteesta.'})
        try:data=self.input()
        except (ValueError,TypeError,json.JSONDecodeError):return self.send(400,{'error':'Virheellinen pyyntö tai liian suuri teksti.'})
        if path=='/api/login':
            client=self.client_address[0]
            with self.server.lock:
                attempts=self.server.failures[client]
                while attempts and attempts[0]<time.time()-60:attempts.popleft()
                if len(attempts)>=10:return self.send(429,{'error':'Liian monta yritystä. Odota minuutti.'})
                supplied=data.get('password','')
                if not isinstance(supplied,str) or not hmac.compare_digest(supplied.encode(),self.server.password.encode()):
                    attempts.append(time.time())
                    return self.send(401,{'error':'Virheellinen pääsykoodi.'})
                token=secrets.token_urlsafe(32);csrf=secrets.token_urlsafe(32)
                self.server.sessions[token]={'csrf':csrf,'expires':time.time()+8*3600}
            secure='; Secure' if urlsplit(self.headers.get('Origin','')).scheme=='https' else ''
            return self.send(200,{'csrf':csrf},[('Set-Cookie','atlas_editor='+token+'; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800'+secure)])
        session=self.session()
        if not session:return self.send(401,{'error':'Istunto päättyi. Kirjaudu uudelleen; säilytä muokattu teksti.'})
        if not hmac.compare_digest(self.headers.get('X-Editor-CSRF',''),session['csrf']):return self.send(403,{'error':'Istunnon tarkistus epäonnistui.'})
        if path=='/api/logout':
            jar=cookies.SimpleCookie();jar.load(self.headers.get('Cookie',''))
            with self.server.lock:self.server.sessions.pop(jar['atlas_editor'].value,None)
            return self.send(200,{'ok':True},[('Set-Cookie','atlas_editor=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0')])
        parts=path.strip('/').split('/')
        if len(parts)!=3 or parts[:2]!=['api','articles']:return self.send(404,{'error':'Tuntematon osoite.'})
        expected=data.get('expected_revision');changes=data.get('changes')
        if type(expected) is not int or expected<1:return self.send(400,{'error':'Versionumero puuttuu.'})
        try:validate_changes(changes)
        except (ValueError,TypeError,json.JSONDecodeError):return self.send(400,{'error':'Tarkista otsikko, teksti, tila ja tunnisteet.'})
        try:
            revision=self.server.library.save(parts[2],expected,changes)
            return self.send(200,{'revision':revision})
        except ValueError as error:
            if str(error).startswith('Revision conflict'):return self.send(409,{'error':'Artikkeli muuttui muualla. Muutoksiasi ei korvattu. Lataa tarvittaessa oma tekstisi tiedostoksi ja avaa uusin versio.'})
            return self.send(400,{'error':'Muutosta ei hyväksytty. Muokattu teksti säilyy editorissa.'})
        except Exception:return self.send(503,{'error':'Tallennusta ei voitu vahvistaa. Säilytä tekstisi ja tarkista uusin versio ennen uutta yritystä.'})

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--host',default='127.0.0.1');parser.add_argument('--port',type=int,default=8765)
    parser.add_argument('--check',action='store_true',help='Verify private database reads without starting a server')
    args=parser.parse_args()
    if not os.environ.get('TURSO_AUTH_TOKEN'):parser.error('Set TURSO_AUTH_TOKEN in the server environment. Do not put it in source code.')
    if args.check:
        library=Library();rows=library.catalog()
        if not rows:raise ValueError('No articles found')
        record=library.article(rows[0]['id']);history=library.history(rows[0]['id'])
        if not record or not history or record['revision']!=history[0]['revision_no']:raise ValueError('History inconsistent')
        print('PASS: Editor database access verified:',len(rows),'articles.')
        return
    password=os.environ.get('EDITOR_PASSWORD') or secrets.token_urlsafe(18)
    if len(password)<16:parser.error('EDITOR_PASSWORD must have at least 16 characters')
    server=EditorServer((args.host,args.port),Library(),password)
    print('Artikkelieditori: http://'+args.host+':'+str(server.server_port),flush=True)
    print('Pääsykoodi: '+password,flush=True)
    print('Pidä Codespaces-portin näkyvyys Private. Turso-avain on vain palvelimella.',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()

if __name__=='__main__':
    try:main()
    except Exception as error:
        print('Editor operation failed ('+type(error).__name__+'); no credentials or texts logged.',file=sys.stderr)
        sys.exit(1)
