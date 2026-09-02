const branchLabels = {
  supports: 'Supporting evidence',
  contradicts: 'Counterevidence',
  derived_from: 'Derived connection',
  mentions: 'Mentioned here',
  explains: 'Explanation',
  questions: 'Disputed connection',
  responds_to: 'Response',
  preceded_by: 'Earlier / later context',
  part_of: 'Contained in',
  cites: 'Primary source',
  related_to: 'Related rabbit hole',
  alternative_interpretation_of: 'Alternative interpretation',
  forked_from: 'Fork lineage'
};

export function createSelectors(graph) {
  const byId = new Map(graph.objects.map((object) => [object.id, object]));

  const outgoing = (id) => graph.relations.filter((relation) => relation.fromId === id);
  const incoming = (id) => graph.relations.filter((relation) => relation.toId === id);
  const object = (id) => byId.get(id) || null;
  const related = (id) => [...outgoing(id), ...incoming(id)].map((relation) => ({
    relation,
    object: object(relation.fromId === id ? relation.toId : relation.fromId),
    direction: relation.fromId === id ? 'out' : 'in'
  })).filter((entry) => entry.object);

  function provenanceChain(id, visited = new Set()) {
    if (visited.has(id)) return [];
    visited.add(id);
    const current = object(id);
    if (!current) return [];
    const parentRelation = outgoing(id).find((relation) => ['part_of','derived_from'].includes(relation.type));
    const explicitParent = current.parentId ? object(current.parentId) : null;
    if (explicitParent) return [current, ...provenanceChain(explicitParent.id, visited)];
    if (parentRelation) return [current, ...provenanceChain(parentRelation.toId, visited)];
    return [current];
  }

  function claimsFor(spaceId) {
    return related(spaceId).filter((entry) => entry.object.type === 'claim').map((entry) => entry.object);
  }

  function sourcesFor(id) {
    const seen = new Set();
    const result = [];
    const queue = [id];
    while (queue.length) {
      const currentId = queue.shift();
      for (const entry of related(currentId)) {
        const candidate = entry.object;
        if (seen.has(candidate.id)) continue;
        seen.add(candidate.id);
        if (['source','document','document_passage','dataset'].includes(candidate.type)) result.push(candidate);
        if (candidate.type === 'claim') queue.push(candidate.id);
      }
    }
    return result;
  }

  function timelineFor(id) {
    return related(id).map((entry) => entry.object)
      .filter((candidate) => candidate.type === 'timeline_event')
      .sort((a,b) => (a.year || 0) - (b.year || 0));
  }

  function rabbitHoleBranches(id) {
    const direct = related(id).map((entry) => ({
      label: branchLabels[entry.relation.type] || 'Connected knowledge',
      relation: entry.relation,
      object: entry.object
    }));
    const unique = [];
    const seen = new Set();
    for (const branch of direct) {
      if (seen.has(branch.object.id)) continue;
      seen.add(branch.object.id);
      unique.push(branch);
    }
    if (unique.length < 3) {
      const current = object(id);
      const topicIds = current?.topicIds || [];
      for (const candidate of graph.objects) {
        if (candidate.id === id || seen.has(candidate.id)) continue;
        if ((candidate.topicIds || []).some((topicId) => topicIds.includes(topicId))) {
          unique.push({ label:'Explore adjacent topic', relation:null, object:candidate });
          seen.add(candidate.id);
        }
        if (unique.length >= 6) break;
      }
    }
    return unique.slice(0,6);
  }

  return { object, outgoing, incoming, related, provenanceChain, claimsFor, sourcesFor, timelineFor, rabbitHoleBranches };
}
