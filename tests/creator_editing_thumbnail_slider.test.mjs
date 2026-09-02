import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRepository, createMemoryStorage } from '../src/data/repository.js';
import { algorithmMarkup } from '../src/features/algorithm/algorithm.js';
import { studioMarkup } from '../src/features/studio/studio.js';
import { renderSignal } from '../src/features/stream/signals.js';

function account(repo,email='owner@libre.local',displayName='Owner') {
  return repo.signUp({email,password:'secret1',displayName});
}

function minimalPublish(repo,{title='Owned Space',thumbnail=null}={}) {
  const draft=repo.createDraft({title});
  repo.updateDraft(draft.id,{subtitle:'Subtitle',summary:'Summary',thumbnail});
  repo.addDraftObject(draft.id,{type:'quote',title:'First note'});
  const current=repo.getDraft(draft.id);
  repo.setReaderPath(draft.id,[current.objects[0].id]);
  return repo.publishDraft(draft.id);
}

test('algorithm controls expose stable live-value hooks instead of requiring page replacement',()=>{
  const markup=algorithmMarkup({algorithm:{discovery:51,depth:67,freshness:50,unfamiliar:40,obscure:52}});
  assert.match(markup,/data-algorithm-value="discovery"/);
  assert.match(markup,/data-algorithm-vector-key="discovery"/);
  const enhancer=fs.readFileSync('src/features/algorithm/algorithm-interaction.js','utf8');
  assert.match(enhancer,/addEventListener\('input',[\s\S]*true\)/);
  assert.match(enhancer,/stopImmediatePropagation/);
  assert.doesNotMatch(enhancer,/setHTML\(main/);
});

test('draft thumbnail persists into publication and Studio exposes a thumbnail creator',()=>{
  const repo=createRepository({storage:createMemoryStorage()});
  account(repo);
  const thumbnail='data:image/webp;base64,AAAA';
  const publication=minimalPublish(repo,{thumbnail});
  assert.equal(publication.thumbnail,thumbnail);
  const draft=repo.createDraft({title:'Thumbnail Draft'});
  const markup=studioMarkup({repository:repo,graph:repo.getState().graph,draftId:draft.id});
  assert.match(markup,/data-thumbnail-file/);
  assert.match(markup,/data-thumbnail-preview/);
  assert.match(markup,/16:9/);
});

test('custom publication thumbnails replace generated Stream art',()=>{
  const thumbnail='data:image/png;base64,BBBB';
  const object={id:'space-custom',type:'publication',title:'Custom cover',thumbnail,creatorId:null,topicIds:[],sourceCount:0,claimCount:0,readMinutes:4};
  const html=renderSignal({object,reasons:[]},{objects:[object],relations:[]});
  assert.match(html,/signal-card-thumbnail/);
  assert.match(html,/data:image\/png;base64,BBBB/);
});

test('only the publication creator can open an edit draft',()=>{
  const storage=createMemoryStorage();
  const repo=createRepository({storage});
  const owner=account(repo);
  const publication=minimalPublish(repo);
  repo.signOut();
  account(repo,'other@libre.local','Other');
  assert.equal(repo.canEditPublication(publication.id),false);
  assert.throws(()=>repo.createEditDraft(publication.id),/only edit knowledge you created/i);
  repo.signOut();
  repo.signIn({email:owner.email,password:'secret1'});
  assert.equal(repo.canEditPublication(publication.id),true);
  const draft=repo.createEditDraft(publication.id);
  assert.equal(draft.editingPublicationId,publication.id);
  assert.equal(draft.title,publication.title);
  assert.ok(draft.objects.length>=1);
});

test('publishing an owner edit updates the same publication instead of duplicating it',()=>{
  const repo=createRepository({storage:createMemoryStorage()});
  account(repo);
  const original=minimalPublish(repo,{title:'Before'});
  const createdAt=original.createdAt;
  const edit=repo.createEditDraft(original.id);
  repo.updateDraft(edit.id,{title:'After',thumbnail:'data:image/jpeg;base64,CCCC'});
  const updated=repo.publishDraft(edit.id);
  assert.equal(updated.id,original.id);
  assert.equal(updated.title,'After');
  assert.equal(updated.thumbnail,'data:image/jpeg;base64,CCCC');
  assert.equal(updated.createdAt,createdAt);
  assert.ok(updated.updatedAt>=createdAt);
  assert.equal(repo.getState().graph.objects.filter((o)=>o.id===original.id).length,1);
});

test('draft mutation is owner protected and published content supports object editing/removal',()=>{
  const repo=createRepository({storage:createMemoryStorage()});
  const owner=account(repo);
  const publication=minimalPublish(repo);
  const edit=repo.createEditDraft(publication.id);
  const objectId=edit.objects[0].id;
  repo.updateDraftObject(edit.id,objectId,{title:'Edited note'});
  assert.equal(repo.getDraft(edit.id).objects[0].title,'Edited note');
  repo.signOut();
  account(repo,'intruder@libre.local','Intruder');
  assert.throws(()=>repo.updateDraft(edit.id,{title:'Hijacked'}),/own draft/i);
  assert.throws(()=>repo.removeDraftObject(edit.id,objectId),/own draft/i);
  repo.signOut();
  repo.signIn({email:owner.email,password:'secret1'});
  repo.removeDraftObject(edit.id,objectId);
  assert.equal(repo.getDraft(edit.id).objects.some((o)=>o.id===objectId),false);
});

test('Space UI offers Edit only to its owner',()=>{
  const space=fs.readFileSync('src/features/space/space.js','utf8');
  assert.match(space,/canEditPublication/);
  assert.match(space,/data-edit-space/);
  const workflow=fs.readFileSync('src/features/studio/creator-workflow.js','utf8');
  assert.match(workflow,/createEditDraft/);
  assert.match(workflow,/data-edit-space/);
});
