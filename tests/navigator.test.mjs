import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createNavigatorSession,saveNavigatorSession,getNavigatorSession,advanceNavigator,navigatorBack,navigatorForward,navigatorJump,navigatorOrigin,
  buildNavigatorGraph,visibleNavigatorGraph,knowledgeNavigatorMarkup,navigatorSearch,NAVIGATOR_STORAGE_KEY
} from '../src/features/navigator/navigator.js';

const memory=new Map();
globalThis.localStorage={getItem:key=>memory.has(key)?memory.get(key):null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)};

const graph={objects:[
  {id:'space-a',type:'publication',title:'Origin Space',topicIds:['topic-x'],creatorId:'person-a',sourceCount:4},
  {id:'space-b',type:'publication',title:'Deeper Space',topicIds:['topic-x'],creatorId:'person-b',sourceCount:8},
  {id:'claim-a',type:'claim',title:'A structured claim',evidenceState:'supported'},
  {id:'source-a',type:'source',title:'Primary source'},
  {id:'topic-x',type:'topic',title:'Hidden History'},
  {id:'person-a',type:'person',title:'Researcher A'}
],relations:[
  {id:'r1',fromId:'space-a',toId:'claim-a',type:'part_of'},
  {id:'r2',fromId:'claim-a',toId:'source-a',type:'supports'},
  {id:'r3',fromId:'space-a',toId:'topic-x',type:'related_to'},
  {id:'r4',fromId:'space-a',toId:'person-a',type:'mentions'}
]};

test('navigator preserves origin and history while diving',()=>{
  memory.clear();saveNavigatorSession(createNavigatorSession('space-a'));advanceNavigator('space-b');let session=getNavigatorSession();
  assert.equal(session.originId,'space-a');assert.equal(session.currentId,'space-b');assert.deepEqual(session.path,['space-a','space-b']);
  assert.equal(navigatorBack(),'space-a');assert.equal(navigatorForward(),'space-b');assert.equal(navigatorJump('space-a'),'space-a');assert.equal(navigatorOrigin(),'space-a');
});

test('navigator builds explicit and inferred graph connections',()=>{
  const model=buildNavigatorGraph(graph);assert.ok(model.nodes.has('space-a'));assert.ok(model.edges.some(edge=>edge.type==='supports'));
  assert.ok(model.edges.some(edge=>edge.type==='inferred_topic'&&[edge.fromId,edge.toId].includes('space-a')&&[edge.fromId,edge.toId].includes('space-b')));
});

test('visible graph keeps current, branches, claims, and context',()=>{
  memory.clear();saveNavigatorSession(createNavigatorSession('space-a'));const session=getNavigatorSession();const visible=visibleNavigatorGraph(graph,session,{maxNeighbors:8});
  assert.ok(visible.nodes.some(node=>node.id==='space-a'));assert.ok(visible.nodes.some(node=>node.id==='space-b'));assert.ok(visible.nodes.some(node=>node.id==='claim-a'));
});

test('navigator markup exposes orientation, atlas, search, and branch controls',()=>{
  memory.clear();const markup=knowledgeNavigatorMarkup({spaceId:'space-a',graph});
  for(const phrase of ['Never lose the thread.','Path spine','Unexplored branches','Selected node','Full Atlas','Back to origin','Search this rabbit hole']) assert.match(markup,new RegExp(phrase));
  assert.match(markup,/data-nav-node="space-a"/);assert.equal(localStorage.getItem(NAVIGATOR_STORAGE_KEY)!==null,true);
});

test('navigator graph search finds knowledge objects',()=>{const results=navigatorSearch(graph,'primary');assert.equal(results[0].id,'source-a');});
