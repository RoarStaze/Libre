import { escapeHTML, evidencePill, avatarMarkup } from '../../shared/dom.js';
import { icon } from '../../shared/icons.js';
import { renderStoryLens, renderEvidenceLens, renderClaimsLens, renderTimelineLens, renderDiscussionLens } from './lenses.js';
import { knowledgeNavigatorMarkup, loadNavigatorSession } from '../navigator/navigator.js';

const lensLabels={story:'Story',evidence:'Evidence',claims:'Claims',timeline:'Timeline',discussion:'Discussion'};

export function renderSpace({ id, lens='story', graph, selectors, repository }) {
  const object=selectors.object(id);
  if (!object) return `<div class="space-overlay"><div class="empty-state" style="margin:80px"><div><h2>Knowledge object not found</h2><button class="primary-button" data-close-space>Return to Stream</button></div></div></div>`;
  const space = object.type==='publication' ? object : contextualSpace(object,graph,selectors);
  const creator=selectors.object(space.creatorId);
  const claims=selectors.claimsFor(space.id);
  const sources=selectors.sourcesFor(space.id);
  const timeline=selectors.timelineFor(space.id);
  const activeLens=['story','evidence','claims','timeline','discussion'].includes(lens)?lens:'story';
  const ownerCanEdit=object.type==='publication' && repository.canEditPublication?.(space.id);
  const navigatorSession=loadNavigatorSession(space.id);
  const navigatorShellClass=navigatorSession.visible ? (navigatorSession.atlas?'navigator-atlas-open':'navigator-docked') : '';
  const longTitle=String(space.title||'').length>72;
  const content={
    story:()=>renderStoryLens({space,graph,selectors}),
    evidence:()=>renderEvidenceLens({space,graph,selectors}),
    claims:()=>renderClaimsLens({space,graph,selectors}),
    timeline:()=>renderTimelineLens({space,graph,selectors}),
    discussion:()=>renderDiscussionLens({space,repository})
  }[activeLens]();
  return `<section class="space-overlay ${navigatorShellClass}" data-space-id="${space.id}" style="view-transition-name: signal-${space.id}">
    <div class="space-toolbar"><div class="space-toolbar-left"><div class="space-history-controls"><button class="icon-button space-history-button" data-space-back aria-label="Go back"><span class="space-back-glyph">${icon('arrow',18)}</span></button><button class="icon-button space-history-button" data-space-forward aria-label="Go forward">${icon('arrow',18)}</button></div><span class="space-breadcrumb">Libre / ${escapeHTML(space.title)}</span></div><div class="space-toolbar-right"><button class="quiet-button navigator-toolbar-toggle" data-nav-toggle aria-pressed="${navigatorSession.visible}" aria-label="${navigatorSession.visible?'Hide':'Show'} Knowledge Navigator">${icon('rabbit',16)}<span>${navigatorSession.visible?'Hide Navigator':'Show Navigator'}</span></button>${ownerCanEdit?`<button class="quiet-button owner-edit-button" data-edit-space="${space.id}">${icon('edit',16)} Edit</button>`:''}<button class="icon-button" data-save-object="${space.id}" aria-label="Save">${icon('bookmark',17)}</button><button class="icon-button" data-share-object="${space.id}" aria-label="Share">${icon('share',17)}</button><button class="quiet-button" data-fork-space="${space.id}">${icon('fork',16)} Fork</button></div></div>
    <div class="space-content-shell">
      <header class="space-hero"><div><div class="space-kicker">${space.format?`<span>${escapeHTML(space.format)}</span><span>•</span>`:''}${space.evidenceState?evidencePill(space.evidenceState):''}${space.topicIds?.length?`<span>${escapeHTML(space.topicIds[0].replace('topic-','').replaceAll('-',' '))}</span>`:''}</div><h1 class="space-title ${longTitle?'space-title--long':''}">${escapeHTML(space.title)}</h1><p class="space-subtitle">${escapeHTML(space.subtitle||space.summary||'')}</p></div><aside class="space-summary-panel"><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px">${avatarMarkup(creator)}<div><strong>${escapeHTML(creator?.title||'Libre contributor')}</strong><div style="font-size:.76rem;color:var(--muted)">${escapeHTML(creator?.bio||'Knowledge object creator')}</div></div></div><p>${escapeHTML(space.summary||'This Space connects narrative, evidence, claims, chronology, and discussion without duplicating the underlying knowledge.')}</p><div class="space-stats"><div class="space-stat"><strong>${sources.length || space.sourceCount || 0}</strong><span>SOURCES</span></div><div class="space-stat"><strong>${claims.length || space.claimCount || 0}</strong><span>CLAIMS</span></div><div class="space-stat"><strong>${timeline.length}</strong><span>TIMELINE</span></div><div class="space-stat"><strong>${space.readMinutes||5}m</strong><span>PATH</span></div></div></aside></header>
      <div class="lens-nav-wrap"><nav class="lens-nav" aria-label="Knowledge lenses">${Object.entries(lensLabels).map(([id,label])=>`<button class="lens-button" aria-selected="${activeLens===id}" data-space-lens="${id}">${label}</button>`).join('')}</nav></div>
      <div class="space-body"><div class="lens-content">${content}</div></div>
    </div>
    ${knowledgeNavigatorMarkup({spaceId:space.id,graph})}
  </section>`;
}

function contextualSpace(object,graph,selectors){
  if(object.type==='trail') return { ...object, type:'publication', format:'trail', subtitle:object.summary||'A curated cross-format path through connected knowledge.', summary:object.summary||'Follow the sequence while every step remains independently inspectable.', sourceCount:0, claimCount:0, readerPath:[...(object.steps||[])], topicIds:object.topicIds||[] };
  if(['claim','document','source','dataset','video'].includes(object.type)) return { ...object, type:'publication', format:object.type, subtitle:object.summary||'Inspect this object through its evidence, relationships, chronology, and discussion.', summary:object.summary||'This object becomes a temporary Knowledge Space without losing its identity or provenance.', sourceCount:object.sourceCount||0, claimCount:object.type==='claim'?1:0, readerPath:[object.id], topicIds:object.topicIds||[] };
  const relatedPublication=selectors.related(object.id).find((entry)=>entry.object.type==='publication')?.object;
  if(relatedPublication) return relatedPublication;
  return { ...object, id:object.id, type:'publication', format:object.type, summary:object.summary||'This object is being viewed as a temporary Knowledge Space so its evidence and relationships remain navigable.', sourceCount:object.sourceCount||0, claimCount:object.type==='claim'?1:0, readerPath:[object.id], topicIds:object.topicIds||[] };
}
