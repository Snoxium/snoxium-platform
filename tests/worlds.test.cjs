const { test } = require('node:test');
const assert = require('node:assert/strict');
// This test file uses the same TypeScript loader as the core regression suite.
const fs = require('node:fs'), ts = require('typescript');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText, filename);
const {actions,getState} = require('../components/mindmap/store.ts');
test('duplicated worlds own independent canvases and survive JSON round trips',()=>{
getState().project.settings.autoSave=false;
const worldNode=Object.values(getState().project.nodes).find(n=>n.childWorldId);
actions.enterWorld(worldNode.childWorldId);const child=actions.createNodeAt(0,0,{title:'Original child'});actions.leaveToParentWorld();
const [copy]=actions.duplicateNodes([worldNode.id]);const duplicate=getState().project.nodes[copy];
assert.notEqual(duplicate.childWorldId,worldNode.childWorldId);
const childCopy=Object.values(getState().project.nodes).find(n=>n.worldId===duplicate.childWorldId);
assert.ok(childCopy);assert.notEqual(childCopy.id,child);actions.updateNode(childCopy.id,{title:'Copy only'});
assert.equal(getState().project.nodes[child].title,'Original child');
assert.doesNotThrow(()=>actions.importJSON(actions.exportJSON()));
});

test('deleted world doorways can be relinked without deleting, cloning or reparenting worlds',()=>{
const p=getState().project;const original=Object.values(p.nodes).find(n=>n.childWorldId);
const world=original.childWorldId, parent=p.worlds[world].parentWorldId;
actions.enterWorld(p.rootWorldId);actions.deleteNodes([original.id]);
assert.ok(p.worlds[world]);
const link=actions.createNodeAt(100,100,{title:'Restored doorway'});
actions.linkNodeToWorld(link,world);assert.equal(p.nodes[link].linkedWorldId,world);
assert.equal(p.worlds[world].parentWorldId,parent);
const [copy]=actions.duplicateNodes([link]);assert.equal(p.nodes[copy].linkedWorldId,world);
actions.linkNodeToWorld(link);assert.equal(p.nodes[link].linkedWorldId,undefined);assert.ok(p.worlds[world]);
assert.doesNotThrow(()=>actions.importJSON(actions.exportJSON()));
const bad=JSON.parse(actions.exportJSON());bad.nodes[copy].linkedWorldId='missing';assert.throws(()=>actions.importJSON(JSON.stringify(bad)));
});

test('chart data survives duplication and backup without sharing mutable data',()=>{
const id=actions.createNodeAt(20,20,{title:'Chart'});
actions.updateNode(id,{kind:'chart',chart:{type:'bar',data:[{id:'one',label:'A',value:10}]}});
const [copy]=actions.duplicateNodes([id]);
assert.deepEqual(getState().project.nodes[copy].chart,getState().project.nodes[id].chart);
assert.notEqual(getState().project.nodes[copy].chart.data,getState().project.nodes[id].chart.data);
assert.doesNotThrow(()=>actions.importJSON(actions.exportJSON()));
const bad=JSON.parse(actions.exportJSON());bad.nodes[copy].chart.data[0].value='oops';assert.throws(()=>actions.importJSON(JSON.stringify(bad)));
});

test('image exports include each chart style, values and chosen node colors',()=>{
const {mapSVG}=require('../components/mindmap/exporters.ts');
const id=actions.createNodeAt(10,10,{title:'Export chart'});
for(const type of ['bar','line','pie']){
actions.updateNode(id,{kind:'chart',color:{fill:'#253550',text:'#ffcc00'},chart:{type,data:[{id:'a',label:'<unsafe & label>',value:75},{id:'b',label:'B',value:25}]}});
const {svg}=mapSVG(getState().project);
assert.ok(svg.includes(`aria-label="${type} chart"`));assert.ok(svg.includes('75'));assert.ok(svg.includes('fill="#253550"'));assert.ok(svg.includes('fill="#ffcc00"'));assert.ok(!svg.includes('<unsafe & label>'));
}
});
