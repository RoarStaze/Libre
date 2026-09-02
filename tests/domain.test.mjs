import test from 'node:test';
import assert from 'node:assert/strict';
import { OBJECT_TYPES, RELATION_TYPES, EVIDENCE_STATES } from '../src/domain/types.js';
import { createSeedGraph } from '../src/domain/seed.js';
import { createSelectors } from '../src/data/selectors.js';

test('knowledge objects expose stable ids and supported types', () => {
  const graph = createSeedGraph();
  assert.ok(graph.objects.length >= 12);
  const ids = new Set(graph.objects.map((object) => object.id));
  assert.equal(ids.size, graph.objects.length);
  for (const object of graph.objects) assert.ok(OBJECT_TYPES.includes(object.type));
});

test('relationships use explicit typed edges and query both directions', () => {
  const graph = createSeedGraph();
  const selectors = createSelectors(graph);
  const claim = graph.objects.find((object) => object.type === 'claim');
  assert.ok(claim);
  const outgoing = selectors.outgoing(claim.id);
  const incoming = selectors.incoming(claim.id);
  assert.ok(outgoing.length + incoming.length > 0);
  for (const relation of [...outgoing, ...incoming]) assert.ok(RELATION_TYPES.includes(relation.type));
});

test('source provenance resolves to an exact anchor chain', () => {
  const graph = createSeedGraph();
  const selectors = createSelectors(graph);
  const passage = graph.objects.find((object) => object.type === 'document_passage');
  assert.ok(passage);
  const chain = selectors.provenanceChain(passage.id);
  assert.ok(chain.length >= 2);
  assert.equal(chain[0].id, passage.id);
  assert.ok(chain.some((object) => object.type === 'document'));
});

test('evidence states never include a truth score', () => {
  assert.deepEqual(EVIDENCE_STATES, ['established', 'supported', 'preliminary', 'disputed', 'unverified', 'theory', 'speculation']);
});

test('rabbit hole branches expose meaningful relationship categories', () => {
  const graph = createSeedGraph();
  const selectors = createSelectors(graph);
  const space = graph.objects.find((object) => object.type === 'publication');
  const branches = selectors.rabbitHoleBranches(space.id);
  assert.ok(branches.length >= 3);
  assert.ok(branches.every((branch) => branch.label && branch.object));
});
