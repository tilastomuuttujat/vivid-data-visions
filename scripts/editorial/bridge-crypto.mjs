import { webcrypto, createHash, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
const subtle=webcrypto.subtle;
export async function encrypt(value, publicKey) {
  const key=await subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);
  const iv=randomBytes(12), rsa=await subtle.importKey('jwk',publicKey,{name:'RSA-OAEP',hash:'SHA-256'},false,['encrypt']);
  return {iv:iv.toString('base64'),key:Buffer.from(await subtle.encrypt('RSA-OAEP',rsa,await subtle.exportKey('raw',key))).toString('base64'),data:Buffer.from(await subtle.encrypt({name:'AES-GCM',iv},key,gzipSync(JSON.stringify(value)))).toString('base64')};
}
export async function decrypt(box, privateKey) {
 const rsa=await subtle.importKey('jwk',privateKey,{name:'RSA-OAEP',hash:'SHA-256'},false,['decrypt']);
 const raw=await subtle.decrypt('RSA-OAEP',rsa,Buffer.from(box.key,'base64'));
 const key=await subtle.importKey('raw',raw,'AES-GCM',false,['decrypt']);
 return JSON.parse(gunzipSync(Buffer.from(await subtle.decrypt({name:'AES-GCM',iv:Buffer.from(box.iv,'base64')},key,Buffer.from(box.data,'base64'))),{maxOutputLength:20000000}).toString());
}
export async function pair() { const k=await subtle.generateKey({name:'RSA-OAEP',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['encrypt','decrypt']);return {publicKey:await subtle.exportKey('jwk',k.publicKey),privateKey:await subtle.exportKey('jwk',k.privateKey)}; }
// Stateless, authenticated session; private key never leaves Actions in plaintext.
export function seal(value, secret) {const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',createHash('sha256').update('article-editor-session-v1:'+secret).digest(),iv);const data=Buffer.concat([c.update(JSON.stringify(value)),c.final()]);return Buffer.concat([iv,c.getAuthTag(),data]).toString('base64');}
export function unseal(value,secret) {const b=Buffer.from(value,'base64'),c=createDecipheriv('aes-256-gcm',createHash('sha256').update('article-editor-session-v1:'+secret).digest(),b.subarray(0,12));c.setAuthTag(b.subarray(12,28));return JSON.parse(Buffer.concat([c.update(b.subarray(28)),c.final()]).toString());}
