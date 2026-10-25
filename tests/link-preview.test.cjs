const { test }=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(mod,filename)=>mod._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,filename);
const {isPublicAddress,webURL,parseMetadata,fetchLinkPreview}=require('../lib/linkPreview.ts');
test('preview fetch blocks local, private, encoded and mapped network targets',async()=>{
 for(const ip of ['127.0.0.1','10.2.3.4','172.16.1.1','192.168.1.1','169.254.169.254','100.64.0.1','0.0.0.0','224.0.0.1','::1','::ffff:127.0.0.1','fc00::1','2001:db8::1','2002:7f00:1::'])assert.equal(isPublicAddress(ip),false,ip);
 for(const ip of ['8.8.8.8','1.1.1.1','2606:4700:4700::1111'])assert.equal(isPublicAddress(ip),true,ip);
 for(const url of ['file:///etc/passwd','https://localhost/','https://user:pass@example.com','https://example.com:8443/'])assert.throws(()=>webURL(url));
 for(const url of ['http://2130706433/','http://0x7f000001/','http://127.0.0.1/'])await assert.rejects(fetchLinkPreview(url));
});
test('metadata handles attribute order, entities, relative images and missing fields safely',()=>{
 const data=parseMetadata(`<title>Fallback</title><meta content='A &amp; B' property="og:title"><meta name='description' content='Description &quot;safe&quot;'><meta property='og:image' content='/pic.png'><script>alert(1)</script>`,new URL('https://example.com/path'));
 assert.equal(data.title,'A & B');assert.equal(data.description,'Description "safe"');assert.equal(data.image,'https://example.com/pic.png');
 assert.equal(parseMetadata('<title>Title</title>',new URL('https://example.com')).image,undefined);
 assert.equal(parseMetadata('<meta property="og:image" content="javascript:alert(1)">',new URL('https://example.com')).image,undefined);
});
