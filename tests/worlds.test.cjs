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
