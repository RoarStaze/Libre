import { escapeHTML } from '../../shared/dom.js';
import { icon } from '../../shared/icons.js';

const typeOrder=['topic','person','publication','claim','document','trail','collection','video','dataset'];
const groupLabels={topic:'Topics',person:'Creators',publication:'Spaces',claim:'Claims',document:'Documents',trail:'Trails',collection:'Collections',video:'Video',dataset:'Datasets'};

function scoreObject(object, query) {
  const text=[object.title,object.subtitle,object.summary,object.bio,(object.tags||[]).join(' ')].filter(Boolean).join(' ').toLowerCase();
  const q=query.toLowerCase().trim();
  if(!q) return (object.popularity||0)/100;
  let score=0;
  if(object.title?.toLowerCase().startsWith(q)) score+=8;
  if(object.title?.toLowerCase().includes(q)) score+=5;
  for(const token of q.split(/\s+/)) if(text.includes(token)) score+=1.5;
  return score;
}

export function searchObjects(graph, query='') {
  return graph.objects.map((object)=>({object,score:scoreObject(object,query)})).filter((entry)=>entry.score>0).sort((a,b)=>b.score-a.score);
}

export function commandPaletteMarkup(graph, query='') {
  const results=searchObjects(graph,query).slice(0,28);
  const grouped=typeOrder.map((type)=>[type,results.filter((entry)=>entry.object.type===type)]).filter(([,items])=>items.length);
  return `<div class="command-backdrop" data-command-backdrop><section class="command-panel" role="dialog" aria-modal="true" aria-label="Libre Omnibar">
    <div class="command-input-wrap">${icon('search',21)}<input class="command-input" data-command-input autofocus placeholder="Search knowledge, claims, sources, creators…" value="${escapeHTML(query)}"><span class="kbd">ESC</span></div>
    <div class="command-results">${grouped.map(([type,items])=>`<div class="command-section-label">${groupLabels[type]||type}</div>${items.slice(0,6).map(({object})=>`<button class="command-result" style="width:100%;border:0;background:transparent;text-align:left" data-command-open="${object.id}"><span class="command-result-type">${icon(type==='person'?'user':type==='topic'?'compass':type==='trail'?'trail':type==='document'?'source':'layers',16)}</span><span><strong>${escapeHTML(object.title)}</strong><small style="display:block">${escapeHTML(object.summary||object.bio||object.subtitle||object.type)}</small></span><span>${icon('chevron',16)}</span></button>`).join('')}`).join('')}${!results.length?'<div class="empty-state" style="min-height:240px"><div><h2>No exact match</h2><p>Try a claim, person, program, source, or topic.</p></div></div>':''}</div>
  </section></div>`;
}

export function exploreMarkup(graph, query='') {
  const results=searchObjects(graph,query).slice(0,40);
  return `<section class="page"><div class="page-heading"><div><h1>Explore the network.</h1></div><p>Search across Spaces, claims, sources, creators, datasets, Trails, and topics instead of searching isolated pages.</p></div><div class="field"><input data-explore-input placeholder="Search all connected knowledge…" value="${escapeHTML(query)}" style="font-size:1.25rem;padding:16px 18px"></div><div class="library-grid">${results.map(({object})=>`<button class="library-item" data-open-object="${object.id}" style="text-align:left;background:transparent;border-left:0;border-right:0;border-bottom:0"><small style="color:var(--accent);text-transform:uppercase;letter-spacing:.08em">${escapeHTML(object.type.replaceAll('_',' '))}</small><h3>${escapeHTML(object.title)}</h3><p style="color:var(--muted);line-height:1.5">${escapeHTML(object.summary||object.bio||object.subtitle||'Connected knowledge object')}</p></button>`).join('')}</div></section>`;
}
