import { escapeHTML, evidencePill, formatDate, typePill, avatarMarkup } from '../../shared/dom.js';
import { icon } from '../../shared/icons.js';

function resolveCreator(graph, creatorId) { return graph.objects.find((object)=>object.id===creatorId); }
function byId(graph,id){return graph.objects.find((object)=>object.id===id)}

export function renderStoryLens({ space, graph, selectors }) {
  const path = (space.readerPath || []).map((id)=>byId(graph,id)).filter(Boolean);
  const claims = selectors.claimsFor(space.id);
  const sources = selectors.sourcesFor(space.id);
  const defaultBlocks = [
    {type:'quote',title:'Every connection in this Space remains inspectable.',body:space.summary},
    ...claims.slice(0,2),
    ...sources.slice(0,2)
  ];
  const blocks = path.length ? path : defaultBlocks;
  return `<article class="story-flow">
    <p class="story-lede">${escapeHTML(space.summary || space.subtitle || '')}</p>
    ${blocks.map((object,index)=>renderStoryObject(object,index,graph,selectors)).join('')}
    <div class="story-block">
      <h2>Where this branches next</h2>
      <p>Libre never treats the end of a narrative as the end of the knowledge. Open the Rabbit Hole to move into primary records, counterarguments, earlier programs, or adjacent research without losing this context.</p>
      <button class="primary-button" data-rabbit-object="${escapeHTML(space.id)}">${icon('rabbit',17)} Take me deeper</button>
    </div>
  </article>`;
}

function renderStoryObject(object,index,graph,selectors) {
  if (object.type==='quote') return `<blockquote class="story-quote">${escapeHTML(object.title)}<small style="display:block;margin-top:12px;color:var(--muted);font:400 .9rem var(--ui-font)">${escapeHTML(object.body||'')}</small></blockquote>`;
  if (object.type==='claim') return `<section class="inline-object claim-object" id="${object.id}">
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:center">${typePill('claim')}${evidencePill(object.evidenceState)}</div>
    <h3>${escapeHTML(object.title)}</h3>
    <div class="claim-evidence-row"><div class="claim-evidence-cell support"><small>Supporting</small><strong>${object.supportCount||0} sources</strong></div><div class="claim-evidence-cell challenge"><small>Challenging</small><strong>${object.contradictCount||0} sources</strong></div></div>
    <button class="quiet-button" data-inspect-claim="${object.id}">Inspect claim</button>
  </section>`;
  if (['document','source','document_passage'].includes(object.type)) {
    const chain=selectors.provenanceChain(object.id);
    return `<section class="inline-object evidence-object">
      <div class="type">${escapeHTML(object.type.replaceAll('_',' '))}</div><h3>${escapeHTML(object.title)}</h3>
      <p style="color:var(--muted);line-height:1.5">${escapeHTML(object.excerpt||object.publisher||object.provenance||'Source object')}</p>
      <div class="provenance-chain">${chain.map((item,i)=>`${i?'→':''}<span>${escapeHTML(item.title)}</span>`).join('')}</div>
    </section>`;
  }
  if (object.type==='timeline_event') return `<section class="story-block"><div class="divider-label">Timeline anchor</div><h2>${escapeHTML(String(object.year||''))} — ${escapeHTML(object.title)}</h2><p>This event is a reusable object. Open the Timeline lens to see how it relates to the rest of the Space.</p></section>`;
  if (object.type==='video') return `<section class="inline-object"><div class="video-frame"><div class="play-orbit">${icon('arrow',24)}</div></div><h3 style="margin-bottom:0">${escapeHTML(object.title)}</h3><p style="color:var(--muted)">${escapeHTML(object.summary||'Transcript and claims remain attached to the media object.')}</p></section>`;
  return `<section class="story-block"><h2>${escapeHTML(object.title)}</h2><p>${escapeHTML(object.body||object.summary||'This object is connected to the Space and can be explored in other lenses.')}</p></section>`;
}

export function renderEvidenceLens({ space, graph, selectors }) {
  const sources=selectors.sourcesFor(space.id);
  const claims=selectors.claimsFor(space.id);
  const direct=selectors.related(space.id);
  const all=[...sources,...direct.map((entry)=>entry.object).filter((object)=>['source','document','document_passage','dataset'].includes(object.type))];
  const unique=[...new Map(all.map((object)=>[object.id,object])).values()];
  return `<section>
    <div class="page-heading" style="margin-top:0"><div><h1 style="font-size:clamp(2.4rem,5vw,5rem)">Evidence, without the narrative.</h1></div><p>${unique.length} source objects are connected directly or through claims. Provenance stays attached as objects move through Libre.</p></div>
    <div class="evidence-grid">${unique.map((object)=>{
      const chain=selectors.provenanceChain(object.id);
      return `<article class="evidence-object"><div class="type">${escapeHTML(object.type.replaceAll('_',' '))}</div><h3>${escapeHTML(object.title)}</h3><p style="color:var(--muted);line-height:1.5">${escapeHTML(object.excerpt||object.publisher||object.provenance||object.summary||'Connected source')}</p>${object.evidenceState?evidencePill(object.evidenceState):''}<div class="provenance-chain">${chain.map((item,i)=>`${i?'→':''}<span>${escapeHTML(item.title)}</span>`).join('')}</div><button class="signal-action" data-comment-scope-type="source" data-comment-scope-id="${object.id}">${icon('reply',15)} Discuss source</button></article>`;
    }).join('')}</div>
    ${!unique.length?'<div class="empty-state"><div><h2>No sources connected yet</h2><p>This Space can still be explored, but Libre exposes that evidence gap rather than hiding it.</p></div></div>':''}
  </section>`;
}

export function renderClaimsLens({ space, selectors }) {
  const claims=selectors.claimsFor(space.id);
  return `<section>
    <div class="page-heading" style="margin-top:0"><div><h1 style="font-size:clamp(2.4rem,5vw,5rem)">Claims are objects.</h1></div><p>Each claim can be challenged, sourced, reused, or forked independently of the prose that originally introduced it.</p></div>
    <div class="claim-list">${claims.map((claim)=>`<article class="claim-object" id="${claim.id}"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center">${typePill('claim')}${evidencePill(claim.evidenceState)}</div><h3>${escapeHTML(claim.title)}</h3><div class="claim-evidence-row"><div class="claim-evidence-cell support"><small>Supporting evidence</small><strong>${claim.supportCount||0} sources</strong></div><div class="claim-evidence-cell challenge"><small>Counterevidence</small><strong>${claim.contradictCount||0} sources</strong></div></div><div class="signal-actions"><button class="quiet-button" data-claim-action="support" data-claim-id="${claim.id}">+ Support with source</button><button class="quiet-button" data-claim-action="challenge" data-claim-id="${claim.id}">+ Add counterevidence</button><button class="quiet-button" data-comment-scope-type="claim" data-comment-scope-id="${claim.id}">Discuss</button></div></article>`).join('')}</div>
    ${!claims.length?'<div class="empty-state"><div><h2>No structured claims yet</h2><p>The Story can still exist, but this Space has not separated its major assertions into inspectable objects.</p></div></div>':''}
  </section>`;
}

export function renderTimelineLens({ space, selectors }) {
  const events=selectors.timelineFor(space.id);
  return `<section><div class="page-heading" style="margin-top:0"><div><h1 style="font-size:clamp(2.4rem,5vw,5rem)">Chronology changes interpretation.</h1></div><p>Timeline events are reusable objects connected to people, records, claims, and Spaces.</p></div><div class="timeline">${events.map((event)=>`<article class="timeline-event"><time>${escapeHTML(event.year)}</time><h3>${escapeHTML(event.title)}</h3><p style="color:var(--muted)">Connected timeline object. Open its neighborhood to see what preceded, followed, or cites it.</p><button class="signal-action" data-rabbit-object="${event.id}">Explore around this event</button></article>`).join('')}</div>${!events.length?'<div class="empty-state"><div><h2>No chronology attached</h2><p>This Space has not connected timeline objects yet.</p></div></div>':''}</section>`;
}

export function renderDiscussionLens({ space, repository, scopeType='space', scopeId=null }) {
  const id=scopeId||space.id;
  const comments=repository.listComments(scopeType,id);
  const parents=comments.filter((comment)=>!comment.parentId);
  return `<section>
    <div class="discussion-head"><div><h2>Discussion</h2><div style="color:var(--muted);margin-top:5px">${comments.length} comments · anchored to ${escapeHTML(scopeType)}</div></div><div class="segmented"><button class="active">Top</button><button>Newest</button></div></div>
    <form class="comment-composer" data-comment-form data-scope-type="${escapeHTML(scopeType)}" data-scope-id="${escapeHTML(id)}"><textarea name="body" placeholder="Add context, challenge reasoning, or ask a question…" required></textarea><div class="comment-composer-footer"><span>${repository.getState().account?'Posting as '+escapeHTML(repository.getState().account.displayName):'Anonymous comments are allowed. Your alias is clearly marked.'}</span><button class="primary-button" type="submit">Post</button></div></form>
    <div>${parents.map((comment)=>renderComment(comment,comments)).join('')||'<div class="empty-state"><div><h2>Start the evidence-aware discussion</h2><p>Comments can target this whole Space or exact claims and sources.</p></div></div>'}</div>
  </section>`;
}

function renderComment(comment,all) {
  const children=all.filter((entry)=>entry.parentId===comment.id);
  return `<article class="comment-thread"><div class="comment-author"><span class="avatar">${escapeHTML(comment.author.displayName.slice(0,2).toUpperCase())}</span><span>${escapeHTML(comment.author.displayName)}</span>${comment.author.isAnonymous?'<span class="anon">ANONYMOUS</span>':''}</div><div class="comment-body">${escapeHTML(comment.body)}</div><div class="comment-actions"><button class="signal-action" data-vote-comment="${comment.id}">${icon('vote',14)} ${comment.votes||0}</button><button class="signal-action" data-reply-comment="${comment.id}">${icon('reply',14)} Reply</button><button class="signal-action" data-report-comment="${comment.id}">${icon('report',14)} Report</button></div>${children.map((child)=>`<div class="comment-thread child">${renderComment(child,all).replace(/^<article class="comment-thread">|<\/article>$/g,'')}</div>`).join('')}</article>`;
}
