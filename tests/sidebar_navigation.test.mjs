import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRepository, createMemoryStorage } from '../src/data/repository.js';
import { sidebarMarkup } from '../src/features/navigation/sidebar.js';
import { libraryMarkup } from '../src/features/library/library.js';

function context(){
  const repository=createRepository({storage:createMemoryStorage()});
  return {repository,state:repository.getState(),graph:repository.getState().graph};
}

test('Libre sidebar exposes goal-based navigation and no dead format-only section',()=>{
  const {state,graph}=context();
  const markup=sidebarMarkup({state,graph,route:{name:'home'},streamMode:'for-you'});
  for(const label of ['Home','Explore','Following','Latest','Deep Dive','Trending','Discover','Library','History','Collections','Drafts','My Algorithm']) {
    assert.match(markup,new RegExp(`>${label}<`));
  }
  assert.doesNotMatch(markup,/>Videos<|>Articles<|>Audio</);
});

test('sidebar renders followed people and topics as live destinations',()=>{
  const {repository}=context();
  const state=repository.getState();
  const person=state.graph.objects.find((object)=>object.type==='person');
  const topic=state.graph.objects.find((object)=>object.type==='topic');
  repository.followEntity(person.id);
  repository.followEntity(topic.id);
  const next=repository.getState();
  const markup=sidebarMarkup({state:next,graph:next.graph,route:{name:'home'},streamMode:'for-you'});
  assert.match(markup,new RegExp(`data-route="/profile/${person.id}"`));
  assert.match(markup,new RegExp(`data-route="/topic/${topic.id}"`));
});

test('sidebar toggle is injected into the real header and shell contains persistent drawer',()=>{
  const runtime=fs.readFileSync('src/features/navigation/sidebar-runtime.js','utf8');
  const index=fs.readFileSync('index.html','utf8');
  assert.match(runtime,/data-toggle-sidebar/);
  assert.match(runtime,/libre-sidebar-open-v1/);
  assert.match(index,/id="global-sidebar"/);
  assert.match(index,/styles\/sidebar\.css/);
  assert.match(index,/navigation\/sidebar-runtime\.js/);
});

test('sidebar stream rows use real Stream modes',()=>{
  const {state,graph}=context();
  const markup=sidebarMarkup({state,graph,route:{name:'home'},streamMode:'deep-dive'});
  assert.match(markup,/data-sidebar-stream-mode="following"/);
  assert.match(markup,/data-sidebar-stream-mode="latest"/);
  assert.match(markup,/data-sidebar-stream-mode="deep-dive"/);
  assert.match(markup,/data-sidebar-stream-mode="trending"/);
  assert.match(markup,/data-sidebar-stream-mode="discover"/);
  assert.match(markup,/aria-current="page"[^>]*>.*Deep Dive/s);
});

test('Library direct views actually filter saved history and collections',()=>{
  const {repository}=context();
  const object=repository.getState().graph.objects.find((entry)=>entry.type==='publication');
  repository.saveObject(object.id,'saved');
  repository.addHistory(object.id);
  repository.createCollection({title:'Research Set',visibility:'private'});
  const state=repository.getState();
  const saved=libraryMarkup({graph:state.graph,state,view:'saved'});
  const history=libraryMarkup({graph:state.graph,state,view:'history'});
  const collections=libraryMarkup({graph:state.graph,state,view:'collections'});
  assert.match(saved,new RegExp(object.title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(history,new RegExp(object.title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(collections,/Research Set/);
  assert.match(saved,/aria-selected="true"[^>]*>Saved</);
  assert.match(history,/aria-selected="true"[^>]*>History</);
  assert.match(collections,/aria-selected="true"[^>]*>Collections</);
});
