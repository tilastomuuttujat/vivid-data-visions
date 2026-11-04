PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS editorial__sources (
 id TEXT PRIMARY KEY,filename TEXT NOT NULL,sha256 TEXT NOT NULL UNIQUE,
 page_count INTEGER NOT NULL CHECK(page_count>0),library_file_id TEXT NOT NULL,
 collection_title TEXT NOT NULL,imported_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS editorial__source_pages (
 source_id TEXT NOT NULL REFERENCES editorial__sources(id),page_no INTEGER NOT NULL CHECK(page_no>0),
 raw_text TEXT NOT NULL,sha256 TEXT NOT NULL,PRIMARY KEY(source_id,page_no)
);
CREATE TABLE IF NOT EXISTS editorial__articles (
 id TEXT PRIMARY KEY,source_id TEXT NOT NULL REFERENCES editorial__sources(id),
 source_position INTEGER NOT NULL,source_number TEXT NOT NULL,
 page_start INTEGER NOT NULL CHECK(page_start>0),page_end INTEGER NOT NULL CHECK(page_end>=page_start),
 title TEXT NOT NULL CHECK(length(trim(title))>0),summary TEXT NOT NULL DEFAULT '',
 body_text TEXT NOT NULL CHECK(length(trim(body_text))>0),
 tags_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(tags_json) AND json_type(tags_json)='array'),
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','review','published','archived')),
 editorial_note TEXT NOT NULL DEFAULT '',
 review_flags_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(review_flags_json) AND json_type(review_flags_json)='array'),
 change_note TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(source_id,source_position)
);
CREATE TABLE IF NOT EXISTS editorial__article_revisions (
 article_id TEXT NOT NULL REFERENCES editorial__articles(id),revision_no INTEGER NOT NULL CHECK(revision_no>0),
 title TEXT NOT NULL,summary TEXT NOT NULL,body_text TEXT NOT NULL,tags_json TEXT NOT NULL,
 status TEXT NOT NULL,editorial_note TEXT NOT NULL,review_flags_json TEXT NOT NULL,change_note TEXT NOT NULL,
 saved_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 PRIMARY KEY(article_id,revision_no)
);
CREATE INDEX IF NOT EXISTS editorial__articles_status ON editorial__articles(status,source_position);
CREATE INDEX IF NOT EXISTS editorial__articles_title ON editorial__articles(title);
CREATE TRIGGER IF NOT EXISTS editorial__articles_insert AFTER INSERT ON editorial__articles BEGIN
 INSERT INTO editorial__article_revisions(article_id,revision_no,title,summary,body_text,tags_json,status,editorial_note,review_flags_json,change_note)
 VALUES(NEW.id,1,NEW.title,NEW.summary,NEW.body_text,NEW.tags_json,NEW.status,NEW.editorial_note,NEW.review_flags_json,NEW.change_note);
END;
CREATE TRIGGER IF NOT EXISTS editorial__articles_update
AFTER UPDATE OF title,summary,body_text,tags_json,status,editorial_note,review_flags_json,change_note ON editorial__articles
WHEN NEW.title IS NOT OLD.title OR NEW.summary IS NOT OLD.summary OR NEW.body_text IS NOT OLD.body_text OR
 NEW.tags_json IS NOT OLD.tags_json OR NEW.status IS NOT OLD.status OR NEW.editorial_note IS NOT OLD.editorial_note OR
 NEW.review_flags_json IS NOT OLD.review_flags_json OR NEW.change_note IS NOT OLD.change_note
BEGIN
 INSERT INTO editorial__article_revisions(article_id,revision_no,title,summary,body_text,tags_json,status,editorial_note,review_flags_json,change_note)
 SELECT NEW.id,coalesce(max(revision_no),0)+1,NEW.title,NEW.summary,NEW.body_text,NEW.tags_json,NEW.status,NEW.editorial_note,NEW.review_flags_json,NEW.change_note
 FROM editorial__article_revisions WHERE article_id=NEW.id;
 UPDATE editorial__articles SET updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS editorial__articles_provenance BEFORE UPDATE OF id,source_id,source_position,source_number,page_start,page_end,created_at ON editorial__articles
BEGIN SELECT RAISE(ABORT,'Original identity and source provenance are immutable'); END;
CREATE TRIGGER IF NOT EXISTS editorial__articles_no_delete BEFORE DELETE ON editorial__articles
BEGIN SELECT RAISE(ABORT,'Archive an article instead of deleting its history'); END;
CREATE TRIGGER IF NOT EXISTS editorial__revisions_no_update BEFORE UPDATE ON editorial__article_revisions
BEGIN SELECT RAISE(ABORT,'Revision history is immutable'); END;
CREATE TRIGGER IF NOT EXISTS editorial__revisions_no_delete BEFORE DELETE ON editorial__article_revisions
BEGIN SELECT RAISE(ABORT,'Revision history is immutable'); END;
CREATE TRIGGER IF NOT EXISTS editorial__pages_no_update BEFORE UPDATE ON editorial__source_pages
BEGIN SELECT RAISE(ABORT,'Original source pages are immutable'); END;
CREATE TRIGGER IF NOT EXISTS editorial__pages_no_delete BEFORE DELETE ON editorial__source_pages
BEGIN SELECT RAISE(ABORT,'Original source pages are immutable'); END;
CREATE TRIGGER IF NOT EXISTS editorial__sources_no_update BEFORE UPDATE ON editorial__sources
BEGIN SELECT RAISE(ABORT,'Original sources are immutable'); END;
CREATE TRIGGER IF NOT EXISTS editorial__sources_no_delete BEFORE DELETE ON editorial__sources
BEGIN SELECT RAISE(ABORT,'Original sources are immutable'); END;
CREATE VIEW IF NOT EXISTS editorial__article_catalog AS
 SELECT a.id,a.source_id,a.source_position,a.source_number,a.title,a.summary,a.status,a.tags_json,a.review_flags_json,
 a.page_start,a.page_end,length(a.body_text) AS characters,a.updated_at,
 (SELECT max(r.revision_no) FROM editorial__article_revisions r WHERE r.article_id=a.id) AS revision
 FROM editorial__articles a;
