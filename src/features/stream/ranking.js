function topicOverlap(object, followedTopics=[]) {
  return (object.topicIds || []).filter((topic) => followedTopics.includes(topic)).length;
}

function relationshipDensity(objectId, relations) {
  return relations.filter((relation) => relation.fromId===objectId || relation.toId===objectId).length;
}

function sourceRichness(object, relations) {
  const relationScore = relations.filter((relation) => relation.fromId===object.id && ['cites','supports','part_of'].includes(relation.type)).length;
  return (object.sourceCount || 0) + relationScore;
}

export function rankCandidates(profile, objects, relations) {
  const eligibleTypes = new Set(['publication','claim','document','video','trail','debate','dataset','collection']);
  const now = Date.now();
  const settings = { discovery:50, depth:50, freshness:50, unfamiliar:35, obscure:50, ...(profile.algorithm||{}) };
  const candidates = objects.filter((object) => eligibleTypes.has(object.type)).map((object) => {
    let score = 0;
    const reasons = [];
    const overlap = topicOverlap(object, profile.followedTopics);
    if (overlap) { score += 28*overlap; reasons.push('Matches a topic you follow'); }
    if (profile.followedCreators?.includes(object.creatorId)) { score += 30; reasons.push('From a creator you follow'); }
    const richness = sourceRichness(object, relations);
    if (richness >= 5) { score += Math.min(25, richness*1.5)*(settings.depth/70); reasons.push('Source-rich deep research'); }
    const density = relationshipDensity(object.id, relations);
    score += Math.min(16,density*2);
    const ageDays = object.createdAt ? (now-object.createdAt)/86_400_000 : 180;
    score += Math.max(0, 18-ageDays)*(settings.freshness/70);
    score += (object.depth || 40)*(settings.depth/100)*0.18;
    score += (object.popularity || 20)*0.16;
    if (profile.saved?.includes(object.id)) { score += 9; reasons.push('Connected to something you saved'); }
    if (!overlap && settings.discovery > 45) { score += settings.discovery*0.08; reasons.push('Outside your usual path for discovery'); }
    if ((object.popularity || 0) < 75) score += settings.obscure*0.05;
    if (profile.negative?.includes(object.id)) score -= 500;
    if (!reasons.length) reasons.push('Connected to your current knowledge neighborhood');
    return { object, score, reasons };
  }).sort((a,b)=>b.score-a.score);

  const mixed = [];
  const queue = [...candidates];
  const recentTypes = [];
  while (queue.length) {
    let pickIndex = 0;
    if (recentTypes.length >= 2 && recentTypes.at(-1) === recentTypes.at(-2)) {
      const alternate = queue.findIndex((entry) => entry.object.type !== recentTypes.at(-1));
      if (alternate > 0) pickIndex = alternate;
    }
    const [picked] = queue.splice(pickIndex,1);
    mixed.push(picked);
    recentTypes.push(picked.object.type);
    if (recentTypes.length > 3) recentTypes.shift();
  }
  return mixed;
}
