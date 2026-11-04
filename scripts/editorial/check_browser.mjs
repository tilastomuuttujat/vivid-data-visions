// Non-mutating check of the exact browser transport against the private library.
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('./turso-browser.js', import.meta.url), 'utf8');
const context = { fetch };
new Function('window', source)(context);
try {
  await context.articleEditorTransport('/api/login', {
    url: 'libsql://murrosmatriisi-tilastomuuttujat.aws-eu-north-1.turso.io',
    password: process.env.TURSO_AUTH_TOKEN || '',
  });
  const { articles } = await context.articleEditorTransport('/api/articles');
  if (!articles.length) throw new Error();
  const article = await context.articleEditorTransport('/api/articles/' + articles[0].id);
  const history = await context.articleEditorTransport('/api/articles/' + articles[0].id + '/history');
  if (!article.body_text || article.revision !== history[0]?.revision_no) throw new Error();
  await context.articleEditorTransport('/api/logout', {});
  console.log('PASS: Standalone HTML transport verified:', articles.length, 'articles; no writes.');
} catch {
  console.error('Standalone browser transport check failed; no texts or credentials logged.');
  process.exitCode = 1;
}
