import http.client
import json
import sqlite3
import threading
import unittest
from articles import import_bundle
from test_articles import Local,fixture
from editor_server import EditorServer,Library

class Database(Local):
    def __init__(self):self.db=sqlite3.connect(':memory:',isolation_level=None,check_same_thread=False)
    def close(self):pass

class EditorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db=Database();import_bundle(cls.db,fixture())
        cls.server=EditorServer(('127.0.0.1',0),Library(lambda:cls.db),'test-private-password-123')
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True);cls.thread.start()
        cls.host='127.0.0.1:'+str(cls.server.server_port)
    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown();cls.server.server_close();cls.thread.join();cls.db.db.close()
    def request(self,path,data=None,cookie=None,csrf=None,origin=None):
        connection=http.client.HTTPConnection(self.host)
        headers={'Origin':origin or 'http://'+self.host}
        if cookie:headers['Cookie']=cookie
        if csrf:headers['X-Editor-CSRF']=csrf
        if data is not None:headers['Content-Type']='application/json'
        connection.request('GET' if data is None else 'POST',path,body=None if data is None else json.dumps(data),headers=headers)
        response=connection.getresponse();raw=response.read();status=response.status;head=dict(response.getheaders());connection.close()
        return status,json.loads(raw) if head.get('Content-Type','').startswith('application/json') else raw.decode(),head
    def login(self):
        status,data,headers=self.request('/api/login',{'password':'test-private-password-123'})
        self.assertEqual(status,200);self.assertIn('HttpOnly',headers['Set-Cookie'])
        return headers['Set-Cookie'].split(';')[0],data['csrf']
    def test_private_api_requires_login_and_rejects_foreign_origins(self):
        self.assertEqual(self.request('/api/articles')[0],401)
        self.assertEqual(self.request('/api/login',{'password':'test-private-password-123'},origin='https://evil.example')[0],403)
        self.assertEqual(self.request('/api/login',{'password':'wrong'})[0],401)
        status,html,headers=self.request('/')
        self.assertEqual(status,200);self.assertNotIn('Original paragraph.',html);self.assertEqual(headers['Cache-Control'],'no-store')
    def test_known_codespaces_https_origin_works_with_a_rewritten_host(self):
        previous=self.server.forwarded_origin
        self.server.forwarded_origin='https://test-space-8765.app.github.dev'
        try:
            status,_,headers=self.request('/api/login',{'password':'test-private-password-123'},origin=self.server.forwarded_origin)
            self.assertEqual(status,200)
            self.assertIn('; Secure',headers['Set-Cookie'])
        finally:self.server.forwarded_origin=previous
    def test_load_edit_history_and_conflict_do_not_overwrite_newer_text(self):
        cookie,csrf=self.login()
        status,catalog,_=self.request('/api/articles',cookie=cookie)
        self.assertEqual(status,200);self.assertEqual(len(catalog['articles']),2)
        current=self.request('/api/articles/one',cookie=cookie)[1]
        revision=current['revision']
        payload={'expected_revision':revision,'changes':{'body_text':'Edited safely','change_note':'Test update'}}
        self.assertEqual(self.request('/api/articles/one',payload,cookie=cookie)[0],403)
        self.assertEqual(self.request('/api/articles/one',payload,cookie=cookie,csrf=csrf)[1]['revision'],revision+1)
        self.assertEqual(self.request('/api/articles/one',payload,cookie=cookie,csrf=csrf)[0],409)
        self.assertEqual(self.request('/api/articles/one',cookie=cookie)[1]['body_text'],'Edited safely')
        history=self.request('/api/articles/one/history',cookie=cookie)[1]
        self.assertEqual(history[0]['revision_no'],revision+1)
        original=self.request('/api/articles/one/history/1',cookie=cookie)[1]
        self.assertEqual(original['body_text'],'Original paragraph.')
        self.assertEqual(self.request('/api/articles/one',{'expected_revision':revision+1,'changes':{'source_id':'bad'}},cookie=cookie,csrf=csrf)[0],400)
        self.assertEqual(self.request('/api/logout',{},cookie=cookie,csrf=csrf)[0],200)
        self.assertEqual(self.request('/api/articles',cookie=cookie)[0],401)

class LegacyCatalogTests(unittest.TestCase):
    def test_catalog_before_numbering_migration_remains_readable(self):
        db=Database()
        try:
            import_bundle(db,fixture());db.execute('DROP VIEW editorial__article_catalog')
            db.execute('CREATE VIEW editorial__article_catalog AS SELECT id,source_id,source_position,title,summary,status,1 AS revision,updated_at FROM editorial__articles')
            rows=Library(lambda:db).catalog();self.assertEqual(len(rows),2);self.assertTrue(all(r['publication_number'] is None for r in rows))
        finally:db.db.close()

if __name__=='__main__':unittest.main()
