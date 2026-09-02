import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeedGraph } from '../src/domain/seed.js';
import { rankCandidates } from '../src/features/stream/ranking.js';

const profile = {
  followedTopics: ['topic-consciousness'],
  followedCreators: ['creator-vale'],
  saved: ['doc-stargate-report'],
  negative: [],
  algorithm: { discovery: 55, depth: 70, freshness: 45, unfamiliar: 35, obscure: 55 }
};

test('ranking boosts followed topics and source-rich material', () => {
  const graph = createSeedGraph();
  const ranked = rankCandidates(profile, graph.objects, graph.relations);
  assert.ok(ranked.length > 0);
  const top = ranked.slice(0, 5);
  assert.ok(top.some((entry) => entry.reasons.some((reason) => /follow|source/i.test(reason))));
});

test('ranking penalizes explicit negative feedback', () => {
  const graph = createSeedGraph();
  const first = rankCandidates(profile, graph.objects, graph.relations);
  const target = first[0].object.id;
  const second = rankCandidates({ ...profile, negative: [target] }, graph.objects, graph.relations);
  assert.ok(second.findIndex((entry) => entry.object.id === target) > 0);
});

test('diversity mixer avoids a single object type dominating first six results', () => {
  const graph = createSeedGraph();
  const ranked = rankCandidates(profile, graph.objects, graph.relations);
  const types = new Set(ranked.slice(0, 6).map((entry) => entry.object.type));
  assert.ok(types.size >= 3);
});
