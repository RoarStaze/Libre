import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeedGraph } from '../src/domain/seed.js';
import { createSelectors } from '../src/data/selectors.js';
import { createRepository, createMemoryStorage } from '../src/data/repository.js';
import { renderStream } from '../src/features/stream/stream.js';
import { renderSpace } from '../src/features/space/space.js';
import { commandPaletteMarkup } from '../src/features/search/search.js';
import { studioMarkup } from '../src/features/studio/studio.js';
import { authPageMarkup } from '../src/features/auth/auth.js';

function context() {
  const repository=createRepository({storage:createMemoryStorage()});
  const state=repository.getState();
  return {repository,state,graph:state.graph,selectors:createSelectors(state.graph)};
}

test('Stream renders heterogeneous native signal families', () => {
  const {state,graph}=context();
  const markup=renderStream({graph,state,mode:'for-you'});
  for (const token of ['signal--investigation','signal--claim','signal--document','signal--trail']) assert.match(markup,new RegExp(token));
  assert.match(markup,/Knowledge is not a feed/);
  assert.match(markup,/My Algorithm/);
});

test('Knowledge Space exposes all five lenses and contextual graph controls', () => {
  const {repository,graph,selectors}=context();
  const markup=renderSpace({id:'space-stargate',lens:'story',graph,selectors,repository});
  for (const lens of ['Story','Evidence','Claims','Timeline','Discussion']) assert.match(markup,new RegExp(lens));
  assert.match(markup,/Rabbit Hole/);
  assert.match(markup,/data-fork-space/);
  assert.match(markup,/view-transition-name/);
});

test('Evidence and Claims lenses render from the same Knowledge Space graph', () => {
  const {repository,graph,selectors}=context();
  const evidence=renderSpace({id:'space-stargate',lens:'evidence',graph,selectors,repository});
  const claims=renderSpace({id:'space-stargate',lens:'claims',graph,selectors,repository});
  assert.match(evidence,/Evidence, without the narrative/);
  assert.match(evidence,/provenance-chain/);
  assert.match(claims,/Claims are objects/);
  assert.match(claims,/Supporting evidence/);
  assert.match(claims,/Counterevidence/);
});

test('Omnibar searches across object types instead of publications only', () => {
  const graph=createSeedGraph();
  const markup=commandPaletteMarkup(graph,'Stargate');
  assert.match(markup,/Spaces/);
  assert.match(markup,/Documents|Claims|Datasets|Video/);
});

test('Studio is graph-first and requires identity before publishing', () => {
  const {repository,graph}=context();
  assert.match(studioMarkup({repository,graph}),/requires a knowledge identity/);
  repository.signUp({email:'ui@libre.local',password:'secret12',displayName:'UI Researcher'});
  repository.createDraft({title:'Graph Test'});
  const markup=studioMarkup({repository,graph:repository.getState().graph});
  assert.match(markup,/Object shelf/);
  assert.match(markup,/Knowledge workspace/);
  assert.match(markup,/Reader Path/);
});

test('Auth page explicitly keeps reading and anonymous discussion open', () => {
  const markup=authPageMarkup('signup');
  assert.match(markup,/Reading, searching, and anonymous discussion never require an account/);
});
