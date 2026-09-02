import { escapeHTML } from '../../shared/dom.js';

const views={
  saved:{label:'Saved',description:'Knowledge you deliberately saved for later reference.'},
  history:{label:'History',description:'Knowledge Spaces and objects you recently opened.'},
  collections:{label:'Collections',description:'Your curated research sets and knowledge groupings.'}
};

function objectCards(items){
  return items.length?`<div class="library-grid">${items.map((object)=>`<article class="library-item"><small class="library-object-type">${escapeHTML(object.type.replaceAll('_',' '))}</small><h3>${escapeHTML(object.title)}</h3><p>${escapeHTML(object.summary||object.subtitle||object.evidenceState||'Saved knowledge object')}</p><button class="quiet-button" data-open-object="${object.id}">Open</button></article>`).join('')}</div>`:`<div class="empty-state"><div><h2>Nothing here yet</h2><p>As you explore Libre, this view becomes a useful memory layer instead of another feed.</p><button class="primary-button" data-route="/">Explore The Stream</button></div></div>`;
}

function collectionCards(state){
  const collections=state.library.collections||[];
  return collections.length?`<div class="library-grid">${collections.map((collection)=>`<article class="library-item"><small class="library-object-type">${escapeHTML(collection.visibility)}</small><h3>${escapeHTML(collection.title)}</h3><p>${collection.items.length} connected object${collection.items.length===1?'':'s'}</p></article>`).join('')}</div>`:`<div class="empty-state"><div><h2>No collections yet</h2><p>Collections let you build curated research sets from any connected Knowledge Object.</p><button class="primary-button" data-new-collection>New collection</button></div></div>`;
}

export function libraryMarkup({ graph, state, view='saved' }) {
  const active=views[view]?view:'saved';
  const ids=active==='history'?[...(state.library.history||[])]:[...(state.library.saved||[])];
  const items=[...new Set(ids)].map((id)=>graph.objects.find((object)=>object.id===id)).filter(Boolean);
  const meta=views[active];

  return `<section class="page library-page">
    <div class="page-heading"><div><h1>Your library is a memory layer.</h1></div><p>${escapeHTML(meta.description)}</p></div>
    <nav class="library-view-tabs" aria-label="Library views">
      ${Object.entries(views).map(([id,item])=>`<button class="mode-chip" aria-selected="${active===id}" data-route="/library?view=${id}">${escapeHTML(item.label)}</button>`).join('')}
    </nav>
    ${active==='collections'?collectionCards(state):objectCards(items)}
    ${active==='collections'?`<div class="library-collection-actions"><button class="quiet-button" data-new-collection>+ New collection</button></div>`:''}
  </section>`;
}
