import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStorage, createRepository } from '../src/data/repository.js';
import { forkSpace } from '../src/features/trails/trails.js';

function freshRepository() {
  return createRepository({ storage: createMemoryStorage() });
}

test('anonymous identity persists and remains visibly anonymous', () => {
  const repository = freshRepository();
  const first = repository.getAnonymousIdentity();
  const second = repository.getAnonymousIdentity();
  assert.equal(first.id, second.id);
  assert.equal(first.isAnonymous, true);
  assert.match(first.displayName, /^Anonymous /);
});

test('comments persist at exact contextual anchors and support replies', () => {
  const repository = freshRepository();
  const parent = repository.addComment({ scopeType: 'claim', scopeId: 'claim-elf-calcium', body: 'Needs stronger replication evidence.' });
  const reply = repository.addComment({ scopeType: 'claim', scopeId: 'claim-elf-calcium', body: 'Agreed; adding a replication source.', parentId: parent.id });
  const comments = repository.listComments('claim', 'claim-elf-calcium');
  assert.equal(comments.length, 2);
  assert.equal(reply.parentId, parent.id);
});

test('save, follow, and algorithm settings persist', () => {
  const repository = freshRepository();
  repository.saveObject('space-bioresonance');
  repository.followEntity('topic-consciousness');
  repository.updateAlgorithm({ discovery: 82, depth: 73, unfamiliar: 64 });
  assert.ok(repository.getState().library.saved.includes('space-bioresonance'));
  assert.ok(repository.getState().following.includes('topic-consciousness'));
  assert.equal(repository.getState().algorithm.discovery, 82);
});

test('local account publishing gate distinguishes guests from members', () => {
  const repository = freshRepository();
  assert.equal(repository.canPublish(), false);
  repository.signUp({ email: 'test@libre.local', password: 'secret12', displayName: 'Test Researcher' });
  assert.equal(repository.canPublish(), true);
  repository.signOut();
  assert.equal(repository.canPublish(), false);
});

test('draft knowledge spaces retain objects, relations, and reader path', () => {
  const repository = freshRepository();
  repository.signUp({ email: 'creator@libre.local', password: 'secret12', displayName: 'Creator' });
  const draft = repository.createDraft({ title: 'Test Space', topicId: 'topic-consciousness' });
  const claim = repository.addDraftObject(draft.id, { type: 'claim', title: 'A structured claim' });
  const source = repository.addDraftObject(draft.id, { type: 'source', title: 'Primary source' });
  repository.addDraftRelation(draft.id, { fromId: claim.id, toId: source.id, type: 'supports' });
  repository.setReaderPath(draft.id, [claim.id, source.id]);
  const hydrated = repository.getDraft(draft.id);
  assert.deepEqual(hydrated.readerPath, [claim.id, source.id]);
  assert.equal(hydrated.relations.length, 1);
});

test('forking preserves original reader-path object ids and lineage instead of duplicating sources', () => {
  const repository = freshRepository();
  repository.signUp({ email: 'fork@libre.local', password: 'secret12', displayName: 'Forker' });
  const source = repository.getState().graph.objects.find((object) => object.id === 'space-stargate');
  const draft = forkSpace(repository, source.id);
  assert.equal(draft.forkedFrom, source.id);
  assert.deepEqual(draft.readerPath, source.readerPath);
  assert.equal(draft.objects.length, 0);
});
