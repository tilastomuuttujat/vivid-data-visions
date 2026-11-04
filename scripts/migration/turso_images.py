"""Verified, restartable original-image archive. Never writes to Supabase."""
import argparse
import base64
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from turso_pilot import SOURCE,Turso,stmt
from turso_indicators import arg,canonical,source_request

BUCKET="atlas-images"
EXPECTED_FILES=288
EXPECTED_BYTES=70468014
MAX_FILE_BYTES=1024*1024
TABLE="storage__atlas_images_v1"
LINKS="storage__atlas_image_links_v1"
MISSING={"M18_kriisien_piirteet.webp","M17_onnistumisten_piirteet.webp",
         "G08_oikeudenmukaisuus.webp","G09_sukupolvi_kantaa.webp","G07_tulevien_oikeudet.webp"}

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs):
        raise ValueError("Unexpected source redirect")

def source_http(path,body=None,max_bytes=2*1024*1024):
    if not path.startswith("/storage/v1/"):
        raise ValueError("Invalid source path")
    key=os.environ["SUPABASE_READ_KEY"]
    req=urllib.request.Request(SOURCE+path,
        data=None if body is None else json.dumps(body).encode(),
        headers={"apikey":key,"Authorization":"Bearer "+key,"Content-Type":"application/json"})
    opener=urllib.request.build_opener(NoRedirect)
    for attempt in range(3):
        try:
            with opener.open(req,timeout=60) as response:
                data=response.read(max_bytes+1)
                content_type=response.headers.get("Content-Type","").split(";")[0].lower()
            if len(data)>max_bytes:
                raise ValueError("Source response exceeds transfer limit")
            return data,content_type
        except urllib.error.HTTPError as error:
            if error.code in (429,500,502,503,504) and attempt<2:
                time.sleep(2**attempt)
                continue
            raise ValueError("Source storage HTTP "+str(error.code)) from None

def inventory():
    files=[]
    offset=0
    while True:
        data,_=source_http("/storage/v1/object/list/"+BUCKET,
            {"prefix":"","limit":100,"offset":offset,"sortBy":{"column":"name","order":"asc"}})
        page=json.loads(data)
        if not isinstance(page,list) or len(page)>100:
            raise ValueError("Invalid storage listing")
        for item in page:
            name=item.get("name")
            metadata=item.get("metadata") or {}
            size=metadata.get("size")
            if (not item.get("id") or not isinstance(name,str) or not name or
                    "/" in name or name in (".","..")):
                raise ValueError("Unexpected folder or object path; re-inventory required")
            if type(size) is not int or not 0<size<=MAX_FILE_BYTES or metadata.get("mimetype")!="image/webp":
                raise ValueError("Unexpected image metadata")
            files.append({"name":name,"object_id":item["id"],"size":size,
                          "mime_type":metadata["mimetype"],"updated_at":item.get("updated_at"),
                          "etag":metadata.get("eTag") or metadata.get("etag")})
        offset+=len(page)
        if len(page)<100:
            break
        if offset>EXPECTED_FILES:
            raise ValueError("Storage listing did not finish")
    if (len(files)!=EXPECTED_FILES or len({f["name"] for f in files})!=len(files) or
            sum(f["size"] for f in files)!=EXPECTED_BYTES):
        raise ValueError("Source file count, keys or bytes changed")
    return sorted(files,key=lambda f:f["name"])

def references(files):
    rows=source_request("infographics",{"select":"id,storage_path","order":"id","limit":500})
    if len(rows)!=288 or len({r["id"] for r in rows})!=len(rows):
        raise ValueError("Infographic reference count changed")
    names={f["name"] for f in files}
    missing={r["storage_path"] for r in rows if r["storage_path"] not in names}
    if missing!=MISSING or sum(r["storage_path"] not in names for r in rows)!=5:
        raise ValueError("Source image-reference gaps changed; review required")
    return rows

def download(file):
    name=urllib.parse.quote(file["name"],safe="")
    data,mime=source_http("/storage/v1/object/authenticated/"+BUCKET+"/"+name,max_bytes=file["size"])
    if len(data)!=file["size"] or mime!=file["mime_type"]:
        raise ValueError("Downloaded image size or content type differs")
    if len(data)<12 or data[:4]!=b"RIFF" or data[8:12]!=b"WEBP":
        raise ValueError("Downloaded image is not WebP")
    return data

def decode(result):
    rows=[]
    for row in result["rows"]:
        values=[]
        for cell in row:
            if cell["type"]=="null":v=None
            elif cell["type"]=="integer":v=int(cell["value"])
            elif cell["type"]=="blob":
                encoded=cell["base64"]
                v=base64.b64decode(encoded+"="*((-len(encoded))%4),validate=True)
            else:v=cell["value"]
            values.append(v)
        rows.append(values)
    return rows

def create(db):
    db.execute([stmt("CREATE TABLE IF NOT EXISTS "+TABLE+
        " (bucket TEXT NOT NULL,name TEXT NOT NULL,object_id TEXT NOT NULL,source_metadata TEXT NOT NULL,"+
        "mime_type TEXT NOT NULL,byte_size INTEGER NOT NULL,sha256 TEXT NOT NULL,content BLOB NOT NULL,"+
        "PRIMARY KEY(bucket,name),CHECK(typeof(content)='blob'),CHECK(length(content)=byte_size))"),
        stmt("CREATE TABLE IF NOT EXISTS "+LINKS+
        " (infographic_id INTEGER PRIMARY KEY,source_path TEXT NOT NULL,status TEXT NOT NULL "+
        "CHECK(status IN ('archived','missing_in_source')))"),
        stmt("CREATE TABLE IF NOT EXISTS storage__image_archive_runs_v1 "+
        "(manifest_sha256 TEXT PRIMARY KEY,file_count INTEGER NOT NULL,total_bytes INTEGER NOT NULL,"+
        "reference_rows INTEGER NOT NULL,missing_reference_rows INTEGER NOT NULL)")],close=True)

def copy_file(db,file,data):
    digest=hashlib.sha256(data).hexdigest()
    wanted=[BUCKET,file["name"],file["object_id"],canonical(file),file["mime_type"],len(data),digest,data]
    sql="SELECT bucket,name,object_id,source_metadata,mime_type,byte_size,sha256,content FROM "+TABLE+" WHERE bucket=? AND name=?"
    args=[arg(BUCKET),arg(file["name"])]
    existing=decode(db.execute([stmt(sql,args)],close=True)[0])
    if existing and existing!=[wanted]:
        raise ValueError("Existing archived image differs; no replacement permitted")
    if not existing:
        values=[arg(v) for v in wanted[:-1]]+[{"type":"blob","base64":base64.b64encode(data).decode("ascii")}]
        db.execute([stmt("INSERT INTO "+TABLE+" VALUES (?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING",values)],close=True)
    actual=decode(db.execute([stmt(sql,args)],close=True)[0])
    if actual!=[wanted] or hashlib.sha256(actual[0][-1]).hexdigest()!=digest:
        raise ValueError("Archived image readback differs")
    return digest

def record_references(db,files,rows):
    actual=decode(db.execute([stmt("SELECT id,storage_path FROM public__infographics ORDER BY id")],close=True)[0])
    expected=[[r["id"],r["storage_path"]] for r in rows]
    if actual!=expected:
        raise ValueError("Previously copied infographic references differ from source")
    names={f["name"] for f in files}
    wanted=[[r["id"],r["storage_path"],"archived" if r["storage_path"] in names else "missing_in_source"] for r in rows]
    old=decode(db.execute([stmt("SELECT infographic_id,source_path,status FROM "+LINKS+" ORDER BY infographic_id")],close=True)[0])
    by_id={r[0]:r for r in wanted}
    if any(by_id.get(r[0])!=r for r in old):
        raise ValueError("Existing image-reference audit differs")
    for start in range(0,len(wanted),40):
        chunk=wanted[start:start+40]
        sql="INSERT INTO "+LINKS+" VALUES "+",".join("(?,?,?)" for _ in chunk)+" ON CONFLICT DO NOTHING"
        db.execute([stmt(sql,[arg(v) for row in chunk for v in row])],close=True)
    actual=decode(db.execute([stmt("SELECT infographic_id,source_path,status FROM "+LINKS+" ORDER BY infographic_id")],close=True)[0])
    if actual!=wanted:
        raise ValueError("Image-reference audit readback differs")

def run(apply=False,max_seconds=3000):
    files=inventory()
    refs=references(files)
    print("Source inventory:",len(files),"files;",sum(f["size"] for f in files),"bytes; 5 known missing reference paths.",flush=True)
    if not apply:
        print("SAMPLE/PARTIAL: source inventory only; binary files not verified.")
        return False
    db=Turso()
    create(db)
    deadline=time.monotonic()+max_seconds
    manifest=[]
    for index,file in enumerate(files):
        if time.monotonic()>=deadline:
            print("PARTIAL: archive time budget; restart to verify and reuse stored files.",flush=True)
            return False
        data=download(file)
        digest=copy_file(db,file,data)
        manifest.append([file["name"],file["size"],digest])
        print("Verified image",index+1,"/",len(files),flush=True)
    summary=decode(db.execute([stmt("SELECT name,byte_size,sha256,length(content) FROM "+TABLE+" WHERE bucket=? ORDER BY name",[arg(BUCKET)])],close=True)[0])
    if sorted(summary)!=sorted([name,size,digest,size] for name,size,digest in manifest):
        raise ValueError("Archive totals or manifest differ")
    record_references(db,files,refs)
    if inventory()!=files or references(files)!=refs:
        raise ValueError("Source images or references changed during archive")
    digest=hashlib.sha256(canonical(manifest).encode()).hexdigest()
    db.execute([stmt("INSERT INTO storage__image_archive_runs_v1 VALUES (?,?,?,?,?) ON CONFLICT DO NOTHING",
        [arg(digest),arg(len(files)),arg(sum(f["size"] for f in files)),arg(len(refs)),arg(5)])],close=True)
    print("PASS: Image archive complete; 288 original files, 70468014 bytes, SHA256 readback verified.",flush=True)
    print("REFERENCE GAPS: 5 missing source paths recorded; no inferred remapping. Image serving remains unchanged.",flush=True)
    return True

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--apply",action="store_true")
    args=parser.parse_args()
    try:
        complete=run(args.apply)
        if args.apply and not complete:sys.exit(2)
    except Exception as error:
        message="HTTP "+str(error.code) if isinstance(error,urllib.error.HTTPError) else str(error) if isinstance(error,ValueError) else type(error).__name__
        print("FAILED:",message,file=sys.stderr)
        sys.exit(1)
