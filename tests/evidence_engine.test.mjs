import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assessClaimEvidence,
  scoreSourceQuality,
  classifyClaimLanguage
} from '../src/domain/evidence.js';
import {
  buildSourceQueries,
  normalizeSourceCandidate,
  rankSourceCandidate,
  dedupeSourceCandidates
} from '../src/domain/source-discovery.js';

function claim(title='A testable claim') {
  return { id:'claim-1', type:'claim', title };
}

function source(id, overrides={}) {
  return {
    id,
    type:'source',
    title:`Source ${id}`,
    sourceKind:'journal article',
    peerReviewed:true,
    primary:true,
    retracted:false,
    relevance:0.9,
    stanceConfidence:0.9,
    publisher:`Publisher ${id}`,
    doi:`10.1000/${id}`,
    ...overrides
  };
}

test('source quality rewards direct primary peer-reviewed evidence and strongly penalizes retraction', () => {
  const strong = scoreSourceQuality(source('strong'));
  const weak = scoreSourceQuality(source('weak',{sourceKind:'blog',peerReviewed:false,primary:false,relevance:0.45,stanceConfidence:0.5}));
  const retracted = scoreSourceQuality(source('retracted',{retracted:true}));
  assert.ok(strong.score > 0.7);
  assert.ok(weak.score < strong.score);
  assert.ok(retracted.score < 0.1);
  assert.ok(retracted.flags.includes('retracted'));
});

test('multiple independent high-quality direct sources can reach established, but duplicate provenance cannot', () => {
  const objects = [claim(), source('a'), source('b'), source('c')];
  const relations = [
    {fromId:'claim-1',toId:'a',type:'supports'},
    {fromId:'claim-1',toId:'b',type:'supports'},
    {fromId:'claim-1',toId:'c',type:'supports'}
  ];
  const established = assessClaimEvidence('claim-1',objects,relations);
  assert.equal(established.evidenceState,'established');
  assert.ok(established.evidenceAssessment.confidence >= 0.75);
  assert.ok(established.evidenceAssessment.independentSourceGroups >= 3);

  const duplicates = [claim(), source('d1',{doi:'10.1000/same',publisher:'Same Lab'}), source('d2',{doi:'10.1000/same',publisher:'Same Lab'}), source('d3',{doi:'10.1000/same',publisher:'Same Lab'})];
  const duplicateRelations = duplicates.slice(1).map((item)=>({fromId:'claim-1',toId:item.id,type:'supports'}));
  const duplicateAssessment = assessClaimEvidence('claim-1',duplicates,duplicateRelations);
  assert.notEqual(duplicateAssessment.evidenceState,'established');
  assert.equal(duplicateAssessment.evidenceAssessment.independentSourceGroups,1);
});

test('credible support and credible counterevidence produce disputed rather than a misleading average', () => {
  const objects=[claim(), source('support1'), source('support2'), source('counter1'), source('counter2')];
  const relations=[
    {fromId:'claim-1',toId:'support1',type:'supports'},
    {fromId:'claim-1',toId:'support2',type:'supports'},
    {fromId:'claim-1',toId:'counter1',type:'contradicts'},
    {fromId:'claim-1',toId:'counter2',type:'contradicts'}
  ];
  const result=assessClaimEvidence('claim-1',objects,relations);
  assert.equal(result.evidenceState,'disputed');
  assert.ok(result.evidenceAssessment.supportWeight > 0);
  assert.ok(result.evidenceAssessment.challengeWeight > 0);
});

test('claim wording is only a framing signal and never upgrades evidence by itself', () => {
  const speculative=classifyClaimLanguage('It might be possible that an unknown field controls thoughts remotely.');
  assert.equal(speculative.kind,'speculative');
  const result=assessClaimEvidence('claim-1',[claim('It might be possible that an unknown field controls thoughts remotely.')],[]);
  assert.ok(['speculation','unverified'].includes(result.evidenceState));
  assert.equal(result.evidenceAssessment.supportingSources,0);
});

test('automatic discovery builds several focused queries from claim and Space context', () => {
  const queries=buildSourceQueries({
    claim:{title:'Pulsed radio-frequency exposure can produce auditory perception under specific conditions.'},
    publication:{title:'Bioelectromagnetic Effects',summary:'A source-first review of electromagnetic effects and disputed extrapolations.'},
    topics:['Frontier Science','Consciousness']
  });
  assert.ok(queries.length >= 3);
  assert.ok(queries.every((query)=>query.length > 8));
  assert.ok(new Set(queries).size === queries.length);
});

test('discovered source ranking uses relevance, metadata quality, retraction status, and stance confidence', () => {
  const candidate=normalizeSourceCandidate({
    provider:'crossref',
    id:'10.1000/example',
    title:'Pulsed radiofrequency auditory perception in humans',
    abstract:'Experimental exposure produced an auditory percept under controlled conditions.',
    doi:'10.1000/example',
    year:2024,
    publisher:'Example Journal',
    type:'journal-article',
    citationCount:44,
    retracted:false,
    url:'https://doi.org/10.1000/example'
  });
  const ranked=rankSourceCandidate(candidate,'Pulsed radio-frequency exposure can produce auditory perception under specific conditions.');
  assert.ok(ranked.relevance >= 0.36);
  assert.ok(ranked.rankScore > 0.4);
  assert.ok(['supports','contradicts','context'].includes(ranked.stance));
});

test('source discovery deduplicates DOI/version aliases before evidence assessment', () => {
  const candidates=[
    {provider:'crossref',id:'a',doi:'10.1000/ABC',title:'Same paper'},
    {provider:'datacite',id:'b',doi:'https://doi.org/10.1000/abc',title:'Same paper'},
    {provider:'crossref',id:'c',doi:'10.1000/other',title:'Different paper'}
  ].map(normalizeSourceCandidate);
  const unique=dedupeSourceCandidates(candidates);
  assert.equal(unique.length,2);
});