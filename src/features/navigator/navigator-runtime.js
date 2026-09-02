import {
  selectNavigatorNode,expandNavigatorNode,advanceNavigator,navigatorBack,navigatorForward,navigatorJump,navigatorOrigin,
  toggleNavigatorPin,toggleNavigatorHide,toggleNavigatorFilter,toggleNavigatorAtlas,toggleNavigatorVisible,resetNavigatorSession,rerenderKnowledgeNavigator,navigatorSearch
} from './navigator.js';

function libre(){ return window.__LIBRE__ || null; }
function graph(){ return libre()?.repository?.getState?.().graph || {objects:[],relations:[]}; }
function root(){ return document.querySelector('.knowledge-navigator'); }
function currentSpaceId(){ return root()?.dataset.navigatorSpaceId || null; }
function refresh(){ const node=root(); if(node) rerenderKnowledgeNavigator(node,graph()); requestAnimationFrame(wireCanvas); }
function objectById(id){ return graph().objects.find(object=>object.id===id)||null; }
function dive(id){ if(!id)return; const object=objectById(id); if(!object)return; if(['topic','person'].includes(object.type)) return; advanceNavigator(id); libre()?.openObject?.(id); }
function navigatePathId(id){ if(!id)return; const object=objectById(id); if(!object)return; libre()?.openObject?.(id); }

function delegatedClick(event){
  const target=event.target.closest('[data-nav-node],[data-nav-select],[data-nav-dive],[data-nav-expand],[data-nav-pin],[data-nav-hide],[data-nav-filter],[data-nav-back],[data-nav-forward],[data-nav-origin],[data-nav-jump],[data-nav-atlas],[data-nav-visible],[data-nav-reset]');
  if(!target)return;
  if(target.matches('[data-nav-node]')){ selectNavigatorNode(target.dataset.navNode); refresh(); return; }
  if(target.matches('[data-nav-select]')){ selectNavigatorNode(target.dataset.navSelect); refresh(); return; }
  if(target.matches('[data-nav-dive]')){ dive(target.dataset.navDive); return; }
  if(target.matches('[data-nav-expand]')){ expandNavigatorNode(target.dataset.navExpand); refresh(); return; }
  if(target.matches('[data-nav-pin]')){ toggleNavigatorPin(target.dataset.navPin); refresh(); return; }
  if(target.matches('[data-nav-hide]')){ toggleNavigatorHide(target.dataset.navHide); refresh(); return; }
  if(target.matches('[data-nav-filter]')){ toggleNavigatorFilter(target.dataset.navFilter); refresh(); return; }
  if(target.matches('[data-nav-back]')){ const id=navigatorBack(); if(id)navigatePathId(id); return; }
  if(target.matches('[data-nav-forward]')){ const id=navigatorForward(); if(id)navigatePathId(id); return; }
  if(target.matches('[data-nav-origin]')){ const id=navigatorOrigin(); if(id)navigatePathId(id); return; }
  if(target.matches('[data-nav-jump]')){ const id=navigatorJump(target.dataset.navJump); if(id)navigatePathId(id); return; }
  if(target.matches('[data-nav-atlas]')){ toggleNavigatorAtlas(); refresh(); return; }
  if(target.matches('[data-nav-visible]')){ toggleNavigatorVisible(target.dataset.navVisible==='true'); refresh(); return; }
  if(target.matches('[data-nav-reset]')){ resetNavigatorSession(target.dataset.navReset||currentSpaceId()); refresh(); return; }
}

document.addEventListener('click',delegatedClick);
document.addEventListener('dblclick',event=>{ const target=event.target.closest('[data-nav-node]'); if(target)dive(target.dataset.navNode); });
document.addEventListener('keydown',event=>{ const target=event.target.closest?.('[data-nav-node]'); if(!target)return; if(event.key==='Enter'){event.preventDefault();dive(target.dataset.navNode);} if(event.key===' '){event.preventDefault();selectNavigatorNode(target.dataset.navNode);refresh();} });
document.addEventListener('input',event=>{
  const input=event.target.closest?.('[data-nav-search]'); if(!input)return;
  const panel=document.querySelector('[data-nav-search-results]'); if(!panel)return;
  const results=navigatorSearch(graph(),input.value,{limit:8});
  if(!input.value.trim()){panel.hidden=true;panel.innerHTML='';return;}
  panel.innerHTML=results.length?results.map(object=>`<button data-nav-select="${object.id}"><strong>${escapeText(object.title||object.text||'Untitled')}</strong><small>${escapeText(object.type.replaceAll('_',' '))}</small></button>`).join(''):'<div class="navigator-empty">No nodes in this knowledge graph match that search.</div>';
  panel.hidden=false;
});

function escapeText(value=''){return String(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));}

function wireCanvas(){
  const svg=document.querySelector('[data-nav-canvas]'); if(!svg||svg.dataset.navWired==='true')return; svg.dataset.navWired='true';
  const base=svg.viewBox.baseVal;const initial={x:base.x,y:base.y,width:base.width,height:base.height};let view={...initial};let dragging=false,start=null;
  const apply=()=>svg.setAttribute('viewBox',`${view.x} ${view.y} ${view.width} ${view.height}`);
  svg.addEventListener('wheel',event=>{event.preventDefault();const factor=event.deltaY>0?1.12:.89;const rect=svg.getBoundingClientRect();const px=(event.clientX-rect.left)/rect.width,py=(event.clientY-rect.top)/rect.height;const nw=Math.max(initial.width*.45,Math.min(initial.width*2.1,view.width*factor));const nh=nw*(initial.height/initial.width);view.x+=px*(view.width-nw);view.y+=py*(view.height-nh);view.width=nw;view.height=nh;apply();},{passive:false});
  svg.addEventListener('pointerdown',event=>{if(event.target.closest?.('.nav-node'))return;dragging=true;start={x:event.clientX,y:event.clientY,vx:view.x,vy:view.y};svg.setPointerCapture?.(event.pointerId);svg.classList.add('is-panning');});
  svg.addEventListener('pointermove',event=>{if(!dragging||!start)return;const rect=svg.getBoundingClientRect();view.x=start.vx-(event.clientX-start.x)*(view.width/rect.width);view.y=start.vy-(event.clientY-start.y)*(view.height/rect.height);apply();});
  const end=()=>{dragging=false;start=null;svg.classList.remove('is-panning');}; svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);
  svg.addEventListener('dblclick',event=>{if(event.target.closest?.('.nav-node'))return;view={...initial};apply();});
}

const observer=new MutationObserver(()=>requestAnimationFrame(wireCanvas));
const overlay=document.querySelector('#overlay-root');if(overlay)observer.observe(overlay,{childList:true,subtree:true});
requestAnimationFrame(wireCanvas);
