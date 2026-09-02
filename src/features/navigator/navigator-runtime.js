import {
  getNavigatorSession,selectNavigatorNode,expandNavigatorNode,advanceNavigator,navigatorBack,navigatorForward,navigatorJump,navigatorOrigin,
  toggleNavigatorPin,toggleNavigatorHide,toggleNavigatorFilter,toggleNavigatorAtlas,toggleNavigatorVisible,resetNavigatorSession,rerenderKnowledgeNavigator,navigatorSearch
} from './navigator.js';

function libre(){return window.__LIBRE__||null;}
function graph(){return libre()?.repository?.getState?.().graph||{objects:[],relations:[]};}
function root(){return document.querySelector('.knowledge-navigator');}
function currentSpaceId(){return root()?.dataset.navigatorSpaceId||document.querySelector('.space-overlay')?.dataset.spaceId||null;}
function objectById(id){return graph().objects.find(object=>object.id===id)||null;}

function syncShell(){
  const session=getNavigatorSession();
  const overlay=document.querySelector('.space-overlay');
  const toggle=document.querySelector('[data-nav-toggle]');
  const docked=Boolean(session?.visible&&!session?.atlas);
  const atlas=Boolean(session?.visible&&session?.atlas);
  overlay?.classList.toggle('navigator-docked',docked);
  overlay?.classList.toggle('navigator-atlas-open',atlas);
  if(toggle){
    toggle.setAttribute('aria-pressed',String(Boolean(session?.visible)));
    toggle.setAttribute('aria-label',session?.visible?'Hide Knowledge Navigator':'Show Knowledge Navigator');
    const label=toggle.querySelector('span');
    if(label)label.textContent=session?.visible?'Hide Navigator':'Show Navigator';
  }
}
function refresh(){
  const node=root();
  if(node)rerenderKnowledgeNavigator(node,graph());
  syncShell();
  requestAnimationFrame(wireCanvas);
}
function dive(id){
  if(!id)return;
  const object=objectById(id);
  if(!object||['topic','person'].includes(object.type))return;
  advanceNavigator(id);
  libre()?.openObject?.(id);
}
function navigatePathId(id){if(!id||!objectById(id))return;libre()?.openObject?.(id);}

function delegatedClick(event){
  const target=event.target.closest('[data-nav-toggle],[data-nav-node],[data-nav-select],[data-nav-dive],[data-nav-expand],[data-nav-pin],[data-nav-hide],[data-nav-filter],[data-nav-back],[data-nav-forward],[data-nav-origin],[data-nav-jump],[data-nav-atlas],[data-nav-visible],[data-nav-reset]');
  if(!target)return;
  if(target.matches('[data-nav-toggle]')){toggleNavigatorVisible();refresh();return;}
  if(target.matches('[data-nav-node]')){selectNavigatorNode(target.dataset.navNode);refresh();return;}
  if(target.matches('[data-nav-select]')){selectNavigatorNode(target.dataset.navSelect);refresh();return;}
  if(target.matches('[data-nav-dive]')){dive(target.dataset.navDive);return;}
  if(target.matches('[data-nav-expand]')){expandNavigatorNode(target.dataset.navExpand);refresh();return;}
  if(target.matches('[data-nav-pin]')){toggleNavigatorPin(target.dataset.navPin);refresh();return;}
  if(target.matches('[data-nav-hide]')){toggleNavigatorHide(target.dataset.navHide);refresh();return;}
  if(target.matches('[data-nav-filter]')){toggleNavigatorFilter(target.dataset.navFilter);refresh();return;}
  if(target.matches('[data-nav-back]')){const id=navigatorBack();if(id)navigatePathId(id);return;}
  if(target.matches('[data-nav-forward]')){const id=navigatorForward();if(id)navigatePathId(id);return;}
  if(target.matches('[data-nav-origin]')){const id=navigatorOrigin();if(id)navigatePathId(id);return;}
  if(target.matches('[data-nav-jump]')){const id=navigatorJump(target.dataset.navJump);if(id)navigatePathId(id);return;}
  if(target.matches('[data-nav-atlas]')){toggleNavigatorAtlas();refresh();return;}
  if(target.matches('[data-nav-visible]')){toggleNavigatorVisible(target.dataset.navVisible==='true');refresh();return;}
  if(target.matches('[data-nav-reset]')){resetNavigatorSession(target.dataset.navReset||currentSpaceId());refresh();return;}
}

document.addEventListener('click',event=>{
  const target=event.target.closest?.('[data-open-object]');
  if(!target||!target.closest('.space-overlay')||target.closest('.knowledge-navigator'))return;
  const object=objectById(target.dataset.openObject);
  if(object&&!['topic','person'].includes(object.type))advanceNavigator(object.id);
},true);

document.addEventListener('click',delegatedClick);
document.addEventListener('dblclick',event=>{const target=event.target.closest('[data-nav-node]');if(target)dive(target.dataset.navNode);});
document.addEventListener('keydown',event=>{const target=event.target.closest?.('[data-nav-node]');if(!target)return;if(event.key==='Enter'){event.preventDefault();dive(target.dataset.navNode);}if(event.key===' '){event.preventDefault();selectNavigatorNode(target.dataset.navNode);refresh();}});
document.addEventListener('input',event=>{
  const input=event.target.closest?.('[data-nav-search]');if(!input)return;
  const scope=input.closest('.knowledge-navigator')||document;
  const panel=scope.querySelector('[data-nav-search-results]');if(!panel)return;
  const results=navigatorSearch(graph(),input.value,{limit:8});
  if(!input.value.trim()){panel.hidden=true;panel.innerHTML='';return;}
  panel.innerHTML=results.length?results.map(object=>`<button data-nav-select="${object.id}"><strong>${escapeText(object.title||object.text||'Untitled')}</strong><small>${escapeText(object.type.replaceAll('_',' '))}</small></button>`).join(''):'<div class="navigator-empty">No nodes in this knowledge graph match that search.</div>';
  panel.hidden=false;
});

function escapeText(value=''){return String(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));}

function wireCanvas(){
  const svg=document.querySelector('[data-nav-canvas]');
  if(!svg||svg.dataset.navWired==='true')return;
  svg.dataset.navWired='true';
  const base=svg.viewBox.baseVal,initial={x:base.x,y:base.y,width:base.width,height:base.height};
  let view={...initial},dragging=false,start=null;
  const apply=()=>svg.setAttribute('viewBox',`${view.x} ${view.y} ${view.width} ${view.height}`);
  svg.addEventListener('wheel',event=>{
    event.preventDefault();
    const factor=event.deltaY>0?1.12:.89,rect=svg.getBoundingClientRect();
    const px=(event.clientX-rect.left)/Math.max(rect.width,1),py=(event.clientY-rect.top)/Math.max(rect.height,1);
    const nextWidth=Math.max(initial.width*.45,Math.min(initial.width*2.1,view.width*factor));
    const nextHeight=nextWidth*(initial.height/initial.width);
    view.x+=px*(view.width-nextWidth);view.y+=py*(view.height-nextHeight);view.width=nextWidth;view.height=nextHeight;apply();
  },{passive:false});
  svg.addEventListener('pointerdown',event=>{
    if(event.target.closest?.('.nav-node'))return;
    dragging=true;start={x:event.clientX,y:event.clientY,vx:view.x,vy:view.y};svg.setPointerCapture?.(event.pointerId);svg.classList.add('is-panning');
  });
  svg.addEventListener('pointermove',event=>{
    if(!dragging||!start)return;
    const rect=svg.getBoundingClientRect();
    view.x=start.vx-(event.clientX-start.x)*(view.width/Math.max(rect.width,1));
    view.y=start.vy-(event.clientY-start.y)*(view.height/Math.max(rect.height,1));
    apply();
  });
  const end=()=>{dragging=false;start=null;svg.classList.remove('is-panning');};
  svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);
  svg.addEventListener('dblclick',event=>{if(event.target.closest?.('.nav-node'))return;view={...initial};apply();});
}

const observer=new MutationObserver(()=>{syncShell();requestAnimationFrame(wireCanvas);});
const overlay=document.querySelector('#overlay-root');if(overlay)observer.observe(overlay,{childList:true,subtree:true});
syncShell();
requestAnimationFrame(wireCanvas);
