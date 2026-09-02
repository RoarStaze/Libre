const SOURCE_TYPES = new Set(['source', 'document', 'document_passage', 'dataset']);
const SUPPORTING_RELATIONS = new Set(['supports']);
const CHALLENGING_RELATIONS = new Set(['contradicts']);

function uniqueSourceTargets(claimId, objects, relations, allowedRelations) {
  const byId = new Map(objects.map((object) => [object.id, object]));
  return new Set(
    relations
      .filter((relation) => relation.fromId === claimId && allowedRelations.has(relation.type))
      .map((relation) => byId.get(relation.toId))
      .filter((object) => object && SOURCE_TYPES.has(object.type))
      .map((object) => object.id)
  );
}

export function assessClaimEvidence(claimId, objects, relations) {
  const supporting = uniqueSourceTargets(claimId, objects, relations, SUPPORTING_RELATIONS);
  const challenging = uniqueSourceTargets(claimId, objects, relations, CHALLENGING_RELATIONS);

  let state = 'unverified';
  if (supporting.size > 0 && challenging.size > 0) state = 'disputed';
  else if (supporting.size >= 3) state = 'supported';
  else if (supporting.size >= 1) state = 'preliminary';

  return {
    evidenceState: state,
    evidenceAssessment: {
      method: 'libre-auto-v1',
      supportingSources: supporting.size,
      challengingSources: challenging.size,
      establishedReserved: true
    }
  };
}

export function recalculateDraftEvidence(draft) {
  const objects = draft.objects.map((object) => {
    const clean = { ...object };
    delete clean.evidenceAssessment;

    if (clean.type !== 'claim') {
      delete clean.evidenceState;
      return clean;
    }

    return {
      ...clean,
      ...assessClaimEvidence(clean.id, draft.objects, draft.relations)
    };
  });

  return { ...draft, objects };
}

export function derivePublicationEvidence(objects) {
  const states = objects
    .filter((object) => object.type === 'claim')
    .map((object) => object.evidenceState || 'unverified');

  if (!states.length) return 'unverified';
  if (states.includes('disputed')) return 'disputed';
  if (states.includes('unverified')) return 'unverified';
  if (states.includes('preliminary')) return 'preliminary';
  if (states.every((state) => state === 'supported')) return 'supported';
  return 'unverified';
}
