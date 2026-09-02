import { escapeHTML, evidencePill } from '../../shared/dom.js';
import { icon } from '../../shared/icons.js';

export const NAVIGATOR_STORAGE_KEY='libre-knowledge-navigator-v2';
const FILTER_KEYS=['space','claim','source','topic','creator'];
const SPACE_TYPES=new Set(['publication','trail','video','document','dataset','audio','archive','collection']);
const SOURCE_TYPES=new Set(['source','document_passage']);

function uid(prefix='nav'){
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
}

function storage(){
  try { return globalThis.localStorage; } catch { return null; }
}
function uniq(values){ return [...new Set(values.filter(Boolean))]; }
function categoryFor(object){
  if(!object) return 'space';
  if(SPACE_TYPES.has(object.type)) return 'space';
  if(object.type==='claim') return 'claim';
  if(SOURCE_TYPES.has(object.type)) return 'source';
  if(object.type==='topic') return 'topic';
  if(object.type==='person') return 'creator';
  return 'space';
}
function isSpaceCapable(object){ return Boolean(object && !['topic','person'].includes(object.type)); }
function stableHash(value=''){
  let h=2166136261;
  for(const ch of String(value)){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); }
  return h>>>0;
}
function relationLabel(type){
  return ({
    supports:'Supporting evidence',contradicts:'Counterevidence',derived_from:'Derived from',mentions:'Mentioned here',
    explains:'Explanation',questions:'Questions',responds_to:'Response',preceded_by:'Earlier / later context',part_of:'Contained in',
    cites:'Primary source',related_to:'Related rabbit hole',alternative_interpretation_of:'Alternative interpretation',forked_from:'Fork lineage',
    inferred_topic:'Shared topic',inferred_creator:'Same creator'
  })[type] || 'Connected knowledge';
}
function relationPriority(type){
  return ({supports:100,contradicts:98,cites:92,derived_from:88,alternative_interpretation_of:86,questions:84,responds_to:82,preceded_by:78,related_to:74,forked_from:72,part_of:68,inferred_topic:58,inferred_creator:42,mentions:40})[type]||30;
}

export function createNavigatorSession(originId){
  return {
    id:uid(),originId,currentId:originId,selectedId:originId,path:[originId],cursor:0,visited:[originId],expanded:[originId],pinned:[],hidden:[],
    filters:{space:true,claim:true,source:true,topic:true,creator:true},atlas:false,visible:true,startedAt:Date.now(),updatedAt:Date.now()
  };
}

export function loadNavigatorSession(currentId){
  let session=null;
  try { session=JSON.parse(storage()?.getItem(NAVIGATOR_STORAGE_KEY)||'null'); } catch {}
  if(!session || !session.originId) session=createNavigatorSession(currentId);
  if(!session.filters) session.filters={space:true,claim:true,source:true,topic:true,creator:true};
  for(const key of FILTER_KEYS) if(typeof session.filters[key]!=='boolean') session.filters[key]=true;
  session.path=Array.isArray(session.path)?session.path:[];
  session.visited=Array.isArray(session.visited)?session.visited:[];
  session.expanded=Array.isArray(session.expanded)?session.expanded:[];
  session.pinned=Array.isArray(session.pinned)?session.pinned:[];
  session.hidden=Array.isArray(session.hidden)?session.hidden:[];

  if(session.currentId!==currentId){
    const existingIndex=session.path.indexOf(currentId);
    if(existingIndex>=0){
      session.cursor=existingIndex;
      session.currentId=currentId;
      session.selectedId=currentId;
      session.visited=uniq([...session.visited,currentId]);
    } else {
      session=createNavigatorSession(currentId);
    }
  }
  saveNavigatorSession(session);
  return session;
}
export function getNavigatorSession(){
  try { return JSON.parse(storage()?.getItem(NAVIGATOR_STORAGE_KEY)||'null'); } catch { return null; }
}
export function saveNavigatorSession(session){
  const next={...session,updatedAt:Date.now()};
  try { storage()?.setItem(NAVIGATOR_STORAGE_KEY,JSON.stringify(next)); } catch {}
  return next;
}
export function resetNavigatorSession(originId){ return saveNavigatorSession(createNavigatorSession(originId)); }
export function selectNavigatorNode(nodeId){ const session=getNavigatorSession(); if(!session)return null; session.selectedId=nodeId;session.visited=uniq([...session.visited,nodeId]);return saveNavigatorSession(session); }
export function expandNavigatorNode(nodeId){ const session=getNavigatorSession();if(!session)return null;session.selectedId=nodeId;session.visited=uniq([...session.visited,nodeId]);session.expanded=uniq([...session.expanded,nodeId]);return saveNavigatorSession(session); }
export function advanceNavigator(nodeId){
  const session=getNavigatorSession(); if(!session)return null;
  const prefix=session.path.slice(0,Number(session.cursor||0)+1);
  if(prefix.at(-1)!==nodeId) prefix.push(nodeId);
  session.path=uniqAdjacent(prefix);session.cursor=session.path.length-1;session.currentId=nodeId;session.selectedId=nodeId;
  session.visited=uniq([...session.visited,nodeId]);session.expanded=uniq([...session.expanded,nodeId]);return saveNavigatorSession(session);
}
function uniqAdjacent(values){ return values.filter((value,index)=>index===0||value!==values[index-1]); }
export function navigatorBack(){ const session=getNavigatorSession();if(!session||session.cursor<=0)return null;session.cursor--;session.currentId=session.path[session.cursor];session.selectedId=session.currentId;saveNavigatorSession(session);return session.currentId; }
export function navigatorForward(){ const session=getNavigatorSession();if(!session||session.cursor>=session.path.length-1)return null;session.cursor++;session.currentId=session.path[session.cursor];session.selectedId=session.currentId;saveNavigatorSession(session);return session.currentId; }
export function navigatorJump(nodeId){ const session=getNavigatorSession();if(!session)return null;const index=session.path.indexOf(nodeId);if(index<0)return null;session.cursor=index;session.currentId=nodeId;session.selectedId=nodeId;saveNavigatorSession(session);return nodeId; }
export function navigatorOrigin(){ const session=getNavigatorSession();if(!session)return null;return navigatorJump(session.originId); }
export function toggleNavigatorPin(nodeId){ const session=getNavigatorSession();if(!session)return null;const set=new Set(session.pinned);set.has(nodeId)?set.delete(nodeId):set.add(nodeId);session.pinned=[...set];return saveNavigatorSession(session); }
export function toggleNavigatorHide(nodeId){ const session=getNavigatorSession();if(!session)return null;const set=new Set(session.hidden);set.has(nodeId)?set.delete(nodeId):set.add(nodeId);if(nodeId===session.currentId||nodeId===session.originId)set.delete(nodeId);session.hidden=[...set];return saveNavigatorSession(session); }
export function toggleNavigatorFilter(category){ const session=getNavigatorSession();if(!session||!FILTER_KEYS.includes(category))return null;session.filters[category]=!session.filters[category];return saveNavigatorSession(session); }
export function toggleNavigatorAtlas(){ const session=getNavigatorSession();if(!session)return null;session.atlas=!session.atlas;return saveNavigatorSession(session); }
export function toggleNavigatorVisible(force){ const session=getNavigatorSession();if(!session)return null;session.visible=typeof force==='boolean'?force:!session.visible;return saveNavigatorSession(session); }

export function buildNavigatorGraph(graph){
  const nodes=new Map((graph.objects||[]).map(object=>[object.id,object]));
  const edges=[];const edgeKeys=new Set();
  const add=(fromId,toId,type,{inferred=false,weight=1}={})=>{
    if(!nodes.has(fromId)||!nodes.has(toId)||fromId===toId)return;
    const pair=[fromId,toId].sort().join('|');const key=`${pair}|${type}`;if(edgeKeys.has(key))return;edgeKeys.add(key);
    edges.push({id:key,fromId,toId,type,label:relationLabel(type),inferred,weight:weight+relationPriority(type)});
  };
  for(const relation of graph.relations||[]) add(relation.fromId,relation.toId,relation.type,{weight:Number(relation.weight||0)});

  const publications=[...nodes.values()].filter(o=>o.type==='publication');
  for(let i=0;i<publications.length;i++){
    for(let j=i+1;j<publications.length;j++){
      const a=publications[i],b=publications[j];
      const sharedTopics=(a.topicIds||[]).filter(id=>(b.topicIds||[]).includes(id));
      if(sharedTopics.length) add(a.id,b.id,'inferred_topic',{inferred:true,weight:sharedTopics.length*2});
      else if(a.creatorId&&a.creatorId===b.creatorId) add(a.id,b.id,'inferred_creator',{inferred:true,weight:1});
    }
  }
  const adjacency=new Map();
  for(const edge of edges){
    if(!adjacency.has(edge.fromId))adjacency.set(edge.fromId,[]);
    if(!adjacency.has(edge.toId))adjacency.set(edge.toId,[]);
    adjacency.get(edge.fromId).push(edge);adjacency.get(edge.toId).push(edge);
  }
  return {nodes,edges,adjacency};
}

function neighborEntries(model,nodeId){
  return (model.adjacency.get(nodeId)||[]).map(edge=>({edge,node:model.nodes.get(edge.fromId===nodeId?edge.toId:edge.fromId)})).filter(entry=>entry.node);
}
function entryScore(entry,session){
  const object=entry.node;const category=categoryFor(object);let score=entry.edge.weight||0;
  if(category==='space')score+=22;if(category==='claim')score+=16;if(category==='source')score+=14;if(category==='topic')score+=8;if(category==='creator')score+=6;
  if((session.visited||[]).includes(object.id))score-=18;if((session.pinned||[]).includes(object.id))score+=20;
  return score;
}
export function visibleNavigatorGraph(graph,session,{maxNeighbors=12}={}){
  const model=buildNavigatorGraph(graph),visible=new Set(),hidden=new Set(session.hidden||[]);
  const addNode=id=>{const object=model.nodes.get(id);if(!object||hidden.has(id))return;if(session.filters?.[categoryFor(object)]===false)return;visible.add(id);};
  [session.originId,session.currentId,session.selectedId,...(session.path||[]),...(session.pinned||[])].forEach(addNode);
  const addNeighbors=(id,limit)=>{
    let added=0;
    for(const entry of neighborEntries(model,id).sort((a,b)=>entryScore(b,session)-entryScore(a,session))){
      const before=visible.size;addNode(entry.node.id);if(visible.size>before)added++;if(added>=limit)break;
    }
  };
  addNeighbors(session.currentId,maxNeighbors);
  if(session.selectedId!==session.currentId)addNeighbors(session.selectedId,Math.max(5,Math.round(maxNeighbors*.45)));
  for(const id of session.expanded||[])addNeighbors(id,Math.max(5,Math.round(maxNeighbors*.45)));
  for(const id of session.pinned||[])addNeighbors(id,5);
  const nodes=[...visible].map(id=>model.nodes.get(id)).filter(Boolean);
  const visibleSet=new Set(nodes.map(n=>n.id));
  const edges=model.edges.filter(edge=>visibleSet.has(edge.fromId)&&visibleSet.has(edge.toId));
  return {model,nodes,edges};
}

export function layoutNavigator(graph,session,visible,{width=700,height=440}={}){
  const positions=new Map();const origin=session.originId,current=session.currentId;
  const ox=width*.16,oy=height*.18,cx=width*.58,cy=height*.48;
  positions.set(origin,{x:ox,y:oy});positions.set(current,{x:cx,y:cy});
  const path=(session.path||[]).filter(id=>visible.model.nodes.has(id));
  const between=path.filter(id=>id!==origin&&id!==current);
  between.forEach((id,index)=>{const t=(index+1)/(between.length+1);positions.set(id,{x:ox+(cx-ox)*(.38+t*.46),y:oy+(cy-oy)*(.24+t*.76)+(index%2?-16:16)});});

  const remaining=visible.nodes.filter(n=>!positions.has(n.id));
  const grouped={space:[],claim:[],source:[],topic:[],creator:[]};remaining.forEach(n=>grouped[categoryFor(n)].push(n));
  const place=(items,radius,start,end)=>{
    items.sort((a,b)=>stableHash(a.id)-stableHash(b.id));
    items.forEach((node,index)=>{const ratio=items.length===1?.5:index/(items.length-1);const angle=start+(end-start)*ratio;const jitter=(stableHash(node.id)%19)-9;positions.set(node.id,{x:cx+Math.cos(angle)*(radius+jitter),y:cy+Math.sin(angle)*(radius+jitter*.4)});});
  };
  place(grouped.topic,128,Math.PI*1.05,Math.PI*1.55);place(grouped.creator,158,Math.PI*.88,Math.PI*1.02);place(grouped.claim,118,-Math.PI*.32,Math.PI*.22);place(grouped.source,148,Math.PI*.30,Math.PI*.91);place(grouped.space,184,-Math.PI*.72,Math.PI*.72);
  return {positions,pathPoints:path.map(id=>positions.get(id)).filter(Boolean)};
}

function objectTitle(object){return object?.title||object?.text||'Untitled knowledge';}
function short(text,max=24){const value=String(text||'');return value.length>max?`${value.slice(0,max-1)}…`:value;}
function kindLabel(object){return ({space:'Space',claim:'Claim',source:'Source',topic:'Topic',creator:'Creator'})[categoryFor(object)]||'Knowledge';}
function canOpenInSpace(object){return isSpaceCapable(object);}

function graphSvg(graph,session,{atlas=false}={}){
  const dims=atlas?{width:960,height:620}:{width:640,height:430};
  const visible=visibleNavigatorGraph(graph,session,{maxNeighbors:atlas?19:11});
  const layout=layoutNavigator(graph,session,visible,dims);const p=layout.positions;
  const pathD=layout.pathPoints.length>1?`M ${layout.pathPoints.map(x=>`${Math.round(x.x)} ${Math.round(x.y)}`).join(' L ')}`:'';
  const pathEdgePairs=new Set((session.path||[]).slice(1).map((id,index)=>[session.path[index],id].sort().join('|')));
  return `<div class="navigator-canvas-wrap"><svg class="navigator-canvas" data-nav-canvas viewBox="0 0 ${dims.width} ${dims.height}" role="img" aria-label="Interactive Libre knowledge graph">
    <defs><radialGradient id="nav-field" cx="58%" cy="46%" r="68%"><stop offset="0" stop-color="rgba(139,120,255,.18)"/><stop offset=".58" stop-color="rgba(77,57,170,.07)"/><stop offset="1" stop-color="rgba(8,10,16,0)"/></radialGradient><filter id="nav-glow"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <rect width="100%" height="100%" fill="url(#nav-field)"/><circle class="nav-field-ring" cx="${Math.round(dims.width*.59)}" cy="${Math.round(dims.height*.47)}" r="${atlas?230:162}"/><circle class="nav-origin-field" cx="${Math.round(dims.width*.17)}" cy="${Math.round(dims.height*.19)}" r="${atlas?92:60}"/>
    ${pathD?`<path class="nav-path-spine-line" d="${pathD}"/>`:''}
    ${visible.edges.map(edge=>{const a=p.get(edge.fromId),b=p.get(edge.toId);if(!a||!b)return'';const isPath=pathEdgePairs.has([edge.fromId,edge.toId].sort().join('|'));return `<g class="nav-edge nav-edge-${edge.type} ${isPath?'is-path':''}"><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>${atlas?`<text x="${(a.x+b.x)/2}" y="${(a.y+b.y)/2-7}">${escapeHTML(edge.label)}</text>`:''}</g>`;}).join('')}
    ${visible.nodes.map(object=>{const pos=p.get(object.id);if(!pos)return'';const category=categoryFor(object);const isCurrent=object.id===session.currentId,isOrigin=object.id===session.originId,isSelected=object.id===session.selectedId,isVisited=(session.visited||[]).includes(object.id),isPinned=(session.pinned||[]).includes(object.id);const r=isCurrent?16:category==='space'?12:9;const tag=isCurrent?'YOU ARE HERE':isOrigin?'ORIGIN':isPinned?'PINNED':'';return `<g class="nav-node kind-${category} ${isCurrent?'is-current':''} ${isOrigin?'is-origin':''} ${isSelected?'is-selected':''} ${isVisited?'is-visited':''} ${isPinned?'is-pinned':''}" data-nav-node="${object.id}" tabindex="0" role="button" aria-label="${escapeHTML(kindLabel(object))}: ${escapeHTML(objectTitle(object))}" transform="translate(${pos.x},${pos.y})"><circle class="nav-node-core" r="${r}" filter="url(#nav-glow)"/>${isOrigin?`<circle class="nav-node-origin-ring" r="${r+8}"/>`:''}${isPinned?`<circle class="nav-node-pin-ring" r="${r+5}"/>`:''}${tag?`<text class="nav-node-tag" y="${-r-10}">${tag}</text>`:''}<text class="nav-node-label" y="${r+18}">${escapeHTML(short(objectTitle(object),atlas?28:21))}</text></g>`;}).join('')}
  </svg><div class="navigator-canvas-help"><span>Click to inspect</span><span>Double-click to dive</span><span>Wheel to zoom</span><span>Drag to pan</span></div></div>`;
}

function pathMarkup(model,session){
  return `<section class="navigator-block"><div class="navigator-block-head"><span>Path spine</span><small>${Math.max(0,(session.path||[]).length-1)} steps deep</small></div><div class="navigator-path">${(session.path||[]).map((id,index)=>{const object=model.nodes.get(id);if(!object)return'';return `<button class="navigator-path-step ${id===session.currentId?'active':''}" data-nav-jump="${id}"><span>${String(index+1).padStart(2,'0')}</span><div><strong>${escapeHTML(objectTitle(object))}</strong><small>${id===session.originId?'Origin':id===session.currentId?'Current focus':'Visited branch'}</small></div></button>`;}).join('')}</div></section>`;
}
function branchMarkup(model,session){
  const branches=neighborEntries(model,session.currentId).filter(entry=>canOpenInSpace(entry.node)&&!(session.path||[]).includes(entry.node.id)&&!(session.hidden||[]).includes(entry.node.id)).sort((a,b)=>entryScore(b,session)-entryScore(a,session)).slice(0,5);
  return `<section class="navigator-block"><div class="navigator-block-head"><span>Unexplored branches</span><small>Skipped branches stay here.</small></div><div class="navigator-branches">${branches.length?branches.map(entry=>`<button class="navigator-branch" data-nav-dive="${entry.node.id}"><div><strong>${escapeHTML(objectTitle(entry.node))}</strong><small>${escapeHTML(entry.edge.label)}</small></div>${icon('arrow',15)}</button>`).join(''):`<div class="navigator-empty">No additional Space branches from this point yet. Expand a claim, source, or topic to reveal more.</div>`}</div></section>`;
}
function inspectorMarkup(model,session){
  const object=model.nodes.get(session.selectedId)||model.nodes.get(session.currentId);if(!object)return'';
  const category=categoryFor(object),pinned=(session.pinned||[]).includes(object.id),hidden=(session.hidden||[]).includes(object.id);const related=neighborEntries(model,object.id).sort((a,b)=>entryScore(b,session)-entryScore(a,session)).slice(0,4);
  return `<section class="navigator-block"><div class="navigator-block-head"><span>Selected node</span><small>${kindLabel(object)}</small></div><article class="navigator-inspector"><div class="navigator-inspector-top"><span class="navigator-kind kind-${category}">${kindLabel(object)}</span>${object.evidenceState?evidencePill(object.evidenceState):''}</div><h3>${escapeHTML(objectTitle(object))}</h3>${object.summary||object.subtitle||object.bio?`<p>${escapeHTML(object.summary||object.subtitle||object.bio)}</p>`:''}<div class="navigator-inspector-actions">${canOpenInSpace(object)?`<button class="primary-button" data-nav-dive="${object.id}">${icon('rabbit',15)} Dive into this</button>`:object.type==='topic'?`<button class="quiet-button" data-route="/topic/${object.id}">Open topic</button>`:object.type==='person'?`<button class="quiet-button" data-route="/profile/${object.id}">Open creator</button>`:''}<button class="quiet-button" data-nav-expand="${object.id}">Expand neighbors</button><button class="quiet-button" data-nav-pin="${object.id}">${pinned?'Unpin':'Pin'}</button>${object.id!==session.originId&&object.id!==session.currentId?`<button class="quiet-button" data-nav-hide="${object.id}">${hidden?'Unhide':'Hide branch'}</button>`:''}</div>${related.length?`<div class="navigator-neighbor-list"><strong>Connections from here</strong>${related.map(entry=>`<button data-nav-select="${entry.node.id}"><span><b>${escapeHTML(objectTitle(entry.node))}</b><small>${escapeHTML(entry.edge.label)}</small></span>${icon('chevron',13)}</button>`).join('')}</div>`:''}</article></section>`;
}
function filtersMarkup(session){return `<div class="navigator-filters">${FILTER_KEYS.map(key=>`<button class="navigator-filter ${session.filters[key]?'active':''}" data-nav-filter="${key}">${({space:'Spaces',claim:'Claims',source:'Sources',topic:'Topics',creator:'Creators'})[key]}</button>`).join('')}</div>`;}
function fallbackMarkup(visible){return `<details class="navigator-list-fallback"><summary>Accessible graph list</summary><div>${visible.nodes.map(object=>`<button data-nav-select="${object.id}"><strong>${escapeHTML(objectTitle(object))}</strong><small>${kindLabel(object)}</small></button>`).join('')}</div></details>`;}

export function knowledgeNavigatorMarkup({spaceId,graph}){
  const session=loadNavigatorSession(spaceId);if(!session.visible)return `<aside class="knowledge-navigator is-collapsed" data-navigator-space-id="${spaceId}"><button class="quiet-button navigator-show" data-nav-visible="true">${icon('rabbit',15)} Show Knowledge Navigator</button><p>Your path is preserved while the Navigator is hidden.</p></aside>`;
  const visible=visibleNavigatorGraph(graph,session,{maxNeighbors:session.atlas?19:11});
  return `<aside class="knowledge-navigator ${session.atlas?'is-atlas':''}" data-navigator-space-id="${spaceId}"><div class="navigator-shell"><header class="navigator-header"><div><span class="navigator-eyebrow">Rabbit Hole Navigator</span><h2>Never lose the thread.</h2><p>Origin, current focus, explored path, and unopened branches stay visible as you dive.</p></div><div class="navigator-header-actions"><button class="icon-button" data-nav-visible="false" aria-label="Hide navigator">${icon('close',16)}</button><button class="quiet-button" data-nav-atlas>${session.atlas?'Close Atlas':'Full Atlas'}</button></div></header><div class="navigator-history-controls"><button class="quiet-button" data-nav-back ${session.cursor<=0?'disabled':''}>Back</button><button class="quiet-button" data-nav-forward ${session.cursor>=session.path.length-1?'disabled':''}>Forward</button><button class="quiet-button" data-nav-origin>Back to origin</button><button class="quiet-button" data-nav-reset="${spaceId}">Restart</button></div><div class="navigator-origin-card"><span>Origin</span><strong>${escapeHTML(objectTitle(visible.model.nodes.get(session.originId)))}</strong><small>${Math.max(0,session.path.length-1)} steps deep · ${session.visited.length} nodes explored</small></div><div class="navigator-search"><span>${icon('search',14)}</span><input type="search" data-nav-search placeholder="Search this rabbit hole…" aria-label="Search current knowledge graph"><div class="navigator-search-results" data-nav-search-results hidden></div></div>${graphSvg(graph,session,{atlas:session.atlas})}${filtersMarkup(session)}${pathMarkup(visible.model,session)}${branchMarkup(visible.model,session)}${inspectorMarkup(visible.model,session)}${fallbackMarkup(visible)}</div></aside>`;
}

export function rerenderKnowledgeNavigator(root,graph){
  if(!root)return;const spaceId=root.dataset.navigatorSpaceId;if(!spaceId)return;
  const wrapper=document.createElement('div');wrapper.innerHTML=knowledgeNavigatorMarkup({spaceId,graph});const next=wrapper.firstElementChild;if(next)root.replaceWith(next);
}

export function navigatorSearch(graph,query,{limit=8}={}){
  const q=String(query||'').trim().toLowerCase();if(!q)return[];
  return (graph.objects||[]).map(object=>{const text=`${objectTitle(object)} ${object.summary||''} ${object.subtitle||''} ${object.bio||''}`.toLowerCase();let score=0;if(objectTitle(object).toLowerCase().startsWith(q))score+=10;if(objectTitle(object).toLowerCase().includes(q))score+=7;if(text.includes(q))score+=3;return{object,score};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||objectTitle(a.object).localeCompare(objectTitle(b.object))).slice(0,limit).map(x=>x.object);
}
