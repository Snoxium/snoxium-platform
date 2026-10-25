const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(mod,filename)=>mod._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,filename);
const {stretchNode,settleNode}=require('../components/mindmap/nodeMotion.ts');
test('drag effects settle without a persistent text compositor layer and respect reduced motion',async()=>{
 let reduced=false,animations=0,cancelled=0,resolve;
 global.window={matchMedia:()=>({matches:reduced})};
 const classes=new Set();const element={style:{transform:'',removeProperty(){this.transform='';}},classList:{add:v=>classes.add(v),remove:v=>classes.delete(v)},animate(){animations++;return{cancel(){cancelled++;},finished:new Promise(r=>resolve=r)}}};
 stretchNode(element,1000,-1000);assert.ok(classes.has('is-dragging'));assert.match(element.style.transform,/translate\(-3px,3px\)/);
 settleNode(element);assert.equal(element.style.transform,'');assert.equal(classes.has('is-dragging'),false);assert.equal(animations,1);
 resolve();await Promise.resolve();assert.equal(cancelled,1);
 reduced=true;stretchNode(element,20,10);settleNode(element);assert.equal(element.style.transform,'');assert.equal(animations,1);
 delete global.window;
});
