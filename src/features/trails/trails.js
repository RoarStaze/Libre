import { escapeHTML } from '../../shared/dom.js';
import { icon } from '../../shared/icons.js';

export function rabbitHoleMarkup(objectId, selectors) {
  const current=selectors.object(objectId);
  const branches=selectors.rabbitHoleBranches(objectId);
  return `<div class="modal-backdrop" data-rabbit-backdrop><section class="modal" style="width:min(760px,100%);max-height:88vh;overflow:auto"><div style="display:flex;justify-content:space-between;gap:20px;align-items:flex-start"><div><small style="color:var(--accent);text-transform:uppercase;letter-spacing:.1em;font-weight:800">Rabbit Hole</small><h2 style="margin-top:8px">Where do you want to go deeper?</h2></div><button class="icon-button" data-close-rabbit>${icon('close',17)}</button></div><p>You are here: <strong>${escapeHTML(current?.title||'Knowledge')}</strong>. Each branch tells you why the next object is connected.</p><div style="display:grid;gap:8px;margin-top:20px">${branches.map((branch)=>`<button data-open-object="${branch.object.id}" class="object-tool"><small style="color:var(--accent)">${escapeHTML(branch.label)}</small><strong style="margin-top:4px">${escapeHTML(branch.object.title)}</strong><span style="color:var(--muted);font-size:.75rem">${escapeHTML(branch.object.type.replaceAll('_',' '))}</span></button>`).join('')}</div></section></div>`;
}

export function forkSpace(repository, sourceId) {
  if(!repository.canPublish()) throw new Error('Sign in before forking a Space.');
  const state=repository.getState();
  const source=state.graph.objects.find((object)=>object.id===sourceId);
  if(!source) throw new Error('Source Space not found.');
  const draft=repository.createDraft({title:`Fork of ${source.title}`,topicId:source.topicIds?.[0]||null,forkedFrom:sourceId});
  const readerPath=source.readerPath || source.steps || [sourceId];
  repository.updateDraft(draft.id,{subtitle:source.subtitle||'',summary:`Forked from ${source.title}. Reused objects keep their original IDs and provenance.`,readerPath:[...readerPath]});
  return repository.getDraft(draft.id);
}
