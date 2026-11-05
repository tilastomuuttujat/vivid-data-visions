"""Private article library: import, verify and optimistic updates. Standard library only."""
import argparse
import base64
import hashlib
import json
import os
import re
from pathlib import Path
import sqlite3
import sys
import zlib
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'migration'))
from turso_pilot import Turso,stmt,request,SOURCE
from turso_indicators import arg
from turso_images import decode

ROOT=Path(__file__).resolve().parent
FIELDS='title summary body_text tags_json status editorial_note review_flags_json change_note'.split()

def canonical(value):
    return json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':'))

def digest(text):
    return hashlib.sha256(text.encode()).hexdigest()

class Remote:
    def __init__(self): self.db=Turso()
    def execute(self,sql,params=()):
        return decode(self.db.execute([stmt(sql,[arg(v) for v in params])])[0])
    def many(self,commands):
        return [decode(result) for result in self.db.execute([stmt(sql,[arg(v) for v in params]) for sql,params in commands])]
    def close(self):
        if self.db.baton:self.db.execute([],close=True)

def schema_statements():
    current=''
    for line in (ROOT/'schema.sql').read_text().splitlines(True):
        current+=line
        if sqlite3.complete_statement(current):
            yield current.strip()
            current=''
    if current.strip():raise ValueError('Incomplete schema')

def create(db):
    db.many([(sql,[]) for sql in schema_statements()])

def body_for(bundle,article):
    pages=bundle['pages'][article['page_start']-1:article['page_end']]
    first=pages[0].lstrip().splitlines()
    # Title lines are verified from PDF geometry, never guessed from body prose.
    first='\n'.join(first[article['title_lines']:]).lstrip()
    return '\n\n'.join([first]+pages[1:]).strip()

def validate(bundle):
    if bundle.get('version')!=1:raise ValueError('Unknown bundle version')
    source=bundle['source']; pages=bundle['pages']; articles=bundle['articles']
    if len(pages)!=source['page_count'] or not articles:raise ValueError('Incomplete source')
    if len({a['id'] for a in articles})!=len(articles):raise ValueError('Duplicate identity')
    expected_page=1
    for position,a in enumerate(articles,1):
        if (a['position']!=position or a['page_start']!=expected_page or
            not a['page_start']<=a['page_end']<=len(pages) or not a['title'].strip() or
            type(a['title_lines']) is not int or not 1<=a['title_lines']<=4 or not body_for(bundle,a)):
            raise ValueError('Invalid article boundaries')
        heading=' '.join(pages[a['page_start']-1].lstrip().splitlines()[:a['title_lines']])
        heading=re.sub(r'^#{1,6}\s+','',heading)
        if re.sub(r'\s+',' ',heading).strip()!=(a['source_number']+' '+a['title']).strip():
            raise ValueError('Extracted heading does not match original page')
        expected_page=a['page_end']+1
    if expected_page!=len(pages)+1:raise ValueError('Unassigned source pages')

def initial_fields(bundle,a):
    note=('Imported from source PDF; text extraction, not fact-checking' if bundle['source']['filename'].lower().endswith('.pdf') else 'Imported from user-supplied text; preserved without editorial changes')
    return [a['title'],'',body_for(bundle,a),'[]','draft','',canonical(a['review_flags']),note]

def import_bundle(db,bundle):
    validate(bundle)
    print('Validated private bundle:',len(bundle['articles']),'articles,',len(bundle['pages']),'pages.',flush=True)
    create(db)
    source=bundle['source']; source_values=[source[k] for k in ['id','filename','sha256','page_count','library_file_id','collection_title']]
    db.execute('BEGIN IMMEDIATE')
    try:
        db.execute('INSERT INTO editorial__sources(id,filename,sha256,page_count,library_file_id,collection_title) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING',source_values)
        actual=db.execute('SELECT id,filename,sha256,page_count,library_file_id,collection_title FROM editorial__sources WHERE id=?',[source['id']])
        if actual!=[source_values]:raise ValueError('Source conflict')
        page_commands=[('INSERT INTO editorial__source_pages(source_id,page_no,raw_text,sha256) VALUES(?,?,?,?) ON CONFLICT(source_id,page_no) DO NOTHING',[source['id'],n,text,digest(text)]) for n,text in enumerate(bundle['pages'],1)]
        for start in range(0,len(page_commands),50):db.many(page_commands[start:start+50])
        commands=[]; expected_provenance=[]; expected_original=[]
        for a in bundle['articles']:
            provenance=[a['id'],source['id'],a['position'],a['source_number'],a['page_start'],a['page_end']]
            fields=initial_fields(bundle,a)
            commands.append(('INSERT INTO editorial__articles(id,source_id,source_position,source_number,page_start,page_end,'+','.join(FIELDS)+') VALUES('+','.join('?' for _ in range(14))+') ON CONFLICT(id) DO NOTHING',provenance+fields))
            expected_provenance.append(provenance)
            expected_original.append([a['id']]+fields)
        db.many(commands)
        print('Article rows stored; checking source pages and original versions.',flush=True)
        provenance=db.execute('SELECT id,source_id,source_position,source_number,page_start,page_end FROM editorial__articles WHERE source_id=? ORDER BY source_position',[source['id']])
        if provenance!=expected_provenance:raise ValueError('Article identity conflict')
        originals=db.execute('SELECT r.article_id,'+','.join('r.'+f for f in FIELDS)+' FROM editorial__article_revisions r JOIN editorial__articles a ON a.id=r.article_id WHERE a.source_id=? AND r.revision_no=1 ORDER BY a.source_position',[source['id']])
        if originals!=expected_original:raise ValueError('Original revision differs; nothing overwritten')
        actual_pages=db.execute('SELECT page_no,raw_text,sha256 FROM editorial__source_pages WHERE source_id=? ORDER BY page_no',[source['id']])
        if actual_pages!=[[n,text,digest(text)] for n,text in enumerate(bundle['pages'],1)]:raise ValueError('Page readback differs')
        count=db.execute('SELECT count(*) FROM editorial__articles WHERE source_id=?',[source['id']])[0][0]
        if count!=len(bundle['articles']):raise ValueError('Article count differs')
        verify(db,source['id'])
        db.execute('COMMIT')
    except Exception:
        db.execute('ROLLBACK')
        raise
    return verify(db,source['id'])

def verify(db,source_id):
    rows=db.execute('SELECT id,'+','.join(FIELDS)+' FROM editorial__articles WHERE source_id=? ORDER BY source_position',[source_id])
    if not rows:raise ValueError('No imported articles')
    histories=db.execute('SELECT r.article_id,r.revision_no,'+','.join('r.'+f for f in FIELDS)+' FROM editorial__article_revisions r JOIN editorial__articles a ON a.id=r.article_id WHERE a.source_id=? ORDER BY a.source_position,r.revision_no',[source_id])
    by_id={row[0]:[] for row in rows}
    for entry in histories:by_id[entry[0]].append(entry[1:])
    revisions=len(histories)
    for row in rows:
        history=by_id[row[0]]
        if not history or [r[0] for r in history]!=list(range(1,len(history)+1)) or history[-1][1:]!=row[1:]:raise ValueError('Revision history inconsistent')
    pages=db.execute('SELECT count(*) FROM editorial__source_pages WHERE source_id=?',[source_id])[0][0]
    declared=db.execute('SELECT page_count FROM editorial__sources WHERE id=?',[source_id])[0][0]
    if pages!=declared:raise ValueError('Source pages incomplete')
    return {'articles':len(rows),'revisions':revisions,'pages':pages}

def update_article(db,article_id,expected_revision,changes):
    if not changes or any(k not in FIELDS for k in changes):raise ValueError('Invalid editable fields')
    db.execute('PRAGMA foreign_keys=ON')
    db.execute('BEGIN IMMEDIATE')
    try:
        old=db.execute('SELECT '+','.join(FIELDS)+' FROM editorial__articles WHERE id=?',[article_id])
        revision=db.execute('SELECT max(revision_no) FROM editorial__article_revisions WHERE article_id=?',[article_id])[0][0]
        if not old or revision!=expected_revision:raise ValueError('Revision conflict; reload before updating')
        columns=list(changes)
        db.execute('UPDATE editorial__articles SET '+','.join(k+'=?' for k in columns)+' WHERE id=?',[changes[k] for k in columns]+[article_id])
        expected=old[0].copy()
        for k,v in changes.items():expected[FIELDS.index(k)]=v
        actual=db.execute('SELECT '+','.join(FIELDS)+' FROM editorial__articles WHERE id=?',[article_id])
        if actual!=[expected]:raise ValueError('Update readback differs')
        new_revision=db.execute('SELECT max(revision_no) FROM editorial__article_revisions WHERE article_id=?',[article_id])[0][0]
        if new_revision!=revision+(expected!=old[0]):raise ValueError('Revision not saved')
        db.execute('COMMIT')
        return new_revision
    except Exception:
        db.execute('ROLLBACK')
        raise

def update_from_bundle(db,bundle):
    validate(bundle)
    if len(bundle['articles'])!=1 or type(bundle.get('expected_revision')) is not int or bundle['expected_revision']<1:
        raise ValueError('A text update requires one article and an expected revision')
    identity=bundle.get('target_article_id')
    if not isinstance(identity,str) or not identity:raise ValueError('Missing permanent article identity')
    article=bundle['articles'][0];source=bundle['source']
    current=db.execute('SELECT title,body_text,change_note FROM editorial__articles WHERE id=?',[identity])
    if not current or current[0][0]!=article['title']:raise ValueError('Existing article title does not match the update')
    note='Uudistettu käyttäjän toimittamasta tekstistä; lähde: '+source['library_file_id']+'; SHA-256: '+source['sha256']
    changes={'title':article['title'],'body_text':body_for(bundle,article),'change_note':note}
    wanted=[changes['title'],changes['body_text'],note]
    if current[0]==wanted:
        revision=db.execute('SELECT max(revision_no) FROM editorial__article_revisions WHERE article_id=?',[identity])[0][0]
    else:
        revision=update_article(db,identity,bundle['expected_revision'],changes)
    if db.execute('SELECT title,body_text,change_note FROM editorial__articles WHERE id=?',[identity])!=[wanted]:raise ValueError('Updated text readback differs')
    return {'articles_updated':1,'revision':revision}

def staged_bundle(manifest):
    key=os.environ['SUPABASE_READ_KEY']
    chunks,_=request(SOURCE+'/rest/v1/rpc/codex_editorial_handoff_v1',
       {'apikey':key,'Authorization':'Bearer '+key,'Content-Type':'application/json'},
       {'requested_batch':manifest['batch_id']})
    if [c['part'] for c in chunks]!=list(range(manifest['chunks'])):raise ValueError('Transfer parts incomplete')
    encoded=''.join(c['content'] for c in chunks)
    raw=zlib.decompress(base64.b64decode(encoded,validate=True))
    if hashlib.sha256(raw).hexdigest()!=manifest['bundle_sha256']:raise ValueError('Transfer digest differs')
    bundle=json.loads(raw)
    if (len(bundle['articles'])!=manifest['articles'] or len(bundle['pages'])!=manifest['pages'] or
        bundle['source']['id']!=manifest['batch_id']):raise ValueError('Transfer inventory differs')
    return bundle

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    sub=parser.add_subparsers(dest='operation',required=True)
    p=sub.add_parser('import-staged');p.add_argument('--manifest',type=Path)
    p=sub.add_parser('import-json');p.add_argument('file',type=Path)
    p=sub.add_parser('verify');p.add_argument('--source-id')
    p=sub.add_parser('update');p.add_argument('--id',required=True);p.add_argument('--expected-revision',required=True,type=int);p.add_argument('--body-file',type=Path);p.add_argument('--title');p.add_argument('--status',choices=['draft','review','published','archived']);p.add_argument('--note',default='')
    args=parser.parse_args();manifest=json.loads((getattr(args,'manifest',None) or ROOT/'bootstrap.json').read_text())
    db=Remote()
    try:
        if args.operation.startswith('import'):
            bundle=staged_bundle(manifest) if args.operation=='import-staged' else json.loads(args.file.read_text())
            result=update_from_bundle(db,bundle) if bundle.get('operation')=='update' else import_bundle(db,bundle)
        elif args.operation=='verify':result=verify(db,args.source_id or manifest['batch_id'])
        else:
            changes={}
            if args.body_file:changes['body_text']=args.body_file.read_text()
            if args.title is not None:changes['title']=args.title
            if args.status is not None:changes['status']=args.status
            if args.note:changes['change_note']=args.note
            result={'revision':update_article(db,args.id,args.expected_revision,changes)}
        print('PASS: Editorial library verified:',canonical(result))
    finally:db.close()

if __name__=='__main__':
    try:main()
    except Exception as error:
        print('Editorial operation failed ('+type(error).__name__+'); no article text or credentials logged.',file=sys.stderr)
        sys.exit(1)
