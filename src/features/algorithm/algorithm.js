import { escapeHTML } from '../../shared/dom.js';

const controls={
  discovery:['Familiar','Discover','How aggressively Libre injects adjacent knowledge outside your normal topics.'],
  depth:['Quick','Deep','How strongly source-rich, long-form, connected material is favored.'],
  freshness:['Foundational','Recent','How much recent publication time influences ranking.'],
  unfamiliar:['Aligned','Opposing','How often unfamiliar viewpoints and counterarguments are surfaced.'],
  obscure:['Popular','Obscure','How willing Libre is to surface useful low-popularity material.']
};

export function algorithmMarkup(state) {
  const values=state.algorithm;
  return `<section class="page"><div class="page-heading"><div><h1>The algorithm belongs to you.</h1></div><p>Libre exposes the major recommendation preferences directly. Change them and The Stream re-ranks immediately.</p></div><div class="algorithm-console"><div class="algorithm-sliders">${Object.entries(controls).map(([key,[left,right,description]])=>`<div class="algorithm-control"><label><strong>${escapeHTML(left)}</strong><span>${values[key]??50}</span><strong>${escapeHTML(right)}</strong></label><p>${escapeHTML(description)}</p><input type="range" min="0" max="100" value="${values[key]??50}" data-algorithm-key="${key}" aria-label="${key}"></div>`).join('')}<button class="quiet-button" data-reset-algorithm>Reset recommendations</button></div><aside class="algorithm-preview"><small style="color:var(--accent);text-transform:uppercase;letter-spacing:.1em">Live recommendation vector</small><h2 style="font:500 2rem var(--reading-font);margin:10px 0">Your Libre</h2><p style="color:var(--muted);line-height:1.5">This visualization changes with your controls. It is deliberately legible rather than pretending personalization is magic.</p><div class="algo-vector">${Object.keys(controls).map((key)=>`<i style="height:${Math.max(8,values[key]??50)}%"></i>`).join('')}</div><button class="primary-button" data-route="/">See the changed Stream</button></aside></div></section>`;
}
