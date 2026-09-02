import { escapeHTML, evidencePill, formatNumber, typePill } from '../../shared/dom.js';
import { icon } from '../../shared/icons.js';

function actions(object) {
  return `<div class="signal-actions">
    <button class="signal-action open-space-button" data-open-object="${escapeHTML(object.id)}">Open ${object.type==='publication'?'Space':'context'} ${icon('arrow',16)}</button>
    <button class="signal-action" data-save-object="${escapeHTML(object.id)}">${icon('bookmark',16)} Save</button>
    <button class="signal-action" data-rabbit-object="${escapeHTML(object.id)}">${icon('rabbit',16)} Take me deeper</button>
    <button class="signal-action" data-more-object="${escapeHTML(object.id)}">${icon('more',16)} Why this?</button>
  </div>`;
}

function commonTopline(object, reason='') {
  const topic = object.topicIds?.[0]?.replace('topic-','').replaceAll('-',' ') || object.type;
  return `<div class="signal-topline"><span>${escapeHTML(topic)}</span><span>•</span><span>${escapeHTML(object.format || object.type.replaceAll('_',' '))}</span>${reason?`<span>•</span><span>${escapeHTML(reason)}</span>`:''}</div>`;
}

function constellation() {
  return `<div class="signal-constellation" aria-hidden="true">
    <span class="node-line" style="width:58%;left:19%;top:42%;transform:rotate(-22deg)"></span>
    <span class="node-line" style="width:44%;left:23%;top:53%;transform:rotate(18deg)"></span>
    <span class="node-line" style="width:55%;left:23%;top:53%;transform:rotate(45deg)"></span>
    <span class="const-node core" style="left:8%;top:42%">SPACE</span>
    <span class="const-node" style="right:5%;top:12%">source</span>
    <span class="const-node" style="right:0;top:50%">claim</span>
    <span class="const-node" style="right:12%;bottom:7%">counterpoint</span>
  </div>`;
}

function investigationSignal(entry) {
  const {object,reasons=[]}=entry;
  return `<article class="signal signal--investigation" data-object-id="${object.id}" style="view-transition-name: signal-${object.id}"><div class="signal-inner"><div>${commonTopline(object,reasons[0])}<h2 class="signal-title">${escapeHTML(object.title)}</h2><p class="signal-summary">${escapeHTML(object.summary || object.subtitle || '')}</p><div class="signal-meta">${evidencePill(object.evidenceState)}<span>${object.sourceCount||0} sources</span><span>${object.claimCount||0} claims</span><span>${object.readMinutes||0} min</span></div>${actions(object)}</div>${constellation()}</div></article>`;
}

function claimSignal(entry) {
  const {object,reasons=[]}=entry;
  return `<article class="signal signal--claim" data-object-id="${object.id}" style="view-transition-name: signal-${object.id}"><div class="signal-inner"><div>${commonTopline(object,reasons[0])}<div style="margin-top:14px">${evidencePill(object.evidenceState)}</div><h2 class="signal-title">${escapeHTML(object.title)}</h2><div class="signal-meta"><span>${object.sourceCount||0} connected sources</span><span>Inspectable claim</span></div>${actions(object)}</div><div class="claim-balance" aria-label="Evidence balance"><div class="claim-side support"><small>Supporting</small><strong>${object.supportCount||0}</strong><span>sources</span></div><div class="claim-side challenge"><small>Challenging</small><strong>${object.contradictCount||0}</strong><span>sources</span></div></div></div></article>`;
}

function documentSignal(entry) {
  const {object,reasons=[]}=entry;
  return `<article class="signal signal--document" data-object-id="${object.id}" style="view-transition-name: signal-${object.id}"><div class="signal-inner"><div class="document-sheet"><div style="font-size:.7rem">${escapeHTML(object.publisher||'Archive')}</div><div class="document-lines"></div></div><div>${commonTopline(object,reasons[0])}<h2 class="signal-title">${escapeHTML(object.title)}</h2><div class="signal-meta">${typePill('primary source')}<span>${object.year||''}</span><span>${object.pages||'?'} pages</span><span>${escapeHTML(object.provenance||'source record')}</span></div>${actions(object)}</div><div class="document-index">${String(object.year||'').slice(-2)}</div></div></article>`;
}

function videoSignal(entry) {
  const {object,reasons=[]}=entry;
  return `<article class="signal signal--video" data-object-id="${object.id}" style="view-transition-name: signal-${object.id}"><div class="signal-inner"><div class="video-frame"><div class="play-orbit">${icon('arrow',24)}</div></div><div>${commonTopline(object,reasons[0])}<h2 class="signal-title">${escapeHTML(object.title)}</h2><p class="signal-summary">${escapeHTML(object.summary||'')}</p><div class="signal-meta"><span>${object.duration||''}</span><span>${object.transcript?'Transcript indexed':'Video'}</span><span>${object.sourceCount||0} sources</span></div>${actions(object)}</div></div></article>`;
}

function trailSignal(entry, graph) {
  const {object,reasons=[]}=entry;
  const byId=new Map(graph.objects.map((o)=>[o.id,o]));
  return `<article class="signal signal--trail" data-object-id="${object.id}" style="view-transition-name: signal-${object.id}"><div class="signal-inner">${commonTopline(object,reasons[0])}<h2 class="signal-title">${escapeHTML(object.title)}</h2><p class="signal-summary">${escapeHTML(object.summary||'')}</p><div class="trail-track">${(object.steps||[]).map((id,index)=>`<div class="trail-step"><small>${String(index+1).padStart(2,'0')}</small><strong>${escapeHTML(byId.get(id)?.title||id)}</strong></div>`).join('')}</div><div class="signal-meta"><span>${object.steps?.length||0} steps</span><span>${object.readMinutes||0} min path</span></div>${actions(object)}</div></article>`;
}

function debateSignal(entry) {
  const {object,reasons=[]}=entry;
  return `<article class="signal signal--debate" data-object-id="${object.id}" style="view-transition-name: signal-${object.id}"><div class="signal-inner"><div>${commonTopline(object,reasons[0])}<h2 class="signal-title">${escapeHTML(object.title)}</h2><p class="signal-summary">Opposing claims remain visible side-by-side instead of being collapsed into a single popularity verdict.</p><div class="signal-meta">${evidencePill(object.evidenceState)}<span>${object.proCount||0} supporting branches</span><span>${object.conCount||0} challenging branches</span><span>${object.sourceCount||0} sources</span></div>${actions(object)}</div><div class="debate-axis" aria-label="Debate positions"><i class="debate-point"></i><i class="debate-point"></i><i class="debate-point"></i><i class="debate-point"></i></div></div></article>`;
}

function datasetSignal(entry) {
  const {object,reasons=[]}=entry;
  return `<article class="signal signal--dataset" data-object-id="${object.id}" style="view-transition-name: signal-${object.id}"><div class="signal-inner"><div>${commonTopline(object,reasons[0])}<h2 class="signal-title">${escapeHTML(object.title)}</h2><p class="signal-summary">${escapeHTML(object.summary||'')}</p><div class="signal-meta"><span>${formatNumber(object.rows||0)} records</span><span>Dataset</span></div>${actions(object)}</div><div class="dataset-number">${formatNumber(object.rows||0)}</div></div></article>`;
}

function collectionSignal(entry) {
  const {object,reasons=[]}=entry;
  return `<article class="signal signal--collection" data-object-id="${object.id}" style="view-transition-name: signal-${object.id}"><div class="signal-inner"><div>${commonTopline(object,reasons[0])}<h2 class="signal-title">${escapeHTML(object.title)}</h2><p class="signal-summary">A human-curated shelf that can mix primary records, claims, Spaces, datasets, and media.</p><div class="signal-meta"><span>${object.items?.length||0} objects</span><span>Curated collection</span></div>${actions(object)}</div><div class="collection-stack" aria-hidden="true"><span></span><span></span><span></span></div></div></article>`;
}

export function renderSignal(entry, graph) {
  const type=entry.object.type;
  if (type==='publication') return investigationSignal(entry);
  if (type==='claim') return claimSignal(entry);
  if (type==='document') return documentSignal(entry);
  if (type==='video') return videoSignal(entry);
  if (type==='trail') return trailSignal(entry,graph);
  if (type==='debate') return debateSignal(entry);
  if (type==='dataset') return datasetSignal(entry);
  if (type==='collection') return collectionSignal(entry);
  return investigationSignal(entry);
}
