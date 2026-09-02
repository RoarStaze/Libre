import { escapeHTML, evidencePill, formatNumber } from '../../shared/dom.js';
import { icon } from '../../shared/icons.js';

const TYPE_LABELS = {
  publication: 'Investigation',
  claim: 'Claim',
  document: 'Primary document',
  video: 'Video',
  trail: 'Trail',
  debate: 'Debate',
  dataset: 'Dataset',
  collection: 'Collection'
};

function objectById(graph, id) {
  return graph.objects.find((object) => object.id === id);
}

function creatorFor(object, graph) {
  return object.creatorId ? objectById(graph, object.creatorId) : null;
}

function topicFor(object, graph) {
  return object.topicIds?.length ? objectById(graph, object.topicIds[0]) : null;
}

function initials(value = 'Libre') {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function compactReason(reasons = []) {
  if (!reasons.length) return '';
  return reasons[0]
    .replace('Because you follow ', '')
    .replace('Because you saved ', '')
    .replace('Connected to ', '')
    .replace('Recommended for ', '');
}

function durationLabel(object) {
  if (object.type === 'video') return object.duration || 'Watch';
  if (object.type === 'publication') return `${object.readMinutes || 0} min`;
  if (object.type === 'trail') return `${object.readMinutes || 0} min`;
  if (object.type === 'document') return `${object.pages || '?'} pp`;
  if (object.type === 'dataset') return `${formatNumber(object.rows || 0)} rows`;
  if (object.type === 'collection') return `${object.items?.length || 0} items`;
  if (object.type === 'debate') return `${object.sourceCount || 0} sources`;
  return `${object.sourceCount || 0} sources`;
}

function metadata(object) {
  if (object.type === 'publication') return `${object.sourceCount || 0} sources · ${object.claimCount || 0} claims`;
  if (object.type === 'claim') return `${object.sourceCount || 0} sources · ${object.supportCount || 0} support · ${object.contradictCount || 0} challenge`;
  if (object.type === 'document') return `${object.publisher || 'Archive'} · ${object.year || 'Undated'}`;
  if (object.type === 'video') return `${object.sourceCount || 0} sources · ${object.transcript ? 'Transcript indexed' : 'Video'}`;
  if (object.type === 'trail') return `${object.steps?.length || 0} steps · Guided research path`;
  if (object.type === 'debate') return `${object.proCount || 0} support · ${object.conCount || 0} challenge`;
  if (object.type === 'dataset') return `${formatNumber(object.rows || 0)} records · Structured data`;
  if (object.type === 'collection') return `${object.items?.length || 0} objects · Human curated`;
  return 'Connected knowledge';
}

function visualInvestigation(object) {
  const keyword = object.tags?.[0] || object.topicIds?.[0]?.replace('topic-', '').replaceAll('-', ' ') || 'Investigation';
  return `<div class="signal-visual-art visual-investigation">
    <div class="visual-glow visual-glow-a"></div><div class="visual-glow visual-glow-b"></div>
    <div class="visual-word">${escapeHTML(keyword)}</div>
    <div class="visual-network" aria-hidden="true"><i></i><i></i><i></i><i></i><span></span><span></span><span></span></div>
    <div class="visual-caption">${object.sourceCount || 0} sources / ${object.claimCount || 0} claims</div>
  </div>`;
}

function visualClaim(object) {
  const total = Math.max(1, (object.supportCount || 0) + (object.contradictCount || 0));
  const support = Math.round(((object.supportCount || 0) / total) * 100);
  return `<div class="signal-visual-art visual-claim">
    <div class="visual-quote-mark">“</div>
    <div class="visual-claim-copy">CLAIM</div>
    <div class="visual-claim-meter"><span class="meter-support" style="width:${support}%"></span><span class="meter-challenge" style="width:${100-support}%"></span></div>
    <div class="visual-claim-stats"><span>${object.supportCount || 0} support</span><span>${object.contradictCount || 0} challenge</span></div>
  </div>`;
}

function visualDocument(object) {
  return `<div class="signal-visual-art visual-document">
    <div class="doc-shadow-sheet"></div>
    <div class="doc-preview-sheet"><small>${escapeHTML(object.publisher || 'PUBLIC ARCHIVE')}</small><b>${escapeHTML(String(object.year || ''))}</b><div class="doc-preview-lines"></div><span>DECLASSIFIED / PUBLIC RECORD</span></div>
    <div class="doc-index-mark">${escapeHTML(String(object.year || '').slice(-2) || 'AR')}</div>
  </div>`;
}

function visualVideo(object) {
  return `<div class="signal-visual-art visual-video">
    <div class="video-rings"><i></i><i></i><i></i></div>
    <div class="video-wave" aria-hidden="true">${Array.from({length:28},(_,index)=>`<i style="--h:${20 + ((index * 37) % 65)}%"></i>`).join('')}</div>
    <div class="video-play">${icon('arrow',22)}</div>
    <div class="visual-caption">Transcript + sources connected</div>
  </div>`;
}

function visualTrail(object, graph) {
  const steps = (object.steps || []).slice(0, 5).map((id) => objectById(graph, id)).filter(Boolean);
  return `<div class="signal-visual-art visual-trail">
    <div class="trail-preview-line"></div>
    <div class="trail-preview-nodes">${steps.map((step,index)=>`<div class="trail-preview-node"><i>${index+1}</i><span>${escapeHTML(step.title)}</span></div>`).join('')}</div>
    <div class="visual-caption">A guided route through connected evidence</div>
  </div>`;
}

function visualDebate(object) {
  return `<div class="signal-visual-art visual-debate">
    <div class="debate-half debate-half-support"><small>SUPPORT</small><strong>${object.proCount || 0}</strong></div>
    <div class="debate-divider"><span>VS</span></div>
    <div class="debate-half debate-half-challenge"><small>CHALLENGE</small><strong>${object.conCount || 0}</strong></div>
  </div>`;
}

function visualDataset(object) {
  return `<div class="signal-visual-art visual-dataset">
    <div class="dataset-grid" aria-hidden="true">${Array.from({length:48},(_,index)=>`<i style="--a:${.16 + ((index * 13) % 60) / 100}"></i>`).join('')}</div>
    <div class="dataset-hero-number">${formatNumber(object.rows || 0)}</div>
    <div class="visual-caption">indexed records</div>
  </div>`;
}

function visualCollection(object) {
  return `<div class="signal-visual-art visual-collection">
    <div class="collection-preview-stack"><i></i><i></i><i></i><i></i></div>
    <div class="collection-preview-count">${object.items?.length || 0}<small>CONNECTED OBJECTS</small></div>
  </div>`;
}

function customThumbnail(object) {
  return `<div class="signal-visual-art visual-custom-thumbnail"><img class="signal-card-thumbnail" src="${escapeHTML(object.thumbnail)}" alt="${escapeHTML(object.title)} thumbnail"><div class="thumbnail-vignette" aria-hidden="true"></div></div>`;
}

function visualFor(object, graph) {
  if(object.thumbnail) return customThumbnail(object);
  if (object.type === 'claim') return visualClaim(object);
  if (object.type === 'document') return visualDocument(object);
  if (object.type === 'video') return visualVideo(object);
  if (object.type === 'trail') return visualTrail(object, graph);
  if (object.type === 'debate') return visualDebate(object);
  if (object.type === 'dataset') return visualDataset(object);
  if (object.type === 'collection') return visualCollection(object);
  return visualInvestigation(object);
}

function quickActions(object) {
  return `<div class="signal-card-actions" aria-label="Post actions">
    <button class="signal-card-action" data-save-object="${escapeHTML(object.id)}" aria-label="Save" title="Save">${icon('bookmark',17)}</button>
    <button class="signal-card-action" data-rabbit-object="${escapeHTML(object.id)}" aria-label="Take me deeper" title="Take me deeper">${icon('rabbit',17)}</button>
    <button class="signal-card-action" data-more-object="${escapeHTML(object.id)}" aria-label="Why this?" title="Why this?">${icon('more',17)}</button>
  </div>`;
}

export function renderSignal(entry, graph) {
  const { object, reasons = [] } = entry;
  const creator = creatorFor(object, graph);
  const topic = topicFor(object, graph);
  const typeLabel = TYPE_LABELS[object.type] || object.type.replaceAll('_', ' ');
  const creatorName = creator?.title || 'Libre Network';
  const reason = compactReason(reasons);

  return `<article class="signal signal-card signal--${escapeHTML(object.type === 'publication' ? 'investigation' : object.type)}" data-object-id="${escapeHTML(object.id)}" data-depth-card style="view-transition-name: signal-${escapeHTML(object.id)}">
    <div class="signal-card-visual">
      ${visualFor(object, graph)}
      <button class="signal-card-cover" data-open-object="${escapeHTML(object.id)}" aria-label="Open ${escapeHTML(object.title)}"></button>
      <div class="signal-card-type">${escapeHTML(typeLabel)}</div>
      <div class="signal-card-duration">${escapeHTML(durationLabel(object))}</div>
      ${quickActions(object)}
    </div>
    <div class="signal-card-body">
      <button class="signal-card-avatar" data-route="${creator ? `/profile/${creator.id}` : '/'}" aria-label="Open ${escapeHTML(creatorName)} profile">${escapeHTML(creator?.avatar || initials(creatorName))}</button>
      <div class="signal-card-copy">
        <button class="signal-card-title-button" data-open-object="${escapeHTML(object.id)}">${escapeHTML(object.title)}</button>
        <div class="signal-card-byline"><span>${escapeHTML(creatorName)}</span>${topic ? `<span>·</span><span>${escapeHTML(topic.title)}</span>` : ''}</div>
        <div class="signal-card-meta">${escapeHTML(metadata(object))}</div>
        <div class="signal-card-context">${object.evidenceState ? evidencePill(object.evidenceState) : ''}${reason ? `<span class="signal-card-reason">${escapeHTML(reason)}</span>` : ''}</div>
      </div>
      <button class="signal-card-menu" data-more-object="${escapeHTML(object.id)}" aria-label="More options">${icon('more',18)}</button>
    </div>
  </article>`;
}
