const {test,mock}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(mod,filename)=>mod._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,filename);
const {stretchNode,settleNode}=require('../components/mindmap/nodeMotion.ts');
const {backgroundColor,withBackgroundOpacity}=require('../components/mindmap/nodeAppearance.ts');

test('spring follows drag direction, rebounds on release, stops frames and respects reduced motion',()=>{
 let reduced=false,now=0,id=0;const frames=new Map();
 mock.method(performance,'now',()=>now);
 global.window={matchMedia:()=>({matches:reduced})};
 global.requestAnimationFrame=fn=>{frames.set(++id,fn);return id;};
 global.cancelAnimationFrame=id=>frames.delete(id);
 const classes=new Set();const element={style:{transform:'',removeProperty(){this.transform='';}},classList:{add:v=>classes.add(v),remove:v=>classes.delete(v)}};
 const step=()=>{now+=16;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(now));};
 try {
  stretchNode(element,0,0);step();assert.ok(classes.has('is-dragging'));assert.match(element.style.transform,/scale\(1\.00/);
  for(let i=0;i<12;i++){stretchNode(element,30,0);step();}
  const scales=element.style.transform.match(/scale\(([^,]+),([^\)]+)\)/).slice(1).map(Number);
  assert.ok(scales[0]>scales[1],'horizontal movement stretches along travel');
  settleNode(element);assert.equal(classes.has('is-dragging'),false);
  let rebounded=false;
  for(let i=0;i<150&&frames.size;i++){step();if(/scale\(([^,]+),/.exec(element.style.transform)?.[1]<1)rebounded=true;}
  assert.ok(rebounded,'release overshoots softly');assert.equal(element.style.transform,'');assert.equal(frames.size,0);
  stretchNode(element,10,10);step();settleNode(element,true);assert.equal(frames.size,0);assert.equal(element.style.transform,'');
  reduced=true;stretchNode(element,20,10);assert.equal(frames.size,0);assert.equal(element.style.transform,'');
 } finally {mock.restoreAll();delete global.window;delete global.requestAnimationFrame;delete global.cancelAnimationFrame;}
});

test('background opacity preserves legacy hex alpha and changing color keeps the chosen opacity',()=>{
 assert.deepEqual(backgroundColor('#f472b614'),{color:'#f472b6',opacity:8});
 assert.deepEqual(backgroundColor('#abc8'),{color:'#aabbcc',opacity:53});
 assert.equal(withBackgroundOpacity('#22d3ee',40),'#22d3ee66');
 assert.equal(withBackgroundOpacity('#22d3ee',100),'#22d3eeff');
 assert.equal(withBackgroundOpacity('#22d3ee',0),'#22d3ee00');
 assert.equal(backgroundColor(withBackgroundOpacity('#34d399',40)).opacity,40);
});
