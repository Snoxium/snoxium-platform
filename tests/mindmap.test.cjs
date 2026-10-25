const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const storage = new Map();
let storageFails = false;
global.window = { addEventListener() {} };
global.document = { addEventListener() {}, visibilityState: 'visible' };
global.localStorage = { getItem: key => storage.get(key) ?? null, setItem(key, value) { if (storageFails) throw new Error('QuotaExceededError'); storage.set(key, value); } };
const { actions, getState, beginUndoGroup, endUndoGroup } = require('../components/mindmap/store.ts');
const { parseProject } = require('../components/mindmap/validation.ts');
const { mapSVG } = require('../components/mindmap/exporters.ts');
const fresh = JSON.parse(actions.exportJSON()); fresh.settings.autoSave = false;
const reset = () => { storageFails = false; actions.importJSON(JSON.stringify(fresh)); };
after(() => { delete global.window; delete global.document; delete global.localStorage; });

test('invalid imports leave project and saved map unchanged', () => {
 reset(); const current = getState().project; const saved = storage.get('snoxium.mindmap.v1');
 for (const value of ['{"version":1}', '{', 'null', '{"version":2}']) assert.throws(() => actions.importJSON(value));
 assert.equal(getState().project, current); assert.equal(storage.get('snoxium.mindmap.v1'), saved);
});
test('world cycles and dangling connections are rejected before replacement', () => {
 reset(); const map = JSON.parse(actions.exportJSON()); map.worlds[map.rootWorldId].parentWorldId = map.rootWorldId;
 assert.throws(() => parseProject(JSON.stringify(map)));
 delete map.worlds[map.rootWorldId].parentWorldId;
 Object.values(map.edges)[0].to = 'missing'; assert.throws(() => parseProject(JSON.stringify(map)));
});
test('zoom preserves the world coordinate under a cursor after panning', () => {
 reset(); actions.setCamera(140, -90, 1.5); const x = (600 - 140) / 1.5, y = (300 + 90) / 1.5;
 actions.zoomAt(600, 300, 2.4); const c = getState().camera;
 assert.ok(Math.abs((600 - c.x) / c.zoom - x) < 1e-9); assert.ok(Math.abs((300 - c.y) / c.zoom - y) < 1e-9);
});
test('new world nodes get their own canvas and return to their parent', () => {
 reset(); const root = getState().project.currentWorldId;
 const id = actions.createNodeAt(400, 300, { kind: 'world', title: 'My world' });
 const child = getState().project.nodes[id].childWorldId; assert.ok(child);
 actions.enterWorld(child); assert.equal(getState().project.currentWorldId, child);
 actions.createNodeAt(0, 0, { title: 'Inside' }); actions.leaveToParentWorld(); assert.equal(getState().project.currentWorldId, root);
 assert.ok(Object.values(getState().project.nodes).some(n => n.worldId === child && n.title === 'Inside'));
 assert.doesNotThrow(() => parseProject(actions.exportJSON()));
});
test('one undo reverses a complete typing session, redo restores it', () => {
 reset(); const node = Object.values(getState().project.nodes)[0], original = node.title;
 const group = beginUndoGroup(); for (const title of ['A','AB','ABC']) actions.updateNode(node.id,{title}); endUndoGroup(group);
 actions.undo(); assert.equal(getState().project.nodes[node.id].title, original);
 actions.redo(); assert.equal(getState().project.nodes[node.id].title, 'ABC');
});
test('connections prevent duplicates, self-links and cross-world links', () => {
 reset(); const nodes = Object.values(getState().project.nodes); const initial = Object.keys(getState().project.edges).length;
 actions.createEdgeFromTo(nodes[0].id, nodes[1].id); actions.createEdgeFromTo(nodes[0].id, nodes[0].id);
 assert.equal(Object.keys(getState().project.edges).length, initial);
 const child = nodes.find(n => n.childWorldId).childWorldId;
 actions.enterWorld(child); const other = actions.createNodeAt(0,0); actions.createEdgeFromTo(nodes[0].id,other);
 assert.equal(Object.keys(getState().project.edges).length, initial);
});
test('deleting a node removes its edges and undo restores them', () => {
 reset(); const id = Object.values(getState().project.nodes)[0].id, count = Object.keys(getState().project.edges).length;
 actions.deleteNodes([id]); assert.ok(Object.values(getState().project.edges).every(e => e.from !== id && e.to !== id));
 actions.undo(); assert.equal(Object.keys(getState().project.edges).length, count); assert.ok(getState().project.nodes[id]);
});
test('storage failures report an actionable error and preserve previous save', () => {
 reset(); const saved = storage.get('snoxium.mindmap.v1'); storageFails = true;
 actions.setProjectName('Changed'); assert.equal(actions.saveNow(), false);
 assert.match(getState().saveError, /backup/i); assert.equal(getState().dirty, true); assert.equal(storage.get('snoxium.mindmap.v1'), saved);
 storageFails = false; assert.equal(actions.saveNow(), true); assert.equal(getState().saveError,null);
});
test('SVG export escapes user text and is independent of viewport camera', () => {
 reset(); const id=Object.keys(getState().project.nodes)[0]; actions.updateNode(id,{title:'<script>"&'});
 const before = mapSVG(getState().project); actions.setCamera(-5000,3000,0.2); const after = mapSVG(getState().project);
 assert.equal(before.svg,after.svg); assert.ok(before.width > 0 && before.height > 0); assert.ok(!before.svg.includes('<script>')); assert.ok(before.svg.includes('&lt;script&gt;'));
});
