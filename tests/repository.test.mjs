import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStorage, createRepository } from '../src/data/repository.js';
import { forkSpace } from '../src/features/trails/trails.js';

function freshRepository() {
  return createRepository({ storage: createMemoryStorage() });
}

function strongSource(title,doi,extra={}) {
  return {
    type:'source',
    title,
    sourceKind:'journal article',
    peerReviewed:true,
    primary:true,
    relevance:.92,
    stanceConfidence:.9,
    publisher:`Independent publisher ${doi}`,
    doi,
    year:2024,
    authors:['Independent Researcher'],
    abstract:`Controlled evidence directly relevant to ${title}.`,
    citationCount:24,
    ...extra
  };
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
  const source = repository.addDraftObject(draft.id, strongSource('Primary source','10.1000/primary'));
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

test('creators cannot set their own evidence classification', () => {
  const repository = freshRepository();
  repository.signUp({ email: 'evidence@libre.local', password: 'secret12', displayName: 'Evidence Tester' });
  const draft = repository.createDraft({ title: 'Evidence Test' });
  const claim = repository.addDraftObject(draft.id, {
    type: 'claim',
    title: 'A creator tries to self-label this as established',
    evidenceState: 'established'
  });
  assert.equal(claim.evidenceState, 'unverified');
  assert.equal(claim.evidenceAssessment.method, 'libre-auto-v2');
});

test('Libre uses source quality, independence, and contradiction rather than raw source counts', () => {
  const repository = freshRepository();
  repository.signUp({ email: 'auto@libre.local', password: 'secret12', displayName: 'Auto Classifier' });
  const draft = repository.createDraft({ title: 'Automatic Evidence' });
  const claim = repository.addDraftObject(draft.id, { type: 'claim', title: 'A testable claim causes a measurable effect' });
  const source1 = repository.addDraftObject(draft.id, strongSource('Independent source one','10.1000/one'));
  const source2 = repository.addDraftObject(draft.id, strongSource('Independent source two','10.1000/two'));
  const source3 = repository.addDraftObject(draft.id, strongSource('Independent source three','10.1000/three'));

  repository.addDraftRelation(draft.id, { fromId: claim.id, toId: source1.id, type: 'supports' });
  assert.equal(repository.getDraft(draft.id).objects.find((object) => object.id === claim.id).evidenceState, 'preliminary');

  repository.addDraftRelation(draft.id, { fromId: claim.id, toId: source2.id, type: 'supports' });
  const afterTwo=repository.getDraft(draft.id).objects.find((object) => object.id === claim.id);
  assert.ok(['supported','preliminary'].includes(afterTwo.evidenceState));

  repository.addDraftRelation(draft.id, { fromId: claim.id, toId: source3.id, type: 'supports' });
  const afterThree=repository.getDraft(draft.id).objects.find((object) => object.id === claim.id);
  assert.equal(afterThree.evidenceState, 'established');
  assert.ok(afterThree.evidenceAssessment.confidence >= .75);
  assert.equal(afterThree.evidenceAssessment.independentSourceGroups,3);

  const counter = repository.addDraftObject(draft.id, strongSource('Strong counterevidence','10.1000/counter'));
  repository.addDraftRelation(draft.id, { fromId: claim.id, toId: counter.id, type: 'contradicts' });
  assert.equal(repository.getDraft(draft.id).objects.find((object) => object.id === claim.id).evidenceState, 'disputed');
});

test('automatic discovery imports sources and source relationships without creator entry', () => {
  const repository=freshRepository();
  repository.signUp({email:'discover@libre.local',password:'secret12',displayName:'Discovery Tester'});
  const draft=repository.createDraft({title:'Auto-sourced Space'});
  const claim=repository.addDraftObject(draft.id,{type:'claim',title:'A testable automatically sourced claim'});

  const summary=repository.importDiscoveredSources(draft.id,{
    claimsSearched:1,
    providerSuccesses:3,
    providerFailures:[],
    discoveries:[{
      claimId:claim.id,
      candidates:[{
        ...strongSource('Automatically discovered paper','10.1000/auto'),
        id:'provider-record-1',
        canonicalKey:'doi:10.1000/auto',
        provider:'crossref',
        stance:'supports',
        rankScore:.91
      }]
    }]
  });

  assert.equal(summary.addedSources,1);
  assert.equal(summary.addedRelations,1);
  const hydrated=repository.getDraft(draft.id);
  const autoSource=hydrated.objects.find((object)=>object.autoDiscovered===true);
  assert.ok(autoSource);
  assert.equal(autoSource.metadataLocked,true);
  assert.equal(autoSource.discoveredBy,'libre-source-discovery-v1');
  assert.ok(hydrated.relations.some((relation)=>relation.fromId===claim.id&&relation.toId===autoSource.id&&relation.type==='supports'));
  assert.equal(hydrated.objects.find((object)=>object.id===claim.id).evidenceState,'preliminary');
});

test('publication evidence classification is derived from claims after source assessment', () => {
  const repository = freshRepository();
  repository.signUp({ email: 'publish@libre.local', password: 'secret12', displayName: 'Publisher' });
  const draft = repository.createDraft({ title: 'Derived Publication State' });
  const claim = repository.addDraftObject(draft.id, { type: 'claim', title: 'Contested measurable claim' });
  const support = repository.addDraftObject(draft.id, strongSource('Strong support','10.1000/pub-support'));
  const counter = repository.addDraftObject(draft.id, strongSource('Strong counterevidence','10.1000/pub-counter'));
  repository.addDraftRelation(draft.id, { fromId: claim.id, toId: support.id, type: 'supports' });
  repository.addDraftRelation(draft.id, { fromId: claim.id, toId: counter.id, type: 'contradicts' });
  const publication = repository.publishDraft(draft.id);
  assert.equal(publication.evidenceState, 'disputed');
  assert.equal(publication.evidenceAssessment.method,'libre-auto-v2');
});