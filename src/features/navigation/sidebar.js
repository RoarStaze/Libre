import { escapeHTML } from '../../shared/dom.js';
import { icon } from '../../shared/icons.js';

const streamItems=[
  ['for-you','Home','home'],
  ['following','Following','following'],
  ['latest','Latest','clock'],
  ['deep-dive','Deep Dive','layers'],
  ['trending','Trending','trending'],
  ['discover','Discover','compass']
];

function activeAttr(active){ return active ? ' aria-current="page"' : ''; }
function activeClass(active){ return active ? ' is-active' : ''; }

function streamItem([mode,label,ico],route,streamMode){
  const active=route?.name==='home' && streamMode===mode;
  return `<button class="libre-sidebar-item${activeClass(active)}"${activeAttr(active)} data-sidebar-stream-mode="${mode}" data-stream-mode="${mode}" title="${escapeHTML(label)}">
    <span class="libre-sidebar-icon">${icon(ico,19)}</span><span class="libre-sidebar-label">${escapeHTML(label)}</span>
  </button>`;
}

function routeItem({label,iconName,path,active=false,badge='',className=''}){
  return `<button class="libre-sidebar-item${activeClass(active)} ${className}"${activeAttr(active)} data-route="${escapeHTML(path)}" title="${escapeHTML(label)}">
    <span class="libre-sidebar-icon">${icon(iconName,19)}</span><span class="libre-sidebar-label">${escapeHTML(label)}</span>${badge!==''?`<span class="libre-sidebar-badge">${escapeHTML(String(badge))}</span>`:''}
  </button>`;
}

function initials(value='Libre'){
  return String(value).split(/\s+/).filter(Boolean).slice(0,2).map((part)=>part[0]).join('').toUpperCase() || 'L';
}

function followedItem(object){
  const isPerson=object.type==='person';
  const path=isPerson?`/profile/${object.id}`:`/topic/${object.id}`;
  const label=object.title || object.displayName || 'Knowledge';
  const avatar=object.avatar || initials(label);
  return `<button class="libre-sidebar-item libre-sidebar-followed" data-route="${escapeHTML(path)}" title="${escapeHTML(label)}">
    <span class="libre-follow-avatar ${isPerson?'person':'topic'}">${escapeHTML(avatar)}</span>
    <span class="libre-sidebar-label">${escapeHTML(label)}</span>
    <span class="libre-follow-kind">${isPerson?'creator':'topic'}</span>
  </button>`;
}

export function sidebarMarkup({state,graph,route={name:'home',query:new URLSearchParams()},streamMode='for-you'}){
  const account=state.account;
  const currentView=route?.query?.get?.('view') || 'saved';
  const following=(state.following||[]).map((id)=>graph.objects.find((object)=>object.id===id)).filter((object)=>object && ['person','topic'].includes(object.type));
  const visibleFollowing=following.slice(0,6);
  const extraFollowing=following.slice(6);
  const ownPublications=account?graph.objects.filter((object)=>object.type==='publication'&&object.creatorId===account.id).length:0;
  const ownDrafts=account?(state.drafts||[]).filter((draft)=>draft.creatorId===account.id).length:0;
  const profilePath=account?`/profile/${account.id}`:'/login/login';

  return `<div class="libre-sidebar-scroll">
    <nav class="libre-sidebar-nav" aria-label="Primary">
      ${streamItem(streamItems[0],route,streamMode)}
      ${routeItem({label:'Explore',iconName:'compass',path:'/explore',active:route?.name==='explore'})}
      ${streamItem(streamItems[1],route,streamMode)}
      ${streamItem(streamItems[2],route,streamMode)}
    </nav>

    <div class="libre-sidebar-divider"></div>
    <section class="libre-sidebar-section" aria-labelledby="sidebar-discover-label">
      <div class="libre-sidebar-section-title" id="sidebar-discover-label">Discover</div>
      ${streamItem(streamItems[3],route,streamMode)}
      ${streamItem(streamItems[4],route,streamMode)}
      ${streamItem(streamItems[5],route,streamMode)}
    </section>

    ${following.length?`<div class="libre-sidebar-divider"></div><section class="libre-sidebar-section" aria-labelledby="sidebar-following-label">
      <div class="libre-sidebar-section-title" id="sidebar-following-label">Following</div>
      ${visibleFollowing.map(followedItem).join('')}
      ${extraFollowing.length?`<details class="libre-sidebar-more"><summary><span class="libre-sidebar-icon">${icon('chevronDown',18)}</span><span>Show ${extraFollowing.length} more</span></summary><div>${extraFollowing.map(followedItem).join('')}</div></details>`:''}
    </section>`:''}

    <div class="libre-sidebar-divider"></div>
    <section class="libre-sidebar-section" aria-labelledby="sidebar-you-label">
      <div class="libre-sidebar-section-title sidebar-you-title" id="sidebar-you-label">You <span>${icon('chevron',14)}</span></div>
      ${routeItem({label:account?'Your profile':'Log in',iconName:'user',path:profilePath,active:route?.name==='profile'&&account&&route?.params?.id===account.id})}
      ${routeItem({label:'Library',iconName:'library',path:'/library?view=saved',active:route?.name==='library'&&currentView==='saved'})}
      ${routeItem({label:'History',iconName:'history',path:'/library?view=history',active:route?.name==='library'&&currentView==='history'})}
      ${routeItem({label:'Collections',iconName:'collection',path:'/library?view=collections',active:route?.name==='library'&&currentView==='collections',badge:state.library?.collections?.length||''})}
      ${account?routeItem({label:'Your Spaces',iconName:'publication',path:`/profile/${account.id}`,active:false,badge:ownPublications||''}):''}
      ${routeItem({label:'Drafts',iconName:'draft',path:'/studio',active:route?.name==='studio',badge:ownDrafts||''})}
      ${routeItem({label:'My Algorithm',iconName:'settings',path:'/algorithm',active:route?.name==='algorithm'})}
      ${account?.role==='admin'?routeItem({label:'Moderation',iconName:'shield',path:'/moderation',active:route?.name==='moderation'}):''}
    </section>

    <div class="libre-sidebar-footer">
      <strong>LIBRE</strong><span>Knowledge, connected.</span>
    </div>
  </div>`;
}
