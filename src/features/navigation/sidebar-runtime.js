import { sidebarMarkup } from './sidebar.js';
import { icon } from '../../shared/icons.js';

const STORAGE_KEY='libre-sidebar-open-v1';
const desktopQuery=window.matchMedia('(min-width: 901px)');
const sidebar=document.querySelector('#global-sidebar');
const header=document.querySelector('#global-header');
const main=document.querySelector('#main-content');
const repository=window.__LIBRE__?.repository;

let sidebarOpen=desktopQuery.matches ? localStorage.getItem(STORAGE_KEY)!=='closed' : false;
let renderQueued=false;
let lastStateSignature='';

function currentMode(){ return sessionStorage.getItem('libre-stream-mode') || 'for-you'; }
function currentRoute(){ return window.__LIBRE__?.getRoute?.() || {name:'home',params:{},query:new URLSearchParams()}; }

function stateSignature(state){
  return JSON.stringify({
    account:state.account?.id||null,
    role:state.account?.role||null,
    following:state.following||[],
    drafts:(state.drafts||[]).filter((draft)=>draft.creatorId===state.account?.id).map((draft)=>draft.id),
    collections:(state.library?.collections||[]).map((collection)=>collection.id),
    publications:state.account ? state.graph.objects.filter((object)=>object.type==='publication'&&object.creatorId===state.account.id).map((object)=>object.id) : []
  });
}

function ensureHeaderToggle(){
  if(!header) return;
  let toggle=header.querySelector('[data-toggle-sidebar]');
  let start=header.querySelector('.header-start');
  const brand=header.querySelector('.brand');

  if(!start && brand){
    start=document.createElement('div');
    start.className='header-start';
    brand.before(start);
    start.append(brand);
  }

  if(!toggle && start){
    toggle=document.createElement('button');
    toggle.type='button';
    toggle.className='icon-button sidebar-toggle';
    toggle.setAttribute('data-toggle-sidebar','');
    toggle.setAttribute('aria-controls','global-sidebar');
    toggle.setAttribute('aria-label',sidebarOpen?'Hide navigation':'Show navigation');
    toggle.innerHTML=icon('menu',20);
    start.prepend(toggle);
  }

  if(toggle){
    toggle.setAttribute('aria-expanded',String(sidebarOpen));
    toggle.setAttribute('aria-label',sidebarOpen?'Hide navigation':'Show navigation');
  }
}

function applySidebarState(){
  document.body.classList.toggle('sidebar-closed',!sidebarOpen);
  if(sidebar){
    sidebar.setAttribute('aria-hidden',String(!sidebarOpen));
    sidebar.inert=!sidebarOpen;
  }
  ensureHeaderToggle();
}

function renderSidebar(){
  if(!sidebar || !repository) return;
  const state=repository.getState();
  sidebar.innerHTML=sidebarMarkup({state,graph:state.graph,route:currentRoute(),streamMode:currentMode()});
  applySidebarState();
  lastStateSignature=stateSignature(state);
}

function scheduleRender(){
  if(renderQueued) return;
  renderQueued=true;
  requestAnimationFrame(()=>{
    renderQueued=false;
    renderSidebar();
  });
}

function setSidebar(open,{persist=desktopQuery.matches}={}){
  sidebarOpen=Boolean(open);
  if(persist && desktopQuery.matches) localStorage.setItem(STORAGE_KEY,sidebarOpen?'open':'closed');
  applySidebarState();
}

function closeOnMobile(){ if(!desktopQuery.matches && sidebarOpen) setSidebar(false,{persist:false}); }

function activateStreamMode(mode){
  sessionStorage.setItem('libre-stream-mode',mode);
  const activate=()=>{
    const chip=document.querySelector(`.mode-chip[data-stream-mode="${CSS.escape(mode)}"]`);
    if(chip){ chip.click(); scheduleRender(); return true; }
    return false;
  };

  if(currentRoute().name==='home'){
    if(!activate()) setTimeout(activate,0);
  }else{
    location.hash='#/';
    let attempts=0;
    const timer=setInterval(()=>{
      attempts++;
      if(activate()||attempts>12) clearInterval(timer);
    },16);
  }
  closeOnMobile();
}

document.addEventListener('click',(event)=>{
  const toggle=event.target.closest('[data-toggle-sidebar]');
  if(toggle){
    event.preventDefault();
    setSidebar(!sidebarOpen);
    return;
  }

  const streamTarget=event.target.closest('#global-sidebar [data-sidebar-stream-mode]');
  if(streamTarget){
    event.preventDefault();
    event.stopImmediatePropagation();
    activateStreamMode(streamTarget.dataset.sidebarStreamMode);
    return;
  }

  if(event.target.closest('#global-sidebar [data-route]')) closeOnMobile();
},true);

window.addEventListener('keydown',(event)=>{
  if(event.key==='Escape' && !desktopQuery.matches && sidebarOpen){
    setSidebar(false,{persist:false});
    header?.querySelector('[data-toggle-sidebar]')?.focus();
  }
});

desktopQuery.addEventListener?.('change',(event)=>{
  if(event.matches) sidebarOpen=localStorage.getItem(STORAGE_KEY)!=='closed';
  else sidebarOpen=false;
  applySidebarState();
});

const headerObserver=new MutationObserver(()=>ensureHeaderToggle());
if(header) headerObserver.observe(header,{childList:true,subtree:false});
const routeObserver=new MutationObserver(scheduleRender);
if(main) routeObserver.observe(main,{childList:true,subtree:false});

repository?.subscribe?.((state)=>{
  const signature=stateSignature(state);
  if(signature!==lastStateSignature) scheduleRender();
});

renderSidebar();
