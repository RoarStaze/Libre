import { escapeHTML } from '../../shared/dom.js';
import { icon } from '../../shared/icons.js';
import { searchObjects } from './search.js';

const typeOrder=['topic','person','publication','claim','document','trail','collection','video','dataset'];
const groupLabels={topic:'Topics',person:'Creators',publication:'Spaces',claim:'Claims',document:'Documents',trail:'Trails',collection:'Collections',video:'Video',dataset:'Datasets'};

function resultIcon(type){
  if(type==='person') return 'user';
  if(type==='topic') return 'compass';
  if(type==='trail') return 'trail';
  if(type==='document') return 'source';
  return 'layers';
}

export function headerSearchMarkup(query='') {
  return `<form class="header-search-shell" data-header-search-form role="search" autocomplete="off">
    <span class="header-search-icon" aria-hidden="true">${icon('search',18)}</span>
    <input class="header-search-input" data-header-search-input type="search" name="q" value="${escapeHTML(query)}" placeholder="Search knowledge, claims, sources, creators…" aria-label="Search Libre" aria-autocomplete="list" aria-expanded="false" aria-controls="header-search-results">
    <span class="header-search-shortcut kbd">Ctrl K</span>
  </form>
  <div id="header-search-results" class="header-search-dropdown" data-header-search-dropdown hidden></div>`;
}

export function headerSearchResultsMarkup(graph, query='') {
  const results=searchObjects(graph,query).slice(0,24);
  const grouped=typeOrder.map((type)=>[type,results.filter((entry)=>entry.object.type===type)]).filter(([,items])=>items.length);
  return `<div class="header-search-dropdown-content" role="listbox" aria-label="Libre search suggestions">
    ${grouped.map(([type,items])=>`<section class="header-search-group"><div class="header-search-group-label">${groupLabels[type]||type}</div>${items.slice(0,5).map(({object})=>`<button type="button" class="header-search-result" role="option" data-command-open="${object.id}"><span class="header-search-result-icon">${icon(resultIcon(type),16)}</span><span class="header-search-result-copy"><strong>${escapeHTML(object.title)}</strong><small>${escapeHTML(object.summary||object.bio||object.subtitle||object.type)}</small></span><span class="header-search-chevron">${icon('chevron',15)}</span></button>`).join('')}</section>`).join('')}
    ${!results.length?'<div class="header-search-empty"><strong>No exact match</strong><span>Try a claim, person, program, source, or topic.</span></div>':''}
    ${query.trim()?`<button type="button" class="header-search-all" data-header-search-all="${escapeHTML(query.trim())}">${icon('search',15)} Search all Libre for “${escapeHTML(query.trim())}”</button>`:''}
  </div>`;
}

let searchQuery='';
let searchOpen=false;

function graph(){ return window.__LIBRE__?.repository?.getState()?.graph; }

function renderDropdown(){
  const root=document.querySelector('[data-header-search-dropdown]');
  const input=document.querySelector('[data-header-search-input]');
  const currentGraph=graph();
  if(!root||!input||!currentGraph)return;
  root.innerHTML=headerSearchResultsMarkup(currentGraph,searchQuery);
  root.hidden=!searchOpen;
  input.setAttribute('aria-expanded',searchOpen?'true':'false');
}

function openSearch(){ searchOpen=true; renderDropdown(); }
function closeSearch(){
  searchOpen=false;
  const root=document.querySelector('[data-header-search-dropdown]');
  const input=document.querySelector('[data-header-search-input]');
  if(root)root.hidden=true;
  if(input)input.setAttribute('aria-expanded','false');
}

function installHeaderSearch(){
  const omnibar=document.querySelector('.omnibar');
  if(!omnibar||omnibar.querySelector('[data-header-search-input]'))return;
  omnibar.innerHTML=headerSearchMarkup(searchQuery);
  const input=omnibar.querySelector('[data-header-search-input]');
  input?.addEventListener('focus',openSearch);
  input?.addEventListener('input',(event)=>{searchQuery=event.target.value;openSearch();});
  omnibar.querySelector('[data-header-search-form]')?.addEventListener('submit',(event)=>{
    event.preventDefault();
    const q=String(new FormData(event.currentTarget).get('q')||'').trim();
    if(!q)return;
    closeSearch();
    location.hash=`#/explore?q=${encodeURIComponent(q)}`;
  });
}

function init(){
  installHeaderSearch();
  const header=document.querySelector('#global-header');
  if(header)new MutationObserver(()=>installHeaderSearch()).observe(header,{childList:true,subtree:true});

  document.addEventListener('click',(event)=>{
    const omnibar=event.target.closest('.omnibar');
    if(omnibar)return;
    if(searchOpen)closeSearch();
  },true);

  document.addEventListener('click',(event)=>{
    const all=event.target.closest('[data-header-search-all]');
    if(all){
      closeSearch();
      location.hash=`#/explore?q=${encodeURIComponent(all.dataset.headerSearchAll)}`;
      return;
    }
    if(event.target.closest('[data-header-search-dropdown] [data-command-open]')) closeSearch();
  },true);

  document.addEventListener('keydown',(event)=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){
      event.preventDefault();
      event.stopImmediatePropagation();
      installHeaderSearch();
      const input=document.querySelector('[data-header-search-input]');
      input?.focus();
      openSearch();
      return;
    }
    if(event.key==='Escape'&&searchOpen){
      event.preventDefault();
      event.stopImmediatePropagation();
      closeSearch();
      document.querySelector('[data-header-search-input]')?.blur();
    }
  },true);
}

if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else queueMicrotask(init);
}
