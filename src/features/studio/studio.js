import { escapeHTML, evidencePill } from '../../shared/dom.js';
import { icon } from '../../shared/icons.js';

const tools=[
  ['claim','Claim','A statement Libre will automatically research and assess at publication.'],
  ['source','Source (optional)','Add a specific paper, record, or reference only when you want to; Libre also discovers sources automatically.'],
  ['document','Document (optional)','Attach a specific public record, PDF, transcript, or scan; automatic discovery still runs.'],
  ['quote','Note','Narrative or explanatory text in the Reader Path.'],
  ['timeline_event','Timeline event','A date-aware reusable event.'],
  ['question','Question','An unresolved question that can branch into evidence.']
];

const percent=(value)=>`${Math.round(Math.max(0,Math.min(1,Number(value)||0))*100)}%`;

function assessmentMarkup(object) {
  if (object.type !== 'claim' || !object.evidenceState) return '';
  const assessment=object.evidenceAssessment || {};
  const reasons=(assessment.reasons||[]).slice(0,2);
  const confidence=percent(assessment.confidence);
  const quality=percent(assessment.averageSourceQuality);
  const directness=percent(assessment.directness);
  return `<div class="libre-assessment" title="Libre recalculates this status from evidence quality, directness, independence, provenance, and contradiction">
    <div class="libre-assessment-head"><span>Libre assessment</span>${evidencePill(object.evidenceState)}</div>
    <div class="libre-assessment-metrics">
      <span><strong>${confidence}</strong><small>assessment confidence</small></span>
      <span><strong>${assessment.independentSourceGroups||0}</strong><small>independent source groups</small></span>
      <span><strong>${quality}</strong><small>source quality</small></span>
      <span><strong>${directness}</strong><small>directness</small></span>
    </div>
    <div class="libre-assessment-balance"><span class="support-count">${assessment.supportingSources||0} support</span><span class="challenge-count">${assessment.challengingSources||0} challenge</span>${assessment.retractedSources?`<span>${assessment.retractedSources} retracted discounted</span>`:''}</div>
    ${reasons.length?`<div class="libre-assessment-reasons">${reasons.map((reason)=>`<small>${escapeHTML(reason)}</small>`).join('')}</div>`:''}
    <small class="assessment-caveat">Assessment confidence measures confidence in the classification process—not the probability that a claim is true.</small>
  </div>`;
}

function discoveryStatusMarkup(draft) {
  const discovery=draft.sourceDiscovery;
  if(!discovery) return `<div class="source-discovery-banner"><span class="source-discovery-icon">${icon('search',18)}</span><div><strong>Automatic source discovery runs when you publish.</strong><p>You only need to write the claim. Libre searches independent scholarly and public-record indexes, removes duplicate versions, separates supporting evidence from counterevidence, discounts retractions, and then assigns the classification.</p></div></div>`;
  return `<div class="source-discovery-banner complete"><span class="source-discovery-icon">${icon('layers',18)}</span><div><strong>Source discovery completed.</strong><p>${discovery.addedSources||0} relevant sources added across ${discovery.claimsSearched||0} claims · ${discovery.supportingSources||0} supporting · ${discovery.challengingSources||0} challenging · ${discovery.contextualSources||0} contextual.</p></div></div>`;
}

export function studioMarkup({ repository, graph, draftId=null }) {
  const state=repository.getState();
  if(!state.account) return `<section class="page"><div class="empty-state"><div><h2>Libre Studio requires a knowledge identity</h2><p>Reading and anonymous discussion stay open. Publishing and forking require an account so provenance has an owner.</p><button class="primary-button" data-open-auth="signup">Create account</button></div></div></section>`;
  let draft=draftId?repository.getDraft(draftId):state.drafts[0];
  if(!draft) {
    return `<section class="page"><div class="page-heading"><div><h1>Libre Studio is not a text box.</h1></div><p>Construct reusable knowledge objects, connect them with explicit relationships, then choose a Reader Path that becomes the Story lens.</p></div><div class="empty-state"><div><h2>Start a Knowledge Space</h2><p>Add the ideas and claims. Libre can discover the evidence automatically when you publish.</p><button class="primary-button" data-create-draft>${icon('plus',17)} New Space</button></div></div></section>`;
  }
  const pathObjects=draft.readerPath.map((id)=>draft.objects.find((object)=>object.id===id) || graph.objects.find((object)=>object.id===id)).filter(Boolean);
  return `<section class="studio-page" data-draft-id="${draft.id}">
    <aside class="studio-panel"><div class="studio-panel-head"><h2>Object shelf</h2><button class="icon-button" data-create-studio-object="custom" aria-label="Add object">${icon('plus',16)}</button></div><div class="object-shelf">${tools.map(([type,label,desc])=>`<button class="object-tool" data-create-studio-object="${type}"><strong>${label}</strong><small>${desc}</small></button>`).join('')}</div><div style="padding:12px 18px"><div class="divider-label">Space metadata</div><div class="field"><label>Title</label><input data-draft-field="title" value="${escapeHTML(draft.title)}"></div><div class="field"><label>Subtitle</label><textarea data-draft-field="subtitle">${escapeHTML(draft.subtitle||'')}</textarea></div><div class="field"><label>Summary</label><textarea data-draft-field="summary">${escapeHTML(draft.summary||'')}</textarea></div></div></aside>
    <main class="studio-canvas"><div class="studio-panel-head" style="position:sticky;top:0"><div><h2>Knowledge workspace</h2><small style="color:var(--muted)">${draft.objects.length} objects · ${draft.relations.length} relationships</small><small class="studio-evidence-note">Creators never choose evidence labels. Source entry is optional: Libre discovers and evaluates relevant evidence during publication.</small></div><div style="display:flex;gap:8px"><button class="quiet-button" data-preview-draft>${icon('layers',15)} Preview</button><button class="primary-button" data-publish-draft>Publish</button></div></div>${discoveryStatusMarkup(draft)}<div class="studio-canvas-inner">${draft.objects.length?draft.objects.map((object)=>`<article class="canvas-object" data-canvas-object="${object.id}"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><span class="object-type">${escapeHTML(object.type.replaceAll('_',' '))}</span>${object.autoDiscovered?'<span class="auto-source-badge">Found by Libre</span>':''}</div><h3>${escapeHTML(object.title)}</h3><small style="color:var(--muted)">${escapeHTML(object.body||object.publisher||object.year||'Reusable knowledge object')}</small>${assessmentMarkup(object)}<div class="signal-actions"><button class="signal-action" data-add-reader-path="${object.id}">+ Reader Path</button><button class="signal-action" data-connect-object="${object.id}">Connect</button></div></article>`).join(''):'<div class="studio-empty"><div><h2 style="font:500 2.2rem var(--reading-font);color:var(--text)">Drop the first idea into the network.</h2><p>Add a claim, note, event, or question. You do not need to hunt down sources before publishing—Libre will do the first evidence-discovery pass automatically.</p></div></div>'}</div></main>
    <aside class="studio-panel"><div class="studio-panel-head"><h2>Reader Path</h2><span>${pathObjects.length}</span></div><div class="reader-path">${pathObjects.map((object,index)=>`<div class="reader-step"><span class="reader-step-index">${index+1}</span><div><strong>${escapeHTML(object.title)}</strong><small style="display:block;color:var(--muted)">${escapeHTML(object.type.replaceAll('_',' '))}</small></div></div>`).join('')||'<div style="padding:20px;color:var(--muted);line-height:1.6">The Reader Path is the narrative order. Your graph can be complex while the Story lens remains simple.</div>'}</div><div style="padding:18px"><div class="divider-label">Relationships</div>${draft.relations.map((relation)=>{const a=draft.objects.find((o)=>o.id===relation.fromId),b=draft.objects.find((o)=>o.id===relation.toId);return `<div style="padding:9px 0;border-bottom:1px solid var(--line);font-size:.76rem"><strong>${escapeHTML(a?.title||'Object')}</strong><br><span style="color:var(--accent)">${escapeHTML(relation.type.replaceAll('_',' '))}</span> → ${escapeHTML(b?.title||'Object')}${relation.autoDiscovered?' <small>· Libre</small>':''}</div>`}).join('')||'<small style="color:var(--muted)">Relationships appear here. Libre will also connect automatically discovered evidence at publish time.</small>'}</div></aside>
  </section>`;
}