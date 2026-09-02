const SOURCE_TYPES = new Set(['source', 'document', 'document_passage', 'dataset']);
const SUPPORTING_RELATIONS = new Set(['supports']);
const CHALLENGING_RELATIONS = new Set(['contradicts']);

const clamp = (value, min=0, max=1) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
const mean = (values) => values.length ? values.reduce((sum,value)=>sum+value,0) / values.length : 0;

const KIND_BASE = new Map([
  ['meta-analysis', .95],
  ['systematic review', .93],
  ['randomized controlled trial', .88],
  ['randomized trial', .87],
  ['controlled trial', .82],
  ['government document', .86],
  ['official record', .86],
  ['archival record', .82],
  ['peer-reviewed study', .79],
  ['journal article', .72],
  ['research article', .72],
  ['review', .78],
  ['dataset', .74],
  ['report', .66],
  ['book', .58],
  ['conference paper', .52],
  ['preprint', .44],
  ['thesis', .52],
  ['news', .34],
  ['website', .28],
  ['blog', .18],
  ['unknown', .40]
]);

function text(value='') { return String(value || '').toLowerCase().trim(); }
function normalizeDoi(value='') {
  return text(value).replace(/^https?:\/\/(dx\.)?doi\.org\//,'').replace(/^doi:\s*/,'').replace(/[?#].*$/,'');
}
function normalizeUrl(value='') {
  try {
    const url=new URL(value);
    url.hash='';
    ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].forEach((key)=>url.searchParams.delete(key));
    return `${url.hostname.replace(/^www\./,'')}${url.pathname.replace(/\/$/,'')}${url.search}`.toLowerCase();
  } catch { return text(value); }
}
function normalizedTitle(value='') { return text(value).replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim(); }

function inferSourceKind(source={}) {
  const explicit=text(source.sourceKind || source.studyType || source.resourceType || source.typeLabel);
  if (explicit) {
    for (const kind of KIND_BASE.keys()) if (explicit.includes(kind)) return kind;
    if (explicit.includes('journal') || explicit.includes('article')) return 'journal article';
    if (explicit.includes('preprint')) return 'preprint';
    if (explicit.includes('dataset')) return 'dataset';
    if (explicit.includes('government') || explicit.includes('congress') || explicit.includes('federal register')) return 'government document';
    if (explicit.includes('archive')) return 'archival record';
    if (explicit.includes('report')) return 'report';
    if (explicit.includes('book')) return 'book';
  }
  if (source.type === 'document' || source.official === true) return 'official record';
  if (source.type === 'dataset') return 'dataset';
  return 'unknown';
}

function metadataCompleteness(source={}) {
  const fields=[source.title,source.publisher,source.year || source.publicationYear,source.doi || source.url,source.authors?.length || source.author,source.abstract || source.description];
  return fields.filter(Boolean).length / fields.length;
}

/**
 * Scores a source's evidentiary usefulness, not whether it agrees with a claim.
 * Citation count is deliberately a small modifier; popularity cannot manufacture truth.
 */
export function scoreSourceQuality(source={}) {
  const kind=inferSourceKind(source);
  const flags=[];
  let score=KIND_BASE.get(kind) ?? KIND_BASE.get('unknown');
  const peerReviewed=source.peerReviewed === true || ['journal article','peer-reviewed study','systematic review','meta-analysis','randomized controlled trial','randomized trial','controlled trial','review'].includes(kind);
  const primary=source.primary === true || ['randomized controlled trial','randomized trial','controlled trial','peer-reviewed study','journal article','government document','official record','archival record','dataset'].includes(kind);
  const official=source.official === true || ['government document','official record'].includes(kind);
  const relevance=clamp(source.relevance ?? 0.65);
  const stanceConfidence=clamp(source.stanceConfidence ?? 0.65);
  const completeness=metadataCompleteness(source);

  if (peerReviewed) score += .055;
  if (primary) score += .045;
  if (official) score += .06;
  if (normalizeDoi(source.doi)) score += .035;
  if (source.fullTextAvailable || source.openAccess) score += .012;

  const citations=Math.max(0, Number(source.citationCount || source.citedByCount || 0));
  score += Math.min(.055, Math.log10(citations + 1) * .018);

  // Relevance/directness and metadata quality matter more than prestige.
  score *= .68 + relevance * .32;
  score *= .90 + stanceConfidence * .10;
  score *= .88 + completeness * .12;

  if (source.retracted === true) {
    flags.push('retracted');
    score = Math.min(score * .06, .045);
  }
  if (source.isParatext === true) { flags.push('paratext'); score *= .35; }
  if (source.preprint === true || kind === 'preprint') flags.push('preprint');
  if (relevance < .5) flags.push('indirect');
  if (completeness < .5) flags.push('sparse-metadata');
  if (!peerReviewed && !official && !primary) flags.push('unverified-methodology');

  return {
    score: clamp(score),
    kind,
    flags,
    components:{ peerReviewed, primary, official, relevance, stanceConfidence, completeness, citations }
  };
}

export function classifyClaimLanguage(value='') {
  const phrase=` ${text(value).replace(/[^a-z0-9' -]+/g,' ')} `;
  const signals=[];
  const has=(patterns)=>patterns.some((pattern)=>phrase.includes(pattern));

  if (has([' might ',' may ',' could ',' possibly ',' possible that ',' speculate ',' speculation ',' perhaps ',' i suspect ',' i believe '])) {
    signals.push('explicit uncertainty');
    return {kind:'speculative',signals};
  }
  if (has([' hypothesis ',' theory ',' theoretical ',' model proposes ',' proposed mechanism '])) {
    signals.push('theoretical framing');
    return {kind:'theoretical',signals};
  }
  if (has([' causes ',' caused ',' produces ',' produced ',' increases ',' decreases ',' changes ',' effect ',' affects ',' leads to ',' results in '])) {
    signals.push('causal/effect wording');
    return {kind:'causal',signals};
  }
  if (has([' existed ',' was founded ',' was created ',' was approved ',' was funded ',' occurred ',' happened ',' declassified ',' records show '])) {
    signals.push('historical/existence wording');
    return {kind:'historical',signals};
  }
  return {kind:'factual',signals};
}

export function canonicalSourceGroup(source={}) {
  const doi=normalizeDoi(source.doi);
  if (doi) return `doi:${doi}`;
  if (source.studyId) return `study:${text(source.studyId)}`;
  if (source.sourceGroup) return `group:${text(source.sourceGroup)}`;
  if (source.parentId) return `parent:${text(source.parentId)}`;
  const url=normalizeUrl(source.url);
  if (url) return `url:${url}`;
  const title=normalizedTitle(source.title);
  const year=source.year || source.publicationYear || '';
  return `title:${title}|${year}`;
}

function evidenceTargets(claimId, objects, relations, allowedRelations) {
  const byId=new Map(objects.map((object)=>[object.id,object]));
  return relations
    .filter((relation)=>relation.fromId===claimId && allowedRelations.has(relation.type))
    .map((relation)=>({ relation, source:byId.get(relation.toId) }))
    .filter(({source})=>source && SOURCE_TYPES.has(source.type));
}

function collapseIndependent(items) {
  const groups=new Map();
  for (const item of items) {
    const group=canonicalSourceGroup(item.source);
    const scored=scoreSourceQuality(item.source);
    const relevance=clamp(item.source.relevance ?? scored.components.relevance ?? .65);
    const stanceConfidence=clamp(item.source.stanceConfidence ?? scored.components.stanceConfidence ?? .65);
    const weight=scored.score * (.80 + relevance*.20) * (.82 + stanceConfidence*.18);
    const existing=groups.get(group);
    if (!existing || weight > existing.weight) groups.set(group,{...item,group,quality:scored,weight});
  }
  return [...groups.values()];
}

function assessmentReasons({state,supportGroups,challengeGroups,avgSupportQuality,directness,retractedCount,confidence}) {
  const reasons=[];
  if (!supportGroups.length && !challengeGroups.length) reasons.push('No direct supporting or challenging sources are connected yet.');
  if (supportGroups.length) reasons.push(`${supportGroups.length} independent supporting source group${supportGroups.length===1?'':'s'} contributed to the assessment.`);
  if (challengeGroups.length) reasons.push(`${challengeGroups.length} independent challenging source group${challengeGroups.length===1?'':'s'} contributed to the assessment.`);
  if (supportGroups.length && avgSupportQuality >= .72) reasons.push('Supporting evidence is predominantly high-quality by available metadata.');
  if (directness < .55 && (supportGroups.length || challengeGroups.length)) reasons.push('Much of the connected evidence is indirect or only partially relevant to the exact claim.');
  if (retractedCount) reasons.push(`${retractedCount} retracted source${retractedCount===1?' was':'s were'} strongly discounted.`);
  if (state==='disputed') reasons.push('Material credible evidence points in competing directions; Libre does not average the disagreement away.');
  if (state==='established') reasons.push('The claim cleared Libre’s high-certainty thresholds for quality, directness, independence, corroboration, and low contradiction.');
  if (confidence < .55) reasons.push('Classification confidence is limited by evidence volume or metadata completeness.');
  return reasons;
}

export function assessClaimEvidence(claimId, objects, relations) {
  const claim=objects.find((object)=>object.id===claimId && object.type==='claim');
  const supportGroups=collapseIndependent(evidenceTargets(claimId,objects,relations,SUPPORTING_RELATIONS));
  const challengeGroups=collapseIndependent(evidenceTargets(claimId,objects,relations,CHALLENGING_RELATIONS));
  const allGroups=[...supportGroups,...challengeGroups];

  const supportWeight=supportGroups.reduce((sum,item)=>sum+item.weight,0);
  const challengeWeight=challengeGroups.reduce((sum,item)=>sum+item.weight,0);
  const avgSupportQuality=mean(supportGroups.map((item)=>item.quality.score));
  const avgChallengeQuality=mean(challengeGroups.map((item)=>item.quality.score));
  const avgQuality=mean(allGroups.map((item)=>item.quality.score));
  const directness=mean(allGroups.map((item)=>item.quality.components.relevance));
  const metadata=mean(allGroups.map((item)=>item.quality.components.completeness));
  const independentSourceGroups=new Set(allGroups.map((item)=>item.group)).size;
  const retractedCount=allGroups.filter((item)=>item.quality.flags.includes('retracted')).length;
  const language=classifyClaimLanguage(claim?.title || '');

  // Confidence means confidence in Libre's classification process, not probability that the claim is true.
  const confidence=clamp(
    .16 +
    Math.min(1, independentSourceGroups/4)*.34 +
    avgQuality*.25 +
    directness*.17 +
    metadata*.08
  );

  let state='unverified';
  const materialChallenge=challengeWeight >= .55;
  const materialSupport=supportWeight >= .45;
  const conflictRatio=supportWeight > 0 ? challengeWeight/supportWeight : (challengeWeight>0?Infinity:0);

  if (materialChallenge && (materialSupport || challengeWeight >= .9)) {
    state='disputed';
  } else if (
    supportGroups.length >= 3 &&
    supportWeight >= 2.05 &&
    avgSupportQuality >= .72 &&
    directness >= .68 &&
    confidence >= .75 &&
    retractedCount === 0 &&
    challengeWeight <= Math.max(.28, supportWeight*.18)
  ) {
    state='established';
  } else if (
    supportGroups.length >= 2 &&
    supportWeight >= 1.15 &&
    avgSupportQuality >= .55 &&
    challengeWeight < supportWeight*.45
  ) {
    state='supported';
  } else if (materialSupport) {
    state='preliminary';
  } else if (!allGroups.length && language.kind==='speculative') {
    state='speculation';
  } else if (!materialSupport && language.kind==='theoretical') {
    state='theory';
  }

  const reasons=assessmentReasons({state,supportGroups,challengeGroups,avgSupportQuality,directness,retractedCount,confidence});

  return {
    evidenceState:state,
    evidenceAssessment:{
      method:'libre-auto-v2',
      frameworkVersion:2,
      supportingSources:supportGroups.length,
      challengingSources:challengeGroups.length,
      independentSourceGroups,
      supportWeight:Number(supportWeight.toFixed(3)),
      challengeWeight:Number(challengeWeight.toFixed(3)),
      averageSourceQuality:Number(avgQuality.toFixed(3)),
      averageSupportQuality:Number(avgSupportQuality.toFixed(3)),
      averageChallengeQuality:Number(avgChallengeQuality.toFixed(3)),
      directness:Number(directness.toFixed(3)),
      metadataCompleteness:Number(metadata.toFixed(3)),
      confidence:Number(confidence.toFixed(3)),
      conflictRatio:Number.isFinite(conflictRatio)?Number(conflictRatio.toFixed(3)):null,
      retractedSources:retractedCount,
      claimLanguage:language,
      reasons,
      establishedReserved:false,
      caveat:'Automated evidence assessment is a transparent triage system, not a substitute for expert systematic review.'
    }
  };
}

export function recalculateDraftEvidence(draft) {
  const snapshotObjects=draft.objects.map((object)=>({...object}));
  const objects=snapshotObjects.map((object)=>{
    const clean={...object};
    delete clean.evidenceAssessment;
    if (clean.type !== 'claim') {
      // Automatically discovered sources may carry source-quality metadata, but evidence labels belong to claims/publications.
      delete clean.evidenceState;
      return clean;
    }
    return {...clean,...assessClaimEvidence(clean.id,snapshotObjects,draft.relations)};
  });
  return {...draft,objects};
}

export function derivePublicationEvidence(objects) {
  const claims=objects.filter((object)=>object.type==='claim');
  if (!claims.length) return 'unverified';
  const states=claims.map((object)=>object.evidenceState || 'unverified');
  if (states.includes('disputed')) return 'disputed';
  if (states.every((state)=>state==='established')) return 'established';
  if (states.every((state)=>['established','supported'].includes(state))) return 'supported';
  if (states.some((state)=>state==='preliminary')) return 'preliminary';
  if (states.some((state)=>state==='theory')) return 'theory';
  if (states.some((state)=>state==='speculation')) return 'speculation';
  return 'unverified';
}
