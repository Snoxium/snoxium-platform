const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), ts = require('typescript');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
const {prepareDiscordMarkdown,remarkDiscord,extractLinks}=require('../components/mindmap/discordMarkdown.ts');
async function render(source,colors=false) {
 const [{unified},{default:parse},{default:gfm},{default:rehype}]=await Promise.all([import('unified'),import('remark-parse'),import('remark-gfm'),import('remark-rehype')]);
 const processor=unified().use(parse).use(gfm).use(remarkDiscord,{textColors:colors}).use(rehype);
 const text=prepareDiscordMarkdown(source); return processor.runSync(processor.parse(text),{value:text});
}
function find(tree,tag){const result=[];function visit(n){if(n.tagName===tag)result.push(n);for(const c of n.children??[])visit(c);}visit(tree);return result;}
test('Discord underline combines with bold and italic, spoilers retain formatted children',async()=>{
 const tree=await render('__underline__ __*italic*__ __**bold**__ __***both***__ ||**hidden** [link](https://example.com)||');
 assert.equal(find(tree,'u').length,4);assert.equal(find(tree,'em').length,2);assert.equal(find(tree,'strong').length,3);
 const spoiler=find(tree,'span')[0]; assert.ok(spoiler);assert.equal(spoiler.properties['data-spoiler'],'true');assert.equal(find(spoiler,'strong').length,1);assert.equal(find(spoiler,'a').length,1);
});
test('subtext, multiline quotes and Discord line breaks render without touching code or escapes',async()=>{
 const tree=await render('-# Small text\n\nline one\nline two\n\n`__literal__ ||literal||`\n\n\\||escaped\\||\n\n>>> quoted one\nquoted two\n\n```js\n__code__ ||code||\n```');
 assert.equal(find(tree,'div')[0].properties.className[0],'mm-subtext'); assert.ok(find(tree,'br').length>=2);
 assert.equal(find(tree,'blockquote').length,1); assert.equal(find(tree,'u').length,0);assert.equal(find(tree,'span').length,0);
 assert.ok(find(tree,'code').some(n=>n.children[0].value.includes('__code__ ||code||')));
});
test('headings, strike, lists, masked links, tasks and tables still work',async()=>{
 const tree=await render('# Heading\n\n~~strike~~ ***bold italic***\n\n- item\n  - child\n\n1. ordered\n\n- [x] task\n\n[masked](https://example.com) https://example.org\n\n| A | B |\n|---|---|\n| one | two |');
 for(const tag of ['h1','del','strong','em','ul','ol','input','a','table'])assert.ok(find(tree,tag).length,tag);
 assert.equal(find(tree,'a').length,2);
});
test('preview links deduplicate, preserve balanced parentheses and ignore code',()=>{
 assert.deepEqual(extractLinks('[a](https://example.com/a_(b)) https://example.com/a_(b). `https://code.test`\n```\nhttps://code2.test\n```'),['https://example.com/a_(b)']);
 assert.deepEqual(extractLinks('https://user:pass@example.com https://example.org,'),['https://example.org/']);
});
test('all seven timestamp styles and default survive parsing, but code remains literal',async()=>{
 const tree=await render(['','t','T','d','D','f','F','R'].map(style=>`<t:1543392060${style?':'+style:''}>`).join(' ')+' `<t:1543392060:R>`');
 assert.equal(find(tree,'time').length,8);assert.deepEqual(find(tree,'time').map(n=>n.properties['data-format']),['f','t','T','d','D','f','F','R']);
 assert.equal(find(tree,'code')[0].children[0].value,'<t:1543392060:R>');
});
test('escaped delimiters do not suppress later spoilers, timestamps or line breaks',async()=>{
 const tree=await render('\\||literal\\|| ||hidden|| <t:1543392060:R>\nnext');
 assert.equal(find(tree,'span').length,1);assert.equal(find(tree,'time').length,1);assert.equal(find(tree,'br').length,1);
});
test('Minecraft colors are opt-in and Birdflop hex, legacy RGB and gradients render safely',async()=>{
 const source='&eYellow &7Gray &rplain &#123456Hex &x&f&f&0&0&a&aPink §aGreen <#22d3ee>Cyan\n\n<gradient:#22d3ee:#c084fc>Gradient **bold**</gradient>\n\n`&e literal`';
 assert.equal(find(await render(source),'span').length,0);
 const tree=await render(source,true),spans=find(tree,'span');
 assert.ok(spans.some(n=>n.properties.style==='color:#ffff55'));assert.ok(spans.some(n=>n.properties.style==='color:#aaaaaa'));
 assert.ok(spans.some(n=>n.properties.style==='color:#123456'));assert.ok(spans.some(n=>n.properties.style==='color:#ff00aa'));
 assert.ok(spans.some(n=>n.properties.className?.includes('mm-text-gradient')));assert.equal(find(tree,'code')[0].children[0].value,'&e literal');
});
test('timestamp formatter supports locale-aware absolute dates and changing relative times',()=>{
 const {formatTimestamp}=require('../components/mindmap/timestamps.ts');
 const seconds=1543392060;
 for(const style of ['t','T','d','D','f','F','R'])assert.ok(formatTimestamp(seconds,style,seconds*1000,'en-GB').length>0);
 assert.match(formatTimestamp(seconds,'F',seconds*1000,'en-GB'),/Wednesday/);
 assert.equal(formatTimestamp(seconds,'R',(seconds-120)*1000,'en-GB'),'in 2 minutes');assert.equal(formatTimestamp(seconds,'R',(seconds+120)*1000,'en-GB'),'2 minutes ago');
});
