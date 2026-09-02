import { createRepository } from './data/repository.js';
import { createSelectors } from './data/selectors.js';
import { discoverSourcesForDraft } from './domain/source-discovery.js';
import { initRouter, setRouterHandler, parseRoute, navigate, back, rememberScroll, consumeRestoreScroll } from './router.js';
import { qs, qsa, escapeHTML, setHTML, delegate, avatarMarkup } from './shared/dom.js';
import { icon } from './shared/icons.js';
import { renderStream } from './features/stream/stream.js';
import { renderSpace } from './features/space/space.js';
import { commandPaletteMarkup, exploreMarkup } from './features/search/search.js';
import { rabbitHoleMarkup, forkSpace } from './features/trails/trails.js';
import { profileMarkup } from './features/profile/profile.js';
import { libraryMarkup } from './features/library/library.js';
import { algorithmMarkup } from './features/algorithm/algorithm.js';
import { authModalMarkup, authPageMarkup } from './features/auth/auth.js';
import { studioMarkup } from './features/studio/studio.js';
import { moderationQueueMarkup } from './features/moderation/moderation.js';

const repository = createRepository();
let route = parseRoute();
let streamMode = sessionStorage.getItem('libre-stream-mode') || 'for-you';
let overlayMode = null;
let pendingReply = null;
let activeDiscussionScope = null;

const main = qs('#main-content');
const header = qs('#global-header');
const mobileNav = qs('#mobile-nav');
const overlayRoot = qs('#overlay-root');
const toastRoot = qs('#toast-root');

function graphContext() {
  const state = repository.getState();
  return { state, graph: state.graph, selectors: createSelectors(state.graph) };
}

function renderHeader() {
  const {state}=graphContext();
  const account=state.account;
  setHTML(header, `<a class="brand" href="#/" data-route="/"><span class="brand-mark" aria-hidden="true"></span><span class="brand-word">LIBRE</span><span class="brand-beta">CONTINUUM</span></a>
    <div class="omnibar"><button class="omnibar-trigger" data-open-command aria-label="Search Libre">${icon('search',18)}<span class="search-copy">Search knowledge, claims, sources, people…</span><span class="kbd">Ctrl K</span></button></div>
    <div class="header-actions"><button class="icon-button" data-toggle-theme aria-label="Toggle theme">${icon(state.theme==='dark'?'sun':'moon',18)}</button><button class="primary-button" data-route="/studio">${icon('plus',17)}<span class="create-copy"> Create</span></button>${account?`<button class="quiet-button" data-account-menu>${avatarMarkup(account)}<span class="login-copy">${escapeHTML(account.displayName)}</span></button>`:`<button class="quiet-button" data-route="/login/login">${icon('user',16)}<span class="login-copy"> Log in</span></button>`}</div>`);
}

function renderMobileNav() {
  const current=route.name;
  setHTML(mobileNav, [
    ['home','/','home','Home'],['explore','/explore','compass','Explore'],['studio','/studio','plus','Create'],['library','/library','library','Library'],['profile',repository.getState().account?`/profile/${repository.getState().account.id}`:'/algorithm','user','You']
  ].map(([name,path,ico,label])=>`<button class="${current===name?'active':''}" data-route="${path}">${icon(ico,20)}<span>${label}</span></button>`).join(''));
}

function topicMarkup(id) {
  const {state,graph}=graphContext();
  const topic=graph.objects.find((o)=>o.id===id&&o.type==='topic');
  if(!topic) return `<section class="page"><div class="empty-state"><div><h2>Topic not found</h2></div></div></section>`;
  const items=graph.objects.filter((o)=>(o.topicIds||[]).includes(id)&&['publication','claim','document','trail','video','dataset'].includes(o.type));
  const creators=[...new Set(items.map((o)=>o.creatorId).filter(Boolean))].map((creatorId)=>graph.objects.find((o)=>o.id===creatorId)).filter(Boolean);
  return `<section class="page"><div class="page-heading"><div><small style="color:var(--accent);text-transform:uppercase;letter-spacing:.12em">Topic neighborhood</small><h1>${escapeHTML(topic.title)}</h1></div><p>${escapeHTML(topic.description||'Explore connected knowledge across formats.')}</p></div><div class="signal-actions"><button class="primary-button" data-follow-entity="${topic.id}">${state.following.includes(topic.id)?'Following':'Follow topic'}</button><button class="quiet-button" data-route="/algorithm">Tune this in My Algorithm</button></div><div class="divider-label">Leading creators</div><div style="display:flex;gap:12px;overflow:auto">${creators.map((person)=>`<button class="object-tool" data-route="/profile/${person.id}" style="min-width:230px">${avatarMarkup(person)}<strong style="margin-top:10px">${escapeHTML(person.title)}</strong><small>${escapeHTML(person.bio||'')}</small></button>`).join('')}</div><div class="divider-label">Connected objects</div><div class="library-grid">${items.map((object)=>`<button class="library-item" data-open-object="${object.id}" style="background:transparent;text-align:left;border-left:0;border-right:0;border-bottom:0"><small style="color:var(--accent);text-transform:uppercase;letter-spacing:.08em">${escapeHTML(object.type.replaceAll('_',' '))}</small><h3>${escapeHTML(object.title)}</h3><p style="color:var(--muted)">${escapeHTML(object.summary||object.subtitle||object.evidenceState||'Connected object')}</p></button>`).join('')}</div></section>`;
}

function notFoundMarkup(){ return `<section class="page"><div class="empty-state"><div><h2>This path does not exist.</h2><p>The knowledge may have moved, been deleted, or never existed.</p><button class="primary-button" data-route="/">Return to The Stream</button></div></div></section>`; }

function renderRoute(nextRoute=route) {
  route=nextRoute;
  renderHeader(); renderMobileNav();
  const {state,graph,selectors}=graphContext();
  let markup='';
  if(route.name==='home') markup=renderStream({graph,state,mode:streamMode});
  else if(route.name==='explore') markup=exploreMarkup(graph,route.query.get('q')||'');
  else if(route.name==='profile') markup=profileMarkup({id:route.params.id,graph,state});
  else if(route.name==='topic') markup=topicMarkup(route.params.id);
  else if(route.name==='library') markup=libraryMarkup({graph,state});
  else if(route.name==='algorithm') markup=algorithmMarkup(state);
  else if(route.name==='studio') markup=studioMarkup({repository,graph,draftId:route.params.id});
  else if(route.name==='login') markup=authPageMarkup(route.params.mode);
  else if(route.name==='moderation') markup=moderationQueueMarkup(state);
  else if(route.name==='space') markup=renderStream({graph,state,mode:streamMode});
  else markup=notFoundMarkup();
  setHTML(main,markup);

  if(route.name==='space') {
    setHTML(overlayRoot,renderSpace({id:route.params.id,lens:route.params.lens,graph,selectors,repository}));
    document.body.style.overflow='hidden';
    repository.addHistory(route.params.id);
  } else if(!overlayMode) {
    setHTML(overlayRoot,'');
    document.body.style.overflow='';
  }

  if(route.name==='home') {
    const restore=consumeRestoreScroll();
    if(restore) requestAnimationFrame(()=>window.scrollTo({top:restore,behavior:'instant'}));
  } else if(route.name!=='space') requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'instant'}));
}

function transitionNavigate(path, options={}) {
  const run=()=>navigate(path,options);
  if(document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(run);
  else run();
}

function openObject(id) {
  const {selectors}=graphContext();
  const object=selectors.object(id);
  if(!object) return;
  if(object.type==='person') return transitionNavigate(`/profile/${id}`);
  if(object.type==='topic') return transitionNavigate(`/topic/${id}`);
  rememberScroll();
  transitionNavigate(`/space/${id}/story`);
}

function openCommand(query='') {
  overlayMode='command';
  const {graph}=graphContext();
  setHTML(overlayRoot,commandPaletteMarkup(graph,query));
  document.body.style.overflow='hidden';
  requestAnimationFrame(()=>qs('[data-command-input]',overlayRoot)?.focus());
}
function closeTransientOverlay() {
  overlayMode=null; pendingReply=null; activeDiscussionScope=null;
  setHTML(overlayRoot,'');
  document.body.style.overflow='';
  if(route.name==='space') renderRoute(route);
}

function toast(message) {
  const node=document.createElement('div'); node.className='toast'; node.textContent=message; toastRoot.append(node); setTimeout(()=>node.remove(),3200);
}

function openAuth(mode='login'){ overlayMode='auth'; setHTML(overlayRoot,authModalMarkup(mode)); document.body.style.overflow='hidden'; }
function openRabbit(id){ const {selectors}=graphContext(); overlayMode='rabbit'; setHTML(overlayRoot,rabbitHoleMarkup(id,selectors)); document.body.style.overflow='hidden'; }

function objectCreateModal(type,draftId) {
  overlayMode='studio-object';
  const normalizedType=type==='custom'?'claim':type;
  const label=type==='custom'?'Knowledge object':type.replaceAll('_',' ');
  const automaticNote=normalizedType==='claim'
    ? '<div class="auto-evidence-notice"><strong>Libre assesses this automatically.</strong><span>When you publish, Libre searches independent source indexes, adds relevant sources, checks support and counterevidence, then assigns the evidence classification. You cannot choose the label yourself.</span></div>'
    : '<div class="auto-evidence-notice"><strong>Sources are optional for creators.</strong><span>Libre will search for relevant sources automatically when the Knowledge Space is published.</span></div>';
  setHTML(overlayRoot,`<div class="modal-backdrop"><section class="modal"><h2>Add ${escapeHTML(label)}</h2><form data-studio-object-form data-type="${escapeHTML(normalizedType)}" data-draft-id="${draftId}"><div class="field"><label>Title / canonical text</label><textarea name="title" required autofocus></textarea></div>${automaticNote}<div class="modal-actions"><button type="button" class="quiet-button" data-close-transient>Cancel</button><button class="primary-button" type="submit">Add to workspace</button></div></form></section></div>`); document.body.style.overflow='hidden';
}

function connectModal(draftId,fromId){ const draft=repository.getDraft(draftId); const others=draft.objects.filter((o)=>o.id!==fromId); overlayMode='connect'; setHTML(overlayRoot,`<div class="modal-backdrop"><section class="modal"><h2>Connect objects</h2><form data-connect-form data-draft-id="${draftId}" data-from-id="${fromId}"><div class="field"><label>Relationship</label><select name="type"><option value="supports">supports</option><option value="contradicts">contradicts</option><option value="derived_from">derived from</option><option value="explains">explains</option><option value="questions">questions</option><option value="cites">cites</option><option value="related_to">related to</option></select></div><div class="field"><label>To object</label><select name="toId">${others.map((o)=>`<option value="${o.id}">${escapeHTML(o.title)}</option>`).join('')}</select></div><div class="modal-actions"><button type="button" class="quiet-button" data-close-transient>Cancel</button><button class="primary-button" type="submit">Connect</button></div></form></section></div>`); document.body.style.overflow='hidden'; }

function newCollectionModal(){ overlayMode='collection'; setHTML(overlayRoot,`<div class="modal-backdrop"><section class="modal"><h2>New collection</h2><form data-collection-form><div class="field"><label>Title</label><input name="title" required autofocus></div><div class="field"><label>Visibility</label><select name="visibility"><option>private</option><option>public</option><option>unlisted</option></select></div><div class="modal-actions"><button type="button" class="quiet-button" data-close-transient>Cancel</button><button class="primary-button">Create</button></div></form></section></div>`);document.body.style.overflow='hidden';}

// Shared navigation and actions
delegate(document,'click','[data-route]',(event,target)=>{event.preventDefault();transitionNavigate(target.dataset.route);});
delegate(document,'click','[data-open-object]',(event,target)=>{event.preventDefault(); if(overlayMode && overlayMode!=='space'){ closeTransientOverlay(); setTimeout(()=>openObject(target.dataset.openObject),0);} else openObject(target.dataset.openObject);});
delegate(document,'click','[data-open-command]',()=>openCommand());
delegate(document,'click','[data-close-space]',()=>back());
delegate(document,'click','[data-space-lens]',(_,target)=>transitionNavigate(`/space/${route.params.id}/${target.dataset.spaceLens}`,{replace:true}));
delegate(document,'click','[data-save-object]',(_,target)=>{repository.saveObject(target.dataset.saveObject);toast('Saved to your Libre library.');});
delegate(document,'click','[data-follow-entity]',(_,target)=>{const id=target.dataset.followEntity;const following=repository.getState().following.includes(id);following?repository.unfollowEntity(id):repository.followEntity(id);renderRoute(route);toast(following?'Unfollowed.':'Following.');});
delegate(document,'click','[data-rabbit-object]',(_,target)=>openRabbit(target.dataset.rabbitObject));
delegate(document,'click','[data-close-rabbit]',closeTransientOverlay);
delegate(document,'click','[data-close-transient]',closeTransientOverlay);
delegate(document,'click','[data-toggle-theme]',()=>{const next=repository.getState().theme==='dark'?'light':'dark';repository.setTheme(next);document.documentElement.dataset.theme=next;renderHeader();});
delegate(document,'click','[data-stream-mode]',(_,target)=>{streamMode=target.dataset.streamMode;sessionStorage.setItem('libre-stream-mode',streamMode);renderRoute(route);});
delegate(document,'click','[data-more-object]',(_,target)=>{const {selectors}=graphContext();const object=selectors.object(target.dataset.moreObject);const reason=object?.topicIds?.length?'Connected to your current knowledge neighborhood and algorithm settings.':'Ranked by relevance, depth, freshness, and discovery.';toast(`Why this: ${reason}`);});
delegate(document,'click','[data-open-auth]',(_,target)=>openAuth(target.dataset.openAuth));
delegate(document,'click','[data-close-auth]',closeTransientOverlay);
delegate(document,'click','[data-switch-auth]',(_,target)=>openAuth(target.dataset.switchAuth));
delegate(document,'click','[data-account-menu]',()=>{if(confirm('Sign out of this local Libre account?')){ repository.signOut(); renderRoute(route); toast('Signed out.'); }});
delegate(document,'click','[data-share-object]',async(_,target)=>{const url=`${location.origin}${location.pathname}#/space/${target.dataset.shareObject}/story`;try{await navigator.clipboard.writeText(url);toast('Libre link copied.');}catch{toast(url);}});
delegate(document,'click','[data-fork-space]',(_,target)=>{try{const draft=forkSpace(repository,target.dataset.forkSpace);transitionNavigate(`/studio/${draft.id}`);}catch(error){toast(error.message);openAuth('login');}});
delegate(document,'click','[data-vote-comment]',(_,target)=>{repository.voteComment(target.dataset.voteComment,1);renderRoute(route);});
delegate(document,'click','[data-report-comment]',(_,target)=>{repository.reportContent({targetType:'comment',targetId:target.dataset.reportComment,reason:'User-submitted report'});toast('Report added to moderation queue.');});
delegate(document,'click','[data-reply-comment]',(_,target)=>{pendingReply=target.dataset.replyComment;const form=qs('[data-comment-form]');if(form){form.querySelector('textarea').focus();form.querySelector('textarea').placeholder='Reply to this comment…';}});
delegate(document,'click','[data-comment-scope-type]',(_,target)=>{activeDiscussionScope={type:target.dataset.commentScopeType,id:target.dataset.commentScopeId}; overlayMode='scope-discussion'; toast(`Discussion is anchored to this ${activeDiscussionScope.type}. Open the Discussion lens to continue.`); transitionNavigate(`/space/${route.params.id}/discussion`,{replace:true});});
delegate(document,'click','[data-claim-action]',(_,target)=>toast(`${target.dataset.claimAction==='support'?'Supporting evidence':'Counterevidence'} can be attached manually, but Libre also searches for independent evidence automatically at publication.`));
delegate(document,'click','[data-new-collection]',newCollectionModal);

delegate(document,'submit','[data-comment-form]',(event,form)=>{event.preventDefault();const data=new FormData(form);const body=String(data.get('body')||'').trim();if(!body)return;repository.addComment({scopeType:form.dataset.scopeType,scopeId:form.dataset.scopeId,body,parentId:pendingReply});pendingReply=null;renderRoute(route);toast('Comment added.');});
delegate(document,'submit','[data-auth-form]',(event,form)=>{event.preventDefault();const data=Object.fromEntries(new FormData(form));try{form.dataset.mode==='signup'?repository.signUp(data):repository.signIn(data);if(overlayMode)closeTransientOverlay();transitionNavigate('/');toast('Signed in to Libre.');}catch(error){toast(error.message);}});
delegate(document,'submit','[data-collection-form]',(event,form)=>{event.preventDefault();const data=Object.fromEntries(new FormData(form));repository.createCollection(data);closeTransientOverlay();renderRoute(route);toast('Collection created.');});

// Command palette
delegate(document,'input','[data-command-input]',(_,target)=>{const {graph}=graphContext();setHTML(overlayRoot,commandPaletteMarkup(graph,target.value));requestAnimationFrame(()=>{const input=qs('[data-command-input]',overlayRoot);input?.focus();input?.setSelectionRange(input.value.length,input.value.length);});});
delegate(document,'click','[data-command-backdrop]',(event,target)=>{if(event.target===target)closeTransientOverlay();});
delegate(document,'click','[data-command-open]',(_,target)=>{const id=target.dataset.commandOpen;closeTransientOverlay();setTimeout(()=>openObject(id),0);});
delegate(document,'input','[data-explore-input]',(_,target)=>{history.replaceState({},'',`#/explore?q=${encodeURIComponent(target.value)}`);setHTML(main,exploreMarkup(graphContext().graph,target.value));});

// Algorithm
delegate(document,'input','[data-algorithm-key]',(_,target)=>{repository.updateAlgorithm({[target.dataset.algorithmKey]:Number(target.value)});setHTML(main,algorithmMarkup(repository.getState()));});
delegate(document,'click','[data-reset-algorithm]',()=>{repository.updateAlgorithm({discovery:55,depth:68,freshness:50,unfamiliar:40,obscure:52});renderRoute(route);toast('Recommendation controls reset.');});

// Studio
delegate(document,'click','[data-create-draft]',()=>{try{const draft=repository.createDraft({title:'Untitled Knowledge Space'});transitionNavigate(`/studio/${draft.id}`);}catch(error){toast(error.message);openAuth('signup');}});
delegate(document,'click','[data-create-studio-object]',(_,target)=>{const draftId=qs('[data-draft-id]')?.dataset.draftId;if(draftId)objectCreateModal(target.dataset.createStudioObject,draftId);});
delegate(document,'submit','[data-studio-object-form]',(event,form)=>{event.preventDefault();const data=Object.fromEntries(new FormData(form));repository.addDraftObject(form.dataset.draftId,{type:form.dataset.type,title:data.title});closeTransientOverlay();renderRoute(route);toast('Object added. Libre will assess claims and discover sources automatically at publish time.');});
delegate(document,'input','[data-draft-field]',(_,target)=>{const draftId=qs('[data-draft-id]')?.dataset.draftId;if(draftId)repository.updateDraft(draftId,{[target.dataset.draftField]:target.value});});
delegate(document,'click','[data-add-reader-path]',(_,target)=>{const draftId=qs('[data-draft-id]')?.dataset.draftId;const draft=repository.getDraft(draftId);if(!draft.readerPath.includes(target.dataset.addReaderPath)){repository.setReaderPath(draftId,[...draft.readerPath,target.dataset.addReaderPath]);renderRoute(route);}});
delegate(document,'click','[data-connect-object]',(_,target)=>{const draftId=qs('[data-draft-id]')?.dataset.draftId;if(draftId)connectModal(draftId,target.dataset.connectObject);});
delegate(document,'submit','[data-connect-form]',(event,form)=>{event.preventDefault();const data=Object.fromEntries(new FormData(form));repository.addDraftRelation(form.dataset.draftId,{fromId:form.dataset.fromId,toId:data.toId,type:data.type});closeTransientOverlay();renderRoute(route);toast('Relationship added.');});
delegate(document,'click','[data-preview-draft]',()=>{const draftId=qs('[data-draft-id]')?.dataset.draftId;const draft=repository.getDraft(draftId);if(!draft)return;toast('Preview uses the current draft. Automatic source discovery and final evidence classification run when you publish.');});

delegate(document,'click','[data-publish-draft]',async(_,target)=>{
  const draftId=qs('[data-draft-id]')?.dataset.draftId;
  if(!draftId || target.disabled) return;
  const original=target.innerHTML;
  target.disabled=true;
  target.setAttribute('aria-busy','true');
  target.innerHTML=`${icon('search',15)} Finding sources…`;
  try {
    const draft=repository.getDraft(draftId);
    if(!draft) throw new Error('Draft not found.');
    const state=repository.getState();
    const topics=draft.topicId
      ? state.graph.objects.filter((object)=>object.id===draft.topicId&&object.type==='topic').map((object)=>object.title)
      : [];
    const claims=draft.objects.filter((object)=>object.type==='claim');
    if(claims.length) {
      const discovery=await discoverSourcesForDraft(draft,{fetchImpl:globalThis.fetch,topics,maxSourcesPerClaim:10});
      if(discovery.providerSuccesses===0) throw new Error('Libre could not reach any source index. Nothing was published; check your connection and try again.');
      const summary=repository.importDiscoveredSources(draftId,discovery);
      target.innerHTML=`${icon('layers',15)} Classifying evidence…`;
      toast(`Libre searched ${discovery.providerSuccesses} source-provider routes and attached ${summary.addedSources} relevant source${summary.addedSources===1?'':'s'}.`);
    }
    const publication=repository.publishDraft(draftId);
    toast(`Published. Libre classified this Space as ${publication.evidenceState}.`);
    transitionNavigate(`/space/${publication.id}/story`);
  } catch(error) {
    toast(error.message || 'Source discovery failed. Nothing was published.');
  } finally {
    if(target.isConnected) {
      target.disabled=false;
      target.removeAttribute('aria-busy');
      target.innerHTML=original;
    }
  }
});

window.addEventListener('keydown',(event)=>{
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openCommand();}
  if(event.key==='Escape'){
    if(overlayMode) closeTransientOverlay();
    else if(route.name==='space') back();
  }
});

repository.subscribe(()=>{document.documentElement.dataset.theme=repository.getState().theme;});
document.documentElement.dataset.theme=repository.getState().theme;
setRouterHandler(renderRoute);
initRouter();

window.__LIBRE__={ repository, getRoute:()=>route, openObject };