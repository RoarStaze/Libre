import { escapeHTML, evidencePill } from '../../shared/dom.js';
import { icon } from '../../shared/icons.js';

const tools=[
  ['claim','Claim','A statement that can carry support and counterevidence.'],
  ['source','Source','A paper, report, archive item, or external reference.'],
  ['document','Document','A public record, PDF, transcript, or scanned source.'],
  ['quote','Note','Narrative or explanatory text in the Reader Path.'],
  ['timeline_event','Timeline event','A date-aware reusable event.'],
  ['question','Question','An unresolved question that can branch into evidence.']
];

function assessmentMarkup(object) {
  if (object.type !== 'claim' || !object.evidenceState) return '';
  const assessment=object.evidenceAssessment || {};
  return `<div class="libre-assessment" title="Libre recalculates this status from the connected evidence graph"><span>Libre assessment</span>${evidencePill(object.evidenceState)}<small>${assessment.supportingSources||0} support · ${assessment.challengingSources||0} challenge</small></div>`;
}

export function studioMarkup({ repository, graph, draftId=null }) {
  const state=repository.getState();
  if(!state.account) return `<section class="page"><div class="empty-state"><div><h2>Libre Studio requires a knowledge identity</h2><p>Reading and anonymous discussion stay open. Publishing and forking require an account so provenance has an owner.</p><button class="primary-button" data-open-auth="signup">Create account</button></div></div></section>`;
  let draft=draftId?repository.getDraft(draftId):state.drafts[0];
  if(!draft) {
    return `<section class="page"><div class="page-heading"><div><h1>Libre Studio is not a text box.</h1></div><p>Construct reusable knowledge objects, connect them with explicit relationships, then choose a Reader Path that becomes the Story lens.</p></div><div class="empty-state"><div><h2>Start a Knowledge Space</h2><p>Your canvas will hold claims, sources, documents, notes, events, and their relationships.</p><button class="primary-button" data-create-draft>${icon('plus',17)} New Space</button></div></div></section>`;
  }
  const pathObjects=draft.readerPath.map((id)=>draft.objects.find((object)=>object.id===id) || graph.objects.find((object)=>object.id===id)).filter(Boolean);
  return `<section class="studio-page" data-draft-id="${draft.id}">
    <aside class="studio-panel"><div class="studio-panel-head"><h2>Object shelf</h2><button class="icon-button" data-create-studio-object="custom" aria-label="Add object">${icon('plus',16)}</button></div><div class="object-shelf">${tools.map(([type,label,desc])=>`<button class="object-tool" data-create-studio-object="${type}"><strong>${label}</strong><small>${desc}</small></button>`).join('')}</div><div style="padding:12px 18px"><div class="divider-label">Space metadata</div><div class="field"><label>Title</label><input data-draft-field="title" value="${escapeHTML(draft.title)}"></div><div class="field"><label>Subtitle</label><textarea data-draft-field="subtitle">${escapeHTML(draft.subtitle||'')}</textarea></div><div class="field"><label>Summary</label><textarea data-draft-field="summary">${escapeHTML(draft.summary||'')}</textarea></div></div></aside>
    <main class="studio-canvas"><div class="studio-panel-head" style="position:sticky;top:0"><div><h2>Knowledge workspace</h2><small style="color:var(--muted)">${draft.objects.length} objects · ${draft.relations.length} relationships</small><small class="studio-evidence-note">Evidence labels are assigned by Libre from connected sources and counterevidence. Creators cannot set them manually.</small></div><div style="display:flex;gap:8px"><button class="quiet-button" data-preview-draft>${icon('layers',15)} Preview</button><button class="primary-button" data-publish-draft>Publish</button></div></div><div class="studio-canvas-inner">${draft.objects.length?draft.objects.map((object)=>`<article class="canvas-object" data-canvas-object="${object.id}"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><span class="object-type">${escapeHTML(object.type.replaceAll('_',' '))}</span>${assessmentMarkup(object)}</div><h3>${escapeHTML(object.title)}</h3><small style="color:var(--muted)">${escapeHTML(object.body||object.publisher||object.year||'Reusable knowledge object')}</small><div class="signal-actions"><button class="signal-action" data-add-reader-path="${object.id}">+ Reader Path</button><button class="signal-action" data-connect-object="${object.id}">Connect</button></div></article>`).join(''):'<div class="studio-empty"><div><h2 style="font:500 2.2rem var(--reading-font);color:var(--text)">Drop the first idea into the network.</h2><p>Add a claim, source, document, note, event, or question from the Object Shelf.</p></div></div>'}</div></main>
    <aside class="studio-panel"><div class="studio-panel-head"><h2>Reader Path</h2><span>${pathObjects.length}</span></div><div class="reader-path">${pathObjects.map((object,index)=>`<div class="reader-step"><span class="reader-step-index">${index+1}</span><div><strong>${escapeHTML(object.title)}</strong><small style="display:block;color:var(--muted)">${escapeHTML(object.type.replaceAll('_',' '))}</small></div></div>`).join('')||'<div style="padding:20px;color:var(--muted);line-height:1.6">The Reader Path is the narrative order. Your graph can be complex while the Story lens remains simple.</div>'}</div><div style="padding:18px"><div class="divider-label">Relationships</div>${draft.relations.map((relation)=>{const a=draft.objects.find((o)=>o.id===relation.fromId),b=draft.objects.find((o)=>o.id===relation.toId);return `<div style="padding:9px 0;border-bottom:1px solid var(--line);font-size:.76rem"><strong>${escapeHTML(a?.title||'Object')}</strong><br><span style="color:var(--accent)">${escapeHTML(relation.type.replaceAll('_',' '))}</span> → ${escapeHTML(b?.title||'Object')}</div>`}).join('')||'<small style="color:var(--muted)">Connect two objects to make the graph explicit.</small>'}</div></aside>
  </section>`;
}
